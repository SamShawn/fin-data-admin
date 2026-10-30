import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Strategy } from '../../entities/strategy.entity';

import { StrategyController } from './strategy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Strategy])],
  controllers: [StrategyController],
})
export class StrategyModule {}
