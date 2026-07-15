import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { TransactionAuditLog } from './audit-log.entity';
import { UserRole } from '../users/user.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    @InjectRepository(TransactionAuditLog)
    private readonly auditRepo: Repository<TransactionAuditLog>,
  ) {}

  async findAll(user: any) {
    if (user.role === UserRole.ADMIN || !user.branchId) {
      return this.txRepo.find();
    }
    return this.txRepo.find({ where: { branchId: user.branchId } });
  }

  async create(user: any, dto: Partial<Transaction>) {
    const tx = this.txRepo.create({
      ...dto,
      branchId: user.role === UserRole.ADMIN && dto.branchId ? dto.branchId : user.branchId,
      userId: user.id,
    });
    return this.txRepo.save(tx);
  }

  async update(user: any, id: string, dto: Partial<Transaction>) {
    const original = await this.txRepo.findOneBy({ id });
    if (!original) throw new NotFoundException('Transaction not found');
    
    // RBAC: Can only edit if Head Office OR belongs to Same Branch
    if (user.role !== UserRole.ADMIN && original.branchId !== user.branchId) {
      throw new NotFoundException('Transaction not found');
    }

    // Save Audit Log
    const audit = this.auditRepo.create({
      transactionId: id,
      editedByUserId: user.id,
      previousValue: JSON.stringify(original),
      newValue: JSON.stringify({ ...original, ...dto }),
    });
    await this.auditRepo.save(audit);

    await this.txRepo.update(id, dto);
    return this.txRepo.findOneBy({ id });
  }
}
