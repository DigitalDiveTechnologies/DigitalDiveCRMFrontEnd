/**
 * API Client Utility for connecting Next.js web dashboard to NestJS backend REST APIs.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchFromApi<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  let activeTenant = 'tenant-default';
  if (typeof window !== 'undefined') {
    const session = localStorage.getItem('user_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.tenantId) {
          activeTenant = parsed.tenantId;
        }
      } catch (e) {}
    }
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-tenant-id': activeTenant,
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      throw new Error(`API Error ${res.status}: ${res.statusText}`);
    }

    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[API Client] Endpoint ${endpoint} unreachable, using local fallback state:`, err);
    throw err;
  }
}

export const api = {
  // Sales Invoices
  getInvoices: () =>
    fetchFromApi<any[]>('/sales-invoices'),
  createSalesInvoice: (data: any) =>
    fetchFromApi('/sales-invoices', { method: 'POST', body: JSON.stringify(data) }),

  // Parties
  getParties: () =>
    fetchFromApi<any[]>('/parties'),
  createParty: (data: any) =>
    fetchFromApi('/parties', { method: 'POST', body: JSON.stringify(data) }),

  // Purchases
  getBills: () =>
    fetchFromApi<any[]>('/purchase-bills'),
  createBill: (data: any) =>
    fetchFromApi('/purchase-bills', { method: 'POST', body: JSON.stringify(data) }),

  // Ledger & Financial Reports
  postJournal: (data: any) =>
    fetchFromApi('/ledger/post-journal', { method: 'POST', body: JSON.stringify(data) }),
  getJournals: () => fetchFromApi<any[]>('/ledger/journals'),
  getTrialBalance: () => fetchFromApi('/ledger/trial-balance'),
  getProfitLoss: () => fetchFromApi('/ledger/profit-loss'),
  getBalanceSheet: () => fetchFromApi('/ledger/balance-sheet'),

  // Inventory
  getItems: () => fetchFromApi<any[]>('/inventory/items'),
  createItem: (data: any) =>
    fetchFromApi('/inventory/items', { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (id: string, data: any) =>
    fetchFromApi(`/inventory/items/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getWarehouses: () => fetchFromApi<any[]>('/inventory/warehouses'),
  createWarehouse: (data: any) =>
    fetchFromApi('/inventory/warehouses', { method: 'POST', body: JSON.stringify(data) }),
  transferStock: (data: any) =>
    fetchFromApi('/inventory/transfers', { method: 'POST', body: JSON.stringify(data) }),
  adjustStock: (data: any) =>
    fetchFromApi('/inventory/adjustments', { method: 'POST', body: JSON.stringify(data) }),
  getStockMovements: () => fetchFromApi<any[]>('/inventory/movements'),

  // Tax & E-Invoicing
  calculateTax: (lines: any[]) =>
    fetchFromApi('/tax/calculate', { method: 'POST', body: JSON.stringify(lines) }),
  submitEInvoice: (data: any) =>
    fetchFromApi('/tax/einvoices/submit', { method: 'POST', body: JSON.stringify(data) }),
  getVat201: () => fetchFromApi('/tax/vat-201'),

  // Employees & Payroll
  getEmployees: () =>
    fetchFromApi<any[]>('/employees'),
  createEmployee: (data: any) =>
    fetchFromApi('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id: string, data: any) =>
    fetchFromApi(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteEmployee: (id: string) =>
    fetchFromApi(`/employees/${id}`, { method: 'DELETE' }),
  sendPayslip: (id: string, data: { month: string; year: number }) =>
    fetchFromApi(`/employees/${id}/payslip`, { method: 'POST', body: JSON.stringify(data) }),
  sendBulkPayslips: (data: { employeeIds: string[]; month: string; year: number }) =>
    fetchFromApi('/employees/payslips/bulk', { method: 'POST', body: JSON.stringify(data) }),

  // Email Portal
  getEmailSettings: () =>
    fetchFromApi<any>('/email/settings'),
  saveEmailSettings: (data: any) =>
    fetchFromApi('/email/settings', { method: 'POST', body: JSON.stringify(data) }),
  sendEmail: (data: { to: string[]; subject: string; body: string }) =>
    fetchFromApi('/email/send', { method: 'POST', body: JSON.stringify(data) }),

  // Organizations & Multi-Tenancy Mappings
  getTenants: () =>
    fetchFromApi<any[]>('/auth/tenants'),
  createTenant: (data: any) =>
    fetchFromApi('/auth/tenants', { method: 'POST', body: JSON.stringify(data) }),
  getBranches: (tenantId: string) =>
    fetchFromApi<any[]>(`/auth/tenants/${tenantId}/branches`),
  createBranch: (tenantId: string, data: any) =>
    fetchFromApi(`/auth/tenants/${tenantId}/branches`, { method: 'POST', body: JSON.stringify(data) }),
  getSystemUsers: () =>
    fetchFromApi<any[]>('/auth/users'),
  createSystemUser: (data: any) =>
    fetchFromApi('/auth/users', { method: 'POST', body: JSON.stringify(data) }),
  updateSystemUser: (id: string, data: any) =>
    fetchFromApi(`/auth/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTenant: (id: string) =>
    fetchFromApi(`/auth/tenants/${id}`, { method: 'DELETE' }),
  deleteBranch: (id: string) =>
    fetchFromApi(`/auth/branches/${id}`, { method: 'DELETE' }),
  deleteSystemUser: (id: string) =>
    fetchFromApi(`/auth/users/${id}`, { method: 'DELETE' }),

  // Offline Sync
  pushSync: (data: any) =>
    fetchFromApi('/sync/push', { method: 'POST', body: JSON.stringify(data) }),
  pullSync: (cursor?: string) =>
    fetchFromApi(`/sync/pull${cursor ? `?cursor=${cursor}` : ''}`),

  // Audit Logs
  getAuditLogs: () => fetchFromApi<any[]>('/auth/audit-logs'),
};
