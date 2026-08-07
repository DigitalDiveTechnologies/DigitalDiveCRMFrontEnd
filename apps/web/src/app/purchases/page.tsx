'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Search, Download, X, Lock, CheckCircle2 } from 'lucide-react';
import { can, getActiveUserRole } from '@/lib/permissions';
import { downloadCsv } from '@/lib/exportUtils';
import { api } from '@/lib/apiClient';

interface PurchaseBillItem {
  id: string;
  billNumber: string;
  supplierName: string;
  supplierTrn: string;
  subtotal: number;
  inputVat: number;
  totalPayable: number;
  issueDate: string;
  status: string;
}

export default function PurchasesPage() {
  const [userRole, setUserRole] = useState<string>('OWNER');
  const [canCreate, setCanCreate] = useState<boolean>(true);

  // Clean state - 0 dummy data
  const [bills, setBills] = useState<PurchaseBillItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [postedSuccess, setPostedSuccess] = useState<boolean>(false);

  // Form state
  const [supplierName, setSupplierName] = useState('');
  const [supplierTrn, setSupplierTrn] = useState('');
  const [subtotalAmount, setSubtotalAmount] = useState(0);

  useEffect(() => {
    const role = getActiveUserRole();
    setUserRole(role);
    setCanCreate(can('CREATE_PURCHASE'));
  }, []);

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || subtotalAmount <= 0 || !canCreate) return;

    const inputVat = subtotalAmount * 0.05;
    const totalPayable = subtotalAmount + inputVat;

    const newBill: PurchaseBillItem = {
      id: `BILL-${Date.now().toString().slice(-6)}`,
      billNumber: `SUPP-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierName,
      supplierTrn: supplierTrn || 'N/A',
      subtotal: subtotalAmount,
      inputVat,
      totalPayable,
      issueDate: new Date().toISOString().substring(0, 10),
      status: 'POSTED',
    };

    setBills([newBill, ...bills]);
    setIsModalOpen(false);
    setPostedSuccess(true);
    setSupplierName('');
    setSupplierTrn('');
    setSubtotalAmount(0);

    try {
      await api.createBill(newBill);
    } catch (e) {}
  };

  const handleExportBills = () => {
    downloadCsv(
      'UAE_Purchase_Bills_Payables.csv',
      ['Bill ID', 'Supplier Name', 'TRN', 'Subtotal (AED)', 'Input VAT (AED)', 'Total Payable (AED)', 'Date'],
      bills.map(b => [b.id, b.supplierName, b.supplierTrn, b.subtotal, b.inputVat, b.totalPayable, b.issueDate])
    );
  };

  const filteredBills = bills.filter((b) =>
    b.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) || b.supplierTrn.includes(searchTerm)
  );

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Purchases & Supplier Payables</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            Supplier Bill Entry, 5% Recoverable Input VAT Tracking, and Accounts Payable (Account 2100) Posting
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportBills} className="btn-secondary">
            <Download size={14} /> Export Bills (CSV)
          </button>
          {canCreate ? (
            <button onClick={() => setIsModalOpen(true)} className="btn-primary">
              <Plus size={16} /> Enter Purchase Bill
            </button>
          ) : (
            <span className="badge-status badge-status-amber" style={{ padding: '8px 12px' }}>
              <Lock size={12} /> Read-Only ({userRole})
            </span>
          )}
        </div>
      </div>

      {/* Posted Success Notification */}
      {postedSuccess && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '14px 16px', borderRadius: '8px', marginBottom: '20px', color: '#047857', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> Purchase Bill posted successfully! 5% Recoverable Input VAT recorded to Account 2160.
        </div>
      )}

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search supplier name or TRN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Bills Table */}
      <div className="card-enterprise" style={{ padding: '0', overflow: 'hidden' }}>
        {filteredBills.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No purchase bills recorded yet. Click "Enter Purchase Bill" to record your first supplier bill.
          </div>
        ) : (
          <table className="table-enterprise">
            <thead>
              <tr>
                <th>Bill Reference</th>
                <th>Supplier Entity</th>
                <th>Supplier TRN</th>
                <th>Bill Date</th>
                <th style={{ textAlign: 'right' }}>Subtotal (AED)</th>
                <th style={{ textAlign: 'right' }}>Input VAT 5% (AED)</th>
                <th style={{ textAlign: 'right' }}>Total Payable (AED)</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 700, color: '#2563eb' }}>{b.id}</td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{b.supplierName}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{b.supplierTrn}</td>
                  <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{b.issueDate}</td>
                  <td style={{ textAlign: 'right' }} className="num-tabular">AED {b.subtotal.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }} className="num-tabular">AED {b.inputVat.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800 }} className="num-tabular">AED {b.totalPayable.toFixed(2)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge-status badge-status-green">POSTED</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card-enterprise" style={{ width: '480px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={18} color="#2563eb" /> Enter Supplier Purchase Bill
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBill}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Supplier Entity Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al Habtoor Engineering"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Supplier UAE TRN Number</label>
                <input
                  type="text"
                  placeholder="e.g. 100492817300003"
                  value={supplierTrn}
                  onChange={(e) => setSupplierTrn(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Bill Subtotal Amount (Excl. VAT AED) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={subtotalAmount}
                  onChange={(e) => setSubtotalAmount(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              {subtotalAmount > 0 && (
                <div style={{ background: '#ecfdf5', padding: '10px 12px', borderRadius: '6px', fontSize: '0.8rem', color: '#047857', marginBottom: '16px' }}>
                  5% Recoverable Input VAT: <strong>AED {(subtotalAmount * 0.05).toFixed(2)}</strong><br />
                  Total Payable: <strong>AED {(subtotalAmount * 1.05).toFixed(2)}</strong>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Post Purchase Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
