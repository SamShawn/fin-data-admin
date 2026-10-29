import * as crypto from 'crypto';

import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Repository, SelectQueryBuilder } from 'typeorm';

import {
  encodeCursor,
  decodeCursor,
  buildCursorCondition,
  SortKey,
} from '../../common/utils/cursor.util';
import { DailyQuote } from '../../entities/daily-quote.entity';
import { REDIS_CLIENT } from '../../redis/redis.module';

import { MarketDataQuery } from './market-data.dto';

@Injectable()
export class MarketDataService {
  constructor(
    @InjectRepository(DailyQuote)
    private quoteRepo: Repository<DailyQuote>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis, // 👈 注入 Redis
  ) {}

  private buildQuery(dto: MarketDataQuery): SelectQueryBuilder<DailyQuote> {
    const qb = this.quoteRepo
      .createQueryBuilder('q')
      .innerJoin('stocks', 's', 's.stock_code = q.stock_code')
      .select(['q.*', 's.stock_name as stock_name', 's.industry as industry']);

    if (dto.stockCode) qb.andWhere('q.stock_code = :sc', { sc: dto.stockCode });
    if (dto.startDate) qb.andWhere('q.trade_date >= :sd', { sd: dto.startDate });
    if (dto.endDate) qb.andWhere('q.trade_date <= :ed', { ed: dto.endDate });
    if (dto.industry) qb.andWhere('s.industry = :ind', { ind: dto.industry });
    if (dto.minPctChange !== undefined)
      qb.andWhere('q.pct_change >= :min', { min: dto.minPctChange });
    if (dto.maxPctChange !== undefined)
      qb.andWhere('q.pct_change <= :max', { max: dto.maxPctChange });

    return qb;
  }

  private buildCacheKey(dto: MarketDataQuery, userId: string): string {
    // 规范化参数，保证参数顺序无关
    const normalized = {
      stockCode: dto.stockCode,
      startDate: dto.startDate,
      endDate: dto.endDate,
      industry: dto.industry,
      minPctChange: dto.minPctChange,
      maxPctChange: dto.maxPctChange,
      sort: dto.sort,
      limit: dto.limit,
      cursor: dto.cursor || null,
      userId, // 数据权限不同，结果不同，必须带入 userId
    };
    const hash = crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
    return `query:market_data:${hash}`;
  }

  private parseSort(sort?: string): SortKey[] {
    const mapping: Record<string, string> = {
      tradeDate: 'trade_date',
      stockCode: 'stock_code',
      close: 'close',
      pctChange: 'pct_change',
      volume: 'volume',
    };

    if (!sort)
      return [
        { column: 'trade_date', order: 'DESC' },
        { column: 'stock_code', order: 'ASC' },
      ];

    const keys = sort.split(',').map((s) => {
      const [col, order] = s.split(':');
      const dbCol = mapping[col];
      if (!dbCol) throw new Error(`不支持的排序字段: ${col}`);
      return {
        column: dbCol,
        order: (order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC',
      };
    });

    if (!keys.some((k) => k.column === 'stock_code')) {
      keys.push({ column: 'stock_code', order: 'ASC' });
    }
    return keys;
  }

  async paginate(dto: MarketDataQuery, userId: string = 'system') {
    const cacheKey = this.buildCacheKey(dto, userId);

    // 1. 尝试读缓存
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // 2. 缓存未命中，查数据库（原有逻辑）
    const sortKeys = this.parseSort(dto.sort);
    const qb = this.buildQuery(dto);

    if (dto.cursor) {
      const cursorValues = decodeCursor(dto.cursor);
      const { sql, params } = buildCursorCondition(sortKeys, cursorValues, 'q');
      if (sql !== '1=1') {
        qb.andWhere(sql, params);
      }
    }

    sortKeys.forEach((k) => {
      qb.addOrderBy(`q.${k.column}`, k.order);
    });

    qb.limit(dto.limit + 1);
    const rows = await qb.getRawMany();

    const hasMore = rows.length > dto.limit;
    const items = hasMore ? rows.slice(0, dto.limit) : rows;
    const nextCursor = hasMore
      ? encodeCursor(sortKeys.map((k) => items[items.length - 1][k.column]))
      : null;

    const result = { items, nextCursor, hasMore };

    // 3. 写入缓存，过期时间 5 分钟（300秒）
    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 300);

    return result;
  }
}
