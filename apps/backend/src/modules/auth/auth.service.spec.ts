import { AuthService } from './auth.service';
import { UserRole } from './roles.enum';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService (JWT Authentication & Login Verification)', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  it('should authenticate Auditor user and return valid session token with AUDITOR role', async () => {
    const session = await authService.login({ email: 'auditor@alfuttaim.ae' });

    expect(session.userId).toBeDefined();
    expect(session.email).toBe('auditor@alfuttaim.ae');
    expect(session.role).toBe(UserRole.AUDITOR);
    expect(session.accessToken).toContain('jwt-bearer-');
  });

  it('should throw UnauthorizedException for unknown email address', async () => {
    await expect(authService.login({ email: 'unknown@hacker.com' })).rejects.toThrow(UnauthorizedException);
  });
});
