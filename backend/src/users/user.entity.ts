import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  TELLER = 'TELLER',
  MANAGER = 'MANAGER',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  passwordHash: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  branchId: string | null; // null = Head Office

  @Column({ default: true })
  mustResetPassword: boolean;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'varchar',
    default: UserRole.TELLER,
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
