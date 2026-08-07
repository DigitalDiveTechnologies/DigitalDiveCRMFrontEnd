import { Injectable } from '@nestjs/common';
import { UserRole, PermissionAction } from './roles.enum';

@Injectable()
export class PolicyService {
  private readonly rolePermissionsMap: Record<UserRole, PermissionAction[]> = {
    [UserRole.OWNER]: [
      PermissionAction.LEDGER_READ, PermissionAction.LEDGER_POST, PermissionAction.PERIOD_CLOSE,
      PermissionAction.SALES_CREATE, PermissionAction.SALES_READ, PermissionAction.PAYMENT_COLLECT,
      PermissionAction.PURCHASE_CREATE, PermissionAction.PURCHASE_READ,
      PermissionAction.INVENTORY_READ, PermissionAction.INVENTORY_TRANSFER, PermissionAction.INVENTORY_ADJUST,
      PermissionAction.USERS_MANAGE, PermissionAction.CONFIG_MANAGE, PermissionAction.REPORTS_READ, PermissionAction.AUDIT_READ,
    ],

    [UserRole.SECONDARY_ADMIN]: [
      PermissionAction.LEDGER_READ, PermissionAction.LEDGER_POST,
      PermissionAction.SALES_CREATE, PermissionAction.SALES_READ, PermissionAction.PAYMENT_COLLECT,
      PermissionAction.PURCHASE_CREATE, PermissionAction.PURCHASE_READ,
      PermissionAction.INVENTORY_READ, PermissionAction.INVENTORY_TRANSFER, PermissionAction.INVENTORY_ADJUST,
      PermissionAction.USERS_MANAGE, PermissionAction.REPORTS_READ, PermissionAction.AUDIT_READ,
    ],

    [UserRole.BILLER_CASHIER]: [
      PermissionAction.SALES_CREATE, PermissionAction.SALES_READ, PermissionAction.PAYMENT_COLLECT,
      PermissionAction.INVENTORY_READ,
    ],

    [UserRole.ACCOUNTANT]: [
      PermissionAction.LEDGER_READ, PermissionAction.LEDGER_POST, PermissionAction.PERIOD_CLOSE,
      PermissionAction.SALES_READ, PermissionAction.PURCHASE_READ,
      PermissionAction.REPORTS_READ, PermissionAction.AUDIT_READ,
    ],

    [UserRole.INVENTORY_MANAGER]: [
      PermissionAction.INVENTORY_READ, PermissionAction.INVENTORY_TRANSFER, PermissionAction.INVENTORY_ADJUST,
      PermissionAction.PURCHASE_READ,
    ],

    [UserRole.AUDITOR]: [
      PermissionAction.LEDGER_READ, PermissionAction.REPORTS_READ, PermissionAction.AUDIT_READ,
    ],
  };

  /**
   * Check if a specific role possesses permission for a target action.
   */
  hasPermission(role: UserRole, action: PermissionAction): boolean {
    const permissions = this.rolePermissionsMap[role] || [];
    return permissions.includes(action);
  }

  /**
   * Get all allowed permissions for a role.
   */
  getRolePermissions(role: UserRole): PermissionAction[] {
    return this.rolePermissionsMap[role] || [];
  }
}
