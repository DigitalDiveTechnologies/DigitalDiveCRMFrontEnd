'use client';

import React, { useState } from 'react';
import { Plus, CheckCircle2, XCircle, Download, X } from 'lucide-react';
import { downloadCsv } from '@/lib/exportUtils';

interface RoleDefinition {
  roleName: string;
  code: string;
  description: string;
  sales: boolean;
  ledger: boolean;
  inventory: boolean;
  reports: boolean;
  usersConfig: boolean;
}

interface UserTeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  branch: string;
  status: string;
}

const roleDefinitions: RoleDefinition[] = [
  { roleName: 'Owner', code: 'OWNER', description: 'Full company access, configuration, users, reports, posting, subscription and branch control', sales: true, ledger: true, inventory: true, reports: true, usersConfig: true },
  { roleName: 'Secondary Admin', code: 'SECONDARY_ADMIN', description: 'Operational access according to assigned policies; cannot override owner-only security settings', sales: true, ledger: true, inventory: true, reports: true, usersConfig: true },
  { roleName: 'Biller / Cashier', code: 'BILLER_CASHIER', description: 'Create drafts and sales, collect permitted payments, view assigned stock; no general ledger access', sales: true, ledger: false, inventory: true, reports: false, usersConfig: false },
  { roleName: 'Accountant', code: 'ACCOUNTANT', description: 'Read financial records, post authorized adjustments, reconcile, close periods, export reports', sales: true, ledger: true, inventory: false, reports: true, usersConfig: false },
  { roleName: 'Inventory Manager', code: 'INVENTORY_MANAGER', description: 'Items, warehouses, stock counts, transfers and adjustments; no unrestricted ledger access', sales: false, ledger: false, inventory: true, reports: false, usersConfig: false },
  { roleName: 'Auditor (Optional)', code: 'AUDITOR', description: 'Read-only access to reports, journal history and audit logs', sales: false, ledger: false, inventory: false, reports: true, usersConfig: false },
];

const initialUsers: UserTeamMember[] = [
  { id: '1', name: 'Saeed Al Maktoum', email: 'saeed@alfuttaim.ae', role: 'ACCOUNTANT', branch: 'Dubai Mall Branch', status: 'Active' },
  { id: '2', name: 'Rashid Al Nuaimi', email: 'rashid@alfuttaim.ae', role: 'OWNER', branch: 'All Branches (HQ)', status: 'Active' },
  { id: '3', name: 'Tariq Mansoor', email: 'tariq@alfuttaim.ae', role: 'BILLER_CASHIER', branch: 'Dubai Mall Counter 1', status: 'Active' },
  { id: '4', name: 'Fatima Al Hamadi', email: 'fatima@alfuttaim.ae', role: 'INVENTORY_MANAGER', branch: 'Dubai Central Warehouse', status: 'Active' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<UserTeamMember[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form state
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('ACCOUNTANT');
  const [userBranch, setUserBranch] = useState('Dubai Mall Branch');

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail) return;

    const newUser: UserTeamMember = {
      id: String(Date.now()),
      name: userName,
      email: userEmail,
      role: userRole,
      branch: userBranch,
      status: 'Active',
    };

    setUsers([newUser, ...users]);
    setIsModalOpen(false);
    setUserName('');
    setUserEmail('');
  };

  const handleExportUsers = () => {
    downloadCsv(
      'UAE_Team_Users_RBAC_Directory.csv',
      ['User Name', 'Email', 'Assigned Role', 'Branch', 'Status'],
      users.map(u => [u.name, u.email, u.role, u.branch, u.status])
    );
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Team Users & Role-Based Access Control (RBAC)</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            Define company roles, fine-grained core permissions, and security policy scoping
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportUsers} className="btn-secondary">
            <Download size={14} /> Export Users (CSV)
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            <Plus size={16} /> Invite New User
          </button>
        </div>
      </div>

      {/* Invite New User Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card-enterprise" style={{ width: '480px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Invite Team Member</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Omar Al Hashimi"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="omar@company.ae"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Assigned Role</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', background: '#fff' }}
                  >
                    <option value="ACCOUNTANT">ACCOUNTANT</option>
                    <option value="BILLER_CASHIER">BILLER / CASHIER</option>
                    <option value="INVENTORY_MANAGER">INVENTORY MANAGER</option>
                    <option value="SECONDARY_ADMIN">SECONDARY ADMIN</option>
                    <option value="AUDITOR">AUDITOR</option>
                    <option value="OWNER">OWNER</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Assigned Branch</label>
                  <input
                    type="text"
                    value={userBranch}
                    onChange={(e) => setUserBranch(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Send Invitation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Definitions & Permissions Matrix */}
      <div className="card-enterprise" style={{ padding: '0', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-main)', fontWeight: 600, color: '#0f172a', background: '#f8fafc' }}>
          Role-Based Access Control (RBAC) Permission Matrix
        </div>
        <table className="table-enterprise">
          <thead>
            <tr>
              <th>Role Name</th>
              <th>Core Permissions & Access Boundaries</th>
              <th style={{ textAlign: 'center' }}>Sales/Billing</th>
              <th style={{ textAlign: 'center' }}>General Ledger</th>
              <th style={{ textAlign: 'center' }}>Inventory/Stock</th>
              <th style={{ textAlign: 'center' }}>Reports</th>
              <th style={{ textAlign: 'center' }}>User Config</th>
            </tr>
          </thead>
          <tbody>
            {roleDefinitions.map((r) => (
              <tr key={r.code}>
                <td>
                  <strong style={{ display: 'block', color: '#0f172a' }}>{r.roleName}</strong>
                  <span style={{ fontSize: '0.72rem', color: '#2563eb', fontFamily: 'monospace' }}>{r.code}</span>
                </td>
                <td style={{ fontSize: '0.82rem', color: '#475569', maxWidth: '340px' }}>{r.description}</td>
                <td style={{ textAlign: 'center' }}>
                  {r.sales ? <CheckCircle2 size={16} color="#059669" style={{ margin: '0 auto' }} /> : <XCircle size={16} color="#94a3b8" style={{ margin: '0 auto' }} />}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {r.ledger ? <CheckCircle2 size={16} color="#059669" style={{ margin: '0 auto' }} /> : <XCircle size={16} color="#94a3b8" style={{ margin: '0 auto' }} />}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {r.inventory ? <CheckCircle2 size={16} color="#059669" style={{ margin: '0 auto' }} /> : <XCircle size={16} color="#94a3b8" style={{ margin: '0 auto' }} />}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {r.reports ? <CheckCircle2 size={16} color="#059669" style={{ margin: '0 auto' }} /> : <XCircle size={16} color="#94a3b8" style={{ margin: '0 auto' }} />}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {r.usersConfig ? <CheckCircle2 size={16} color="#059669" style={{ margin: '0 auto' }} /> : <XCircle size={16} color="#94a3b8" style={{ margin: '0 auto' }} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Active Team Users Directory */}
      <div className="card-enterprise" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-main)', fontWeight: 600, color: '#0f172a' }}>
          Active Company Team Members
        </div>
        <table className="table-enterprise">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email Address</th>
              <th>Assigned Role</th>
              <th>Assigned Branch</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600, color: '#0f172a' }}>{u.name}</td>
                <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{u.email}</td>
                <td>
                  <span className="badge-status badge-status-blue">{u.role}</span>
                </td>
                <td style={{ fontSize: '0.82rem', color: '#334155' }}>{u.branch}</td>
                <td>
                  <span className="badge-status badge-status-green">{u.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
