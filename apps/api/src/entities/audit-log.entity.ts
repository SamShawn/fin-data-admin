import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column()
  username: string;

  @Column()
  action: string;

  @Column()
  module: string;

  @Column({ name: 'resource_id', nullable: true })
  resourceId: string;

  @Column({ name: 'request_id', nullable: true })
  requestId: string;

  @Column({ nullable: true })
  ip: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ name: 'before_snapshot', type: 'jsonb', nullable: true })
  beforeSnapshot: Record<string, unknown>;

  @Column({ name: 'after_snapshot', type: 'jsonb', nullable: true })
  afterSnapshot: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
