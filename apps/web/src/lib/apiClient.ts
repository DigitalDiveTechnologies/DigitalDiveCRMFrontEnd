/**
 * API Client Utility for connecting Next.js web dashboard to NestJS backend REST APIs.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchFromApi<T>(
  endpoint: string,
  options: RequestInit = {},
  tenantId: string = 'tenant-default',
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-tenant-id': tenantId,
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
  createSalesInvoice: (data: any) =>
    fetchFromApi('/sales-invoices', { method: 'POST', body: JSON.stringify(data) }),

  // Parties
  createParty: (data: any) =>
    fetchFromApi('/parties', { method: 'POST', body: JSON.stringify(data) }),

  // Purchases
  createBill: (data: any) =>
    fetchFromApi('/purchase-bills', { method: 'POST', body: JSON.stringify(data) }),

  // Ledger & Financial Reports
  postJournal: (data: any) =>
    fetchFromApi('/ledger/post-journal', { method: 'POST', body: JSON.stringify(data) }),
  getTrialBalance: () => fetchFromApi('/ledger/trial-balance'),
  getProfitLoss: () => fetchFromApi('/ledger/profit-loss'),
  getBalanceSheet: () => fetchFromApi('/ledger/balance-sheet'),

  // Inventory
  getItems: () => fetchFromApi('/inventory/items'),
  createItem: (data: any) =>
    fetchFromApi('/inventory/items', { method: 'POST', body: JSON.stringify(data) }),

  // Tax & E-Invoicing
  calculateTax: (lines: any[]) =>
    fetchFromApi('/tax/calculate', { method: 'POST', body: JSON.stringify(lines) }),
  submitEInvoice: (data: any) =>
    fetchFromApi('/tax/einvoices/submit', { method: 'POST', body: JSON.stringify(data) }),
  getVat201: () => fetchFromApi('/tax/vat-201'),

  // Offline Sync
  pushSync: (data: any) =>
    fetchFromApi('/sync/push', { method: 'POST', body: JSON.stringify(data) }),
  pullSync: (cursor?: string) =>
    fetchFromApi(`/sync/pull${cursor ? `?cursor=${cursor}` : ''}`),
};
