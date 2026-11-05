import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from 'nestjs-pino';
import { Repository, LessThan } from 'typeorm';

import { AuditLog } from '../../entities/audit-log.entity';

@Injectable()
export class AuditCleanupService {
  constructor(
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
    private readonly logger: Logger,
  ) {}

  // 每天凌晨 3:00 执行清理
  @Cron('0 3 * * *')
  async cleanupExpiredLogs() {
    this.logger.log('开始清理过期审计日志...');

    const retentionDays = 180;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const result = await this.auditRepo.delete({
        createdAt: LessThan(cutoffDate),
      });
      this.logger.log(`清理完成，共删除 ${result.affected} 条过期日志`);
    } catch (error) {
      this.logger.error('清理审计日志失败', error);
    }
  }
}
