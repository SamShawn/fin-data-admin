import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { z } from 'zod';

import { Auditable } from '../../common/decorators/auditable.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Permission } from '../../entities/permission.entity';
import { Role } from '../../entities/role.entity';

const createRoleSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  dataScope: z.enum(['ALL', 'DEPT', 'SELF']).default('ALL'),
});

@Controller('admin/roles')
export class RoleController {
  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Permission) private permRepo: Repository<Permission>,
  ) {}

  @Get()
  @RequirePermission('sys:role:read')
  async list() {
    const roles = await this.roleRepo.find({ relations: ['permissions'] });
    return { items: roles };
  }

  @Get('permissions')
  @RequirePermission('sys:role:read')
  async listPermissions() {
    // 获取所有权限，供前端勾选
    return { items: await this.permRepo.find({ order: { module: 'ASC' } }) };
  }

  @Post()
  @RequirePermission('sys:role:write')
  @Auditable({ module: 'role', action: 'CREATE' })
  async create(@Body() body: unknown) {
    const parsed = createRoleSchema.parse(body);
    const role = this.roleRepo.create(parsed);
    await this.roleRepo.save(role);
    return { success: true };
  }

  @Put(':id/permissions')
  @RequirePermission('sys:role:write')
  @Auditable({ module: 'role', action: 'ASSIGN_PERMISSIONS', resourceIdPath: 'params.id' })
  async updatePermissions(@Param('id') id: string, @Body('permissionIds') permissionIds: string[]) {
    const role = await this.roleRepo.findOne({ where: { id }, relations: ['permissions'] });
    if (!role) throw new Error('角色不存在');

    // 重新绑定权限
    const perms = await this.permRepo.find({ where: { id: In(permissionIds) } });
    role.permissions = perms;
    await this.roleRepo.save(role);

    // 注意：权限变更后，需要清除所有在线用户的权限缓存（Redis 里之前缓存的 perm:user:*）
    // 这里留个 TODO，由于我们是每次请求实时查（或短缓存），也可在 Redis 层面处理

    return { success: true };
  }
}
