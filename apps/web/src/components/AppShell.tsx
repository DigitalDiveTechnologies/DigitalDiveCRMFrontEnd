'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/login';
  const [isSessionReady, setIsSessionReady] = useState(isLoginPage);

  useEffect(() => {
    if (isLoginPage) {
      setIsSessionReady(true);
      return;
    }

    const sessionRaw = localStorage.getItem('user_session');
    if (!sessionRaw) {
      setIsSessionReady(false);
      router.replace('/login');
      return;
    }

    try {
      const session = JSON.parse(sessionRaw);
      if (!session.userId || !session.accessToken || !session.tenantId) {
        throw new Error('Incomplete session');
      }
      setIsSessionReady(true);
    } catch {
      localStorage.removeItem('user_session');
      localStorage.removeItem('active_user_role');
      setIsSessionReady(false);
      router.replace('/login');
    }
  }, [isLoginPage, pathname, router]);

  if (isLoginPage) {
    return <main style={{ minHeight: '100vh', width: '100%' }}>{children}</main>;
  }

  if (!isSessionReady) {
    return (
      <main style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        color: '#475569',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}>
        Checking your session...
      </main>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header />
        <div style={{ flex: 1, padding: '32px' }}>{children}</div>
      </div>
    </div>
  );
}
