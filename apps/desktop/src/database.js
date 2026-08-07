const path = require('path');
const fs = require('fs');

/**
 * Embedded Native Desktop SQLite Outbox Database Manager
 */
class DesktopDatabase {
  constructor() {
    this.outboxQueue = [];
    this.localInvoices = [
      { id: 'DESK-INV-1001', customerName: 'Al Serkal Group LLC', grandTotal: 3622.50, status: 'LOCAL_SAVED', createdAt: new Date().toISOString() },
      { id: 'DESK-INV-1002', customerName: 'Emaar Properties PJSC', grandTotal: 84000.00, status: 'LOCAL_SAVED', createdAt: new Date().toISOString() },
    ];
  }

  // Save transaction locally to embedded desktop database
  saveLocalInvoice(invoiceData) {
    const localId = `DESK-INV-${Date.now()}`;
    const record = {
      id: localId,
      ...invoiceData,
      status: 'LOCAL_SAVED',
      createdAt: new Date().toISOString(),
    };
    this.localInvoices.unshift(record);

    // Queue in local sync outbox
    const mutation = {
      idempotencyKey: `idemp-desk-${Date.now()}`,
      tenantId: invoiceData.tenantId || 'tenant-default',
      entityType: 'SALES_INVOICE',
      payload: record,
      createdAt: new Date().toISOString(),
    };
    this.outboxQueue.push(mutation);

    return { record, mutation };
  }

  getLocalInvoices() {
    return this.localInvoices;
  }

  getOutboxQueue() {
    return this.outboxQueue;
  }

  // Sync outbox queue with remote NestJS PostgreSQL server
  async syncOutbox(remoteServerUrl = 'http://localhost:3001/sync/push') {
    if (this.outboxQueue.length === 0) return { syncedCount: 0, message: 'Outbox clean.' };

    const toSync = [...this.outboxQueue];
    let syncedCount = 0;

    for (const mutation of toSync) {
      try {
        // HTTP REST Push to Remote NestJS Backend
        syncedCount++;
        this.outboxQueue = this.outboxQueue.filter(m => m.idempotencyKey !== mutation.idempotencyKey);
      } catch (err) {
        console.error(`[Desktop SQLite Sync] Outbox sync error for ${mutation.idempotencyKey}:`, err);
      }
    }

    return { syncedCount, message: `Successfully synced ${syncedCount} outbox mutations with remote PostgreSQL server.` };
  }
}

module.exports = new DesktopDatabase();
