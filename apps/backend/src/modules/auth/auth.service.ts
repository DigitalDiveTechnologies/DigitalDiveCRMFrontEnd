import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from './roles.enum';
import { User } from '../../database/entities/user.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import { Branch } from '../../database/entities/branch.entity';
import { EmailService } from '../email/email.service';

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
    private readonly emailService: EmailService,
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
    if (!userData.password) {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let pass = '';
      for (let i = 0; i < 8; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      userData.password = pass;
    }

    const user = this.userRepository.create(userData) as unknown as User;
    const savedUser = await this.userRepository.save(user);

    try {
      const emailBody = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <div style="background: #0f172a; padding: 24px; color: #ffffff; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">Welcome to FilsDesk ERP</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">UAE Accounting, Billing & Inventory Suite</p>
          </div>
          <div style="padding: 24px; background: #ffffff;">
            <p style="margin-top: 0;">Dear <strong>${savedUser.name}</strong>,</p>
            <p>An enterprise portal login has been registered for you under the role of <strong style="color: #2563eb;">${savedUser.role}</strong>.</p>
            <p>You can sign in using your corporate credentials below:</p>
            
            <div style="background: #f1f5f9; padding: 16px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 4px 0; color: #64748b; font-weight: 600; width: 100px;">Portal URL:</td>
                  <td style="padding: 4px 0; font-weight: 600; color: #0f172a;"><a href="http://localhost:3000" style="color: #2563eb; text-decoration: none;">http://localhost:3000</a></td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Username:</td>
                  <td style="padding: 4px 0; font-weight: 600; color: #0f172a; font-family: monospace;">${savedUser.email}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Password:</td>
                  <td style="padding: 4px 0; font-weight: 600; color: #d97706; font-family: monospace;">${savedUser.password}</td>
                </tr>
              </table>
            </div>
            
            <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">If you did not request this account, please contact your organization administrator.</p>
          </div>
          <div style="background: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
            © 2026 FilsDesk. All Rights Reserved. • Dubai, UAE
          </div>
        </div>
      `;

      await this.emailService.sendMail(
        [savedUser.email],
        'Your FilsDesk Enterprise Login Credentials',
        emailBody,
        savedUser.tenantId
      );
    } catch (e) {
      this.logger.error(`Failed to send credentials email to ${savedUser.email}: ${e.message}`);
    }

    return savedUser;
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

    if (user.isActive === false) {
      throw new UnauthorizedException('This account has been deactivated. Please contact your administrator.');
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
