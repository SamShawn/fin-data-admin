import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserFavorite } from '../../entities/user-favorite.entity';

import { FavoriteController } from './favorite.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserFavorite])],
  controllers: [FavoriteController],
})
export class FavoriteModule {}
