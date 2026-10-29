import { Controller, Get, Query, Res, Req } from '@nestjs/common';
import { Request, Response } from 'express';

import { RequirePermission } from '../../common/decorators/require-permission.decorator';

import { marketDataQuerySchema } from './market-data.dto';
import { MarketDataService } from './market-data.service';

@Controller('market-data')
export class MarketDataController {
  constructor(private readonly service: MarketDataService) {}

  @Get()
  @RequirePermission('sys:market_data:read')
  async list(@Query() query: unknown, @Req() req: Request & { user: { userId: string } }) {
    const parsed = marketDataQuerySchema.parse(query);
    // 传 req.user.userId 用于构建缓存 key
    return this.service.paginate(parsed, req.user?.userId || 'anonymous');
  }

  @Get('export')
  @RequirePermission('sys:market_data:export')
  async exportCsv(@Query() query: unknown, @Res() res: Response) {
    const parsed = marketDataQuerySchema.parse(query);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="market_data_${Date.now()}.csv"`);
    res.write('\uFEFF');
    res.write('交易日期,股票代码,股票名称,开盘,最高,最低,收盘,成交量,成交额,涨跌幅\n');

    const BATCH = 1000;
    let cursor: string | undefined = undefined;
    let hasMore = true; // 👈 替换 while(true)

    while (hasMore) {
      const page = await this.service.paginate({ ...parsed, cursor, limit: BATCH });
      if (page.items.length === 0) break;

      for (const row of page.items) {
        const line = `${row.trade_date},${row.stock_code},${row.stock_name},${row.open},${row.high},${row.low},${row.close},${row.volume},${row.amount},${row.pct_change}\n`;
        res.write(line);
      }

      hasMore = page.hasMore; // 👈 更新循环条件
      if (!hasMore) break;

      cursor = page.nextCursor!;
    }

    res.end();
  }
}
