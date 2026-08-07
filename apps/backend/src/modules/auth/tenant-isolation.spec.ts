import { TenantIsolationGuard } from './tenant-isolation.guard';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

describe('TenantIsolationGuard (Automated Tenant Isolation Security Test)', () => {
  let guard: TenantIsolationGuard;

  beforeEach(() => {
    guard = new TenantIsolationGuard();
  });

  function createMockContext(headers: any, body?: any, params?: any): any {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
          body,
          params,
        }),
      }),
    };
  }

  it('should allow request when tenant context matches target tenant', () => {
    const context = createMockContext({ 'x-tenant-id': 'tenant-dxb-100' }, { tenantId: 'tenant-dxb-100' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should block cross-tenant request with ForbiddenException when tenant IDs mismatch', () => {
    const context = createMockContext({ 'x-tenant-id': 'tenant-dxb-100' }, { tenantId: 'tenant-abudhabi-999' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw UnauthorizedException when header x-tenant-id is missing', () => {
    const context = createMockContext({}, { tenantId: 'tenant-dxb-100' });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
