import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Permission } from '../../entities/permission.entity';
import { Role } from '../../entities/role.entity';
import { User } from '../../entities/user.entity';

import { RoleController } from './role.controller';
import { UserController } from './user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Permission])],
  controllers: [UserController, RoleController],
})
export class AdminModule {}
