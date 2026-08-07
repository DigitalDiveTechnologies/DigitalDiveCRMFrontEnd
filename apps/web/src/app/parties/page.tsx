'use client';

import React, { useState, useEffect } from 'react';
import { Building2, ShieldCheck, Plus, Search, Download, X, Lock } from 'lucide-react';
import { can, getActiveUserRole } from '@/lib/permissions';
import { downloadCsv } from '@/lib/exportUtils';
import { api } from '@/lib/apiClient';

interface PartyItem {
  id: string;
  name: string;
  partyType: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
  trn: string;
  email: string;
  phone: string;
  creditLimit: number;
  balance: number;
}

export default function PartiesPage() {
  const [userRole, setUserRole] = useState<string>('OWNER');
  const [canManage, setCanManage] = useState<boolean>(true);

  // Clean state - 0 dummy data
  const [parties, setParties] = useState<PartyItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form state
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyTrn, setNewPartyTrn] = useState('');
  const [newPartyEmail, setNewPartyEmail] = useState('');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [newPartyCreditLimit, setNewPartyCreditLimit] = useState(50000);
  const [newPartyType, setNewPartyType] = useState<'CUSTOMER' | 'SUPPLIER' | 'BOTH'>('CUSTOMER');

  useEffect(() => {
    const role = getActiveUserRole();
    setUserRole(role);
    setCanManage(can('MANAGE_PARTIES'));
  }, []);

  const handleSaveParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyName || !canManage) return;

    const newParty: PartyItem = {
      id: `pty-${Date.now()}`,
      name: newPartyName,
      trn: newPartyTrn || 'N/A',
      email: newPartyEmail || 'contact@party.ae',
      phone: newPartyPhone || '+971 4 000 0000',
      partyType: newPartyType,
      creditLimit: newPartyCreditLimit || 50000,
      balance: 0.00,
    };

    setParties([newParty, ...parties]);
    setIsModalOpen(false);
    setNewPartyName('');
    setNewPartyTrn('');
    setNewPartyEmail('');
    setNewPartyPhone('');

    try {
      await api.createParty(newParty);
    } catch (e) {}
  };

  const handleExportParties = () => {
    downloadCsv(
      'UAE_Parties_Directory.csv',
      ['Party Name', 'Type', 'TRN', 'Email', 'Phone', 'Credit Limit (AED)', 'Balance (AED)'],
      parties.map(p => [p.name, p.partyType, p.trn, p.email, p.phone, p.creditLimit, p.balance])
    );
  };

  const filteredParties = parties.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.trn.includes(searchTerm);
    const matchesFilter = filterType === 'ALL' || p.partyType === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Parties (Customers & Suppliers)</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            Customer and supplier ledgers, 15-digit UAE TRNs, and credit limits
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportParties} className="btn-secondary">
            <Download size={14} /> Export Directory (CSV)
          </button>
          {canManage ? (
            <button onClick={() => setIsModalOpen(true)} className="btn-primary">
              <Plus size={16} /> Add New Party
            </button>
          ) : (
            <span className="badge-status badge-status-amber" style={{ padding: '8px 12px' }}>
              <Lock size={12} /> Read-Only ({userRole})
            </span>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search party name or TRN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.85rem' }}
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}
        >
          <option value="ALL">All Party Types</option>
          <option value="CUSTOMER">Customers Only</option>
          <option value="SUPPLIER">Suppliers Only</option>
        </select>
      </div>

      {/* Directory Table */}
      <div className="card-enterprise" style={{ padding: '0', overflow: 'hidden' }}>
        {filteredParties.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No parties registered yet. Click "Add New Party" to create your first customer or supplier record.
          </div>
        ) : (
          <table className="table-enterprise">
            <thead>
              <tr>
                <th>Party Entity</th>
                <th>Type</th>
                <th>UAE TRN Number</th>
                <th>Contact Info</th>
                <th style={{ textAlign: 'right' }}>Credit Limit</th>
                <th style={{ textAlign: 'right' }}>Current Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredParties.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</td>
                  <td>
                    <span className={p.partyType === 'CUSTOMER' ? 'badge-status badge-status-blue' : 'badge-status badge-status-amber'}>
                      {p.partyType}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{p.trn}</td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {p.email}<br />{p.phone}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }} className="num-tabular">
                    AED {p.creditLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: p.balance >= 0 ? '#0f172a' : '#dc2626' }} className="num-tabular">
                    AED {p.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Party Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card-enterprise" style={{ width: '480px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="#2563eb" /> Add New Customer / Supplier
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveParty}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Entity Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al Serkal Group LLC"
                  value={newPartyName}
                  onChange={(e) => setNewPartyName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Party Classification</label>
                <select
                  value={newPartyType}
                  onChange={(e) => setNewPartyType(e.target.value as any)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                >
                  <option value="CUSTOMER">Customer (Receivables)</option>
                  <option value="SUPPLIER">Supplier (Payables)</option>
                  <option value="BOTH">Both Customer & Supplier</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>15-Digit UAE TRN Number</label>
                <input
                  type="text"
                  placeholder="e.g. 100293847500003"
                  value={newPartyTrn}
                  onChange={(e) => setNewPartyTrn(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Email</label>
                  <input
                    type="email"
                    placeholder="billing@company.ae"
                    value={newPartyEmail}
                    onChange={(e) => setNewPartyEmail(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Phone</label>
                  <input
                    type="text"
                    placeholder="+971 4 000 0000"
                    value={newPartyPhone}
                    onChange={(e) => setNewPartyPhone(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Party</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
