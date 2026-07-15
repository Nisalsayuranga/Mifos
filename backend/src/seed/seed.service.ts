import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '../branches/branch.entity';
import { User, UserRole } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedBranches();
    await this.seedUsers();
  }

  private async seedBranches() {
    const branches = [
      { name: 'Borella', code: 'BRL' },
      { name: 'Kotikawatta', code: 'KTW' },
      { name: 'Dematagoda', code: 'DMT' },
      { name: 'Wattala', code: 'WTL' },
      { name: 'Kiribathgoda', code: 'KRB' },
      { name: 'Kadawatha', code: 'KDW' },
      { name: 'Dehiwala', code: 'DHW' },
      { name: 'Panadura', code: 'PND' },
      { name: 'Kottawa', code: 'KOT' },
      { name: 'Homagama', code: 'HMG' },
    ];

    for (const b of branches) {
      const exists = await this.branchRepo.findOneBy({ name: b.name });
      if (!exists) {
        await this.branchRepo.save(this.branchRepo.create(b));
      }
    }
  }

  private async seedUsers() {
    // Head Office
    const headOfficeExists = await this.userRepo.findOneBy({ email: 'admin@rupasinghe.com' });
    if (!headOfficeExists) {
      await this.userRepo.save(this.userRepo.create({
        email: 'admin@rupasinghe.com',
        firstName: 'Head',
        lastName: 'Office',
        passwordHash: await bcrypt.hash('Admin@123', 10),
        role: UserRole.ADMIN,
        branchId: undefined, // Global access
        mustResetPassword: true,
      }));
    }

    // Branch Users
    const branches = await this.branchRepo.find();
    for (const branch of branches) {
      const email = `branch.${branch.code.toLowerCase()}@rupasinghe.com`;
      const exists = await this.userRepo.findOneBy({ email });
      if (!exists) {
        const plainPass = `${branch.code}2024!`;
        await this.userRepo.save(this.userRepo.create({
          email,
          firstName: branch.name,
          lastName: 'Branch',
          passwordHash: await bcrypt.hash(plainPass, 10),
          role: UserRole.TELLER,
          branchId: branch.id,
          mustResetPassword: true,
        }));
      }
    }
  }
}

