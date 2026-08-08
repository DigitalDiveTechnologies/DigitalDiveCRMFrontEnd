'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  BookOpen, 
  BarChart3, 
  ShoppingBag,
  Warehouse,
  Shield,
  ShieldAlert,
  Printer,
  FileCode,
  CheckCircle2,
  Lock,
  LogOut,
  Mail
} from 'lucide-react';
import { getActiveUserRole } from '@/lib/permissions';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  roles: string[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState('OWNER');
  const [orgName, setOrgName] = useState('FilsDesk ERP');

  useEffect(() => {
    setRole(getActiveUserRole());
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('user_session');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          if (parsed.tenantId === 'tenant-dxb-90210') {
            setOrgName('Al Futtaim Group');
          } else if (parsed.tenantId === 'tenant-default') {
            setOrgName('Al Serkal Group LLC');
          } else {
            setOrgName('Assigned Organization');
          }
        } catch (e) {}
      }
    }
  }, [pathname]);

  const allNavItems: NavItem[] = [
    // Core Online Modules
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['OWNER', 'ACCOUNTANT', 'BILLER_CASHIER', 'INVENTORY_MANAGER', 'AUDITOR'] },
    { name: 'POS Billing Counter', href: '/pos', icon: Printer, roles: ['OWNER', 'BILLER_CASHIER', 'ACCOUNTANT'] },
    { name: 'Sales & Invoices', href: '/invoices', icon: FileText, roles: ['OWNER', 'ACCOUNTANT', 'BILLER_CASHIER'] },
    { name: 'Parties & Customers', href: '/parties', icon: Users, roles: ['OWNER', 'ACCOUNTANT', 'BILLER_CASHIER'] },
    { name: 'Item Catalogue', href: '/items', icon: Package, roles: ['OWNER', 'ACCOUNTANT', 'INVENTORY_MANAGER', 'BILLER_CASHIER'] },
    
    // Operations
    { name: 'Purchases & Bills', href: '/purchases', icon: ShoppingBag, roles: ['OWNER', 'ACCOUNTANT'] },
    { name: 'Warehouse Stock', href: '/inventory', icon: Warehouse, roles: ['OWNER', 'INVENTORY_MANAGER', 'ACCOUNTANT'] },
    { name: 'Employees & Payroll', href: '/employees', icon: Users, roles: ['OWNER', 'ACCOUNTANT'] },

    // Financials
    { name: 'General Ledger', href: '/ledger', icon: BookOpen, roles: ['OWNER', 'ACCOUNTANT'] },
    { name: 'Financial Reports', href: '/reports', icon: BarChart3, roles: ['OWNER', 'ACCOUNTANT', 'AUDITOR'] },
    { name: 'E-Invoicing Gateway', href: '/compliance', icon: FileCode, roles: ['OWNER', 'ACCOUNTANT', 'AUDITOR'] },
    
    // Security & Admin
    { name: 'Email & SMTP Portal', href: '/email', icon: Mail, roles: ['OWNER'] },
    { name: 'Audit Logs', href: '/settings/audit', icon: ShieldAlert, roles: ['OWNER', 'AUDITOR'] },
    { name: 'Organizations & Access', href: '/settings/organizations', icon: Shield, roles: ['OWNER'] },
  ];

  const visibleNavItems = allNavItems.filter((item) => item.roles.includes(role));

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_session');
      localStorage.removeItem('active_user_role');
      window.location.href = '/login';
    }
  };

  return (
    <aside style={{
      width: '240px',
      background: '#1e293b',
      borderRight: '1px solid #334155',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      padding: '20px 14px',
      color: '#cbd5e1',
    }}>
      {/* Brand Header */}
      <div style={{ padding: '4px 8px 18px 8px', borderBottom: '1px solid #334155', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: '#2563eb',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.95rem',
          }}>
            FD
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em', lineHeight: '1.2' }}>
              {orgName}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <CheckCircle2 size={11} /> Cloud SaaS Active
            </div>
          </div>
        </div>
      </div>

      {/* Role-Filtered Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', padding: '4px 8px 6px 8px' }}>
          ONLINE NAVIGATION
        </div>

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '6px',
                color: isActive ? '#ffffff' : '#cbd5e1',
                background: isActive ? '#0f172a' : 'transparent',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.86rem',
              }}
            >
              <Icon size={16} color={isActive ? '#38bdf8' : '#94a3b8'} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Role & Sign Out */}
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{
          padding: '8px 12px',
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '6px',
          fontSize: '0.75rem',
          color: '#e2e8f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            {role === 'AUDITOR' ? <Lock size={12} color="#f59e0b" /> : <CheckCircle2 size={12} color="#10b981" />}
            <span>Active Role: {role.replace('_', ' ')}</span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '8px',
            background: 'transparent',
            border: '1px solid #334155',
            borderRadius: '6px',
            color: '#cbd5e1',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
