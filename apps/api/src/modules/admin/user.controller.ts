import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { z } from 'zod';

import { Auditable } from '../../common/decorators/auditable.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { User } from '../../entities/user.entity';

const createUserSchema = z.object({
  username: z.string().min(2),
  password: z.string().min(6),
  displayName: z.string().min(1),
  department: z.string().optional(),
  roleIds: z.array(z.string()).optional(),
});

@Controller('admin/users')
export class UserController {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  @Get()
  @RequirePermission('sys:user:read')
  async list(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('keyword') keyword?: string,
  ) {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.roles', 'r')
      .orderBy('u.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (keyword) {
      qb.andWhere('(u.username ILIKE :kw OR u.display_name ILIKE :kw)', { kw: `%${keyword}%` });
    }

    const [items, total] = await qb.getManyAndCount();
    // 剔除密码字段返回
    const safeItems = items.map(({ passwordHash: _passwordHash, ...rest }) => rest);
    return { items: safeItems, total, page, limit };
  }

  @Post()
  @RequirePermission('sys:user:write')
  @Auditable({ module: 'user', action: 'CREATE' })
  async create(@Body() body: unknown) {
    const parsed = createUserSchema.parse(body);
    const passwordHash = await bcrypt.hash(parsed.password, 10);

    const user = this.userRepo.create({
      username: parsed.username,
      passwordHash,
      displayName: parsed.displayName,
      department: parsed.department,
      roles: parsed.roleIds?.map((id) => ({ id })) || [],
    });

    await this.userRepo.save(user);
    return { success: true };
  }

  @Put(':id')
  @RequirePermission('sys:user:write')
  @Auditable({ module: 'user', action: 'UPDATE', resourceIdPath: 'params.id' })
  async update(
    @Param('id') id: string,
    @Body() body: { displayName?: string; department?: string; status?: number },
  ) {
    await this.userRepo.update(id, body);
    return { success: true };
  }

  @Delete(':id')
  @RequirePermission('sys:user:delete')
  @Auditable({ module: 'user', action: 'DELETE', resourceIdPath: 'params.id' })
  async delete(@Param('id') id: string) {
    await this.userRepo.delete(id);
    return { success: true };
  }
}
