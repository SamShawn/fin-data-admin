import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AuditLog } from '../../entities/audit-log.entity';

@Controller('audit-logs')
export class AuditController {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  @Get()
  @RequirePermission('sys:audit:read')
  async list(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('module') module?: string,
    @Query('username') username?: string,
  ) {
    const qb = this.auditRepo
      .createQueryBuilder('a')
      .orderBy('a.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (module) qb.andWhere('a.module = :module', { module });
    if (username) qb.andWhere('a.username = :username', { username });

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }
}
