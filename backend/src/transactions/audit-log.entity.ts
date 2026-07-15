import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('transaction_audit_logs')
export class TransactionAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  transactionId: string;

  @Column()
  editedByUserId: string;

  @Column('simple-json')
  previousValue: any;

  @Column('simple-json')
  newValue: any;

  @CreateDateColumn()
  editedAt: Date;
}
