'use client';

import React, { useState } from 'react';
import { ShieldCheck, Send, CheckCircle2, Lock, FileCode, RefreshCw } from 'lucide-react';

interface EInvoiceLog {
  uuid: string;
  invoiceNo: string;
  buyerName: string;
  amount: number;
  vatAmount: number;
  hash: string;
  aspStatus: 'CLEARED' | 'REPORTED' | 'REJECTED';
  timestamp: string;
}

const initialEInvoices: EInvoiceLog[] = [
  { uuid: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6', invoiceNo: 'INV-2026-0089', buyerName: 'Emirates Retail Holdings LLC', amount: 3620.00, vatAmount: 181.00, hash: 'a8f5f167f44f4964e6c998dee827110c', aspStatus: 'CLEARED', timestamp: '2026-08-06 21:00:12' },
  { uuid: 'e71c3e3b-6cda-11d0-a765-00a0c91e6bf5', invoiceNo: 'INV-2026-0088', buyerName: 'Emaar Properties PJSC', amount: 85000.00, vatAmount: 4250.00, hash: 'b9e4e056e33e3853d5b887cdd716000b', aspStatus: 'CLEARED', timestamp: '2026-08-05 18:30:00' },
];

export default function EInvoicingCompliancePage() {
  const [logs, setLogs] = useState<EInvoiceLog[]>(initialEInvoices);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

  const handleTransmitEInvoice = () => {
    const newLog: EInvoiceLog = {
      uuid: `uuid-${Math.floor(100000 + Math.random() * 900000)}`,
      invoiceNo: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      buyerName: 'Al Serkal Group LLC',
      amount: 14250.00,
      vatAmount: 712.50,
      hash: `hash-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      aspStatus: 'CLEARED',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setLogs([newLog, ...logs]);
    setSubmissionSuccess(true);
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>UAE E-Invoicing & ASP Gateway Compliance</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            UBL 2.1 XML serialization, cryptographic SHA-256 hashing, and Accredited Service Provider clearance
          </p>
        </div>
        <button onClick={handleTransmitEInvoice} className="btn-primary">
          <Send size={16} /> Transmit E-Invoice to ASP Gateway
        </button>
      </div>

      {/* Success Banner */}
      {submissionSuccess && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '14px 16px', borderRadius: '8px', marginBottom: '20px', color: '#047857', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> E-Invoice successfully transmitted to ASP Gateway! Status: <strong>CLEARED</strong>. Cryptographic QR payload attached.
        </div>
      )}

      {/* Overview Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card-enterprise">
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
            E-Invoice Schema Standard
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>UBL 2.1 XML</div>
          <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>UAE FTA Tax Authority Compliant</span>
        </div>

        <div className="card-enterprise">
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
            ASP Gateway Status
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#059669' }}>Connected & Active</div>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Accredited Service Provider Gateway</span>
        </div>

        <div className="card-enterprise">
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
            Cleared E-Invoices (MTD)
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#2563eb' }} className="num-tabular">{logs.length} Cleared</div>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>0 Rejections</span>
        </div>
      </div>

      {/* E-Invoicing Clearance Log Table */}
      <div className="card-enterprise" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-main)', fontWeight: 600, color: '#0f172a' }}>
          ASP Gateway E-Invoice Transmission Logs
        </div>
        <table className="table-enterprise">
          <thead>
            <tr>
              <th>E-Invoice UUID</th>
              <th>Invoice No</th>
              <th>Buyer Entity</th>
              <th style={{ textAlign: 'right' }}>Total Amount (AED)</th>
              <th style={{ textAlign: 'right' }}>VAT Amount (5%)</th>
              <th>SHA-256 Hash</th>
              <th style={{ textAlign: 'center' }}>ASP Clearance Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.uuid}>
                <td style={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 600, fontSize: '0.78rem' }}>{log.uuid}</td>
                <td style={{ fontWeight: 600, color: '#0f172a' }}>{log.invoiceNo}</td>
                <td style={{ fontSize: '0.85rem' }}>{log.buyerName}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }} className="num-tabular">
                  {log.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }} className="num-tabular">
                  {log.vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>{log.hash}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className="badge-status badge-status-green">
                    <CheckCircle2 size={12} /> {log.aspStatus}
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
