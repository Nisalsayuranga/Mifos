import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/repository';
import { Repository } from 'typeorm';
import { InjectRepository as InjectTypeORMRepository } from '@nestjs/typeorm';
import { Branch } from '../branches/branch.entity';
import { User, UserRole } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectTypeORMRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectTypeORMRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedBranches();
    await this.seedUsers();
  }

  private async seedBranches() {
    const branches = [
      { name: 'Borella', code: 'BRL' },
      { name: 'Kotikawatta', code: 'KOT' },
      { name: 'Dematagoda', code: 'DMT' },
      { name: 'Wattala', code: 'WAT' },
      { name: 'Kiribathgoda', code: 'KIR' },
      { name: 'Kadawatha', code: 'KDW' },
      { name: 'Dehiwala', code: 'DHW' },
      { name: 'Panadura', code: 'PND' },
      { name: 'Kottawa', code: 'KTW' },
      { name: 'Homagama', code: 'HMG' },
    ];

    for (const b of branches) {
      const exists = await this.branchRepo.findOneBy({ name: b.name });
      if (!exists) {
        await this.branchRepo.save(this.branchRepo.create(b));
      } else {
        // Update code if it changed (e.g. KTW -> KOT for Kotikawatta)
        if (exists.code !== b.code) {
          exists.code = b.code;
          await this.branchRepo.save(exists);
        }
      }
    }
  }

  private async seedUsers() {
    // Head Office (Admin)
    const headOfficeExists = await this.userRepo.findOneBy({ email: 'admin@rupasinghe.com' });
    const adminPassHash = await bcrypt.hash('HeadOffice@2024', 10);
    if (!headOfficeExists) {
      await this.userRepo.save(this.userRepo.create({
        email: 'admin@rupasinghe.com',
        firstName: 'Head',
        lastName: 'Office',
        passwordHash: adminPassHash,
        role: UserRole.ADMIN,
        branchId: null, // Global access
        mustResetPassword: true,
      }));
    } else {
      headOfficeExists.passwordHash = adminPassHash;
      await this.userRepo.save(headOfficeExists);
    }

    // Branch Users
    const branches = await this.branchRepo.find();
    for (const branch of branches) {
      const email = `branch.${branch.code.toLowerCase()}@rupasinghe.com`;
      const exists = await this.userRepo.findOneBy({ email });
      
      // Match the correct password configuration
      let plainPass = '';
      if (branch.code === 'BRL') plainPass = 'Borella123';
      else if (branch.code === 'KOT') plainPass = 'Kotikawatta123';
      else if (branch.code === 'DMT') plainPass = 'Dematagoda123';
      else if (branch.code === 'WAT') plainPass = 'Wattala123';
      else if (branch.code === 'KIR') plainPass = 'Kiribathgoda123';
      else if (branch.code === 'KDW') plainPass = 'Kadawatha123';
      else if (branch.code === 'DHW') plainPass = 'Dehiwala123';
      else if (branch.code === 'PND') plainPass = 'Panadura123';
      else if (branch.code === 'KTW') plainPass = 'Kottawa123';
      else if (branch.code === 'HMG') plainPass = 'Homagama123';
      else plainPass = `${branch.code}123`; // fallback

      const passHash = await bcrypt.hash(plainPass, 10);

      if (!exists) {
        await this.userRepo.save(this.userRepo.create({
          email,
          firstName: branch.name,
          lastName: 'Branch',
          passwordHash: passHash,
          role: UserRole.TELLER,
          branchId: branch.id,
          mustResetPassword: true,
        }));
      } else {
        exists.passwordHash = passHash;
        await this.userRepo.save(exists);
      }
    }
  }
}
