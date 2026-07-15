import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ select: ['id', 'email', 'firstName', 'lastName', 'role', 'branchId'] });
  }

  async create(payload: any): Promise<User> {
    if (!payload.email || !payload.password) {
      throw new BadRequestException('Email and Default Password are required to assign Teller.');
    }
    
    const existing = await this.usersRepository.findOneBy({ email: payload.email });
    if (existing) {
      throw new BadRequestException('Employee Account already exists targeting this identity');
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(payload.password, salt);

    const user = this.usersRepository.create({
      email: payload.email,
      passwordHash: hash,
      firstName: payload.firstName || 'New',
      lastName: payload.lastName || 'Teller',
      role: payload.role || UserRole.TELLER,
      branchId: payload.branchId || null
    });

    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
