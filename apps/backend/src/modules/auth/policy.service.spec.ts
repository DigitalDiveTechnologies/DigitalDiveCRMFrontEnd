import { PolicyService } from './policy.service';
import { UserRole, PermissionAction } from './roles.enum';

describe('PolicyService (RBAC Role & Permission Verification)', () => {
  let policyService: PolicyService;

  beforeEach(() => {
    policyService = new PolicyService();
  });

  it('Owner should have full permissions including config and users management', () => {
    expect(policyService.hasPermission(UserRole.OWNER, PermissionAction.CONFIG_MANAGE)).toBe(true);
    expect(policyService.hasPermission(UserRole.OWNER, PermissionAction.LEDGER_POST)).toBe(true);
  });

  it('Biller/Cashier should be allowed to create sales but BLOCKED from General Ledger posting', () => {
    expect(policyService.hasPermission(UserRole.BILLER_CASHIER, PermissionAction.SALES_CREATE)).toBe(true);
    expect(policyService.hasPermission(UserRole.BILLER_CASHIER, PermissionAction.LEDGER_POST)).toBe(false);
  });

  it('Inventory Manager should be allowed stock transfers but BLOCKED from direct General Ledger posting', () => {
    expect(policyService.hasPermission(UserRole.INVENTORY_MANAGER, PermissionAction.INVENTORY_TRANSFER)).toBe(true);
    expect(policyService.hasPermission(UserRole.INVENTORY_MANAGER, PermissionAction.LEDGER_POST)).toBe(false);
  });

  it('Auditor should have read-only access to reports and audit logs but BLOCKED from mutations', () => {
    expect(policyService.hasPermission(UserRole.AUDITOR, PermissionAction.REPORTS_READ)).toBe(true);
    expect(policyService.hasPermission(UserRole.AUDITOR, PermissionAction.SALES_CREATE)).toBe(false);
  });
});
