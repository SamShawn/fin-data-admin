import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DailyQuote } from '../../entities/daily-quote.entity';

import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';

@Module({
  imports: [TypeOrmModule.forFeature([DailyQuote])],
  controllers: [MarketDataController],
  providers: [MarketDataService],
  exports: [MarketDataService],
})
export class MarketDataModule {}
