export type UserRoleType = 'OWNER' | 'SECONDARY_ADMIN' | 'ACCOUNTANT' | 'BILLER_CASHIER' | 'INVENTORY_MANAGER' | 'AUDITOR';

export function getActiveUserRole(): UserRoleType {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('active_user_role');
    if (saved) return saved as UserRoleType;
    const sessionRaw = localStorage.getItem('user_session');
    if (sessionRaw) {
      try {
        const session = JSON.parse(sessionRaw);
        if (session.role) return session.role as UserRoleType;
      } catch (e) {}
    }
  }
  return 'OWNER';
}

export function can(action: 'CREATE_INVOICE' | 'MANAGE_PARTIES' | 'MANAGE_ITEMS' | 'CREATE_PURCHASE' | 'INVENTORY_WRITE' | 'MANAGE_USERS' | 'VIEW_LEDGER'): boolean {
  const role = getActiveUserRole();

  if (role === 'OWNER' || role === 'SECONDARY_ADMIN') return true;
  if (role === 'AUDITOR') return false; // Auditor is 100% READ-ONLY on all write actions

  if (role === 'BILLER_CASHIER') {
    return ['CREATE_INVOICE', 'MANAGE_PARTIES', 'MANAGE_ITEMS'].includes(action);
  }
  if (role === 'ACCOUNTANT') {
    return ['CREATE_INVOICE', 'MANAGE_PARTIES', 'MANAGE_ITEMS', 'CREATE_PURCHASE', 'VIEW_LEDGER'].includes(action);
  }
  if (role === 'INVENTORY_MANAGER') {
    return ['MANAGE_ITEMS', 'INVENTORY_WRITE'].includes(action);
  }

  return true;
}
