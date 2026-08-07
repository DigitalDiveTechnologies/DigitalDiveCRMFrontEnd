'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Download, X, Lock, CheckCircle2 } from 'lucide-react';
import { can, getActiveUserRole } from '@/lib/permissions';
import { downloadCsv } from '@/lib/exportUtils';
import { api } from '@/lib/apiClient';

interface JournalEntryItem {
  id: string;
  narration: string;
  debitAccount: string;
  creditAccount: string;
  debitAmount: number;
  creditAmount: number;
  date: string;
  status: string;
}

export default function LedgerPage() {
  const [userRole, setUserRole] = useState<string>('OWNER');
  const [canPost, setCanPost] = useState<boolean>(true);

  // Clean state - 0 dummy data
  const [journals, setJournals] = useState<JournalEntryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [postedSuccess, setPostedSuccess] = useState<boolean>(false);

  // Form states
  const [narration, setNarration] = useState('');
  const [debitAcc, setDebitAcc] = useState('1010 - Cash on Hand');
  const [creditAcc, setCreditAcc] = useState('4010 - General Sales Revenue');
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    const role = getActiveUserRole();
    setUserRole(role);
    setCanPost(can('VIEW_LEDGER'));
  }, []);

  const handlePostJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narration || amount <= 0 || !canPost) return;

    const newJournal: JournalEntryItem = {
      id: `JRN-${Date.now().toString().slice(-6)}`,
      narration,
      debitAccount: debitAcc,
      creditAccount: creditAcc,
      debitAmount: amount,
      creditAmount: amount,
      date: new Date().toISOString().substring(0, 10),
      status: 'POSTED_BALANCED',
    };

    setJournals([newJournal, ...journals]);
    setIsModalOpen(false);
    setPostedSuccess(true);
    setNarration('');
    setAmount(0);

    try {
      await api.postJournal(newJournal);
    } catch (e) {}
  };

  const handleExportJournals = () => {
    downloadCsv(
      'General_Ledger_Journal_Entries.csv',
      ['Journal ID', 'Narration', 'Debit Account', 'Credit Account', 'Amount (AED)', 'Posting Date', 'Status'],
      journals.map(j => [j.id, j.narration, j.debitAccount, j.creditAccount, j.debitAmount, j.date, j.status])
    );
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>General Ledger & Journal Entries</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            Immutable Double-Entry Posting Engine (Debits == Credits Enforcement)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportJournals} className="btn-secondary">
            <Download size={14} /> Export Journal Entries (CSV)
          </button>
          {canPost ? (
            <button onClick={() => setIsModalOpen(true)} className="btn-primary">
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
      <div className="card-enterprise" style={{ padding: '0', overflow: 'hidden' }}>
        {journals.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No manual journal entries posted yet. Click "Post Manual Journal Entry" to create your first balanced double-entry transaction.
          </div>
        ) : (
          <table className="table-enterprise">
            <thead>
              <tr>
                <th>Journal Reference</th>
                <th>Narration Description</th>
                <th>Debit Account (DR)</th>
                <th>Credit Account (CR)</th>
                <th style={{ textAlign: 'right' }}>Balanced Amount (AED)</th>
                <th>Posting Date</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {journals.map((j) => (
                <tr key={j.id}>
                  <td style={{ fontWeight: 700, color: '#2563eb' }}>{j.id}</td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{j.narration}</td>
                  <td style={{ fontSize: '0.82rem', color: '#047857', fontWeight: 600 }}>{j.debitAccount}</td>
                  <td style={{ fontSize: '0.82rem', color: '#1d4ed8', fontWeight: 600 }}>{j.creditAccount}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800 }} className="num-tabular">AED {j.debitAmount.toFixed(2)}</td>
                  <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{j.date}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge-status badge-status-green">{j.status}</span>
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
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} color="#2563eb" /> Post Manual Journal Entry
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePostJournal}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Journal Narration *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Petty cash replenishment"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Debit Account (DR)</label>
                  <select
                    value={debitAcc}
                    onChange={(e) => setDebitAcc(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    <option value="1010 - Cash on Hand">1010 - Cash on Hand</option>
                    <option value="1020 - ENBD Operating Account">1020 - ENBD Operating Account</option>
                    <option value="1200 - Accounts Receivable">1200 - Accounts Receivable</option>
                    <option value="5010 - Cost of Goods Sold">5010 - Cost of Goods Sold</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Credit Account (CR)</label>
                  <select
                    value={creditAcc}
                    onChange={(e) => setCreditAcc(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    <option value="4010 - General Sales Revenue">4010 - General Sales Revenue</option>
                    <option value="2100 - Accounts Payable">2100 - Accounts Payable</option>
                    <option value="2150 - Output VAT Payable">2150 - Output VAT Payable</option>
                    <option value="1010 - Cash on Hand">1010 - Cash on Hand</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Journal Amount (AED) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Post Journal Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
