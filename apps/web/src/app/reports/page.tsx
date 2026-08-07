'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { downloadCsv } from '@/lib/exportUtils';

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<'vat201' | 'pnl' | 'trial'>('vat201');

  const handleExportReport = () => {
    if (activeReport === 'vat201') {
      downloadCsv(
        'UAE_Form_VAT_201_Tax_Return.csv',
        ['Box Number', 'Description', 'Amount (AED)', 'VAT Amount (AED)'],
        [
          ['1a', 'Standard rated supplies in Dubai (5%)', 142850.00, 7142.50],
          ['1b', 'Standard rated supplies in Abu Dhabi (5%)', 45000.00, 2250.00],
          ['2', 'Zero-rated supplies', 25000.00, 0.00],
          ['3', 'Exempt supplies', 12000.00, 0.00],
          ['TOTAL_OUTPUT', 'Total Output Tax Due (A)', 224850.00, 9392.50],
          ['9', 'Standard rated expenses (5%)', 64000.00, 3200.00],
          ['TOTAL_INPUT', 'Total Recoverable Tax (B)', 64000.00, 3200.00],
          ['NET_PAYABLE', 'Net VAT Payable to FTA (A - B)', 160850.00, 6192.50],
        ]
      );
    } else if (activeReport === 'pnl') {
      downloadCsv(
        'Profit_and_Loss_Statement.csv',
        ['Financial Line Item', 'Amount (AED)'],
        [
          ['Sales Revenue', 224850.00],
          ['Cost of Goods Sold (COGS)', -82400.00],
          ['Gross Profit', 142450.00],
          ['Operating Expenses (Rent, Salaries)', -48000.00],
          ['Net Operating Profit', 94450.00],
        ]
      );
    } else if (activeReport === 'trial') {
      downloadCsv(
        'Trial_Balance.csv',
        ['Account Code & Name', 'Debit (AED)', 'Credit (AED)'],
        [
          ['1010 - Bank Account (Emirates NBD)', 185000.00, 0.00],
          ['1100 - Accounts Receivable', 95000.00, 0.00],
          ['4000 - Sales Revenue', 0.00, 224850.00],
          ['2150 - Output VAT Payable', 0.00, 55150.00],
          ['TOTAL', 280000.00, 280000.00],
        ]
      );
    }
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Financial & VAT Reports</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            Federal Tax Authority Form VAT 201, Profit & Loss Statement, and Trial Balance
          </p>
        </div>
        <button onClick={handleExportReport} className="btn-secondary">
          <Download size={14} /> Export Active Report (CSV)
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveReport('vat201')}
          style={{
            background: activeReport === 'vat201' ? '#0f172a' : '#ffffff',
            color: activeReport === 'vat201' ? '#ffffff' : '#475569',
            border: '1px solid #cbd5e1',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          UAE VAT 201 Return
        </button>

        <button
          onClick={() => setActiveReport('pnl')}
          style={{
            background: activeReport === 'pnl' ? '#0f172a' : '#ffffff',
            color: activeReport === 'pnl' ? '#ffffff' : '#475569',
            border: '1px solid #cbd5e1',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Profit & Loss Statement
        </button>

        <button
          onClick={() => setActiveReport('trial')}
          style={{
            background: activeReport === 'trial' ? '#0f172a' : '#ffffff',
            color: activeReport === 'trial' ? '#ffffff' : '#475569',
            border: '1px solid #cbd5e1',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Trial Balance
        </button>
      </div>

      {/* Form VAT 201 */}
      {activeReport === 'vat201' && (
        <div className="card-enterprise">
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>Federal Tax Authority (FTA) - Form VAT 201</h2>
              <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Tax Period: 01 May 2026 - 31 Jul 2026 • TRN: 100293847500003</p>
            </div>
            <span className="badge-status badge-status-blue">Currency: AED</span>
          </div>

          <h3 style={{ fontSize: '0.95rem', color: '#0f172a', marginBottom: '10px', fontWeight: 600 }}>VAT on Sales and All Other Outputs</h3>
          <table className="table-enterprise" style={{ marginBottom: '20px' }}>
            <thead>
              <tr>
                <th>Box # Description</th>
                <th style={{ textAlign: 'right' }}>Amount (AED)</th>
                <th style={{ textAlign: 'right' }}>VAT Amount (AED)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1a. Standard rated supplies in Dubai (5%)</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">142,850.00</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: '#0284c7' }} className="num-tabular">7,142.50</td>
              </tr>
              <tr>
                <td>1b. Standard rated supplies in Abu Dhabi (5%)</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">45,000.00</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: '#0284c7' }} className="num-tabular">2,250.00</td>
              </tr>
              <tr>
                <td>2. Zero-rated supplies</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">25,000.00</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">0.00</td>
              </tr>
              <tr>
                <td>3. Exempt supplies</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">12,000.00</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">0.00</td>
              </tr>
              <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                <td>Total Output Tax Due (A)</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">224,850.00</td>
                <td style={{ textAlign: 'right', color: '#0284c7' }} className="num-tabular">9,392.50</td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ fontSize: '0.95rem', color: '#0f172a', marginBottom: '10px', fontWeight: 600 }}>VAT on Expenses and All Other Inputs</h3>
          <table className="table-enterprise" style={{ marginBottom: '20px' }}>
            <thead>
              <tr>
                <th>Box # Description</th>
                <th style={{ textAlign: 'right' }}>Amount (AED)</th>
                <th style={{ textAlign: 'right' }}>Recoverable VAT (AED)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>9. Standard rated expenses (5%)</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">64,000.00</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: '#059669' }} className="num-tabular">3,200.00</td>
              </tr>
              <tr style={{ background: '#ecfdf5', fontWeight: 700 }}>
                <td>Total Recoverable Tax (B)</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">64,000.00</td>
                <td style={{ textAlign: 'right', color: '#059669' }} className="num-tabular">3,200.00</td>
              </tr>
            </tbody>
          </table>

          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 600 }}>Net VAT Payable to Federal Tax Authority</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Calculated as Output Tax (9,392.50 AED) - Recoverable Input Tax (3,200.00 AED)</p>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2563eb' }} className="num-tabular">
              AED 6,192.50
            </div>
          </div>
        </div>
      )}

      {/* PnL View */}
      {activeReport === 'pnl' && (
        <div className="card-enterprise">
          <h2 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '16px', fontWeight: 700 }}>Profit & Loss Statement (AED)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
              <span>Sales Revenue</span>
              <strong className="num-tabular">AED 224,850.00</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', color: '#dc2626' }}>
              <span>Cost of Goods Sold (COGS)</span>
              <strong className="num-tabular">- AED 82,400.00</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '10px', borderRadius: '6px', fontWeight: 700 }}>
              <span>Gross Profit</span>
              <span style={{ color: '#0f172a' }} className="num-tabular">AED 142,450.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', color: '#dc2626' }}>
              <span>Operating Expenses (Rent, Salaries)</span>
              <strong className="num-tabular">- AED 48,000.00</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#ecfdf5', padding: '14px', borderRadius: '8px', fontWeight: 700, fontSize: '1.1rem' }}>
              <span style={{ color: '#047857' }}>Net Operating Profit</span>
              <span style={{ color: '#047857' }} className="num-tabular">AED 94,450.00</span>
            </div>
          </div>
        </div>
      )}

      {/* Trial Balance View */}
      {activeReport === 'trial' && (
        <div className="card-enterprise">
          <h2 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '16px', fontWeight: 700 }}>Trial Balance (AED)</h2>
          <table className="table-enterprise">
            <thead>
              <tr>
                <th>Account Code & Name</th>
                <th style={{ textAlign: 'right' }}>Debit (AED)</th>
                <th style={{ textAlign: 'right' }}>Credit (AED)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1010 - Bank Account (Emirates NBD)</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">185,000.00</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">0.00</td>
              </tr>
              <tr>
                <td>1100 - Accounts Receivable</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">95,000.00</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">0.00</td>
              </tr>
              <tr>
                <td>4000 - Sales Revenue</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">0.00</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">224,850.00</td>
              </tr>
              <tr>
                <td>2150 - Output VAT Payable</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">0.00</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">55,150.00</td>
              </tr>
              <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                <td>Total Trial Balance</td>
                <td style={{ textAlign: 'right', color: '#0f172a' }} className="num-tabular">280,000.00</td>
                <td style={{ textAlign: 'right', color: '#0f172a' }} className="num-tabular">280,000.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
