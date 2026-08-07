export enum UserRole {
  OWNER = 'OWNER',                             // Full access, users, config, subscription, branch control
  SECONDARY_ADMIN = 'SECONDARY_ADMIN',         // Operational access, cannot override owner security settings
  BILLER_CASHIER = 'BILLER_CASHIER',           // Drafts/Sales, collect payments, assigned stock (No GL access)
  ACCOUNTANT = 'ACCOUNTANT',                   // Financial records, post adjustments, reconcile, close periods, reports
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',     // Items, warehouses, stock counts, transfers, adjustments (No GL access)
  AUDITOR = 'AUDITOR',                         // Read-only reports, journal history, audit logs
}

export enum PermissionAction {
  // Ledger & Accounting
  LEDGER_READ = 'ledger:read',
  LEDGER_POST = 'ledger:post',
  PERIOD_CLOSE = 'period:close',
  
  // Sales & Billing
  SALES_CREATE = 'sales:create',
  SALES_READ = 'sales:read',
  PAYMENT_COLLECT = 'payment:collect',
  
  // Purchases
  PURCHASE_CREATE = 'purchase:create',
  PURCHASE_READ = 'purchase:read',
  
  // Inventory
  INVENTORY_READ = 'inventory:read',
  INVENTORY_TRANSFER = 'inventory:transfer',
  INVENTORY_ADJUST = 'inventory:adjust',
  
  // System & Users
  USERS_MANAGE = 'users:manage',
  CONFIG_MANAGE = 'config:manage',
  REPORTS_READ = 'reports:read',
  AUDIT_READ = 'audit:read',
}
