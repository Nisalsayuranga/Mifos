import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // e.g. Borella, Kotikawatta

  @Column({ unique: true })
  code: string; // e.g. BRL, KTW

  @CreateDateColumn()
  createdAt: Date;
}
