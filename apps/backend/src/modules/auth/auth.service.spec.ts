import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { UserRole } from './roles.enum';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '../../database/entities/user.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import { Branch } from '../../database/entities/branch.entity';

const mockUser: Partial<User> = {
  id: 'usr-test-001',
  email: 'owner@digitaldive.ae',
  password: 'admin',
  name: 'Rashid Al Nuaimi',
  role: 'OWNER',
  tenantId: 'tenant-001',
  branchId: 'branch-001',
};

const mockUserRepo = {
  count: jest.fn().mockResolvedValue(1),
  findOne: jest.fn().mockImplementation(({ where }) => {
    if (where?.email === 'owner@digitaldive.ae') return Promise.resolve(mockUser);
    return Promise.resolve(null);
  }),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn().mockResolvedValue([mockUser]),
};

const mockTenantRepo = {
  count: jest.fn().mockResolvedValue(1),
  findOne: jest.fn().mockResolvedValue({ id: 'tenant-001', companyName: 'Digital Dive Technologies' }),
  create: jest.fn(),
  save: jest.fn(),
};

const mockBranchRepo = {
  count: jest.fn().mockResolvedValue(1),
  findOne: jest.fn().mockResolvedValue({ id: 'branch-001', tenantId: 'tenant-001' }),
  create: jest.fn(),
  save: jest.fn(),
};

describe('AuthService (Database-backed Authentication)', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Tenant), useValue: mockTenantRepo },
        { provide: getRepositoryToken(Branch), useValue: mockBranchRepo },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should authenticate the default owner and return a valid session token', async () => {
    const session = await authService.login({ email: 'owner@digitaldive.ae', password: 'admin' });

    expect(session.userId).toBe('usr-test-001');
    expect(session.email).toBe('owner@digitaldive.ae');
    expect(session.role).toBe(UserRole.OWNER);
    expect(session.accessToken).toContain('jwt-bearer-');
  });

  it('should throw UnauthorizedException for an unknown email address', async () => {
    await expect(authService.login({ email: 'unknown@hacker.com' })).rejects.toThrow(UnauthorizedException);
  });
});
