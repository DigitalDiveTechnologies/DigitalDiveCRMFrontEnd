/**
 * Offline-First Client Database Engine & Sync Outbox
 * Built according to UAE Accounting Platform Technical Architecture Section 5.
 */

import { API_BASE_URL } from './apiClient';

export interface OutboxMutation {
  id: string; // Idempotency UUID
  tenantId: string;
  entityType: 'SALES_INVOICE' | 'RECEIPT' | 'STOCK_TRANSFER' | 'PARTY';
  payload: any;
  createdAt: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
}

const OUTBOX_STORAGE_KEY = 'uae_accounting_offline_outbox';
const LOCAL_DB_KEY = 'uae_accounting_local_db';

export const offlineDb = {
  // Get all pending outbox mutations
  getOutbox(): OutboxMutation[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  // Save offline mutation to outbox queue
  saveMutation(entityType: OutboxMutation['entityType'], payload: any, tenantId: string = 'tenant-default'): OutboxMutation {
    const mutation: OutboxMutation = {
      id: `idemp-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      tenantId,
      entityType,
      payload,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
    };

    const current = this.getOutbox();
    const updated = [...current, mutation];
    localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(updated));

    // Also persist into local offline SQLite/IndexedDB store
    this.persistLocalStore(entityType, payload);

    return mutation;
  },

  // Clear synced mutations from outbox
  markSynced(mutationId: string) {
    const current = this.getOutbox();
    const updated = current.filter(m => m.id !== mutationId);
    localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(updated));
  },

  // Save to local offline database store
  persistLocalStore(entityType: string, record: any) {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(LOCAL_DB_KEY) || '{}';
    const db = JSON.parse(raw);
    if (!db[entityType]) db[entityType] = [];
    db[entityType].push({ ...record, offlineId: Date.now() });
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
  },

  // Read from local offline store
  getLocalRecords(entityType: string): any[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(LOCAL_DB_KEY) || '{}';
    const db = JSON.parse(raw);
    return db[entityType] || [];
  },

  // Trigger Outbox Sync Push to remote backend server
  async syncOutboxWithServer(remoteSyncUrl: string = `${API_BASE_URL}/sync/push`): Promise<{ syncedCount: number; errors: any[] }> {
    const pending = this.getOutbox();
    if (pending.length === 0) return { syncedCount: 0, errors: [] };

    let syncedCount = 0;
    const errors: any[] = [];

    for (const mutation of pending) {
      try {
        const res = await fetch(remoteSyncUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': mutation.tenantId,
          },
          body: JSON.stringify({
            mutations: [
              {
                idempotencyKey: mutation.id,
                entityType: mutation.entityType,
                payload: mutation.payload,
                clientTimestamp: mutation.createdAt,
              },
            ],
          }),
        });

        if (res.ok) {
          this.markSynced(mutation.id);
          syncedCount++;
        } else {
          errors.push({ id: mutation.id, error: `HTTP ${res.status}` });
        }
      } catch (err) {
        errors.push({ id: mutation.id, error: err });
      }
    }

    return { syncedCount, errors };
  },
};
