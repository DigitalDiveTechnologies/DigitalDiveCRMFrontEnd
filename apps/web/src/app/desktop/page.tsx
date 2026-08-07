'use client';

import React, { useState, useEffect } from 'react';
import { 
  Laptop, 
  Wifi, 
  WifiOff, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  ArrowRight,
  Printer,
  HardDrive
} from 'lucide-react';
import { offlineDb, OutboxMutation } from '@/lib/offlineDb';

declare global {
  interface Window {
    electronAPI?: {
      getLocalInvoices: () => Promise<any[]>;
      getOutboxQueue: () => Promise<any[]>;
      saveInvoiceLocally: (data: any) => Promise<any>;
      syncOutboxWithServer: () => Promise<any>;
      printThermalReceipt: (payload: any) => Promise<any>;
      isNativeDesktop?: boolean;
    };
  }
}

export default function DesktopOfflineAppPage() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isNativeApp, setIsNativeApp] = useState<boolean>(false);
  const [outbox, setOutbox] = useState<OutboxMutation[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');

  // Form states for local offline sales
  const [customerName, setCustomerName] = useState('Al Tayer Group LLC');
  const [amount, setAmount] = useState<number>(4500.00);

  const refreshOutboxState = async () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        const queue = await window.electronAPI.getOutboxQueue();
        setOutbox(queue || []);
      } catch (e) {
        setOutbox(offlineDb.getOutbox());
      }
    } else {
      setOutbox(offlineDb.getOutbox());
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      setIsNativeApp(true);
    }
    refreshOutboxState();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOnline(navigator.onLine);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  const handleCreateOfflineSale = async (e: React.FormEvent) => {
    e.preventDefault();

    const salePayload = {
      customerName,
      amount,
      vatAmount: amount * 0.05,
      grandTotal: amount * 1.05,
      items: [{ description: 'Desktop Offline POS Sale Item', price: amount }],
    };

    if (window.electronAPI) {
      // Native Desktop IPC call to embedded SQLite DB
      await window.electronAPI.saveInvoiceLocally(salePayload);
      setSyncStatusMsg('Transaction saved into Native Embedded Desktop SQLite DB!');
    } else {
      offlineDb.saveMutation('SALES_INVOICE', salePayload);
      setSyncStatusMsg('Saved to local SQLite Outbox database queue!');
    }

    refreshOutboxState();
  };

  const handleTriggerSync = async () => {
    if (!isOnline) {
      setSyncStatusMsg('Cannot sync: System is OFFLINE. Local SQLite database active.');
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg('Syncing native desktop outbox with remote PostgreSQL server...');

    if (window.electronAPI) {
      const res = await window.electronAPI.syncOutboxWithServer();
      setSyncStatusMsg(res.message || 'Synced native desktop outbox with remote PostgreSQL server!');
    } else {
      const result = await offlineDb.syncOutboxWithServer();
      setSyncStatusMsg(`Sync Complete! Successfully pushed ${result.syncedCount} outbox mutations to remote server.`);
    }

    setTimeout(() => {
      setIsSyncing(false);
      refreshOutboxState();
    }, 600);
  };

  const handlePrintEscPosNative = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.printThermalReceipt({ customerName, total: amount * 1.05 });
      setSyncStatusMsg(`Native Hardware: ${res.message}`);
    } else {
      setSyncStatusMsg('ESC/POS receipt payload formatted for 80mm USB Thermal Printer.');
    }
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Laptop size={24} color="#2563eb" />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Standalone Desktop Application Container</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            {isNativeApp ? 'Native Electron Desktop App Running (Windows/macOS) with Embedded SQLite DB' : 'Native Desktop App POS Container & Outbox Sync Protocol'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsOnline(!isOnline)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: isOnline ? '1px solid #a7f3d0' : '1px solid #fecaca',
              background: isOnline ? '#ecfdf5' : '#fef2f2',
              color: isOnline ? '#047857' : '#dc2626',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>{isOnline ? 'Network ONLINE (Remote DB Connected)' : 'Network OFFLINE (Local SQLite DB Active)'}</span>
          </button>

          <button onClick={handlePrintEscPosNative} className="btn-secondary" style={{ fontSize: '0.82rem' }}>
            <Printer size={14} /> USB ESC/POS Hardware Print
          </button>
        </div>
      </div>

      {/* Container Mode Status Badge */}
      <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 600 }}>
          <HardDrive size={16} color="#2563eb" />
          <span>Container Runtime: {isNativeApp ? 'Electron Desktop Executable (.exe / .app)' : 'Native Desktop Client Simulation (IPC Bridge Enabled)'}</span>
        </div>
        <span className="badge-status badge-status-blue">SQLite Embedded Engine v3.45</span>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMsg && (
        <div style={{ background: isOnline ? '#eff6ff' : '#fffbeb', border: isOnline ? '1px solid #bfdbfe' : '1px solid #fde68a', padding: '14px 16px', borderRadius: '8px', marginBottom: '20px', color: isOnline ? '#1d4ed8' : '#b45309', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isOnline ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{syncStatusMsg}</span>
          </div>
          {outbox.length > 0 && isOnline && (
            <button onClick={handleTriggerSync} disabled={isSyncing} className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} /> Sync Now ({outbox.length})
            </button>
          )}
        </div>
      )}

      {/* Grid: Offline Sale Form & Database Outbox Queue */}
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '20px' }}>
        {/* Left: Create Sale in Local/Remote Database */}
        <div className="card-enterprise">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} color="#2563eb" /> Record Sales Transaction
          </h2>

          <form onSubmit={handleCreateOfflineSale}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Customer Entity Name</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Subtotal Amount (Excl. VAT AED)</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '18px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Subtotal:</span>
                <span className="num-tabular">AED {amount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600, marginBottom: '4px' }}>
                <span>UAE VAT (5%):</span>
                <span className="num-tabular">AED {(amount * 0.05).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#0f172a', borderTop: '1px solid #cbd5e1', paddingTop: '6px' }}>
                <span>Total Amount:</span>
                <span className="num-tabular">AED {(amount * 1.05).toFixed(2)}</span>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '10px', justifyContent: 'center' }}>
              {isOnline ? 'Post & Sync Remote DB' : 'Save Offline into Embedded SQLite DB'} <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* Right: Local Database Outbox Queue & Server Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card-enterprise">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={18} color="#059669" /> Desktop SQLite Outbox Queue
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Mutations in local SQLite database awaiting remote PostgreSQL sync
                </span>
              </div>

              <button onClick={handleTriggerSync} disabled={!isOnline || isSyncing} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
                <RefreshCw size={14} /> Sync Outbox ({outbox.length})
              </button>
            </div>

            {outbox.length === 0 ? (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '16px', borderRadius: '8px', color: '#047857', textAlign: 'center', fontSize: '0.85rem' }}>
                <CheckCircle2 size={20} style={{ margin: '0 auto 6px auto' }} />
                <strong>Outbox Clean! All local SQLite transactions are 100% synced with remote PostgreSQL database.</strong>
              </div>
            ) : (
              <table className="table-enterprise">
                <thead>
                  <tr>
                    <th>Idempotency UUID</th>
                    <th>Entity Type</th>
                    <th>Customer Name</th>
                    <th style={{ textAlign: 'right' }}>Total (AED)</th>
                    <th>Queue Status</th>
                  </tr>
                </thead>
                <tbody>
                  {outbox.map((m: any) => (
                    <tr key={m.id || m.idempotencyKey}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#2563eb' }}>{m.id || m.idempotencyKey}</td>
                      <td><span className="badge-status badge-status-blue">{m.entityType}</span></td>
                      <td style={{ fontWeight: 600 }}>{m.payload?.customerName}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="num-tabular">
                        AED {(m.payload?.grandTotal || 0).toFixed(2)}
                      </td>
                      <td>
                        <span className="badge-status badge-status-amber">
                          {m.status || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
