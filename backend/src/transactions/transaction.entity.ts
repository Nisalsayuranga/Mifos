import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TransactionType {
  PAWN = 'PAWN',
  REPAYMENT = 'REPAYMENT',
  REDEMPTION = 'REDEMPTION',
  RENEWAL = 'RENEWAL',
  TRANSFER = 'TRANSFER',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  branchId: string;

  @Column({ type: 'varchar', nullable: true })
  targetBranchId: string | null;

  @Column()
  userId: string;

  @Column()
  clientId: string;

  @Column({
    type: 'varchar',
    default: TransactionType.PAWN,
  })
  type: TransactionType;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column()
  description: string;

  @CreateDateColumn()
  timestamp: Date; // Important data integrity rule

  @UpdateDateColumn()
  updatedAt: Date;
}
