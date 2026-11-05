import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditLog } from '../../entities/audit-log.entity';

import { AuditCleanupService } from './audit-cleanup.service';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditController],
  providers: [AuditService, AuditCleanupService],
  exports: [AuditService],
})
export class AuditModule {}
