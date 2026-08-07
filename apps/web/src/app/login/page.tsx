'use client';

import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  Building, 
  Globe, 
  User, 
  FileText, 
  Printer, 
  Warehouse,
  CheckCircle2
} from 'lucide-react';

interface RoleOption {
  role: string;
  label: string;
  name: string;
  desc: string;
  color: string;
  icon: any;
  email: string;
}

const roleOptions: RoleOption[] = [
  { role: 'OWNER', label: 'Owner / Admin', name: 'Rashid Al Nuaimi', desc: 'Full platform access & company management', color: '#1e293b', icon: User, email: 'owner@alfuttaim.ae' },
  { role: 'ACCOUNTANT', label: 'Accountant', name: 'Saeed Al Maktoum', desc: 'General ledger, purchases & VAT returns', color: '#0284c7', icon: FileText, email: 'accountant@alfuttaim.ae' },
  { role: 'BILLER_CASHIER', label: 'Biller / Cashier', name: 'Tariq Mansoor', desc: 'POS billing counter & retail sales invoices only', color: '#059669', icon: Printer, email: 'biller@alfuttaim.ae' },
  { role: 'INVENTORY_MANAGER', label: 'Inventory Manager', name: 'Hamdan Al Hamadi', desc: 'Warehouse stock levels & SKU catalogue only', color: '#6d28d9', icon: Warehouse, email: 'inventory@alfuttaim.ae' },
  { role: 'AUDITOR', label: 'Auditor', name: 'Fatima Al Mansoori', desc: 'Read-only audit trail & VAT compliance', color: '#d97706', icon: ShieldCheck, email: 'auditor@alfuttaim.ae' },
];

export default function CleanFlatLoginPage() {
  const [selectedRole, setSelectedRole] = useState<RoleOption>(roleOptions[0]);
  const [email, setEmail] = useState(roleOptions[0].email);
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectRole = (opt: RoleOption) => {
    setSelectedRole(opt);
    setEmail(opt.email);
  };

  const performLogin = (opt: RoleOption) => {
    setIsLoading(true);

    const sessionData = {
      userId: `usr-${Date.now()}`,
      email: opt.email,
      name: opt.name,
      role: opt.role,
      tenantId: 'tenant-dxb-90210',
      accessToken: `jwt-bearer-signed-${Date.now()}`,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('user_session', JSON.stringify(sessionData));
      localStorage.setItem('active_user_role', sessionData.role);
      setTimeout(() => {
        window.location.href = '/';
      }, 350);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(selectedRole);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#faf9f5',
    }}>
      {/* ---------------- LEFT HALF: CLEAN FLAT ENTERPRISE SHOWCASE ---------------- */}
      <div style={{
        background: '#1e293b',
        borderRight: '1px solid #334155',
        padding: '60px 48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#ffffff',
      }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            background: '#2563eb',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1.1rem',
          }}>
            FD
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>FilsDesk</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>100% Online Cloud Accounting & POS Platform</div>
          </div>
        </div>

        {/* Center Overview */}
        <div style={{ margin: '40px 0' }}>
          <div style={{
            display: 'inline-block',
            background: '#0f172a',
            border: '1px solid #334155',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '0.78rem',
            color: '#10b981',
            fontWeight: 600,
            marginBottom: '20px',
          }}>
            100% Real-Time Cloud Server Connected
          </div>

          <h2 style={{ fontSize: '2.2rem', fontWeight: 700, color: '#ffffff', lineHeight: '1.25', marginBottom: '16px' }}>
            Simple, Intuitive Online ERP
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '460px', marginBottom: '32px' }}>
            Every user gets a simple, focused workspace matching their daily role — connected 100% online to your central database.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              'Clean screens customized for cashiers, stock managers, and accountants',
              'Automatic 5% UAE VAT calculation & FTA Form 201 returns',
              'Instant cloud database persistence across all branches',
            ].map((feat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem', color: '#cbd5e1' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: '#64748b' }}>
          <span>FTA VAT 201 Ready</span>
          <span>•</span>
          <span>Double-Entry Engine</span>
          <span>•</span>
          <span>100% Online Cloud</span>
        </div>
      </div>

      {/* ---------------- RIGHT HALF: ROLE SELECTOR & SIGN IN ---------------- */}
      <div style={{
        padding: '50px 48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: '#faf9f5',
        overflowY: 'auto',
      }}>
        <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b' }}>
              Sign In to FilsDesk
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>
              Select your role below to open your online cloud workspace:
            </p>
          </div>

          {/* 1-Click Role Quick Selection Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {roleOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedRole.role === opt.role;
              return (
                <div
                  key={opt.role}
                  onClick={() => handleSelectRole(opt)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: isSelected ? `2px solid ${opt.color}` : '1px solid #cbd5e1',
                    background: isSelected ? '#ffffff' : '#faf9f5',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '6px',
                      background: isSelected ? opt.color : '#e2e8f0',
                      color: isSelected ? '#ffffff' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#1e293b' }}>{opt.label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{opt.desc}</div>
                    </div>
                  </div>

                  <input
                    type="radio"
                    name="roleSelection"
                    checked={isSelected}
                    onChange={() => handleSelectRole(opt)}
                    style={{ accentColor: opt.color, width: '16px', height: '16px' }}
                  />
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => performLogin(selectedRole)}
            disabled={isLoading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              justifyContent: 'center',
              fontSize: '0.92rem',
              borderRadius: '8px',
              fontWeight: 700,
              background: selectedRole.color,
              borderColor: selectedRole.color,
            }}
          >
            {isLoading ? 'Opening Cloud Workspace...' : `Sign In as ${selectedRole.label}`} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
