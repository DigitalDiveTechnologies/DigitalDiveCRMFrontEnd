'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Search, Download, X, Lock, CheckCircle2, Trash2 } from 'lucide-react';
import { can, getActiveUserRole } from '@/lib/permissions';
import { downloadCsv } from '@/lib/exportUtils';
import { api } from '@/lib/apiClient';

interface PurchaseBillItem {
  id: string;
  billNumber: string;
  supplierBillNumber: string;
  supplier?: {
    name: string;
    trn: string;
  };
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
  billDate: string;
  status: string;
}

interface PurchaseLineInput {
  itemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatCategory: 'STANDARD_5' | 'ZERO_0' | 'EXEMPT';
}

export default function PurchasesPage() {
  const [userRole, setUserRole] = useState<string>('OWNER');
  const [canCreate, setCanCreate] = useState<boolean>(true);

  const [bills, setBills] = useState<PurchaseBillItem[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [postedSuccess, setPostedSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierBillNumber, setSupplierBillNumber] = useState('');
  const [billLines, setBillLines] = useState<PurchaseLineInput[]>([]);

  // Add line input
  const [selectedItemId, setSelectedItemId] = useState('');
  const [qty, setQty] = useState(1);
  const [costPrice, setCostPrice] = useState(0);

  useEffect(() => {
    const role = getActiveUserRole();
    setUserRole(role);
    setCanCreate(can('CREATE_PURCHASE'));
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [fetchedBills, fetchedParties, fetchedItems] = await Promise.all([
        api.getBills(),
        api.getParties(),
        api.getItems(),
      ]);
      setBills(fetchedBills || []);
      setSuppliers(fetchedParties?.filter((p: any) => p.partyType === 'SUPPLIER' || p.partyType === 'BOTH') || []);
      setItems(fetchedItems || []);
    } catch (e) {
      console.error('Failed to load purchase bills', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || qty <= 0 || costPrice <= 0) return;

    const item = items.find(i => i.id === selectedItemId);
    if (!item) return;

    setBillLines([...billLines, {
      itemId: selectedItemId,
      description: item.name,
      quantity: qty,
      unitPrice: costPrice,
      vatCategory: 'STANDARD_5',
    }]);

    setSelectedItemId('');
    setQty(1);
    setCostPrice(0);
  };

  const handleRemoveLine = (index: number) => {
    setBillLines(billLines.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => billLines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const calculateVat = () => calculateSubtotal() * 0.05;
  const calculateTotal = () => calculateSubtotal() + calculateVat();

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || billLines.length === 0 || !canCreate || isLoading) return;
    setIsLoading(true);

    try {
      const finalBillNo = supplierBillNumber.trim() || 'SUP-REF-' + Math.floor(Math.random() * 900000 + 100000);
      await api.createBill({
        supplierId: selectedSupplierId,
        supplierBillNumber: finalBillNo,
        billDate: new Date().toISOString(),
        lines: billLines,
      });

      setPostedSuccess(true);
      setIsModalOpen(false);
      
      // Reset form
      setSelectedSupplierId('');
      setSupplierBillNumber('');
      setBillLines([]);

      // Reload
      await loadInitialData();
      setTimeout(() => setPostedSuccess(false), 5000);
    } catch (e) {
      console.error(e);
      alert('Error: Failed to post purchase bill.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportBills = () => {
    downloadCsv(
      'UAE_Purchase_Bills_Payables.csv',
      ['Bill ID', 'Supplier Name', 'Supplier TRN', 'Subtotal (AED)', 'VAT Total (AED)', 'Total Payable (AED)', 'Date'],
      bills.map(b => [
        b.billNumber, 
        b.supplier?.name || 'Unknown', 
        b.supplier?.trn || 'N/A', 
        Number(b.subtotal).toFixed(2), 
        Number(b.vatTotal).toFixed(2), 
        Number(b.grandTotal).toFixed(2), 
        b.billDate ? new Date(b.billDate).toLocaleDateString() : 'N/A'
      ])
    );
  };

  const filteredBills = bills.filter((b) =>
    b.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.supplier?.trn.includes(searchTerm) ||
    b.billNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>Purchases & Supplier Payables</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '2px' }}>
            Supplier Bill Entry, 5% Recoverable Input VAT Tracking, and Accounts Payable (Account 2100) Posting
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportBills} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} /> Export Bills (CSV)
          </button>
          {canCreate ? (
            <button onClick={() => { setIsModalOpen(true); setBillLines([]); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
          <CheckCircle2 size={16} /> Purchase Bill posted successfully! stock increments recorded & Input VAT posted to Account 2160.
        </div>
      )}

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search supplier name or TRN or Bill No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Bills Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
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
                  <td style={{ fontWeight: 700, color: '#2563eb' }}>{b.billNumber} <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 'normal' }}>({b.supplierBillNumber})</span></td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{b.supplier?.name || 'Unknown'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{b.supplier?.trn || 'N/A'}</td>
                  <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{b.billDate ? new Date(b.billDate).toLocaleDateString() : 'N/A'}</td>
                  <td style={{ textAlign: 'right' }} className="num-tabular">AED {Number(b.subtotal || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }} className="num-tabular">AED {Number(b.vatTotal || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800 }} className="num-tabular">AED {Number(b.grandTotal || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge-status badge-status-green">{b.status || 'POSTED'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bill Entry Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card-enterprise" style={{ width: '640px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Record Supplier Purchase Bill</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBill}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Select Supplier *</label>
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (TRN: {s.trn || 'N/A'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Supplier Invoice Bill Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="Auto-generates if blank"
                    value={supplierBillNumber}
                    onChange={(e) => setSupplierBillNumber(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Add item to bill line form */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px' }}>Add Items to Purchase Bill</div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>Item *</label>
                    <select
                      value={selectedItemId}
                      onChange={(e) => {
                        setSelectedItemId(e.target.value);
                        const selected = items.find(i => i.id === e.target.value);
                        setCostPrice(selected ? Number(selected.purchasePrice) : 0);
                      }}
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.82rem' }}
                    >
                      <option value="">-- Choose Item --</option>
                      {items.map(i => (
                        <option key={i.id} value={i.id}>{i.name} (SKU: {i.sku})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      value={qty}
                      onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>Cost Unit Price (AED) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <button type="button" onClick={handleAddLine} className="btn-secondary" style={{ padding: '7px 12px', fontSize: '0.82rem' }}>
                    Add
                  </button>
                </div>
              </div>

              {/* Lines table */}
              {billLines.length > 0 && (
                <table className="table-enterprise" style={{ marginBottom: '16px', fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Cost</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                      <th style={{ textAlign: 'center' }}>Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billLines.map((line, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{line.description}</td>
                        <td style={{ textAlign: 'center' }}>{line.quantity}</td>
                        <td style={{ textAlign: 'right' }}>AED {line.unitPrice.toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>AED {(line.quantity * line.unitPrice).toFixed(2)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button type="button" onClick={() => handleRemoveLine(idx)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', borderTop: '1px solid #cbd5e1', paddingTop: '10px' }}>
                <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal:</span>
                    <span>AED {calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                    <span>Recoverable Input VAT (5%):</span>
                    <span>AED {calculateVat().toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0f172a', paddingTop: '6px', fontWeight: 800, color: '#0f172a' }}>
                    <span>Total Payable:</span>
                    <span>AED {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={billLines.length === 0 || !selectedSupplierId || isLoading} className="btn-primary">Post Supplier Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
