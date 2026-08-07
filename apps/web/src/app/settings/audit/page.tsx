'use client';

import React, { useState } from 'react';
import { ShieldAlert, Laptop, Smartphone, Lock, Search, Download, CheckCircle2, AlertOctagon } from 'lucide-react';
import { downloadCsv } from '@/lib/exportUtils';

interface DeviceSessionItem {
  sessionId: string;
  userEmail: string;
  deviceType: string;
  ipAddress: string;
  lastActive: string;
  isRevoked: boolean;
}

interface AuditLogEntry {
  id: string;
  correlationId: string;
  userEmail: string;
  action: 'USER_LOGIN' | 'ROLE_CHANGE' | 'DATA_EXPORT' | 'PRIVILEGE_ESCALATION' | 'SESSION_REVOKED';
  ipAddress: string;
  scope: string;
  timestamp: string;
  status: 'SUCCESS' | 'FLAGGED_ANOMALY';
}

const initialSessions: DeviceSessionItem[] = [
  { sessionId: 'sess-dxb-801', userEmail: 'rashid@alfuttaim.ae', deviceType: 'macOS Web Dashboard (Chrome)', ipAddress: '194.170.92.1', lastActive: 'Just now', isRevoked: false },
  { sessionId: 'sess-dxb-802', userEmail: 'tariq@alfuttaim.ae', deviceType: 'Windows POS Terminal Counter #01', ipAddress: '194.170.92.14', lastActive: '5 mins ago', isRevoked: false },
  { sessionId: 'sess-dxb-803', userEmail: 'saeed@alfuttaim.ae', deviceType: 'Android Mobile App (Samsung S23)', ipAddress: '92.98.112.45', lastActive: '18 mins ago', isRevoked: false },
];

const initialLogs: AuditLogEntry[] = [
  { id: '1', correlationId: 'corr-uuid-90182', userEmail: 'rashid@alfuttaim.ae', action: 'ROLE_CHANGE', ipAddress: '194.170.92.1', scope: 'Assigned ACCOUNTANT role to Saeed', timestamp: '2026-08-05 21:30:12', status: 'SUCCESS' },
  { id: '2', correlationId: 'corr-uuid-90183', userEmail: 'saeed@alfuttaim.ae', action: 'DATA_EXPORT', ipAddress: '194.170.92.1', scope: 'Exported Form VAT 201 Tax Return', timestamp: '2026-08-05 20:15:45', status: 'SUCCESS' },
  { id: '3', correlationId: 'corr-uuid-90184', userEmail: 'tariq@alfuttaim.ae', action: 'USER_LOGIN', ipAddress: '194.170.92.14', scope: 'Authenticated on POS Terminal #01', timestamp: '2026-08-05 19:00:00', status: 'SUCCESS' },
  { id: '4', correlationId: 'corr-uuid-90185', userEmail: 'unknown@external.org', action: 'PRIVILEGE_ESCALATION', ipAddress: '185.220.101.5', scope: 'Throttled 5 failed password attempts', timestamp: '2026-08-05 18:42:10', status: 'FLAGGED_ANOMALY' },
];

export default function AuditLogsPage() {
  const [sessions, setSessions] = useState<DeviceSessionItem[]>(initialSessions);
  const [logs, setLogs] = useState<AuditLogEntry[]>(initialLogs);
  const [searchTerm, setSearchTerm] = useState('');

  const handleRevokeSession = (sessionId: string) => {
    setSessions(sessions.map(s => s.sessionId === sessionId ? { ...s, isRevoked: true } : s));

    const newAuditEntry: AuditLogEntry = {
      id: String(Date.now()),
      correlationId: `corr-rev-${Math.floor(Math.random() * 100000)}`,
      userEmail: 'admin@alfuttaim.ae',
      action: 'SESSION_REVOKED',
      ipAddress: '194.170.92.1',
      scope: `Revoked active device session [${sessionId}]`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'SUCCESS',
    };

    setLogs([newAuditEntry, ...logs]);
  };

  const handleExportAuditLogs = () => {
    downloadCsv(
      'UAE_Security_Audit_Logs.csv',
      ['Correlation ID', 'User Email', 'Action Event', 'IP Address', 'Scope / Target', 'Timestamp', 'Security Status'],
      logs.map(l => [l.correlationId, l.userEmail, l.action, l.ipAddress, l.scope, l.timestamp, l.status])
    );
  };

  const filteredLogs = logs.filter(l =>
    l.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.correlationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Security, Device Sessions & Audit Logs</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            Immutable audit trails, correlationId tracking, active device sessions, and abuse protection
          </p>
        </div>
        <button onClick={handleExportAuditLogs} className="btn-secondary">
          <Download size={14} /> Export Security Audit Logs (CSV)
        </button>
      </div>

      {/* Active Device Sessions & Revocation Console */}
      <div className="card-enterprise" style={{ padding: '0', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-main)', fontWeight: 600, color: '#0f172a', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Laptop size={16} color="#2563eb" /> Active User Device Sessions & Refresh Tokens
          </span>
          <span className="badge-status badge-status-blue">Anomaly Detection Active</span>
        </div>

        <table className="table-enterprise">
          <thead>
            <tr>
              <th>Session ID</th>
              <th>User Email</th>
              <th>Device Model / Platform</th>
              <th>IP Address</th>
              <th>Last Active</th>
              <th style={{ textAlign: 'center' }}>Session Control</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.sessionId}>
                <td style={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 600 }}>{s.sessionId}</td>
                <td style={{ fontWeight: 500, color: '#0f172a' }}>{s.userEmail}</td>
                <td style={{ fontSize: '0.82rem', color: '#475569' }}>{s.deviceType}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#64748b' }}>{s.ipAddress}</td>
                <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.lastActive}</td>
                <td style={{ textAlign: 'center' }}>
                  {s.isRevoked ? (
                    <span className="badge-status badge-status-amber">REVOKED</span>
                  ) : (
                    <button
                      onClick={() => handleRevokeSession(s.sessionId)}
                      style={{
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Revoke Device Session
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Filter Bar */}
      <div className="card-enterprise" style={{ padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Search size={14} color="#64748b" />
        <input
          type="text"
          placeholder="Filter audit logs by correlation ID, user email, or action event..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ background: 'transparent', border: 'none', color: '#0f172a', width: '100%', outline: 'none', fontSize: '0.85rem' }}
        />
      </div>

      {/* Immutable Audit Trail Table */}
      <div className="card-enterprise" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-main)', fontWeight: 600, color: '#0f172a' }}>
          Immutable Action & Security Audit Log
        </div>
        <table className="table-enterprise">
          <thead>
            <tr>
              <th>Correlation ID</th>
              <th>User Email</th>
              <th>Action Event</th>
              <th>IP Address</th>
              <th>Security Scope / Target</th>
              <th>Timestamp</th>
              <th style={{ textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((l) => (
              <tr key={l.id}>
                <td style={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 600, fontSize: '0.78rem' }}>{l.correlationId}</td>
                <td style={{ fontWeight: 500, color: '#0f172a' }}>{l.userEmail}</td>
                <td>
                  <span className={l.action === 'PRIVILEGE_ESCALATION' ? 'badge-status badge-status-amber' : 'badge-status badge-status-blue'}>
                    {l.action}
                  </span>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#64748b' }}>{l.ipAddress}</td>
                <td style={{ fontSize: '0.82rem', color: '#334155' }}>{l.scope}</td>
                <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{l.timestamp}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className={l.status === 'SUCCESS' ? 'badge-status badge-status-green' : 'badge-status badge-status-amber'}>
                    {l.status === 'SUCCESS' ? <CheckCircle2 size={12} /> : <AlertOctagon size={12} />}
                    {l.status}
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
