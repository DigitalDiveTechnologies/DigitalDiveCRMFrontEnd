'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Download, X, Lock, CheckCircle2 } from 'lucide-react';
import { can, getActiveUserRole } from '@/lib/permissions';
import { downloadCsv } from '@/lib/exportUtils';
import { api } from '@/lib/apiClient';

interface JournalEntryItem {
  id: string;
  narration: string;
  postingDate: string;
  totalDebit: number;
  totalCredit: number;
  sourceDocumentType: string;
  lines: any[];
}

export default function LedgerPage() {
  const [userRole, setUserRole] = useState<string>('OWNER');
  const [canPost, setCanPost] = useState<boolean>(true);

  const [journals, setJournals] = useState<JournalEntryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [postedSuccess, setPostedSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form states
  const [narration, setNarration] = useState('');
  const [debitAccCode, setDebitAccCode] = useState('1010');
  const [debitAccName, setDebitAccName] = useState('Cash on Hand');
  const [creditAccCode, setCreditAccCode] = useState('4000');
  const [creditAccName, setCreditAccName] = useState('Sales Revenue');
  const [amount, setAmount] = useState<number>(0);

  const accountsList = [
    { code: '1010', name: 'Cash on Hand', type: 'ASSET' },
    { code: '1020', name: 'Emirates NBD Bank Account', type: 'ASSET' },
    { code: '1100', name: 'Accounts Receivable', type: 'ASSET' },
    { code: '1200', name: 'Inventory Asset', type: 'ASSET' },
    { code: '2100', name: 'Accounts Payable', type: 'LIABILITY' },
    { code: '2150', name: 'Output VAT Payable (5%)', type: 'LIABILITY' },
    { code: '2160', name: 'Input VAT Recoverable', type: 'ASSET' },
    { code: '4000', name: 'Sales Revenue', type: 'REVENUE' },
    { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE' },
    { code: '5050', name: 'Inventory Adjustment Expense', type: 'EXPENSE' },
  ];

  useEffect(() => {
    const role = getActiveUserRole();
    setUserRole(role);
    setCanPost(can('VIEW_LEDGER'));
    loadJournals();
  }, []);

  const loadJournals = async () => {
    setIsLoading(true);
    try {
      const data = await api.getJournals();
      setJournals(data || []);
    } catch (e) {
      console.error('Failed to load journals', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narration || amount <= 0 || !canPost || isLoading) return;
    setIsLoading(true);

    try {
      const debitAccount = accountsList.find(a => a.code === debitAccCode);
      const creditAccount = accountsList.find(a => a.code === creditAccCode);

      const payload = {
        sourceDocumentId: `MANUAL-${Date.now().toString().slice(-6)}`,
        sourceDocumentType: 'MANUAL_JOURNAL',
        postingDate: new Date(),
        narration: narration,
        lines: [
          {
            accountId: `acc-${debitAccCode}`,
            accountCode: debitAccCode,
            debit: amount,
            credit: 0,
            description: `Manual Debit to ${debitAccount?.name || 'Account'}`,
          },
          {
            accountId: `acc-${creditAccCode}`,
            accountCode: creditAccCode,
            debit: 0,
            credit: amount,
            description: `Manual Credit to ${creditAccount?.name || 'Account'}`,
          }
        ]
      };

      await api.postJournal(payload);
      setPostedSuccess(true);
      setIsModalOpen(false);
      setNarration('');
      setAmount(0);
      
      await loadJournals();
      setTimeout(() => setPostedSuccess(false), 5000);
    } catch (e) {
      console.error(e);
      alert('Error: Failed to post manual journal. Ensure lines are balanced.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportJournals = () => {
    const headers = ['Journal ID', 'Narration', 'Type', 'Total Debit (AED)', 'Total Credit (AED)', 'Posting Date'];
    const rows = journals.map(j => [
      j.id, 
      j.narration, 
      j.sourceDocumentType, 
      Number(j.totalDebit).toFixed(2), 
      Number(j.totalCredit).toFixed(2), 
      j.postingDate ? new Date(j.postingDate).toLocaleDateString() : 'N/A'
    ]);
    downloadCsv('General_Ledger_Journal_Entries.csv', headers, rows);
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>General Ledger & Journal Entries</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '2px' }}>
            Immutable Double-Entry Posting Engine (Debits == Credits Enforcement)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportJournals} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} /> Export Journal Entries (CSV)
          </button>
          {canPost ? (
            <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Post Manual Journal Entry
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
          <CheckCircle2 size={16} /> Double-Entry Journal Entry posted successfully! Debits == Credits == AED {amount.toFixed(2)}.
        </div>
      )}

      {/* Journal Entries Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
        {journals.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No journal entries posted yet. Click "Post Manual Journal Entry" to create your first balanced double-entry transaction.
          </div>
        ) : (
          <table className="table-enterprise">
            <thead>
              <tr>
                <th>Journal Reference</th>
                <th>Source Doc</th>
                <th>Narration Description</th>
                <th style={{ textAlign: 'right' }}>Total Debit (DR)</th>
                <th style={{ textAlign: 'right' }}>Total Credit (CR)</th>
                <th>Posting Date</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {journals.map((j) => (
                <tr key={j.id}>
                  <td style={{ fontWeight: 700, color: '#2563eb' }}>JRN-{j.id.slice(-6).toUpperCase()}</td>
                  <td style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>{j.sourceDocumentType}</td>
                  <td style={{ fontWeight: 500, color: '#0f172a' }}>{j.narration}</td>
                  <td style={{ textAlign: 'right', color: '#047857', fontWeight: 700 }} className="num-tabular">AED {Number(j.totalDebit).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', color: '#1d4ed8', fontWeight: 700 }} className="num-tabular">AED {Number(j.totalCredit).toFixed(2)}</td>
                  <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{j.postingDate ? new Date(j.postingDate).toLocaleDateString() : 'N/A'}</td>
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
          <div className="card-enterprise" style={{ width: '520px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Post Manual Journal Entry</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePostJournal}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Transaction Narration *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Month-end depreciation adjustment"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Debit Account (DR) *</label>
                  <select
                    value={debitAccCode}
                    onChange={(e) => setDebitAccCode(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    {accountsList.map(a => (
                      <option key={a.code} value={a.code}>{a.code} - {a.name} ({a.type})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Credit Account (CR) *</label>
                  <select
                    value={creditAccCode}
                    onChange={(e) => setCreditAccCode(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    {accountsList.map(a => (
                      <option key={a.code} value={a.code}>{a.code} - {a.name} ({a.type})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Balanced Transfer Amount (AED) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={amount <= 0 || debitAccCode === creditAccCode || isLoading} className="btn-primary">Post Journal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
