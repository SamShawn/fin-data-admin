import { Controller, Get, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { DataSource } from 'typeorm';

import { REDIS_CLIENT } from '../redis/redis.module';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Get()
  async check() {
    const [dbOk, redisOk] = await Promise.all([this.checkDatabase(), this.checkRedis()]);

    return {
      status: dbOk && redisOk ? 'ok' : 'degraded',
      db: dbOk,
      redis: redisOk,
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      this.logger.error('数据库健康检查失败', error instanceof Error ? error.stack : error);
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    try {
      await Promise.race([
        this.redis.ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis 健康检查超时')), 2000)),
      ]);
      return true;
    } catch (error) {
      this.logger.error('Redis 健康检查失败', error instanceof Error ? error.stack : error);
      return false;
    }
  }
}
