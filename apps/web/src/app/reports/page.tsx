'use client';

import React, { useState, useEffect } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { downloadCsv } from '@/lib/exportUtils';
import { api } from '@/lib/apiClient';

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<'vat201' | 'pnl' | 'trial'>('vat201');
  const [isLoading, setIsLoading] = useState(false);

  // States for report data
  const [vatReturn, setVatReturn] = useState<any>(null);
  const [pnlData, setPnlData] = useState<any>(null);
  const [trialData, setTrialData] = useState<any>(null);

  useEffect(() => {
    loadActiveReportData();
  }, [activeReport]);

  const loadActiveReportData = async () => {
    setIsLoading(true);
    try {
      if (activeReport === 'vat201') {
        const data = await api.getVat201();
        setVatReturn(data);
      } else if (activeReport === 'pnl') {
        const data = await api.getProfitLoss();
        setPnlData(data);
      } else if (activeReport === 'trial') {
        const data = await api.getTrialBalance();
        setTrialData(data);
      }
    } catch (e) {
      console.error('Failed to load report data', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = () => {
    if (activeReport === 'vat201' && vatReturn) {
      const boxes = vatReturn.boxes || {};
      downloadCsv(
        'UAE_Form_VAT_201_Tax_Return.csv',
        ['Box Number', 'Description', 'Amount (AED)', 'VAT Amount (AED)'],
        [
          ['1a', 'Standard rated supplies in Dubai (5%)', boxes.box1_standardRatedSales?.amount || 0, boxes.box1_standardRatedSales?.vatAmount || 0],
          ['2', 'Zero-rated supplies', boxes.box2_zeroRatedSales?.amount || 0, boxes.box2_zeroRatedSales?.vatAmount || 0],
          ['3', 'Exempt supplies', boxes.box3_exemptSales?.amount || 0, boxes.box3_exemptSales?.vatAmount || 0],
          ['TOTAL_OUTPUT', 'Total Output Tax Due (A)', boxes.box1_standardRatedSales?.amount || 0, boxes.box12_totalVatDue || 0],
          ['9', 'Standard rated expenses (5%)', boxes.box9_standardRatedPurchases?.amount || 0, boxes.box13_totalVatRecoverable || 0],
          ['TOTAL_INPUT', 'Total Recoverable Tax (B)', boxes.box9_standardRatedPurchases?.amount || 0, boxes.box13_totalVatRecoverable || 0],
          ['NET_PAYABLE', 'Net VAT Payable to FTA (A - B)', (boxes.box12_totalVatDue || 0) - (boxes.box13_totalVatRecoverable || 0), boxes.box14_netVatPayable || 0],
        ]
      );
    } else if (activeReport === 'pnl' && pnlData) {
      downloadCsv(
        'Profit_and_Loss_Statement.csv',
        ['Financial Line Item', 'Amount (AED)'],
        [
          ['Sales Revenue', pnlData.grossSalesRevenue || 0],
          ['Cost of Goods Sold (COGS)', -(pnlData.costOfGoodsSold || 0)],
          ['Gross Profit', pnlData.grossProfit || 0],
          ['Operating Expenses (Rent, Salaries)', -(pnlData.operatingExpenses || 0)],
          ['Net Operating Profit', pnlData.netProfit || 0],
        ]
      );
    } else if (activeReport === 'trial' && trialData) {
      const rows = trialData.accounts?.map((acc: any) => [
        `${acc.code} - ${acc.name}`, 
        Number(acc.debit).toFixed(2), 
        Number(acc.credit).toFixed(2)
      ]) || [];
      rows.push(['Total Trial Balance', Number(trialData.totalDebit).toFixed(2), Number(trialData.totalCredit).toFixed(2)]);
      
      downloadCsv(
        'Trial_Balance.csv',
        ['Account Code & Name', 'Debit (AED)', 'Credit (AED)'],
        rows
      );
    }
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>Financial & VAT Reports</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '2px' }}>
            Federal Tax Authority Form VAT 201, Profit & Loss Statement, and Trial Balance
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={loadActiveReportData} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} disabled={isLoading}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={handleExportReport} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} disabled={isLoading}>
            <Download size={14} /> Export Active Report (CSV)
          </button>
        </div>
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

      {isLoading && (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Calculating report fields from database general ledger entries...
        </div>
      )}

      {/* Form VAT 201 */}
      {!isLoading && activeReport === 'vat201' && vatReturn && (
        <div className="card-enterprise">
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>Federal Tax Authority (FTA) - Form VAT 201</h2>
              <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Tax Period: Q3 Return • TRN: {vatReturn.trn}</p>
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
                <td>1a. Standard rated supplies in Dubai/UAE (5%)</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">{Number(vatReturn.boxes?.box1_standardRatedSales?.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: '#0284c7' }} className="num-tabular">{Number(vatReturn.boxes?.box1_standardRatedSales?.vatAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td>2. Zero-rated supplies</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">{Number(vatReturn.boxes?.box2_zeroRatedSales?.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">{Number(vatReturn.boxes?.box2_zeroRatedSales?.vatAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td>3. Exempt supplies</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">{Number(vatReturn.boxes?.box3_exemptSales?.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">{Number(vatReturn.boxes?.box3_exemptSales?.vatAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              </tr>
              <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                <td>Total Output Tax Due (A)</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">{Number(vatReturn.boxes?.box1_standardRatedSales?.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td style={{ textAlign: 'right', color: '#0284c7' }} className="num-tabular">{Number(vatReturn.boxes?.box12_totalVatDue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
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
                <td style={{ textAlign: 'right' }} className="num-tabular">{Number(vatReturn.boxes?.box9_standardRatedPurchases?.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: '#059669' }} className="num-tabular">{Number(vatReturn.boxes?.box9_standardRatedPurchases?.vatAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              </tr>
              <tr style={{ background: '#ecfdf5', fontWeight: 700 }}>
                <td>Total Recoverable Tax (B)</td>
                <td style={{ textAlign: 'right' }} className="num-tabular">{Number(vatReturn.boxes?.box9_standardRatedPurchases?.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td style={{ textAlign: 'right', color: '#059669' }} className="num-tabular">{Number(vatReturn.boxes?.box13_totalVatRecoverable || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 600 }}>Net VAT Payable to Federal Tax Authority</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Calculated as Output Tax (A) - Recoverable Input Tax (B)</p>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2563eb' }} className="num-tabular">
              AED {Number(vatReturn.boxes?.box14_netVatPayable || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
          </div>
        </div>
      )}

      {/* PnL View */}
      {!isLoading && activeReport === 'pnl' && pnlData && (
        <div className="card-enterprise">
          <h2 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '16px', fontWeight: 700 }}>Profit & Loss Statement (AED)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
              <span>Sales Revenue</span>
              <strong className="num-tabular">AED {Number(pnlData.grossSalesRevenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', color: '#dc2626' }}>
              <span>Cost of Goods Sold (COGS)</span>
              <strong className="num-tabular">- AED {Number(pnlData.costOfGoodsSold || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '10px', borderRadius: '6px', fontWeight: 700 }}>
              <span>Gross Profit</span>
              <span style={{ color: '#0f172a' }} className="num-tabular">AED {Number(pnlData.grossProfit || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', color: '#dc2626' }}>
              <span>Operating Expenses (Rent, Salaries)</span>
              <strong className="num-tabular">- AED {Number(pnlData.operatingExpenses || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#ecfdf5', padding: '14px', borderRadius: '8px', fontWeight: 700, fontSize: '1.1rem' }}>
              <span style={{ color: '#047857' }}>Net Operating Profit</span>
              <span style={{ color: '#047857' }} className="num-tabular">AED {Number(pnlData.netProfit || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>
      )}

      {/* Trial Balance View */}
      {!isLoading && activeReport === 'trial' && trialData && (
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
              {trialData.accounts?.map((acc: any) => (
                <tr key={acc.code}>
                  <td>{acc.code} - {acc.name}</td>
                  <td style={{ textAlign: 'right' }} className="num-tabular">{Number(acc.debit || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td style={{ textAlign: 'right' }} className="num-tabular">{Number(acc.credit || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
              ))}
              <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                <td>Total Trial Balance</td>
                <td style={{ textAlign: 'right', color: '#0f172a' }} className="num-tabular">{Number(trialData.totalDebit || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td style={{ textAlign: 'right', color: '#0f172a' }} className="num-tabular">{Number(trialData.totalCredit || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
