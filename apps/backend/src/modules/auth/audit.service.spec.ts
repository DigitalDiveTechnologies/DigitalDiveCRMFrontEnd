import { AuditService } from './audit.service';
import { AuditAction, AuditLogEntity } from '../../database/entities/audit-log.entity';

describe('AuditService (Access & Session Logging Features)', () => {
  let auditService: AuditService;
  const savedEntries: AuditLogEntity[] = [];

  beforeEach(() => {
    savedEntries.length = 0;

    const mockRepo = {
      create: jest.fn((dto: any) => ({ ...dto, id: `mock-${Date.now()}`, timestamp: new Date() })) as any,
      save: jest.fn(async (entry: any) => { savedEntries.push(entry); return entry; }) as any,
      find: jest.fn(async (opts?: any) => {
        const tenantId = opts?.where?.tenantId;
        return tenantId ? savedEntries.filter(e => e.tenantId === tenantId) : [...savedEntries];
      }) as any,
    };

    auditService = new AuditService(mockRepo as any);
  });

  it('should log immutable security audit event and persist to repository', async () => {
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
    expect(savedEntries).toHaveLength(1);
    expect(savedEntries[0].action).toBe(AuditAction.ROLE_CHANGE);
  });

  it('should retrieve persisted audit logs filtered by tenantId', async () => {
    await auditService.logAuditEvent({
      tenantId: 'tenant-dxb',
      userEmail: 'owner@company.ae',
      action: AuditAction.USER_LOGIN,
      correlationId: 'corr-login-1',
      ipAddress: '10.0.0.1',
    });

    await auditService.logAuditEvent({
      tenantId: 'tenant-dxb',
      userEmail: 'cashier@company.ae',
      action: AuditAction.INVOICE_CREATED,
      correlationId: 'corr-inv-1',
      ipAddress: '10.0.0.2',
    });

    const logs = await auditService.getAuditLogs('tenant-dxb');
    expect(logs.length).toBe(2);
  });

  it('should persist USER_CREATED event with correct metadata', async () => {
    const result = await auditService.logAuditEvent({
      tenantId: 'tenant-dxb',
      userEmail: 'admin@company.ae',
      action: AuditAction.USER_CREATED,
      correlationId: 'corr-user-create-1',
      ipAddress: '194.170.92.1',
      metadata: { newUserEmail: 'staff@company.ae', newUserRole: 'BILLER_CASHIER' },
    });

    expect(result.correlationId).toBe('corr-user-create-1');
    expect(savedEntries[0].metadata).toMatchObject({ newUserEmail: 'staff@company.ae' });
  });
});
