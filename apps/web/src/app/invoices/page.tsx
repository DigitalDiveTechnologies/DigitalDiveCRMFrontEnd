'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Printer, Download, CheckCircle2, AlertCircle, Plus, Eye, Lock, Trash2, User, X } from 'lucide-react';
import { can, getActiveUserRole } from '@/lib/permissions';
import { downloadCsv } from '@/lib/exportUtils';
import { api } from '@/lib/apiClient';

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatCategory: 'STANDARD_5' | 'ZERO_0' | 'EXEMPT';
}

export default function SalesInvoicingPage() {
  const [userRole, setUserRole] = useState<string>('OWNER');
  const [canCreate, setCanCreate] = useState<boolean>(true);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [lines, setLines] = useState<InvoiceLineItem[]>([]);

  // Line creation input
  const [newLineDesc, setNewLineDesc] = useState('');
  const [newLineQty, setNewLineQty] = useState(1);
  const [newLinePrice, setNewLinePrice] = useState(0);
  const [newLineVatCategory, setNewLineVatCategory] = useState<'STANDARD_5' | 'ZERO_0' | 'EXEMPT'>('STANDARD_5');

  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [postedSuccess, setPostedSuccess] = useState<boolean>(false);
  const [postedInvoiceNumber, setPostedInvoiceNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const role = getActiveUserRole();
    setUserRole(role);
    setCanCreate(can('CREATE_INVOICE'));
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [fetchedInvoices, fetchedParties] = await Promise.all([
        api.getInvoices(),
        api.getParties(),
      ]);
      setInvoices(fetchedInvoices || []);
      setParties(fetchedParties?.filter((p: any) => p.partyType === 'CUSTOMER' || p.partyType === 'BOTH') || []);
    } catch (e) {
      console.error('Failed to load sales invoicing page data', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLineDesc || newLineQty <= 0 || newLinePrice <= 0) return;
    setLines([...lines, { description: newLineDesc, quantity: newLineQty, unitPrice: newLinePrice, vatCategory: newLineVatCategory }]);
    setNewLineDesc('');
    setNewLineQty(1);
    setNewLinePrice(0);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  // Calculations
  const calculateLineSubtotal = (line: InvoiceLineItem) => line.quantity * line.unitPrice;
  const calculateLineVat = (line: InvoiceLineItem) => {
    if (line.vatCategory === 'STANDARD_5') return calculateLineSubtotal(line) * 0.05;
    return 0;
  };

  const subtotal = lines.reduce((sum, l) => sum + calculateLineSubtotal(l), 0);
  const totalVat = lines.reduce((sum, l) => sum + calculateLineVat(l), 0);
  const grandTotal = subtotal + totalVat;

  const handlePostInvoice = async () => {
    if (!canCreate || lines.length === 0 || !selectedCustomerId) return;
    setIsLoading(true);

    try {
      const response = await api.createSalesInvoice({
        customerId: selectedCustomerId,
        items: lines,
        invoiceDate: new Date().toISOString(),
      });

      setPostedInvoiceNumber(response.invoiceNumber);
      setPostedSuccess(true);
      setLines([]);
      setSelectedCustomerId('');
      
      // Refresh registry
      const fetchedInvoices = await api.getInvoices();
      setInvoices(fetchedInvoices || []);
      
      // Switch view after timeout
      setTimeout(() => {
        setPostedSuccess(false);
      }, 5000);
    } catch (e) {
      console.error('Failed to post sales invoice to server', e);
      alert('Error: Failed to post invoice to backend server database.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportInvoice = () => {
    const headers = ['Invoice No', 'Customer Name', 'Subtotal (AED)', 'VAT Total (AED)', 'Grand Total (AED)', 'Status', 'Date'];
    const rows = invoices.map(i => [
      i.invoiceNumber, 
      i.customer?.name || 'Unknown', 
      Number(i.subtotal).toFixed(2), 
      Number(i.vatTotal).toFixed(2), 
      Number(i.grandTotal).toFixed(2), 
      i.status,
      new Date(i.invoiceDate).toLocaleDateString()
    ]);
    downloadCsv('Sales_Tax_Invoices_Registry.csv', headers, rows);
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>Sales Invoicing & Billing</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '2px' }}>
            Tax Invoice Generation, 5% Standard VAT Calculation, and Double-Entry Ledger Posting
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportInvoice} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} /> Export Invoices (CSV)
          </button>
          {canCreate ? (
            <button onClick={handlePostInvoice} disabled={lines.length === 0 || !selectedCustomerId || isLoading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} /> Post Tax Invoice to Ledger
            </button>
          ) : (
            <span className="badge-status badge-status-amber" style={{ padding: '8px 12px', fontSize: '0.82rem' }}>
              <Lock size={12} /> Read-Only Mode ({userRole})
            </span>
          )}
        </div>
      </div>

      {/* Read-Only Role Warning Banner */}
      {!canCreate && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', color: '#b45309', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Lock size={16} color="#d97706" />
          <span><strong>Read-Only Compliance Mode:</strong> Your active role [<strong>{userRole}</strong>] has view-only access. Tax invoice posting actions are locked.</span>
        </div>
      )}

      {/* Success Notification */}
      {postedSuccess && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '14px 16px', borderRadius: '8px', marginBottom: '20px', color: '#047857', fontSize: '0.875rem' }}>
          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} /> Invoice Successfully Posted to Ledger!
          </div>
          <div style={{ marginTop: '4px' }}>
            Posted Invoice <strong>{postedInvoiceNumber}</strong>. Double-entry entries created and email notification dispatched. Document is now locked and immutable.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('create')}
          style={{
            background: activeTab === 'create' ? '#0f172a' : '#ffffff',
            color: activeTab === 'create' ? '#ffffff' : '#475569',
            border: '1px solid #cbd5e1',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Create New Tax Invoice
        </button>

        <button
          onClick={() => setActiveTab('list')}
          style={{
            background: activeTab === 'list' ? '#0f172a' : '#ffffff',
            color: activeTab === 'list' ? '#ffffff' : '#475569',
            border: '1px solid #cbd5e1',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Posted Invoices Registry ({invoices.length})
        </button>
      </div>

      {/* Create Tax Invoice View */}
      {activeTab === 'create' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '32px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>Select Customer Entity</h2>

          {/* Customer Selection Dropdown */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Registered Customer *</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
            >
              <option value="">-- Choose customer --</option>
              {parties.map((party) => (
                <option key={party.id} value={party.id}>
                  {party.name} {party.trn ? `(TRN: ${party.trn})` : ''}
                </option>
              ))}
            </select>
            {parties.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px' }}>No registered customers found. Please add a customer under the "Parties" section first.</p>
            )}
          </div>

          {/* Add Item Line Form */}
          <form onSubmit={handleAddLine} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>Add Line Item to Invoice</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Description *</label>
                <input
                  type="text"
                  placeholder="Item description"
                  value={newLineDesc}
                  onChange={(e) => setNewLineDesc(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={newLineQty}
                  onChange={(e) => setNewLineQty(parseInt(e.target.value) || 1)}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Unit Price (AED) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newLinePrice}
                  onChange={(e) => setNewLinePrice(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>VAT Category</label>
                <select
                  value={newLineVatCategory}
                  onChange={(e) => setNewLineVatCategory(e.target.value as any)}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.82rem' }}
                >
                  <option value="STANDARD_5">5% Standard VAT</option>
                  <option value="ZERO_0">0% Zero-Rated</option>
                  <option value="EXEMPT">Exempt</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ padding: '7px 14px', fontSize: '0.82rem' }}>
                <Plus size={14} /> Add Line
              </button>
            </div>
          </form>

          {/* Line items table */}
          {lines.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: '8px', marginBottom: '24px' }}>
              No line items added yet. Use the form above to add invoice items.
            </div>
          ) : (
            <table className="table-enterprise" style={{ marginBottom: '24px' }}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Unit Price (AED)</th>
                  <th style={{ textAlign: 'center' }}>VAT Rate</th>
                  <th style={{ textAlign: 'right' }}>Subtotal (AED)</th>
                  <th style={{ textAlign: 'right' }}>VAT Amount (AED)</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{l.description}</td>
                    <td style={{ textAlign: 'center' }} className="num-tabular">{l.quantity}</td>
                    <td style={{ textAlign: 'right' }} className="num-tabular">{l.unitPrice.toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={l.vatCategory === 'STANDARD_5' ? 'badge-status badge-status-blue' : 'badge-status badge-status-green'}>
                        {l.vatCategory === 'STANDARD_5' ? '5%' : '0%'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="num-tabular">{calculateLineSubtotal(l).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#059669' }} className="num-tabular">{calculateLineVat(l).toFixed(2)}</td>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal (Excl. VAT):</span>
                <span className="num-tabular">AED {subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                <span>Total UAE VAT (5%):</span>
                <span className="num-tabular">AED {totalVat.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0f172a', paddingTop: '8px', fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                <span>Grand Total:</span>
                <span className="num-tabular">AED {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posted Invoices Registry */}
      {activeTab === 'list' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
          {invoices.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              No posted sales tax invoices yet. Create your first invoice using the "Create New Tax Invoice" tab.
            </div>
          ) : (
            <table className="table-enterprise">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Customer Name</th>
                  <th>UAE TRN</th>
                  <th>Issue Date</th>
                  <th style={{ textAlign: 'right' }}>Subtotal (AED)</th>
                  <th style={{ textAlign: 'right' }}>VAT Total (AED)</th>
                  <th style={{ textAlign: 'right' }}>Grand Total (AED)</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} onClick={() => setSelectedInvoice(inv)} style={{ cursor: 'pointer' }} className="hover-row">
                    <td style={{ fontWeight: 700, color: '#2563eb' }}>{inv.invoiceNumber}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{inv.customer?.name || 'Unknown'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{inv.customer?.trn || 'N/A'}</td>
                    <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ textAlign: 'right' }} className="num-tabular">AED {Number(inv.subtotal || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }} className="num-tabular">AED {Number(inv.vatTotal || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800 }} className="num-tabular">AED {Number(inv.grandTotal || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge-status badge-status-green">{inv.status || 'POSTED'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card-enterprise" style={{ width: '700px', maxWidth: '95%' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Tax Invoice Details: {selectedInvoice.invoiceNumber}
              </h3>
              <button onClick={() => setSelectedInvoice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <div>
                <h4 style={{ fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Customer Information</h4>
                <div style={{ color: '#0f172a', fontWeight: 600 }}>{selectedInvoice.customer?.name || 'Walk-in Customer'}</div>
                {selectedInvoice.customer?.trn && <div style={{ color: '#64748b' }}>TRN: <span style={{ fontFamily: 'monospace' }}>{selectedInvoice.customer.trn}</span></div>}
                {selectedInvoice.customer?.email && <div style={{ color: '#64748b' }}>Email: {selectedInvoice.customer.email}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <h4 style={{ fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Invoice Metadata</h4>
                <div><strong>Issue Date:</strong> {new Date(selectedInvoice.invoiceDate).toLocaleString()}</div>
                <div><strong>Status:</strong> <span className="badge-status badge-status-green" style={{ display: 'inline-block', marginTop: '4px' }}>{selectedInvoice.status || 'POSTED'}</span></div>
              </div>
            </div>

            <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Item Description</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Unit Price (AED)</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>VAT Rate</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>VAT Amt (AED)</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Subtotal (AED)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.lines?.map((line: any, idx: number) => {
                    const lSub = Number(line.quantity || 0) * Number(line.unitPrice || 0);
                    const lVat = line.vatCategory === 'STANDARD_5' ? lSub * 0.05 : 0;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px', fontWeight: 500, color: '#0f172a' }}>{line.description}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }} className="num-tabular">{line.quantity}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }} className="num-tabular">AED {Number(line.unitPrice).toFixed(2)}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <span className={line.vatCategory === 'STANDARD_5' ? 'badge-status badge-status-blue' : 'badge-status badge-status-green'}>
                            {line.vatCategory === 'STANDARD_5' ? '5%' : '0%'}
                          </span>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#059669' }} className="num-tabular">AED {lVat.toFixed(2)}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }} className="num-tabular">AED {lSub.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal (Excl. VAT):</span>
                  <span className="num-tabular">AED {Number(selectedInvoice.subtotal || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                  <span>VAT Total (5%):</span>
                  <span className="num-tabular">AED {Number(selectedInvoice.vatTotal || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0f172a', paddingTop: '6px', fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                  <span>Grand Total:</span>
                  <span className="num-tabular">AED {Number(selectedInvoice.grandTotal || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setSelectedInvoice(null)} className="btn-secondary">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
