'use client';

import React, { useState, useEffect } from 'react';
import { Warehouse, ArrowRightLeft, AlertOctagon, Plus, Download, X, Lock, CheckCircle2 } from 'lucide-react';
import { can, getActiveUserRole } from '@/lib/permissions';
import { downloadCsv } from '@/lib/exportUtils';
import { api } from '@/lib/apiClient';

interface MovementRecord {
  id: string;
  type: 'TRANSFER' | 'ADJUSTMENT_LOSS';
  sku: string;
  quantity: number;
  fromWarehouse: string;
  toWarehouse?: string;
  reason?: string;
  date: string;
  status: string;
}

export default function InventoryPage() {
  const [userRole, setUserRole] = useState<string>('OWNER');
  const [canManage, setCanManage] = useState<boolean>(true);

  // Clean state - 0 dummy data
  const [movements, setMovements] = useState<MovementRecord[]>([]);

  // Modals
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [isLossModalOpen, setIsLossModalOpen] = useState<boolean>(false);
  const [postedSuccess, setPostedSuccess] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Form states
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [fromWh, setFromWh] = useState('wh-dxb-main');
  const [toWh, setToWh] = useState('wh-aud-mall');
  const [lossReason, setLossReason] = useState('');

  useEffect(() => {
    const role = getActiveUserRole();
    setUserRole(role);
    setCanManage(can('INVENTORY_WRITE'));
  }, []);

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || quantity <= 0 || !canManage) return;

    const record: MovementRecord = {
      id: `TRF-${Date.now().toString().slice(-6)}`,
      type: 'TRANSFER',
      sku,
      quantity,
      fromWarehouse: fromWh === 'wh-dxb-main' ? 'Dubai Central Depot (WH-01)' : 'Abu Dhabi Mall Depot (WH-02)',
      toWarehouse: toWh === 'wh-aud-mall' ? 'Abu Dhabi Mall Depot (WH-02)' : 'Dubai Central Depot (WH-01)',
      date: new Date().toISOString().substring(0, 10),
      status: 'COMPLETED',
    };

    setMovements([record, ...movements]);
    setIsTransferModalOpen(false);
    setSuccessMsg(`Inter-warehouse stock transfer of ${quantity} units [SKU: ${sku}] successfully executed.`);
    setPostedSuccess(true);
    setSku('');
  };

  const handleWriteOffLoss = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || quantity <= 0 || !canManage) return;

    const record: MovementRecord = {
      id: `ADJ-${Date.now().toString().slice(-6)}`,
      type: 'ADJUSTMENT_LOSS',
      sku,
      quantity,
      fromWarehouse: fromWh === 'wh-dxb-main' ? 'Dubai Central Depot (WH-01)' : 'Abu Dhabi Mall Depot (WH-02)',
      reason: lossReason || 'Stock Damage / Write-off',
      date: new Date().toISOString().substring(0, 10),
      status: 'POSTED_TO_5050',
    };

    setMovements([record, ...movements]);
    setIsLossModalOpen(false);
    setSuccessMsg(`Inventory loss write-off of ${quantity} units [SKU: ${sku}] posted to Account 5050 Inventory Loss Expense.`);
    setPostedSuccess(true);
    setSku('');
    setLossReason('');
  };

  const handleExportMovements = () => {
    downloadCsv(
      'Warehouse_Stock_Movements.csv',
      ['Movement ID', 'Type', 'SKU Code', 'Quantity', 'From Depot', 'To Depot / Reason', 'Date', 'Status'],
      movements.map(m => [m.id, m.type, m.sku, m.quantity, m.fromWarehouse, m.toWarehouse || m.reason || 'N/A', m.date, m.status])
    );
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Warehouse Inventory & Stock Control</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            Multi-warehouse stock transfers, stock adjustment write-offs (Account 5050), and depot movement logs
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportMovements} className="btn-secondary">
            <Download size={14} /> Export Log (CSV)
          </button>

          {canManage ? (
            <>
              <button onClick={() => setIsTransferModalOpen(true)} className="btn-secondary">
                <ArrowRightLeft size={16} /> Inter-Warehouse Transfer
              </button>
              <button onClick={() => setIsLossModalOpen(true)} className="btn-primary">
                <AlertOctagon size={16} /> Record Stock Damage / Loss
              </button>
            </>
          ) : (
            <span className="badge-status badge-status-amber" style={{ padding: '8px 12px' }}>
              <Lock size={12} /> Read-Only ({userRole})
            </span>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {postedSuccess && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '14px 16px', borderRadius: '8px', marginBottom: '20px', color: '#047857', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Movements Table */}
      <div className="card-enterprise" style={{ padding: '0', overflow: 'hidden' }}>
        {movements.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No stock movements or adjustments recorded yet. Use the buttons above to test transfers or stock loss write-offs.
          </div>
        ) : (
          <table className="table-enterprise">
            <thead>
              <tr>
                <th>Reference ID</th>
                <th>Movement Type</th>
                <th>SKU Code</th>
                <th style={{ textAlign: 'center' }}>Quantity</th>
                <th>Source Depot</th>
                <th>Destination / Reason</th>
                <th>Date</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 700, color: '#2563eb' }}>{m.id}</td>
                  <td>
                    <span className={m.type === 'TRANSFER' ? 'badge-status badge-status-blue' : 'badge-status badge-status-amber'}>
                      {m.type}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{m.sku}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }} className="num-tabular">{m.quantity} units</td>
                  <td style={{ fontSize: '0.82rem' }}>{m.fromWarehouse}</td>
                  <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{m.toWarehouse || m.reason}</td>
                  <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{m.date}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge-status badge-status-green">{m.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card-enterprise" style={{ width: '480px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowRightLeft size={18} color="#2563eb" /> Inter-Warehouse Stock Transfer
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Item SKU Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PRN-80"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Transfer Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>From Source Depot</label>
                  <select
                    value={fromWh}
                    onChange={(e) => setFromWh(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    <option value="wh-dxb-main">Dubai Central Depot (WH-01)</option>
                    <option value="wh-aud-mall">Abu Dhabi Mall Depot (WH-02)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>To Destination Depot</label>
                  <select
                    value={toWh}
                    onChange={(e) => setToWh(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    <option value="wh-aud-mall">Abu Dhabi Mall Depot (WH-02)</option>
                    <option value="wh-dxb-main">Dubai Central Depot (WH-01)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setIsTransferModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Execute Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loss Modal */}
      {isLossModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card-enterprise" style={{ width: '480px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertOctagon size={18} color="#dc2626" /> Record Stock Loss Write-off
              </h3>
              <button onClick={() => setIsLossModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleWriteOffLoss}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Item SKU Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PRN-80"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Quantity Lost / Damaged *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Loss Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Water damage in bay 4"
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setIsLossModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#dc2626' }}>Write-off Stock Loss</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
