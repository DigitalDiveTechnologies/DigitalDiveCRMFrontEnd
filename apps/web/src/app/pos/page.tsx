'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Printer, ShoppingCart, Plus, Minus, Trash2, CheckCircle2,
  Settings, Image, X, Edit3
} from 'lucide-react';
import { can, getActiveUserRole } from '@/lib/permissions';
import { api } from '@/lib/apiClient';

interface CartItem {
  itemId: string;
  name: string;
  sku: string;
  price: number;
  qty: number;
}

interface ReceiptSettings {
  companyName: string;
  address: string;
  phone: string;
  trn: string;
  footerMessage: string;
  logoUrl: string; // base64 or empty
}

const DEFAULT_RECEIPT: ReceiptSettings = {
  companyName: 'Digital Dive Technologies',
  address: 'Dubai, United Arab Emirates',
  phone: '+971 4 000 0000',
  trn: '100293847500003',
  footerMessage: 'Thank you for shopping with us! VAT Reg. applicable.',
  logoUrl: '',
};

function loadReceiptSettings(): ReceiptSettings {
  if (typeof window === 'undefined') return DEFAULT_RECEIPT;
  try {
    const stored = localStorage.getItem('pos_receipt_settings');
    return stored ? { ...DEFAULT_RECEIPT, ...JSON.parse(stored) } : DEFAULT_RECEIPT;
  } catch { return DEFAULT_RECEIPT; }
}

function saveReceiptSettings(s: ReceiptSettings) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pos_receipt_settings', JSON.stringify(s));
  }
}

export default function PosBillingCounterPage() {
  const [canBill, setCanBill] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD'>('CASH');
  const [receiptSuccess, setReceiptSuccess] = useState<boolean>(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedItemId, setSelectedItemId] = useState('');

  // Receipt Customization
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>(DEFAULT_RECEIPT);
  const [showReceiptEditor, setShowReceiptEditor] = useState(false);
  const [draftSettings, setDraftSettings] = useState<ReceiptSettings>(DEFAULT_RECEIPT);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCanBill(can('CREATE_INVOICE'));
    setReceiptSettings(loadReceiptSettings());
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [fetchedItems, fetchedParties] = await Promise.all([api.getItems(), api.getParties()]);
      setItems(fetchedItems || []);

      const activeCustomers = fetchedParties?.filter(
        (p: any) => p.partyType === 'CUSTOMER' || p.partyType === 'BOTH'
      ) || [];

      let walkIn = activeCustomers.find((c: any) => c.name.toLowerCase().includes('walk-in'));
      if (!walkIn) {
        walkIn = await api.createParty({
          name: 'Walk-in Retail Customer',
          type: 'CUSTOMER',
          email: 'retail@filsdesk.ae',
          trn: '100000000000003',
        });
        activeCustomers.push(walkIn);
      }

      setCustomers(activeCustomers);
      setSelectedCustomerId(walkIn?.id || activeCustomers[0]?.id || '');
    } catch (e) {
      console.error('POS load error', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return;
    const product = items.find((i) => i.id === selectedItemId);
    if (!product) return;
    const existingIdx = cart.findIndex((i) => i.itemId === selectedItemId);
    if (existingIdx >= 0) {
      const updated = [...cart];
      updated[existingIdx].qty += 1;
      setCart(updated);
    } else {
      setCart([...cart, { itemId: product.id, name: product.name, sku: product.sku, price: Number(product.salesPrice), qty: 1 }]);
    }
    setSelectedItemId('');
  };

  const updateQty = (itemId: string, delta: number) => {
    setCart(cart.map((item) => {
      if (item.itemId === itemId) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeItem = (itemId: string) => setCart(cart.filter((item) => item.itemId !== itemId));

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const vatTotal = subtotal * 0.05;
  const grandTotal = subtotal + vatTotal;

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const isWalkIn = selectedCustomer?.name?.toLowerCase().includes('walk-in');
  const isOverLimit = grandTotal >= 10000;
  const requiresCustomer = isOverLimit && isWalkIn;

  const handleChargeAndPrint = async () => {
    if (cart.length === 0 || !canBill || !selectedCustomerId || isLoading || requiresCustomer) return;
    setIsLoading(true);
    try {
      const result = await api.createSalesInvoice({
        customerId: selectedCustomerId,
        items: cart.map(item => ({
          itemId: item.itemId,
          description: item.name,
          quantity: item.qty,
          unitPrice: item.price,
          vatCategory: 'STANDARD_5',
        })),
        paidAmount: grandTotal,
        paymentMethod,
        invoiceDate: new Date().toISOString(),
        narration: customCustomerName ? `POS-WALKIN:${customCustomerName}` : 'POS Cashier checkout',
      });
      setLastInvoice(result);
      setReceiptSuccess(true);
      setCart([]);
      setCustomCustomerName('');
      const refreshed = await api.getItems();
      setItems(refreshed || []);
    } catch (e) {
      console.error(e);
      alert('Error creating invoice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Receipt Editor ---
  const openEditor = () => {
    setDraftSettings({ ...receiptSettings });
    setShowReceiptEditor(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setDraftSettings((prev) => ({ ...prev, logoUrl: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const saveEditor = () => {
    setReceiptSettings(draftSettings);
    saveReceiptSettings(draftSettings);
    setShowReceiptEditor(false);
  };

  const handlePrintReceipt = () => {
    const receiptEl = document.getElementById('thermal-receipt');
    if (!receiptEl) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            body {
              margin: 0;
              padding: 10px;
              font-family: monospace;
              font-size: 11px;
              color: #000;
              width: 72mm;
            }
            img {
              max-height: 44px;
              display: block;
              margin: 0 auto 8px auto;
              object-fit: contain;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              font-size: 11px;
            }
            @page {
              margin: 0;
              size: auto;
            }
          </style>
        </head>
        <body>
          <div style="text-align: center;">
            ${receiptEl.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.frameElement.remove();
              }, 1000);
            }
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  const s = receiptSettings;

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>POS Retail Cashier Terminal</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '2px' }}>
            Real-Time Stock Deduction · UAE VAT 5% · Custom Thermal Receipt
          </p>
        </div>
        <button
          onClick={openEditor}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
        >
          <Settings size={15} /> Customize Receipt Slip
        </button>
      </div>

      {/* ---- Receipt Customizer Modal ---- */}
      {showReceiptEditor && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px', width: '520px',
            padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} color="#2563eb" /> Customize Receipt / Slip
              </div>
              <button onClick={() => setShowReceiptEditor(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            {/* Logo Upload */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                Company Logo (optional)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {draftSettings.logoUrl ? (
                  <img src={draftSettings.logoUrl} alt="Logo Preview" style={{ height: '52px', width: 'auto', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                ) : (
                  <div style={{ height: '52px', width: '80px', borderRadius: '4px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Image size={20} color="#94a3b8" />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button type="button" onClick={() => logoInputRef.current?.click()} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                    Upload Logo
                  </button>
                  {draftSettings.logoUrl && (
                    <button type="button" onClick={() => setDraftSettings((p) => ({ ...p, logoUrl: '' }))}
                      style={{ fontSize: '0.76rem', color: '#dc2626', border: 'none', background: 'none', cursor: 'pointer' }}>
                      Remove Logo
                    </button>
                  )}
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" hidden onChange={handleLogoUpload} />
              </div>
            </div>

            {/* Fields */}
            {([
              ['companyName', 'Company / Store Name'],
              ['address', 'Address Line'],
              ['phone', 'Phone Number'],
              ['trn', 'UAE TRN Number'],
              ['footerMessage', 'Footer / Thank-You Message'],
            ] as [keyof ReceiptSettings, string][]).map(([key, label]) => (
              <div key={key} style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>{label}</label>
                {key === 'footerMessage' ? (
                  <textarea
                    rows={2}
                    value={draftSettings[key]}
                    onChange={(e) => setDraftSettings((p) => ({ ...p, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                ) : (
                  <input
                    type="text"
                    value={draftSettings[key]}
                    onChange={(e) => setDraftSettings((p) => ({ ...p, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                )}
              </div>
            ))}

            {/* Live Preview */}
            <div style={{ marginTop: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Live Receipt Preview</div>
              <div style={{
                background: '#fff', border: '1px solid #cbd5e1', padding: '14px 12px', fontFamily: 'monospace',
                fontSize: '0.75rem', color: '#1e293b', borderRadius: '4px', textAlign: 'center',
              }}>
                {draftSettings.logoUrl && <img src={draftSettings.logoUrl} alt="logo" style={{ height: '40px', marginBottom: '6px', objectFit: 'contain' }} />}
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{draftSettings.companyName || 'Your Company'}</div>
                <div style={{ color: '#475569' }}>{draftSettings.address}</div>
                <div style={{ color: '#475569' }}>Tel: {draftSettings.phone}</div>
                <div style={{ color: '#475569' }}>TRN: {draftSettings.trn}</div>
                <div style={{ borderTop: '1px dashed #ccc', margin: '8px 0', fontSize: '0.72rem', color: '#64748b' }}>
                  Item 1 × 2... AED 50.00 | Item 2 × 1... AED 30.00<br />
                  Subtotal: AED 80.00 | VAT 5%: AED 4.00 | Total: AED 84.00
                </div>
                <div style={{ fontStyle: 'italic', fontSize: '0.72rem', color: '#475569' }}>{draftSettings.footerMessage}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowReceiptEditor(false)} className="btn-secondary">Cancel</button>
              <button onClick={saveEditor} className="btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Success + Receipt */}
      {receiptSuccess && lastInvoice && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '20px', borderRadius: '8px', marginBottom: '24px', color: '#065f46' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #d1fae5', paddingBottom: '10px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
              <CheckCircle2 size={20} color="#059669" /> Charged Successfully — {lastInvoice.invoiceNumber}
            </div>
            <button onClick={() => setReceiptSuccess(false)} className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              New Sale
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>
            <div>
              <p>Invoice <strong>{lastInvoice.invoiceNumber}</strong> saved to database. Inventory stock and ledger have been updated automatically.</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button type="button" onClick={handlePrintReceipt} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Printer size={14} /> Print Receipt
                </button>
                <button onClick={openEditor} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                  <Settings size={13} /> Edit Slip Design
                </button>
              </div>
            </div>

            {/* Thermal Receipt */}
            <div id="thermal-receipt" style={{
              background: '#ffffff', border: '1px solid #cbd5e1', padding: '16px 14px',
              fontFamily: 'monospace', fontSize: '0.76rem', color: '#1e293b',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderRadius: '4px',
              textAlign: 'center',
            }}>
              {s.logoUrl && (
                <img src={s.logoUrl} alt="Logo" style={{ height: '44px', marginBottom: '8px', objectFit: 'contain' }} />
              )}
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '2px' }}>{s.companyName}</div>
              <div style={{ color: '#475569', marginBottom: '2px' }}>{s.address}</div>
              <div style={{ color: '#475569', marginBottom: '2px' }}>Tel: {s.phone}</div>
              <div style={{ color: '#475569', marginBottom: '8px' }}>TRN: {s.trn}</div>

              <div style={{ fontWeight: 'bold', fontSize: '0.8rem', margin: '4px 0 8px 0', textTransform: 'uppercase', color: '#000', borderBottom: '1px dashed #475569', borderTop: '1px dashed #475569', padding: '4px 0' }}>
                {lastInvoice.customer?.name?.toLowerCase().includes('walk-in') ? 'SIMPLIFIED TAX INVOICE' : 'TAX INVOICE'}
              </div>

              <div style={{ borderBottom: '1px dashed #475569', padding: '6px 0', marginBottom: '8px', textAlign: 'left' }}>
                <div>Receipt: {lastInvoice.invoiceNumber}</div>
                <div>Date: {new Date(lastInvoice.invoiceDate).toLocaleString()}</div>
                <div>
                  Customer: {
                    lastInvoice.narration?.startsWith('POS-WALKIN:')
                      ? lastInvoice.narration.replace('POS-WALKIN:', '')
                      : lastInvoice.customer?.name || 'Walk-in'
                  }
                </div>
                {lastInvoice.customer?.trn && lastInvoice.customer.trn !== '100000000000003' && (
                  <div>Cust TRN: {lastInvoice.customer.trn}</div>
                )}
                <div>Payment: {paymentMethod}</div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px dashed #475569' }}>
                    <th style={{ paddingBottom: '4px' }}>Item</th>
                    <th style={{ textAlign: 'center', paddingBottom: '4px' }}>Qty</th>
                    <th style={{ textAlign: 'right', paddingBottom: '4px' }}>AED</th>
                  </tr>
                </thead>
                <tbody>
                  {lastInvoice.lines?.map((line: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ padding: '3px 0' }}>{line.description}</td>
                      <td style={{ textAlign: 'center', padding: '3px 0' }}>{line.quantity}</td>
                      <td style={{ textAlign: 'right', padding: '3px 0' }}>{Number(line.lineTotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderTop: '1px dashed #475569', paddingTop: '6px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span><span>AED {Number(lastInvoice.subtotal).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>VAT (5%):</span><span>AED {Number(lastInvoice.vatTotal).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.85rem', marginTop: '4px' }}>
                  <span>TOTAL PAID:</span><span>AED {Number(lastInvoice.grandTotal).toFixed(2)}</span>
                </div>
              </div>

              <div style={{ marginTop: '14px', fontStyle: 'italic', color: '#64748b', fontSize: '0.7rem' }}>
                {s.footerMessage}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 440px', gap: '20px' }}>
        {/* Left: Item Selector */}
        <div className="card-enterprise">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} color="#2563eb" /> Select Product
          </h2>

          <form onSubmit={handleAddToCart} style={{ marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr auto', gap: '10px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Inventory Catalogue Item *</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                >
                  <option value="">-- Choose Catalogue Item --</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id} disabled={i.currentStock <= 0}>
                      {i.name} (SKU: {i.sku} · AED {Number(i.salesPrice).toFixed(2)} · Stock: {i.currentStock})
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={!selectedItemId} className="btn-primary" style={{ padding: '9px 16px' }}>
                <Plus size={16} /> Add
              </button>
            </div>
            {items.length === 0 && !isLoading && (
              <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '6px' }}>No items in catalog. Add items under "Inventory" first.</p>
            )}
          </form>

          {/* Quick Preset Pills */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '10px' }}>Frequently Sold (Quick-Add)</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {items.slice(0, 8).map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    const existingIdx = cart.findIndex((c) => c.itemId === p.id);
                    if (existingIdx >= 0) {
                      const updated = [...cart];
                      updated[existingIdx].qty += 1;
                      setCart(updated);
                    } else {
                      setCart([...cart, { itemId: p.id, name: p.name, sku: p.sku, price: Number(p.salesPrice), qty: 1 }]);
                    }
                  }}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}
                >
                  {p.name} · AED {Number(p.salesPrice).toFixed(2)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Cart & Charge */}
        <div className="card-enterprise">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={18} color="#2563eb" /> Current Basket ({cart.length})
          </h2>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Customer</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.82rem' }}
            >
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Custom Walk-in Customer name input */}
          {isWalkIn && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Walk-in Customer Name (Unregistered)
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe / Cash Customer"
                value={customCustomerName}
                onChange={(e) => setCustomCustomerName(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.82rem', boxSizing: 'border-box' }}
              />
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.82rem' }}
            >
              <option value="CASH">Cash Drawer (Account 1010)</option>
              <option value="CREDIT_CARD">Credit / Debit Card Terminal</option>
              <option value="BANK_TRANSFER">Direct Bank Deposit (Account 1020)</option>
            </select>
          </div>

          {/* UAE VAT Compliance Panel */}
          {selectedCustomerId && (
            <div style={{
              margin: '12px 0',
              padding: '10px 12px',
              borderRadius: '6px',
              border: requiresCustomer ? '1px solid #fee2e2' : !isWalkIn ? '1px solid #d1fae5' : '1px solid #e0f2fe',
              background: requiresCustomer ? '#fef2f2' : !isWalkIn ? '#f0fdf4' : '#f0f9ff',
              fontSize: '0.78rem',
            }}>
              {requiresCustomer ? (
                <div>
                  <strong style={{ color: '#991b1b', display: 'block', marginBottom: '4px' }}>⚠️ UAE FTA LAW ALERT</strong>
                  <span style={{ color: '#b91c1c' }}>
                    Standard Tax Invoice is legally required for transactions above AED 10,000. Please select a registered corporate customer instead of Walk-in.
                  </span>
                </div>
              ) : !isWalkIn ? (
                <div>
                  <strong style={{ color: '#166534', display: 'block', marginBottom: '2px' }}>📋 STANDARD TAX INVOICE MODE</strong>
                  <span style={{ color: '#15803d', display: 'block' }}>Buyer: {selectedCustomer?.name}</span>
                  <span style={{ color: '#15803d', display: 'block', fontFamily: 'monospace' }}>TRN: {selectedCustomer?.trn || 'N/A'}</span>
                </div>
              ) : (
                <div>
                  <strong style={{ color: '#075985', display: 'block', marginBottom: '2px' }}>🧾 SIMPLIFIED TAX INVOICE MODE</strong>
                  <span style={{ color: '#0369a1' }}>
                    Customer: {customCustomerName || 'Walk-in Retail Customer'} (Under AED 10,000 threshold).
                  </span>
                </div>
              )}
            </div>
          )}

          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: '8px', marginBottom: '20px' }}>
              Basket is empty. Add products on the left.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', maxHeight: '240px', overflowY: 'auto' }}>
              {cart.map((item) => (
                <div key={item.itemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>{item.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>AED {item.price.toFixed(2)} each</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 6px' }}>
                      <button onClick={() => updateQty(item.itemId, -1)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><Minus size={12} /></button>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.itemId, 1)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><Plus size={12} /></button>
                    </div>
                    <button onClick={() => removeItem(item.itemId)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Subtotal:</span><span>AED {subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600, marginBottom: '6px' }}>
              <span>UAE VAT (5%):</span><span>AED {vatTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0f172a', paddingTop: '8px', fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
              <span>Total Payable:</span><span>AED {grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleChargeAndPrint}
            disabled={cart.length === 0 || !canBill || isLoading || requiresCustomer}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', justifyContent: 'center', opacity: requiresCustomer ? 0.55 : 1, cursor: requiresCustomer ? 'not-allowed' : 'pointer' }}
          >
            <Printer size={18} />
            {isLoading ? 'Processing...' : 'Charge & Print Receipt'}
          </button>
        </div>
      </div>
    </div>
  );
}
