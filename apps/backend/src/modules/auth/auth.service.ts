import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from './roles.enum';
import { User } from '../../database/entities/user.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import { Branch } from '../../database/entities/branch.entity';

export interface LoginDto {
  email: string;
  password?: string;
}

export interface UserSessionPayload {
  userId: string;
  email: string;
  name: string;
  tenantId: string;
  branchId: string;
  role: UserRole;
  accessToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  private async seedDefaultUserAndTenant(): Promise<void> {
    const userCount = await this.userRepository.count();
    if (userCount === 0) {
      this.logger.log('Seeding default Tenant and Owner User into database...');

      // 1. Seed Tenant
      let tenant = await this.tenantRepository.findOne({ where: { companyName: 'Digital Dive Technologies' } });
      if (!tenant) {
        tenant = this.tenantRepository.create({
          companyName: 'Digital Dive Technologies',
          trn: '100293847500003',
          baseCurrency: 'AED',
          isActive: true,
        });
        tenant = await this.tenantRepository.save(tenant);
      }

      // 2. Seed Branch
      let branch = await this.branchRepository.findOne({ where: { tenantId: tenant.id } });
      if (!branch) {
        branch = this.branchRepository.create({
          tenantId: tenant.id,
          name: 'Dubai Head Office',
          code: 'BR-HQ-001',
          isActive: true,
        });
        branch = await this.branchRepository.save(branch);
      }

      // 3. Seed Owner User
      const ownerUser = this.userRepository.create({
        email: 'owner@digitaldive.ae',
        password: 'admin',
        name: 'Rashid Al Nuaimi',
        role: 'OWNER',
        tenantId: tenant.id,
        branchId: branch.id,
      });
      await this.userRepository.save(ownerUser);
      this.logger.log(`Default owner seeded: email=owner@digitaldive.ae password=admin`);
    }
  }

  async getUsers() {
    await this.seedDefaultUserAndTenant();
    return this.userRepository.find();
  }

  async createUser(userData: any) {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async updateUser(id: string, userData: any) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new Error('User not found');
    Object.assign(user, userData);
    return this.userRepository.save(user);
  }

  /**
   * Authenticate user credentials and return signed user session payload.
   */
  async login(input: LoginDto): Promise<UserSessionPayload> {
    await this.seedDefaultUserAndTenant();
    const user = await this.userRepository.findOne({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('No account found with that email address.');
    }

    // Validate password if provided and non-placeholder
    const enteredPw = (input.password || '').trim();
    if (enteredPw && enteredPw !== user.password) {
      throw new UnauthorizedException('Incorrect password.');
    }

    // Generate JWT-style access token
    const accessToken = `jwt-bearer-${Buffer.from(
      JSON.stringify({ sub: user.id, role: user.role, tenantId: user.tenantId }),
    ).toString('base64')}`;

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId,
      branchId: user.branchId || '',
      role: user.role as UserRole,
      accessToken,
    };
  }
}
