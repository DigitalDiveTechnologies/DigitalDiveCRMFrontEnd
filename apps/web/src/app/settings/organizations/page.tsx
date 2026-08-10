'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Shield, Plus, Key, CheckCircle2, AlertCircle, Users, LayoutGrid, X, Loader, Globe, ArrowRight } from 'lucide-react';
import { api } from '@/lib/apiClient';

interface TenantItem {
  id: string;
  companyName: string;
  trn: string;
  baseCurrency: string;
  isActive: boolean;
  createdAt: string;
}

interface BranchItem {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  location: string;
  isActive: boolean;
}

interface UserLoginItem {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  branchId: string;
  password?: string;
  isActive?: boolean;
}

export default function OrganizationsAdminPage() {
  const [activeTab, setActiveTab] = useState<'tenants' | 'branches' | 'users'>('tenants');
  
  // Data States
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [users, setUsers] = useState<UserLoginItem[]>([]);
  
  // Selection and Loading states
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedDetailUser, setSelectedDetailUser] = useState<UserLoginItem | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'tenant' | 'branch' | 'user'>('tenant');

  // Form: Tenant
  const [tenantName, setTenantName] = useState('');
  const [tenantTrn, setTenantTrn] = useState('');
  const [tenantCurrency, setTenantCurrency] = useState('AED');

  // Form: Branch
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchLocation, setBranchLocation] = useState('');

  // Form: User Access
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('ACCOUNTANT');
  const [userTenantId, setUserTenantId] = useState('');
  const [userBranchId, setUserBranchId] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const tenantData = await api.getTenants();
      setTenants(tenantData || []);

      if (tenantData && tenantData.length > 0) {
        const initialTenant = tenantData[0].id;
        setSelectedTenantId(initialTenant);
        setUserTenantId(initialTenant);
        
        // Load branches for initial tenant
        const branchData = await api.getBranches(initialTenant);
        setBranches(branchData || []);
        if (branchData && branchData.length > 0) {
          setUserBranchId(branchData[0].id);
        }
      }

      const userData = await api.getSystemUsers();
      setUsers(userData || []);
    } catch (e: any) {
      console.error('Failed to load multi-tenancy mappings:', e);
      setNotification({ type: 'error', message: 'Failed to connect to Multi-Tenancy API.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTenantChange = async (tenantId: string) => {
    setSelectedTenantId(tenantId);
    try {
      const branchData = await api.getBranches(tenantId);
      setBranches(branchData || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUserTenantChange = async (tenantId: string) => {
    setUserTenantId(tenantId);
    try {
      const branchData = await api.getBranches(tenantId);
      if (branchData && branchData.length > 0) {
        setUserBranchId(branchData[0].id);
      } else {
        setUserBranchId('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenModal = (type: typeof modalType) => {
    setModalType(type);
    setIsModalOpen(true);
    
    // Clear forms
    setTenantName('');
    setTenantTrn('');
    setBranchName('');
    setBranchCode('');
    setBranchLocation('');
    setUserName('');
    setUserEmail('');
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName) return;

    try {
      const newTenant = await api.createTenant({
        companyName: tenantName,
        trn: tenantTrn,
        baseCurrency: tenantCurrency,
      });

      setTenants([...tenants, newTenant]);
      setNotification({ type: 'success', message: `Organization "${newTenant.companyName}" successfully established.` });
      setIsModalOpen(false);
    } catch (err: any) {
      setNotification({ type: 'error', message: `Creation failed: ${err.message || err}` });
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName || !branchCode) return;

    try {
      const newBranch = await api.createBranch(selectedTenantId, {
        name: branchName,
        code: branchCode,
        location: branchLocation,
      });

      setBranches([...branches, newBranch]);
      setNotification({ type: 'success', message: `Branch "${newBranch.name}" created under organization.` });
      setIsModalOpen(false);
    } catch (err: any) {
      setNotification({ type: 'error', message: `Creation failed: ${err.message || err}` });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail || !userTenantId) return;

    try {
      const newUser = await api.createSystemUser({
        name: userName,
        email: userEmail,
        role: userRole,
        tenantId: userTenantId,
        branchId: userBranchId || 'b-default',
      });

      setUsers([...users, newUser]);
      setNotification({ type: 'success', message: `User "${newUser.name}" created and assigned to Organization.` });
      setIsModalOpen(false);
    } catch (err: any) {
      setNotification({ type: 'error', message: `Registration failed: ${err.message || err}` });
    }
  };

  const handleDeleteTenant = async (id: string) => {
    if (!confirm('Warning: Deleting this organization will permanently delete all associated branches, inventories, and users! Proceed?')) return;
    try {
      await api.deleteTenant(id);
      setTenants(tenants.filter(t => t.id !== id));
      setNotification({ type: 'success', message: 'Organization successfully deleted.' });
    } catch (err: any) {
      setNotification({ type: 'error', message: `Delete failed: ${err.message || err}` });
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this operational branch?')) return;
    try {
      await api.deleteBranch(id);
      setBranches(branches.filter(b => b.id !== id));
      setNotification({ type: 'success', message: 'Branch successfully deleted.' });
    } catch (err: any) {
      setNotification({ type: 'error', message: `Delete failed: ${err.message || err}` });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to revoke system access for this user?')) return;
    try {
      await api.deleteSystemUser(id);
      setUsers(users.filter(u => u.id !== id));
      setNotification({ type: 'success', message: 'User access successfully revoked.' });
    } catch (err: any) {
      setNotification({ type: 'error', message: `Revocation failed: ${err.message || err}` });
    }
  };

  const getTenantName = (id: string) => {
    const tenant = tenants.find(t => t.id === id);
    return tenant ? tenant.companyName : id;
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Organizations & Access Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            Multi-Tenant Administration: Establish corporate tenants, launch local branches, and assign employee memberships.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'tenants' && (
            <button onClick={() => handleOpenModal('tenant')} className="btn-primary">
              <Plus size={16} /> Create Organization (Tenant)
            </button>
          )}
          {activeTab === 'branches' && (
            <button onClick={() => handleOpenModal('branch')} className="btn-primary" disabled={!selectedTenantId}>
              <Plus size={16} /> Create Branch
            </button>
          )}
          {activeTab === 'users' && (
            <button onClick={() => handleOpenModal('user')} className="btn-primary">
              <Plus size={16} /> Assign Employee System Access
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div style={{
          background: notification.type === 'success' ? '#ecfdf5' : '#fff5f5',
          border: `1px solid ${notification.type === 'success' ? '#a7f3d0' : '#feb2b2'}`,
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          color: notification.type === 'success' ? '#047857' : '#c53030',
          fontSize: '0.85rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('tenants')}
          style={{
            background: activeTab === 'tenants' ? '#0f172a' : '#ffffff',
            color: activeTab === 'tenants' ? '#ffffff' : '#475569',
            border: '1px solid #cbd5e1',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Building2 size={15} /> Organizations (Tenants)
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          style={{
            background: activeTab === 'branches' ? '#0f172a' : '#ffffff',
            color: activeTab === 'branches' ? '#ffffff' : '#475569',
            border: '1px solid #cbd5e1',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <LayoutGrid size={15} /> Operational Branches
        </button>

        <button
          onClick={() => setActiveTab('users')}
          style={{
            background: activeTab === 'users' ? '#0f172a' : '#ffffff',
            color: activeTab === 'users' ? '#ffffff' : '#475569',
            border: '1px solid #cbd5e1',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Key size={15} /> User Access Mappings
        </button>
      </div>

      {/* Tab Content Panes */}
      <div className="card-enterprise" style={{ padding: '0', overflow: 'hidden', background: '#ffffff' }}>
        
        {/* Pane 1: Tenants List */}
        {activeTab === 'tenants' && (
          <div>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading tenants list...</div>
            ) : tenants.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No corporate tenants registered.</div>
            ) : (
              <table className="table-enterprise">
                <thead>
                  <tr>
                    <th>Organization / Tenant Name</th>
                    <th>Tenant ID</th>
                    <th>UAE TRN</th>
                    <th>Currency</th>
                    <th>Status</th>
                    <th>Date Registered</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{t.companyName}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>{t.id}</td>
                      <td style={{ fontFamily: 'monospace' }}>{t.trn}</td>
                      <td style={{ fontWeight: 600 }}>{t.baseCurrency}</td>
                      <td>
                        <span className="badge-status badge-status-green">ACTIVE</span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => handleDeleteTenant(t.id)}
                          style={{
                            border: 'none',
                            background: '#fee2e2',
                            color: '#dc2626',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Pane 2: Branches List */}
        {activeTab === 'branches' && (
          <div>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Select Tenant Context:</span>
              <select
                value={selectedTenantId}
                onChange={(e) => handleTenantChange(e.target.value)}
                style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', color: '#1e293b', fontWeight: 500 }}
              >
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.companyName}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading branch networks...</div>
            ) : branches.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No branches operational under this tenant yet.</div>
            ) : (
              <table className="table-enterprise">
                <thead>
                  <tr>
                    <th>Branch Name</th>
                    <th>Branch Code</th>
                    <th>Location / Address</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{b.name}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>{b.code}</td>
                      <td style={{ color: '#475569' }}>{b.location}</td>
                      <td>
                        <span className="badge-status badge-status-green">ACTIVE</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => handleDeleteBranch(b.id)}
                          style={{
                            border: 'none',
                            background: '#fee2e2',
                            color: '#dc2626',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Pane 3: Access List */}
        {activeTab === 'users' && (
          <div>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading access controls...</div>
            ) : users.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No login users configured in database.</div>
            ) : (
              <table className="table-enterprise">
                <thead>
                  <tr>
                    <th>Login User Details</th>
                    <th>User ID</th>
                    <th>System Role</th>
                    <th>Assigned Organization</th>
                    <th>Assigned Branch</th>
                    <th>Access Scope</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>{u.id}</td>
                      <td>
                        <span className={`badge-status ${u.role === 'OWNER' ? 'badge-status-blue' : 'badge-status-amber'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#059669' }}>{getTenantName(u.tenantId)}</td>
                      <td style={{ fontFamily: 'monospace' }}>{u.branchId}</td>
                      <td style={{ fontSize: '0.8rem', color: '#475569' }}>
                        {u.role === 'OWNER' && 'Full Tenant Settings'}
                        {u.role === 'ACCOUNTANT' && 'General Ledger & Financials'}
                        {u.role === 'BILLER_CASHIER' && 'Billing Counter Only'}
                        {u.role === 'AUDITOR' && 'Read-Only Audits'}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => setSelectedDetailUser(u)}
                          style={{
                            border: 'none',
                            background: '#eff6ff',
                            color: '#2563eb',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginRight: '8px',
                          }}
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          style={{
                            border: 'none',
                            background: '#fee2e2',
                            color: '#dc2626',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          disabled={u.email === 'owner@digitaldive.ae'}
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* CREATE MODALS */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card-enterprise" style={{ width: '480px', maxWidth: '90%' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} color="#2563eb" />
                {modalType === 'tenant' && 'Create Corporate Tenant'}
                {modalType === 'branch' && 'Launch Local Branch'}
                {modalType === 'user' && 'Add Employee Access'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            {/* Form: Tenant */}
            {modalType === 'tenant' && (
              <form onSubmit={handleCreateTenant}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Organization Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Al Futtaim Auto LLC"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>15-Digit UAE TRN</label>
                  <input
                    type="text"
                    placeholder="e.g. 100123456700003"
                    value={tenantTrn}
                    onChange={(e) => setTenantTrn(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', fontFamily: 'monospace' }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Base Currency</label>
                  <select
                    value={tenantCurrency}
                    onChange={(e) => setTenantCurrency(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    <option value="AED">AED (United Arab Emirates Dirham)</option>
                    <option value="USD">USD (US Dollar)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Establish Organization</button>
                </div>
              </form>
            )}

            {/* Form: Branch */}
            {modalType === 'branch' && (
              <form onSubmit={handleCreateBranch}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Branch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jumeirah Boutique Branch"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Branch Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DXB-09"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', fontFamily: 'monospace' }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Location / Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Jumeirah Road, Dubai"
                    value={branchLocation}
                    onChange={(e) => setBranchLocation(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Launch Branch</button>
                </div>
              </form>
            )}

            {/* Form: User Assignment */}
            {modalType === 'user' && (
              <form onSubmit={handleCreateUser}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Employee / User Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Salim Al Mansoor"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Login Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="salim@company.ae"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>System Access Role</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    <option value="OWNER">Owner / Full Access</option>
                    <option value="SECONDARY_ADMIN">Secondary Admin</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="BILLER_CASHIER">Biller / Cashier</option>
                    <option value="INVENTORY_MANAGER">Inventory Manager</option>
                    <option value="AUDITOR">Auditor</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Assign Organization *</label>
                    <select
                      value={userTenantId}
                      onChange={(e) => handleUserTenantChange(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                    >
                      {tenants.map(t => (
                        <option key={t.id} value={t.id}>{t.companyName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Assign Branch</label>
                    <select
                      value={userBranchId}
                      onChange={(e) => setUserBranchId(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                      {branches.length === 0 && (
                        <option value="b-default">Corporate HQ</option>
                      )}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Register & Bind User</button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* USER DETAIL MODAL */}
      {selectedDetailUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card-enterprise" style={{ width: '500px', maxWidth: '90%' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#2563eb" /> Employee Access Details
              </h3>
              <button onClick={() => setSelectedDetailUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              
              {/* Profile Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.2rem'
                }}>
                  {selectedDetailUser.name.charAt(0)}
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>{selectedDetailUser.name}</h4>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{selectedDetailUser.email}</span>
                </div>
              </div>

              {/* Detail fields */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 0', color: '#64748b', fontWeight: 600, width: '150px' }}>User ID</td>
                    <td style={{ padding: '8px 0', fontFamily: 'monospace', color: '#0f172a' }}>{selectedDetailUser.id}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', color: '#64748b', fontWeight: 600 }}>System Role</td>
                    <td style={{ padding: '8px 0' }}>
                      <select
                        value={selectedDetailUser.role}
                        onChange={async (e) => {
                          const newRole = e.target.value;
                          try {
                            await api.updateSystemUser(selectedDetailUser.id, { role: newRole });
                            setUsers(users.map(u => u.id === selectedDetailUser.id ? { ...u, role: newRole } : u));
                            setSelectedDetailUser({ ...selectedDetailUser, role: newRole });
                            setNotification({ type: 'success', message: `User "${selectedDetailUser.name}" role updated to ${newRole}.` });
                          } catch (err: any) {
                            alert(`Failed to update role: ${err.message || err}`);
                          }
                        }}
                        style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', background: '#ffffff', fontWeight: 600, color: '#0f172a' }}
                        disabled={selectedDetailUser.email === 'owner@digitaldive.ae'}
                      >
                        <option value="OWNER">Owner / Full Access</option>
                        <option value="SECONDARY_ADMIN">Secondary Admin</option>
                        <option value="ACCOUNTANT">Accountant</option>
                        <option value="BILLER_CASHIER">Biller / Cashier</option>
                        <option value="INVENTORY_MANAGER">Inventory Manager</option>
                        <option value="AUDITOR">Auditor</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', color: '#64748b', fontWeight: 600 }}>Corporate Tenant</td>
                    <td style={{ padding: '8px 0', fontWeight: 600, color: '#0f172a' }}>{getTenantName(selectedDetailUser.tenantId)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', color: '#64748b', fontWeight: 600 }}>Active Branch ID</td>
                    <td style={{ padding: '8px 0', fontFamily: 'monospace', color: '#0f172a' }}>{selectedDetailUser.branchId}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', color: '#64748b', fontWeight: 600 }}>Access Password</td>
                    <td style={{ padding: '8px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#d97706', fontWeight: 700, background: '#fffbeb', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fef3c7' }}>
                          {selectedDetailUser.password || 'admin'}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedDetailUser.password || 'admin');
                            alert('Password copied to clipboard!');
                          }}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            color: '#475569',
                            fontWeight: 600
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', color: '#64748b', fontWeight: 600 }}>Login Status</td>
                    <td style={{ padding: '8px 0' }}>
                      <span className={`badge-status ${selectedDetailUser.isActive !== false ? 'badge-status-emerald' : 'badge-status-rose'}`}>
                        {selectedDetailUser.isActive !== false ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Status Actions */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.82rem', color: '#0f172a' }}>Administrative Control</strong>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Temporarily block or restore employee's portal access.</span>
                </div>
                
                <button
                  onClick={async () => {
                    const newStatus = selectedDetailUser.isActive === false;
                    try {
                      await api.updateSystemUser(selectedDetailUser.id, { isActive: newStatus });
                      setUsers(users.map(u => u.id === selectedDetailUser.id ? { ...u, isActive: newStatus } : u));
                      setSelectedDetailUser({ ...selectedDetailUser, isActive: newStatus });
                      setNotification({ type: 'success', message: `User "${selectedDetailUser.name}" has been ${newStatus ? 'activated' : 'deactivated'}.` });
                    } catch (err: any) {
                      alert(`Failed to update status: ${err.message || err}`);
                    }
                  }}
                  className={selectedDetailUser.isActive !== false ? 'btn-secondary' : 'btn-primary'}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: selectedDetailUser.isActive !== false ? '#fee2e2' : '#059669',
                    color: selectedDetailUser.isActive !== false ? '#dc2626' : '#ffffff',
                    border: 'none',
                    borderRadius: '6px'
                  }}
                  disabled={selectedDetailUser.email === 'owner@digitaldive.ae'}
                >
                  {selectedDetailUser.isActive !== false ? 'Deactivate User' : 'Activate User'}
                </button>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
              <button onClick={() => setSelectedDetailUser(null)} className="btn-primary" style={{ padding: '8px 16px' }}>
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
