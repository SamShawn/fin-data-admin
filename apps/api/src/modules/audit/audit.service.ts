import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLog } from '../../entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async log(data: Partial<AuditLog>) {
    try {
      const log = this.auditRepo.create(data);
      await this.auditRepo.save(log);
    } catch (error) {
      // 审计日志写入失败不应该阻塞主业务，仅记录错误
      console.error('写入审计日志失败:', error);
    }
  }
}
