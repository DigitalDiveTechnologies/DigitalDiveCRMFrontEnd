'use client';

import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, CheckCircle2, Loader } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Invalid credentials. Please check your email and password.');
      }

      const data = await response.json();
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_session', JSON.stringify({
          userId: data.userId,
          email: data.email,
          name: data.name,
          role: data.role,
          tenantId: data.tenantId,
          accessToken: data.accessToken,
        }));
        localStorage.setItem('active_user_role', data.role);
        window.location.href = '/';
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#faf9f5',
    }}>
      {/* ---- LEFT: Branding Panel ---- */}
      <div style={{
        background: '#1e293b',
        padding: '60px 48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#ffffff',
      }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            background: '#2563eb', color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '1.1rem',
          }}>FD</div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.01em' }}>FilsDesk</div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Cloud Accounting & POS Platform</div>
          </div>
        </div>

        {/* Features */}
        <div style={{ margin: '40px 0' }}>
          <div style={{
            display: 'inline-block', background: '#0f172a', border: '1px solid #334155',
            padding: '6px 14px', borderRadius: '6px', fontSize: '0.75rem',
            color: '#10b981', fontWeight: 600, marginBottom: '20px',
          }}>
            ✓ 100% Real-Time Cloud Connected
          </div>

          <h2 style={{ fontSize: '2.1rem', fontWeight: 700, lineHeight: '1.25', marginBottom: '16px' }}>
            Built for UAE Businesses
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.65', maxWidth: '440px', marginBottom: '32px' }}>
            Every user gets a focused workspace matching their daily role — Accountant, Cashier, or Owner — connected 100% online to your central database.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              'Automatic 5% UAE VAT calculation & FTA Form 201 returns',
              'POS receipts with your company logo & custom settings',
              'Instant cloud database sync across all branches',
            ].map((feat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                <CheckCircle2 size={15} color="#10b981" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', fontSize: '0.78rem', color: '#475569' }}>
          <span>FTA VAT 201 Ready</span>
          <span>•</span><span>Double-Entry Engine</span>
          <span>•</span><span>Multi-Branch Support</span>
        </div>
      </div>

      {/* ---- RIGHT: Login Form ---- */}
      <div style={{
        padding: '60px 48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: '#faf9f5',
      }}>
        <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
              Sign In
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Enter your account credentials to continue.
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '8px', padding: '12px 14px',
              fontSize: '0.85rem', color: '#dc2626',
              marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center',
            }}>
              ⚠ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="owner@yourcompany.ae"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px 10px 36px',
                    border: '1px solid #d1d5db', borderRadius: '8px',
                    fontSize: '0.9rem', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px 10px 36px',
                    border: '1px solid #d1d5db', borderRadius: '8px',
                    fontSize: '0.9rem', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                width: '100%', padding: '12px',
                background: isLoading ? '#3b82f6' : '#1e40af',
                color: '#ffffff', fontWeight: 700, fontSize: '0.92rem',
                border: 'none', borderRadius: '8px', cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s ease',
                marginTop: '4px',
              }}
            >
              {isLoading ? (
                <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing In...</>
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Hint */}
          <div style={{
            marginTop: '28px', padding: '14px', background: '#f0f9ff',
            border: '1px solid #bae6fd', borderRadius: '8px',
            fontSize: '0.8rem', color: '#0369a1', lineHeight: '1.6',
          }}>
            <strong>Default Owner Account:</strong><br />
            Email: <code>owner@digitaldive.ae</code><br />
            Password: <code>admin</code>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
