'use client';

import React from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

interface OutboxMutationRow {
  mutationId: string;
  deviceId: string;
  deviceType: 'WINDOWS_POS' | 'ANDROID_MOBILE' | 'MACOS_POS';
  idempotencyKey: string;
  entityType: string;
  operation: string;
  clientTime: string;
  status: 'POSTED_TO_LEDGER' | 'INGESTED' | 'CONFLICT_REJECTED';
}

const mockSyncLogs: OutboxMutationRow[] = [
  { mutationId: 'mut-dxb-9021', deviceId: 'pos-terminal-dubai-01', deviceType: 'WINDOWS_POS', idempotencyKey: 'idemp-uuid-80219482', entityType: 'SALES_INVOICE', operation: 'CREATE', clientTime: '2026-08-05 21:50:12', status: 'POSTED_TO_LEDGER' },
  { mutationId: 'mut-dxb-9022', deviceId: 'mobile-salesman-android', deviceType: 'ANDROID_MOBILE', idempotencyKey: 'idemp-uuid-80219483', entityType: 'RECEIPT', operation: 'CREATE', clientTime: '2026-08-05 21:48:30', status: 'POSTED_TO_LEDGER' },
  { mutationId: 'mut-dxb-9023', deviceId: 'pos-terminal-dubai-02', deviceType: 'WINDOWS_POS', idempotencyKey: 'idemp-uuid-80219484', entityType: 'SALES_INVOICE', operation: 'CREATE', clientTime: '2026-08-05 21:45:00', status: 'POSTED_TO_LEDGER' },
];

export default function SyncPage() {
  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Offline Outbox & Device Sync Engine</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            Asynchronous client ingestion, idempotency deduplication, and conflict resolution
          </p>
        </div>
        <span className="badge-status badge-status-blue">
          <RefreshCw size={12} /> Sync Engine Online
        </span>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card-enterprise">
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
            Registered Devices
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>2 Devices</div>
          <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>1 Windows POS, 1 Android Mobile</span>
        </div>

        <div className="card-enterprise">
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
            Pending Client Outbox Queue
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>0 Pending</div>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>All mutations synchronized</span>
        </div>

        <div className="card-enterprise">
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
            Idempotency Status
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb' }}>100% Filtered</div>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Client UUID keys active</span>
        </div>
      </div>

      {/* Sync Log Data Table */}
      <div className="card-enterprise" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-main)', fontWeight: 600, color: '#0f172a' }}>
          Recent Ingested Outbox Mutations
        </div>
        <table className="table-enterprise">
          <thead>
            <tr>
              <th>Mutation ID</th>
              <th>Device ID</th>
              <th>Idempotency Key</th>
              <th>Entity / Operation</th>
              <th>Client Timestamp</th>
              <th style={{ textAlign: 'center' }}>Ingestion Status</th>
            </tr>
          </thead>
          <tbody>
            {mockSyncLogs.map((log) => (
              <tr key={log.mutationId}>
                <td style={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 600 }}>{log.mutationId}</td>
                <td style={{ fontSize: '0.82rem' }}>{log.deviceId}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#64748b' }}>{log.idempotencyKey}</td>
                <td style={{ fontSize: '0.85rem' }}>
                  <strong>{log.entityType}</strong> <span style={{ color: '#2563eb', fontSize: '0.75rem' }}>({log.operation})</span>
                </td>
                <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{log.clientTime}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className="badge-status badge-status-green">
                    <CheckCircle2 size={12} /> {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
