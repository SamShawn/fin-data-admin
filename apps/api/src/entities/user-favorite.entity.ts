import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('user_favorites')
export class UserFavorite {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @PrimaryColumn({ name: 'stock_code' })
  stockCode: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
