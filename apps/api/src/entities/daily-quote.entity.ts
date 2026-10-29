import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('daily_quotes')
export class DailyQuote {
  @PrimaryColumn({ name: 'trade_date', type: 'date' })
  tradeDate: Date;

  @PrimaryColumn({ name: 'stock_code' })
  stockCode: string;

  @Column({ type: 'numeric', precision: 12, scale: 4 })
  open: number;

  @Column({ type: 'numeric', precision: 12, scale: 4 })
  high: number;

  @Column({ type: 'numeric', precision: 12, scale: 4 })
  low: number;

  @Column({ type: 'numeric', precision: 12, scale: 4 })
  close: number;

  @Column({ type: 'bigint' })
  volume: number;

  @Column({ type: 'numeric', precision: 20, scale: 4 })
  amount: number;

  @Column({ name: 'pct_change', type: 'numeric', precision: 8, scale: 4 })
  pctChange: number;

  @Column({ name: 'turnover_rate', type: 'numeric', precision: 8, scale: 4 })
  turnoverRate: number;
}
