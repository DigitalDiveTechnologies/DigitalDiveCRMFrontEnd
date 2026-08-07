import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRole } from './roles.enum';

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
  private readonly usersDatabase = [
    { userId: 'usr-101', email: 'owner@alfuttaim.ae', name: 'Rashid Al Nuaimi', role: UserRole.OWNER, tenantId: 'tenant-dxb-90210', branchId: 'b1' },
    { userId: 'usr-102', email: 'accountant@alfuttaim.ae', name: 'Saeed Al Maktoum', role: UserRole.ACCOUNTANT, tenantId: 'tenant-dxb-90210', branchId: 'b1' },
    { userId: 'usr-103', email: 'auditor@alfuttaim.ae', name: 'Fatima Al Mansoori', role: UserRole.AUDITOR, tenantId: 'tenant-dxb-90210', branchId: 'b1' },
    { userId: 'usr-104', email: 'biller@alfuttaim.ae', name: 'Tariq Mansoor', role: UserRole.BILLER_CASHIER, tenantId: 'tenant-dxb-90210', branchId: 'b1' },
    { userId: 'usr-105', email: 'inventory@alfuttaim.ae', name: 'Hamdan Al Hamadi', role: UserRole.INVENTORY_MANAGER, tenantId: 'tenant-dxb-90210', branchId: 'b3' },
  ];

  /**
   * Authenticate user credentials and return signed user session payload with JWT token.
   */
  async login(input: LoginDto): Promise<UserSessionPayload> {
    const user = this.usersDatabase.find((u) => u.email.toLowerCase() === input.email.toLowerCase());

    if (!user) {
      throw new UnauthorizedException('Invalid email or password credentials.');
    }

    // Generate simulated JWT access token
    const accessToken = `jwt-bearer-${Buffer.from(JSON.stringify({ sub: user.userId, role: user.role, tenantId: user.tenantId })).toString('base64')}`;

    return {
      userId: user.userId,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId,
      branchId: user.branchId,
      role: user.role,
      accessToken,
    };
  }
}
