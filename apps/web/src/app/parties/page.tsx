'use client';

import React, { useState, useEffect } from 'react';
import { Building2, ShieldCheck, Plus, Search, Download, X, Lock, FileText, ArrowRight, Wallet, ShoppingBag } from 'lucide-react';
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
  address?: string;
  creditLimit: number;
  balance: number;
}

export default function PartiesPage() {
  const [userRole, setUserRole] = useState<string>('OWNER');
  const [canManage, setCanManage] = useState<boolean>(true);

  // Core records state
  const [parties, setParties] = useState<PartyItem[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedParty, setSelectedParty] = useState<PartyItem | null>(null);

  // Form state
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyTrn, setNewPartyTrn] = useState('');
  const [newPartyEmail, setNewPartyEmail] = useState('');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [newPartyAddress, setNewPartyAddress] = useState('');
  const [newPartyCreditLimit, setNewPartyCreditLimit] = useState(50000);
  const [newPartyType, setNewPartyType] = useState<'CUSTOMER' | 'SUPPLIER' | 'BOTH'>('CUSTOMER');

  useEffect(() => {
    const role = getActiveUserRole();
    setUserRole(role);
    setCanManage(can('MANAGE_PARTIES'));
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [partyData, invoiceData, billData] = await Promise.all([
        api.getParties(),
        api.getInvoices(),
        api.getBills(),
      ]);
      setParties(partyData || []);
      setInvoices(invoiceData || []);
      setBills(billData || []);
    } catch (e) {
      console.warn('Error loading CRM data from backend:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyName || !canManage) return;

    const newParty: any = {
      name: newPartyName,
      trn: newPartyTrn || 'N/A',
      email: newPartyEmail || 'contact@party.ae',
      phone: newPartyPhone || '+971 4 000 0000',
      address: newPartyAddress || 'Dubai, UAE',
      partyType: newPartyType,
      creditLimit: Number(newPartyCreditLimit) || 50000,
      balance: 0.00,
    };

    try {
      const saved = await api.createParty(newParty);
      setParties([saved, ...parties]);
      setIsModalOpen(false);
      
      // Clear form
      setNewPartyName('');
      setNewPartyTrn('');
      setNewPartyEmail('');
      setNewPartyPhone('');
      setNewPartyAddress('');
      setNewPartyCreditLimit(50000);
    } catch (e) {
      console.error('Failed to create party:', e);
    }
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
    const matchesFilter = filterType === 'ALL' || p.partyType === filterType || (p.partyType === 'BOTH');
    return matchesSearch && matchesFilter;
  });

  // Associated transactions filtering for profiles
  const getAssociatedInvoices = (party: PartyItem) => {
    return invoices.filter(inv => inv.customerName === party.name);
  };

  const getAssociatedBills = (party: PartyItem) => {
    return bills.filter(b => b.supplierName === party.name);
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Client Database & Profiles</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            Manage client profiles, 15-digit UAE TRNs, limits, and view their interactive transactional ledgers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportParties} className="btn-secondary">
            <Download size={14} /> Export Directory (CSV)
          </button>
          {canManage ? (
            <button onClick={() => setIsModalOpen(true)} className="btn-primary">
              <Plus size={16} /> Add Client Profile
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
            placeholder="Search clients by name, email or TRN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.85rem' }}
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', color: '#1e293b', fontWeight: 500 }}
        >
          <option value="ALL">All Relations</option>
          <option value="CUSTOMER">Customers Only</option>
          <option value="SUPPLIER">Suppliers Only</option>
        </select>
      </div>

      {/* Directory Table */}
      <div className="card-enterprise" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Loading database...
          </div>
        ) : filteredParties.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No clients registered yet. Click "Add Client Profile" to create one.
          </div>
        ) : (
          <table className="table-enterprise">
            <thead>
              <tr>
                <th>Entity Legal Name</th>
                <th>Relationship</th>
                <th>UAE TRN Number</th>
                <th>Contact Info</th>
                <th style={{ textAlign: 'right' }}>Credit Limit</th>
                <th style={{ textAlign: 'right' }}>Current Balance</th>
                <th style={{ textAlign: 'center' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredParties.map((p) => (
                <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedParty(p)}>
                  <td style={{ fontWeight: 600, color: '#2563eb' }}>{p.name}</td>
                  <td>
                    <span className={`badge-status ${p.partyType === 'CUSTOMER' ? 'badge-status-blue' : p.partyType === 'SUPPLIER' ? 'badge-status-amber' : 'badge-status-green'}`}>
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
                  <td style={{ textAlign: 'right', fontWeight: 700, color: p.balance >= 0 ? '#059669' : '#dc2626' }} className="num-tabular">
                    AED {p.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                    View Profile <ArrowRight size={12} style={{ display: 'inline', marginLeft: '2px' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sliding Side Profile Panel */}
      {selectedParty && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          zIndex: 90,
          display: 'flex',
          justifyContent: 'flex-end',
        }} onClick={() => setSelectedParty(null)}>
          
          <div style={{
            width: '560px',
            height: '100vh',
            background: '#ffffff',
            boxShadow: '-4px 0 25px rgba(0,0,0,0.15)',
            padding: '36px',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                  {selectedParty.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{selectedParty.name}</h3>
                  <span className={`badge-status ${selectedParty.partyType === 'CUSTOMER' ? 'badge-status-blue' : 'badge-status-amber'}`} style={{ marginTop: '3px' }}>
                    {selectedParty.partyType} Profile
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedParty(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            {/* Client Details Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>UAE TRN Number</label>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'monospace', marginTop: '2px' }}>{selectedParty.trn}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Relationship ID</label>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px' }}>{selectedParty.id}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Email Address</label>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px' }}>{selectedParty.email}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Phone Number</label>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px' }}>{selectedParty.phone}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Registered Address</label>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px' }}>{selectedParty.address || 'Dubai, UAE'}</div>
              </div>
            </div>

            {/* Financial Metrics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '30px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  <Wallet size={14} color="#64748b" /> Account Balance
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: selectedParty.balance >= 0 ? '#059669' : '#dc2626', marginTop: '6px' }} className="num-tabular">
                  AED {selectedParty.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  <ShieldCheck size={14} color="#64748b" /> Credit Limit
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginTop: '6px' }} className="num-tabular">
                  AED {selectedParty.creditLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Interactive Transaction History */}
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              Ledger Transactions & Associated Invoices
            </h4>

            <div style={{ flex: 1 }}>
              {(selectedParty.partyType === 'CUSTOMER' || selectedParty.partyType === 'BOTH') && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={12} /> Posted Sales Invoices ({getAssociatedInvoices(selectedParty).length})
                  </div>
                  {getAssociatedInvoices(selectedParty).length === 0 ? (
                    <div style={{ padding: '16px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '6px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '16px' }}>
                      No sales invoices recorded for this customer.
                    </div>
                  ) : (
                    <table className="table-enterprise" style={{ fontSize: '0.8rem', marginBottom: '20px' }}>
                      <thead>
                        <tr>
                          <th>Inv No</th>
                          <th>Date</th>
                          <th style={{ textAlign: 'right' }}>Total Cost</th>
                          <th style={{ textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getAssociatedInvoices(selectedParty).map(inv => (
                          <tr key={inv.invoiceId}>
                            <td style={{ fontWeight: 700, color: '#2563eb' }}>{inv.invoiceId}</td>
                            <td>{inv.issueDate}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }} className="num-tabular">AED {inv.grandTotal.toFixed(2)}</td>
                            <td style={{ textAlign: 'center' }}><span className="badge-status badge-status-green" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>{inv.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {(selectedParty.partyType === 'SUPPLIER' || selectedParty.partyType === 'BOTH') && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShoppingBag size={12} /> Posted Supplier Bills ({getAssociatedBills(selectedParty).length})
                  </div>
                  {getAssociatedBills(selectedParty).length === 0 ? (
                    <div style={{ padding: '16px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '6px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                      No purchase bills recorded for this supplier.
                    </div>
                  ) : (
                    <table className="table-enterprise" style={{ fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          <th>Bill ID</th>
                          <th>Supplier No</th>
                          <th>Date</th>
                          <th style={{ textAlign: 'right' }}>Payable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getAssociatedBills(selectedParty).map(bill => (
                          <tr key={bill.billId}>
                            <td style={{ fontWeight: 700, color: '#d97706' }}>{bill.billId}</td>
                            <td style={{ fontFamily: 'monospace' }}>{bill.supplierBillNumber}</td>
                            <td>{bill.billDate}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }} className="num-tabular">AED {bill.grandTotal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Add Party Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card-enterprise" style={{ width: '480px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="#2563eb" /> Add Client profile
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
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Classification Type</label>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Al Quoz, Dubai"
                    value={newPartyAddress}
                    onChange={(e) => setNewPartyAddress(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Credit Limit (AED)</label>
                  <input
                    type="number"
                    value={newPartyCreditLimit}
                    onChange={(e) => setNewPartyCreditLimit(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
