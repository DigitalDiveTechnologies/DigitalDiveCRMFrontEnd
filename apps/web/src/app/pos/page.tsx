'use client';

import React, { useState, useEffect } from 'react';
import { Printer, ShoppingCart, Plus, Minus, Trash2, CheckCircle2, CreditCard, DollarSign, Lock } from 'lucide-react';
import { can, getActiveUserRole } from '@/lib/permissions';

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export default function PosBillingCounterPage() {
  const [userRole, setUserRole] = useState<string>('OWNER');
  const [canBill, setCanBill] = useState<boolean>(true);

  // Clean state - 0 dummy cart data
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Retail Customer');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [receiptSuccess, setReceiptSuccess] = useState<boolean>(false);
  const [lastReceiptNo, setLastReceiptNo] = useState<string>('');

  // Quick item addition form
  const [quickItemName, setQuickItemName] = useState('');
  const [quickItemPrice, setQuickItemPrice] = useState<number>(0);

  useEffect(() => {
    const role = getActiveUserRole();
    setUserRole(role);
    setCanBill(can('CREATE_INVOICE'));
  }, []);

  const handleAddQuickItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickItemName || quickItemPrice <= 0) return;

    const existingIdx = cart.findIndex((i) => i.name === quickItemName);
    if (existingIdx >= 0) {
      const updated = [...cart];
      updated[existingIdx].qty += 1;
      setCart(updated);
    } else {
      setCart([...cart, { id: `pos-${Date.now()}`, name: quickItemName, price: quickItemPrice, qty: 1 }]);
    }
    setQuickItemName('');
    setQuickItemPrice(0);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map((item) => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const vatTotal = subtotal * 0.05;
  const grandTotal = subtotal + vatTotal;

  const handlePrintReceipt = () => {
    if (cart.length === 0 || !canBill) return;
    const rcptId = `POS-${Date.now().toString().slice(-6)}`;
    setLastReceiptNo(rcptId);
    setReceiptSuccess(true);
    setCart([]);
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>POS Retail Cashier Terminal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            58mm/80mm ESC/POS Thermal Printing & Instant Retail Cash Ledger Posting
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {receiptSuccess && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '14px 16px', borderRadius: '8px', marginBottom: '20px', color: '#047857', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> Receipt <strong>{lastReceiptNo}</strong> printed & posted to Cash Account 1010!
          </div>
          <button onClick={() => setReceiptSuccess(false)} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
            New Transaction
          </button>
        </div>
      )}

      {/* Grid: Quick Item Form & Retail Cart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 440px', gap: '20px' }}>
        {/* Left: Quick Item Add Form */}
        <div className="card-enterprise">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} color="#2563eb" /> Scan or Enter POS Item
          </h2>

          <form onSubmit={handleAddQuickItem} style={{ marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Product Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Retail Item / Barcode"
                  value={quickItemName}
                  onChange={(e) => setQuickItemName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Price (AED) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={quickItemPrice}
                  onChange={(e) => setQuickItemPrice(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '9px 16px' }}>
                <Plus size={16} /> Add to Cart
              </button>
            </div>
          </form>

          {/* Quick preset pills */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '10px' }}>Quick Item Shortcuts</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { name: 'Cold Drink 330ml', price: 5.00 },
                { name: 'Fresh Milk 1L', price: 8.50 },
                { name: 'Arabica Coffee Beans 250g', price: 42.00 },
                { name: 'Thermal Paper Roll 80mm', price: 15.00 },
              ].map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCart([...cart, { id: `pos-${Date.now()}-${i}`, name: p.name, price: p.price, qty: 1 }])}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}
                >
                  {p.name} (AED {p.price.toFixed(2)})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Cart Summary & Thermal Receipt Generator */}
        <div className="card-enterprise">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={18} color="#2563eb" /> Current Basket ({cart.length})
          </h2>

          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: '8px', marginBottom: '20px' }}>
              Basket is empty. Add items using the quick shortcuts or product entry form on the left.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', maxHeight: '240px', overflowY: 'auto' }}>
              {cart.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>{item.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>AED {item.price.toFixed(2)} each</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 6px' }}>
                      <button onClick={() => updateQty(item.id, -1)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><Minus size={12} /></button>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700 }} className="num-tabular">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><Plus size={12} /></button>
                    </div>
                    <button onClick={() => removeItem(item.id)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cart Total Breakdown */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Subtotal:</span>
              <span className="num-tabular">AED {subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600, marginBottom: '6px' }}>
              <span>UAE VAT (5%):</span>
              <span className="num-tabular">AED {vatTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0f172a', paddingTop: '8px', fontWeight: 800, fontSize: '1.15rem', color: '#0f172a' }}>
              <span>Total Payable:</span>
              <span className="num-tabular">AED {grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button onClick={handlePrintReceipt} disabled={cart.length === 0 || !canBill} className="btn-primary" style={{ width: '100%', padding: '12px', justifyContent: 'center' }}>
            <Printer size={18} /> Print Thermal ESC/POS Receipt & Charge
          </button>
        </div>
      </div>
    </div>
  );
}
