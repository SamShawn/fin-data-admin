import { Controller, Get, Post, Delete, Param, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';

import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { UserFavorite } from '../../entities/user-favorite.entity';

@Controller('favorites')
export class FavoriteController {
  constructor(
    @InjectRepository(UserFavorite)
    private favoriteRepo: Repository<UserFavorite>,
  ) {}

  @Get()
  @RequirePermission('sys:market_data:read')
  async list(@Req() req: Request & { user: { userId: string } }) {
    const items = await this.favoriteRepo.find({
      where: { userId: req.user.userId },
      order: { createdAt: 'DESC' },
    });
    return { items };
  }

  @Post(':stockCode')
  @RequirePermission('sys:market_data:read')
  async add(
    @Param('stockCode') stockCode: string,
    @Req() req: Request & { user: { userId: string } },
  ) {
    // 使用 upsert 避免重复插入报错
    await this.favoriteRepo.upsert({ userId: req.user.userId, stockCode }, ['userId', 'stockCode']);
    return { success: true };
  }

  @Delete(':stockCode')
  @RequirePermission('sys:market_data:read')
  async remove(
    @Param('stockCode') stockCode: string,
    @Req() req: Request & { user: { userId: string } },
  ) {
    await this.favoriteRepo.delete({
      userId: req.user.userId,
      stockCode,
    });
    return { success: true };
  }
}
