import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Auditable } from '../../common/decorators/auditable.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Strategy } from '../../entities/strategy.entity';

import { createStrategySchema, updateStrategySchema } from './strategy.dto';

@Controller('strategies')
export class StrategyController {
  constructor(
    @InjectRepository(Strategy)
    private strategyRepo: Repository<Strategy>,
  ) {}

  @Get()
  @RequirePermission('biz:strategy:read')
  async list(@Query('page') page = 1, @Query('limit') limit = 10) {
    const [items, total] = await this.strategyRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  @Post()
  @RequirePermission('biz:strategy:write')
  @Auditable({ module: 'strategy', action: 'CREATE' })
  async create(@Body() body: unknown) {
    const parsed = createStrategySchema.parse(body);
    const strategy = this.strategyRepo.create(parsed);
    await this.strategyRepo.save(strategy);
    return { success: true };
  }

  @Put(':id')
  @RequirePermission('biz:strategy:write')
  @Auditable({ module: 'strategy', action: 'UPDATE', resourceIdPath: 'params.id' })
  async update(@Param('id') id: string, @Body() body: unknown) {
    const parsed = updateStrategySchema.parse(body);
    // 👇 加上 as any 或者明确断言为 Record<string, unknown>
    await this.strategyRepo.update(id, parsed as Record<string, unknown>);
    return { success: true };
  }

  @Delete(':id')
  @RequirePermission('biz:strategy:write')
  @Auditable({ module: 'strategy', action: 'DELETE', resourceIdPath: 'params.id' })
  async delete(@Param('id') id: string) {
    await this.strategyRepo.delete(id);
    return { success: true };
  }
}
