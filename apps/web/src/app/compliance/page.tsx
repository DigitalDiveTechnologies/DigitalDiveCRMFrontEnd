'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Send, CheckCircle2, RefreshCw, AlertTriangle, User, LogIn, Key, Download, Package, FileText, ArrowLeftRight } from 'lucide-react';
import { api } from '@/lib/apiClient';

const ACTION_META: Record<string, { label: string; color: string; badgeClass: string; icon: React.ReactNode }> = {
  USER_LOGIN:           { label: 'User Login',           color: '#2563eb', badgeClass: 'badge-status-blue',  icon: <LogIn size={12} /> },
  USER_LOGOUT:          { label: 'User Logout',          color: '#64748b', badgeClass: 'badge-status-blue',  icon: <LogIn size={12} /> },
  USER_CREATED:         { label: 'User Created',         color: '#059669', badgeClass: 'badge-status-green', icon: <User size={12} /> },
  ROLE_CHANGE:          { label: 'Role Changed',         color: '#d97706', badgeClass: 'badge-status-amber', icon: <Key size={12} /> },
  PRIVILEGE_ESCALATION: { label: 'Privilege Escalated',  color: '#dc2626', badgeClass: 'badge-status-red',   icon: <AlertTriangle size={12} /> },
  DATA_EXPORT:          { label: 'Data Exported',        color: '#7c3aed', badgeClass: 'badge-status-blue',  icon: <Download size={12} /> },
  DOCUMENT_ACCESS:      { label: 'Document Accessed',    color: '#475569', badgeClass: 'badge-status-blue',  icon: <FileText size={12} /> },
  SESSION_REVOKED:      { label: 'Session Revoked',      color: '#dc2626', badgeClass: 'badge-status-red',   icon: <AlertTriangle size={12} /> },
  INVOICE_CREATED:      { label: 'Invoice Created',      color: '#059669', badgeClass: 'badge-status-green', icon: <FileText size={12} /> },
  STOCK_ADJUSTMENT:     { label: 'Stock Write-off',      color: '#dc2626', badgeClass: 'badge-status-red',   icon: <Package size={12} /> },
  STOCK_TRANSFER:       { label: 'Stock Transfer',       color: '#2563eb', badgeClass: 'badge-status-blue',  icon: <ArrowLeftRight size={12} /> },
  PURCHASE_RECORDED:    { label: 'Purchase Recorded',    color: '#059669', badgeClass: 'badge-status-green', icon: <Package size={12} /> },
};

export default function CompliancePage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [filterAction, setFilterAction] = useState('ALL');

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const logs = await api.getAuditLogs();
      setAuditLogs(logs || []);
    } catch (e) {
      console.error('Failed to load audit logs', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = filterAction === 'ALL'
    ? auditLogs
    : auditLogs.filter(l => l.action === filterAction);

  const actionTypes = ['ALL', ...Object.keys(ACTION_META)];

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>Security Audit Log</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '2px' }}>
            Immutable real-time trail of all system actions — logins, role changes, stock write-offs, and more.
          </p>
        </div>
        <button
          onClick={loadLogs}
          disabled={isLoading}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
          {isLoading ? 'Refreshing...' : 'Refresh Logs'}
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card-enterprise">
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Total Events Logged</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{auditLogs.length}</div>
        </div>
        <div className="card-enterprise">
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Login Events</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb' }}>{auditLogs.filter(l => l.action === 'USER_LOGIN').length}</div>
        </div>
        <div className="card-enterprise">
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Role Changes</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706' }}>{auditLogs.filter(l => l.action === 'ROLE_CHANGE').length}</div>
        </div>
        <div className="card-enterprise">
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Stock Write-offs</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626' }}>{auditLogs.filter(l => l.action === 'STOCK_ADJUSTMENT').length}</div>
        </div>
      </div>

      {/* Filter by action type */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {actionTypes.map(a => (
          <button
            key={a}
            onClick={() => setFilterAction(a)}
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              border: filterAction === a ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
              background: filterAction === a ? '#eff6ff' : '#ffffff',
              color: filterAction === a ? '#2563eb' : '#64748b',
              fontWeight: filterAction === a ? 700 : 400,
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            {a === 'ALL' ? 'All Events' : (ACTION_META[a]?.label || a)}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <RefreshCw size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
            Loading audit logs from database...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <ShieldCheck size={32} style={{ margin: '0 auto 12px', display: 'block', color: '#cbd5e1' }} />
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>No audit events yet</div>
            <div style={{ fontSize: '0.82rem' }}>Events will appear here as users log in, change roles, post invoices, or adjust stock.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table-enterprise">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event Type</th>
                  <th>User / Email</th>
                  <th>IP Address</th>
                  <th>Correlation ID</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const meta = ACTION_META[log.action] || { label: log.action, badgeClass: 'badge-status-blue', icon: <ShieldCheck size={12} /> };
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      style={{ cursor: 'pointer' }}
                      className="hover-row"
                    >
                      <td style={{ fontSize: '0.78rem', color: '#475569', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge-status ${meta.badgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {meta.icon} {meta.label}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>{log.userEmail}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>{log.ipAddress}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#94a3b8' }}>{log.correlationId}</td>
                      <td style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {log.metadata?.role && <span>Role: <strong>{log.metadata.role}</strong></span>}
                        {log.metadata?.newRole && <span>→ <strong>{log.metadata.newRole}</strong></span>}
                        {log.metadata?.newUserEmail && <span>New user: <strong>{log.metadata.newUserEmail}</strong></span>}
                        {log.metadata?.revokedSessionId && <span>Session: <strong>{log.metadata.revokedSessionId}</strong></span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card-enterprise" style={{ width: '580px', maxWidth: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>Audit Event Detail</h3>
              <button onClick={() => setSelectedLog(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.2rem' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '16px' }}>
              <div><strong style={{ color: '#475569' }}>Event ID:</strong><br /><span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{selectedLog.id}</span></div>
              <div><strong style={{ color: '#475569' }}>Timestamp:</strong><br />{new Date(selectedLog.timestamp).toLocaleString()}</div>
              <div><strong style={{ color: '#475569' }}>Action:</strong><br />
                <span className={`badge-status ${ACTION_META[selectedLog.action]?.badgeClass || 'badge-status-blue'}`}>
                  {ACTION_META[selectedLog.action]?.label || selectedLog.action}
                </span>
              </div>
              <div><strong style={{ color: '#475569' }}>User Email:</strong><br />{selectedLog.userEmail}</div>
              <div><strong style={{ color: '#475569' }}>IP Address:</strong><br /><span style={{ fontFamily: 'monospace' }}>{selectedLog.ipAddress}</span></div>
              <div><strong style={{ color: '#475569' }}>Correlation ID:</strong><br /><span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{selectedLog.correlationId}</span></div>
            </div>

            {selectedLog.userAgent && (
              <div style={{ marginBottom: '12px', fontSize: '0.8rem' }}>
                <strong style={{ color: '#475569' }}>User Agent:</strong>
                <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.72rem', color: '#64748b', marginTop: '4px', wordBreak: 'break-all' }}>{selectedLog.userAgent}</div>
              </div>
            )}

            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div style={{ marginBottom: '16px', fontSize: '0.8rem' }}>
                <strong style={{ color: '#475569' }}>Event Metadata:</strong>
                <pre style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', fontSize: '0.75rem', color: '#334155', marginTop: '6px', overflowX: 'auto', border: '1px solid #e2e8f0' }}>
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedLog(null)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
