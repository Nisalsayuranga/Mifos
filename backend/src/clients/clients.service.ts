import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
  ) {}

  findAll(branchId: string | null) {
    if (branchId) {
       return this.clientsRepository.find({ where: { branchId }, order: { createdAt: 'DESC' } });
    }
    return this.clientsRepository.find({ order: { createdAt: 'DESC' } });
  }

  findOne(id: string) {
    return this.clientsRepository.findOneBy({ id });
  }

  async create(clientDto: Partial<Client>) {
    // Ensuring basic default scopes if somehow bypassed
    if (!clientDto.branchId) clientDto.branchId = 'HQ';
    if (!clientDto.createdByUserId) clientDto.createdByUserId = 'SYSTEM';

    const client = this.clientsRepository.create(clientDto);
    return this.clientsRepository.save(client);
  }

  async update(id: string, updateDto: Partial<Client>) {
    await this.clientsRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.clientsRepository.delete(id);
  }
}
