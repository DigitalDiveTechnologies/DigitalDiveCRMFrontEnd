'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, Building, GitBranch, X, Plus, Check, Shield, LogOut, User } from 'lucide-react';
import { api } from '@/lib/apiClient';

export default function Header() {
  const router = useRouter();

  const [orgName, setOrgName] = useState('');
  const [trnNumber, setTrnNumber] = useState('');
  const [activeBranch, setActiveBranch] = useState('');
  const [tenantId, setTenantId] = useState('');

  // User session state
  const [userName, setUserName] = useState('Logged User');
  const [userEmail, setUserEmail] = useState('user@company.ae');
  const [currentRole, setCurrentRole] = useState<'OWNER' | 'ACCOUNTANT' | 'BILLER_CASHIER' | 'INVENTORY_MANAGER' | 'AUDITOR' | 'SECONDARY_ADMIN'>('OWNER');

  // Modals state
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Form states
  const [tempOrgName, setTempOrgName] = useState('');
  const [tempTrnNumber, setTempTrnNumber] = useState('');
  const [newBranchName, setNewBranchName] = useState('');

  const [branchesList, setBranchesList] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sessionRaw = localStorage.getItem('user_session');
      if (sessionRaw) {
        try {
          const session = JSON.parse(sessionRaw);
          setUserName(session.name || 'Logged User');
          setUserEmail(session.email || 'user@company.ae');
          setCurrentRole(session.role || 'OWNER');

          // Load saved org/branch from localStorage first (fast, no flicker)
          const savedOrg = localStorage.getItem('org_name');
          const savedTrn = localStorage.getItem('org_trn');
          const savedBranch = localStorage.getItem('active_branch');

          if (savedOrg) setOrgName(savedOrg);
          if (savedTrn) setTrnNumber(savedTrn);
          if (savedBranch) setActiveBranch(savedBranch);

          // Then fetch from backend if tenantId exists
          if (session.tenantId) {
            setTenantId(session.tenantId);
            api.getTenants()
              .then((tenants: any[]) => {
                if (!tenants || tenants.length === 0) return;
                const myTenant = tenants.find((t: any) => t.id === session.tenantId) || tenants[0];
                if (myTenant) {
                  const name = myTenant.name || myTenant.companyName || myTenant.organizationName || savedOrg || 'My Organization';
                  const trn = myTenant.trn || myTenant.trnNumber || savedTrn || '';
                  setOrgName(name);
                  setTrnNumber(trn);
                  localStorage.setItem('org_name', name);
                  if (trn) localStorage.setItem('org_trn', trn);
                }
              })
              .catch(() => {
                if (!savedOrg) setOrgName('My Organization');
              });

            // Fetch real branches list
            api.getBranches(session.tenantId)
              .then((branches) => {
                setBranchesList(branches || []);
                const savedBranch = localStorage.getItem('active_branch');
                if (!savedBranch && branches && branches.length > 0) {
                  setActiveBranch(branches[0].name);
                  localStorage.setItem('active_branch', branches[0].name);
                }
              })
              .catch(err => console.error('Failed to load branches', err));
          } else {
            if (!savedOrg) setOrgName('My Organization');
          }

          if (!savedBranch) setActiveBranch('Head Office');
        } catch (e) {
          setOrgName('My Organization');
          setActiveBranch('Head Office');
        }
      } else {
        setOrgName('My Organization');
        setActiveBranch('Head Office');
      }
    }
  }, []);

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_session');
      localStorage.removeItem('active_user_role');
      localStorage.removeItem('org_name');
      localStorage.removeItem('org_trn');
      localStorage.removeItem('active_branch');
      window.location.href = '/login';
    }
  };

  const handleSaveOrgSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempOrgName) {
      setOrgName(tempOrgName);
      setTrnNumber(tempTrnNumber);
      localStorage.setItem('org_name', tempOrgName);
      if (tempTrnNumber) localStorage.setItem('org_trn', tempTrnNumber);
      setIsOrgModalOpen(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newBranchName && tenantId) {
      try {
        const branchCode = 'BR-' + Date.now().toString().slice(-4);
        const saved = await api.createBranch(tenantId, {
          name: newBranchName,
          code: branchCode,
          location: 'Dubai, UAE',
        });
        setBranchesList(prev => [...prev, saved]);
        setActiveBranch(saved.name);
        localStorage.setItem('active_branch', saved.name);
        setNewBranchName('');
        setIsBranchModalOpen(false);
      } catch (err) {
        console.error('Failed to create branch', err);
      }
    }
  };

  return (
    <header style={{
      height: '56px',
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* Interactive Breadcrumb Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
        <span style={{ color: '#64748b' }}>Organization</span>
        <span style={{ color: '#cbd5e1' }}>/</span>

        {/* Interactive Tenant / Organization Button */}
        <button
          onClick={() => { setTempOrgName(orgName); setTempTrnNumber(trnNumber); setIsOrgModalOpen(true); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            padding: '3px 8px',
            borderRadius: '4px',
            color: '#0f172a',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
          title="Click to edit Organization details or switch tenant"
        >
          <Building size={13} color="#2563eb" />
          <span>{orgName}</span>
          <ChevronDown size={12} color="#64748b" />
        </button>

        <span style={{ color: '#cbd5e1' }}>/</span>

        {/* Interactive Branch Switcher Button */}
        <button
          onClick={() => setIsBranchModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            padding: '3px 8px',
            borderRadius: '4px',
            color: '#047857',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
          title="Click to switch active branch or create a new branch"
        >
          <GitBranch size={13} color="#059669" />
          <span>{activeBranch}</span>
          <ChevronDown size={12} color="#059669" />
        </button>
      </div>

      {/* Organization Settings Modal */}
      {isOrgModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card-enterprise" style={{ width: '460px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={18} color="#2563eb" /> Organization & Tenant Profile
              </h3>
              <button onClick={() => setIsOrgModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOrgSettings}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Legal Business / Organization Name *</label>
                <input
                  type="text"
                  required
                  value={tempOrgName}
                  onChange={(e) => setTempOrgName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>UAE Tax Registration Number (15 Digits TRN)</label>
                <input
                  type="text"
                  value={tempTrnNumber}
                  onChange={(e) => setTempTrnNumber(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setIsOrgModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Organization</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Switch Branch Modal */}
      {isBranchModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card-enterprise" style={{ width: '460px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GitBranch size={18} color="#059669" /> Switch Active Branch
              </h3>
              <button onClick={() => setIsBranchModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {branchesList.map((b) => {
                const isSelected = activeBranch === b.name;
                return (
                  <button
                    key={b.id}
                    onClick={() => { setActiveBranch(b.name); localStorage.setItem('active_branch', b.name); setIsBranchModalOpen(false); }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: isSelected ? '1px solid #059669' : '1px solid #e2e8f0',
                      background: isSelected ? '#ecfdf5' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.88rem', color: isSelected ? '#047857' : '#0f172a' }}>{b.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Code: {b.code}</span>
                    </div>
                    {isSelected && <Check size={16} color="#059669" />}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleCreateBranch} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Create & Switch to New Branch</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. Sharjah City Centre Branch"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '8px 14px' }}>
                  <Plus size={14} /> Add Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Right Header Utilities: Search, User Profile & Sign Out */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          padding: '6px 12px',
          borderRadius: '6px',
          width: '220px',
        }}>
          <Search size={14} color="#64748b" />
          <input
            type="text"
            placeholder="Search records (⌘K)"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '0.82rem',
              color: '#0f172a',
              width: '100%',
            }}
          />
        </div>

        {/* Authenticated User Menu Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: currentRole === 'AUDITOR' ? '#d97706' : '#2563eb',
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {userName.charAt(0)}
            </div>
            <div style={{ textAlign: 'left', lineHeight: '1.1' }}>
              <strong style={{ display: 'block', fontSize: '0.78rem', color: '#0f172a' }}>{userName}</strong>
              <span style={{ fontSize: '0.68rem', color: currentRole === 'AUDITOR' ? '#d97706' : '#2563eb', fontWeight: 600 }}>{currentRole}</span>
            </div>
            <ChevronDown size={12} color="#64748b" />
          </button>

          {isUserMenuOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '38px',
              width: '220px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              padding: '8px',
              zIndex: 50,
            }}>
              <div style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', marginBottom: '6px' }}>
                <strong style={{ display: 'block', fontSize: '0.82rem', color: '#0f172a' }}>{userName}</strong>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{userEmail}</span>
                <span className={currentRole === 'AUDITOR' ? 'badge-status badge-status-amber' : 'badge-status badge-status-blue'} style={{ marginTop: '4px', display: 'inline-block' }}>
                  Role: {currentRole}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  borderRadius: '6px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <LogOut size={14} /> Sign Out of Account
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
