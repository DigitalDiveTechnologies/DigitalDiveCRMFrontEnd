import { AuditService } from './audit.service';
import { AuditAction } from '../../database/entities/audit-log.entity';

describe('AuditService (Access & Session Logging Features)', () => {
  let auditService: AuditService;

  beforeEach(() => {
    auditService = new AuditService();
  });

  it('should log immutable security audit event with correlationId', async () => {
    const result = await auditService.logAuditEvent({
      tenantId: 'tenant-dxb',
      userEmail: 'admin@company.ae',
      action: AuditAction.ROLE_CHANGE,
      correlationId: 'corr-uuid-99018273',
      ipAddress: '194.170.92.1',
      metadata: { targetUser: 'staff@company.ae', newRole: 'ACCOUNTANT' },
    });

    expect(result.auditId).toBeDefined();
    expect(result.correlationId).toBe('corr-uuid-99018273');
  });

  it('should retrieve active device sessions and perform session revocation', async () => {
    const sessionsBefore = await auditService.getActiveSessions();
    expect(sessionsBefore.length).toBeGreaterThan(0);

    const revokeResult = await auditService.revokeDeviceSession('sess-dxb-801', 'admin@company.ae');
    expect(revokeResult.success).toBe(true);
    expect(revokeResult.revokedSessionId).toBe('sess-dxb-801');

    const targetSession = (await auditService.getActiveSessions()).find((s) => s.sessionId === 'sess-dxb-801');
    expect(targetSession?.isRevoked).toBe(true);
  });
});
