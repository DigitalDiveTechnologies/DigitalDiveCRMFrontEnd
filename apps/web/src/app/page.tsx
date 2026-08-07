'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Printer, 
  Warehouse, 
  BarChart3, 
  ArrowRight,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { getActiveUserRole } from '@/lib/permissions';

export default function OverviewDashboardPage() {
  const [role, setRole] = useState('OWNER');

  useEffect(() => {
    setRole(getActiveUserRole());
  }, []);

  const isBiller = role === 'BILLER_CASHIER';
  const isInventoryManager = role === 'INVENTORY_MANAGER';
  const isAuditor = role === 'AUDITOR';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Flat Human Enterprise Banner */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '28px 32px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={14} color="#059669" /> 100% Online Cloud Server Active • Role: {role.replace('_', ' ')}
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
            Welcome to FilsDesk ERP
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            {isBiller && 'Real-time online POS billing counter & retail sales invoices.'}
            {isInventoryManager && 'Live warehouse stock master, SKUs, and depot transfers.'}
            {isAuditor && 'Read-only compliance, Form VAT 201 returns, and security audit logs.'}
            {(!isBiller && !isInventoryManager && !isAuditor) && 'Real-time UAE Accounting, Invoicing, Inventory & Double-Entry Financial Engine.'}
          </p>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 18px', borderRadius: '8px', textAlign: 'right' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Financial Ledger</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <ShieldCheck size={16} /> Double-Entry Balanced
          </div>
        </div>
      </div>

      {/* Role Action Cards */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
        Quick Navigation ({role.replace('_', ' ')})
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
        {/* Card 1: POS Billing */}
        {(isBiller || !isInventoryManager) && (
          <Link href="/pos" style={{ textDecoration: 'none' }}>
            <div className="card-enterprise" style={{ transition: 'border-color 0.15s ease', cursor: 'pointer' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <Printer size={18} />
              </div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>POS Billing Counter</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>Retail receipt checkout & 80mm USB thermal printing.</p>
              <div style={{ marginTop: '12px', fontSize: '0.8rem', fontWeight: 600, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Open Counter <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        )}

        {/* Card 2: Sales Invoicing */}
        {(isBiller || !isInventoryManager) && (
          <Link href="/invoices" style={{ textDecoration: 'none' }}>
            <div className="card-enterprise" style={{ transition: 'border-color 0.15s ease', cursor: 'pointer' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <FileText size={18} />
              </div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>Create Tax Invoice</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>Issue 5% UAE VAT invoices to registered customers.</p>
              <div style={{ marginTop: '12px', fontSize: '0.8rem', fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                New Invoice <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        )}

        {/* Card 3: Inventory Stock */}
        {(isInventoryManager || !isBiller) && (
          <Link href="/inventory" style={{ textDecoration: 'none' }}>
            <div className="card-enterprise" style={{ transition: 'border-color 0.15s ease', cursor: 'pointer' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#f5f3ff', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <Warehouse size={18} />
              </div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>Warehouse Stock</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>Inter-warehouse stock transfers & damage loss entries.</p>
              <div style={{ marginTop: '12px', fontSize: '0.8rem', fontWeight: 600, color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Manage Stock <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        )}

        {/* Card 4: Financial Reports */}
        {(isAuditor || (!isBiller && !isInventoryManager)) && (
          <Link href="/reports" style={{ textDecoration: 'none' }}>
            <div className="card-enterprise" style={{ transition: 'border-color 0.15s ease', cursor: 'pointer' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <BarChart3 size={18} />
              </div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>VAT 201 & Reports</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>View Form VAT 201 tax returns, P&L, and Trial Balance.</p>
              <div style={{ marginTop: '12px', fontSize: '0.8rem', fontWeight: 600, color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View Reports <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
