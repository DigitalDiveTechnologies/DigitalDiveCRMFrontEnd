'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Settings, Send, CheckCircle2, AlertCircle, Users, User, ArrowRight, Loader } from 'lucide-react';
import { api } from '@/lib/apiClient';

interface EmployeeItem {
  id: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  status: string;
}

export default function EmailPortalPage() {
  const [activeTab, setActiveTab] = useState<'smtp' | 'compose'>('compose');
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // SMTP state
  const [smtpHost, setSmtpHost] = useState('smtp.mailtrap.io');
  const [smtpPort, setSmtpPort] = useState(2525);
  const [smtpUser, setSmtpUser] = useState('mock-user');
  const [smtpPass, setSmtpPass] = useState('••••••••••••');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpFrom, setSmtpFrom] = useState('noreply@filsdesk.ae');
  const [smtpStatusMsg, setSmtpStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);

  // Compose State
  const [recipientType, setRecipientType] = useState<'individual' | 'multiple' | 'all'>('individual');
  const [selectedSingleEmployeeId, setSelectedSingleEmployeeId] = useState('');
  const [selectedMultipleIds, setSelectedMultipleIds] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<{ type: 'success' | 'error'; text: string; details?: any } | null>(null);

  useEffect(() => {
    loadEmployees();
    loadSmtpSettings();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const data = await api.getEmployees();
      const activeOnly = data.filter(e => e.status === 'ACTIVE');
      setEmployees(activeOnly);
      if (activeOnly.length > 0) {
        setSelectedSingleEmployeeId(activeOnly[0].id);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadSmtpSettings = async () => {
    try {
      const data = await api.getEmailSettings();
      if (data) {
        setSmtpHost(data.host || '');
        setSmtpPort(data.port || 2525);
        setSmtpUser(data.username || '');
        setSmtpPass(data.password || '••••••••••••');
        setSmtpSecure(data.secure || false);
        setSmtpFrom(data.fromEmail || '');
      }
    } catch (err) {
      console.error('Failed to load SMTP settings:', err);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSmtp(true);
      setSmtpStatusMsg(null);
      await api.saveEmailSettings({
        host: smtpHost,
        port: Number(smtpPort),
        username: smtpUser,
        password: smtpPass,
        secure: smtpSecure,
        fromEmail: smtpFrom,
      });
      setSmtpStatusMsg({ type: 'success', text: 'SMTP credentials updated successfully!' });
      // Re-load settings to reflect changes
      await loadSmtpSettings();
    } catch (err: any) {
      setSmtpStatusMsg({ type: 'error', text: `Failed to save credentials: ${err.message || err}` });
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleTestSmtp = async () => {
    try {
      setTestingSmtp(true);
      setSmtpStatusMsg(null);
      const result: any = await api.sendEmail({
        to: [smtpFrom],
        subject: 'FilsDesk SMTP Integration Verification Test',
        body: '<h3>FilsDesk Connection Test</h3><p>This email verifies that SMTP integration credentials have been set up successfully on FilsDesk!</p>',
      });
      if (result.success) {
        setSmtpStatusMsg({
          type: 'success',
          text: `Test successful! Connection is active (Mode: ${result.mode}). Check your mailbox or server logs.`,
        });
      }
    } catch (err: any) {
      setSmtpStatusMsg({ type: 'error', text: `SMTP connection test failed: ${err.message || err}` });
    } finally {
      setTestingSmtp(false);
    }
  };

  const toggleMultipleSelection = (id: string) => {
    if (selectedMultipleIds.includes(id)) {
      setSelectedMultipleIds(selectedMultipleIds.filter(item => item !== id));
    } else {
      setSelectedMultipleIds([...selectedMultipleIds, id]);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject || !emailBody) {
      setEmailStatusMsg({ type: 'error', text: 'Subject and body cannot be empty.' });
      return;
    }

    let recipientEmails: string[] = [];
    if (recipientType === 'individual') {
      const emp = employees.find(e => e.id === selectedSingleEmployeeId);
      if (emp) recipientEmails = [emp.email];
    } else if (recipientType === 'multiple') {
      recipientEmails = employees.filter(e => selectedMultipleIds.includes(e.id)).map(e => e.email);
    } else if (recipientType === 'all') {
      recipientEmails = employees.map(e => e.email);
    }

    if (recipientEmails.length === 0) {
      setEmailStatusMsg({ type: 'error', text: 'Please select at least one recipient.' });
      return;
    }

    try {
      setSendingEmail(true);
      setEmailStatusMsg(null);
      
      const result: any = await api.sendEmail({
        to: recipientEmails,
        subject: emailSubject,
        body: `<div>${emailBody.replace(/\n/g, '<br />')}</div>`,
      });

      if (result.success) {
        setEmailStatusMsg({
          type: 'success',
          text: `Emails successfully dispatched to ${recipientEmails.length} recipient(s)! (Delivery Mode: ${result.mode})`,
        });
        setEmailSubject('');
        setEmailBody('');
        setSelectedMultipleIds([]);
      }
    } catch (err: any) {
      setEmailStatusMsg({ type: 'error', text: `Failed to dispatch emails: ${err.message || err}` });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Communication & Email Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            Setup company SMTP mail servers, draft corporate emails, and dispatch bulk alerts to employee groups.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('compose')}
          style={{
            background: activeTab === 'compose' ? '#0f172a' : '#ffffff',
            color: activeTab === 'compose' ? '#ffffff' : '#475569',
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
          <Send size={15} /> Compose & Bulk Email
        </button>

        <button
          onClick={() => setActiveTab('smtp')}
          style={{
            background: activeTab === 'smtp' ? '#0f172a' : '#ffffff',
            color: activeTab === 'smtp' ? '#ffffff' : '#475569',
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
          <Settings size={15} /> SMTP Integration Setup
        </button>
      </div>

      {/* Main Container */}
      <div className="card-enterprise" style={{ background: '#ffffff', padding: '30px' }}>
        {/* Tab 1: Compose & Bulk Email */}
        {activeTab === 'compose' && (
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
              <Mail size={18} color="#2563eb" /> Draft New Email
            </h2>

            {emailStatusMsg && (
              <div style={{
                background: emailStatusMsg.type === 'success' ? '#ecfdf5' : '#fff5f5',
                border: `1px solid ${emailStatusMsg.type === 'success' ? '#a7f3d0' : '#feb2b2'}`,
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                color: emailStatusMsg.type === 'success' ? '#047857' : '#c53030',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {emailStatusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{emailStatusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSendEmail}>
              {/* Recipient Selection Tools */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Recipient Selection</label>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setRecipientType('individual')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: recipientType === 'individual' ? '#f0f6ff' : '#ffffff',
                      border: `1px solid ${recipientType === 'individual' ? '#3b82f6' : '#cbd5e1'}`,
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: recipientType === 'individual' ? '#1d4ed8' : '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <User size={14} /> Individual Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientType('multiple')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: recipientType === 'multiple' ? '#f0f6ff' : '#ffffff',
                      border: `1px solid ${recipientType === 'multiple' ? '#3b82f6' : '#cbd5e1'}`,
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: recipientType === 'multiple' ? '#1d4ed8' : '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Users size={14} /> Selected Employees
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientType('all')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: recipientType === 'all' ? '#f0f6ff' : '#ffffff',
                      border: `1px solid ${recipientType === 'all' ? '#3b82f6' : '#cbd5e1'}`,
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: recipientType === 'all' ? '#1d4ed8' : '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Users size={14} /> All Employees ({employees.length})
                  </button>
                </div>

                {/* Sub-selectors depending on type */}
                {recipientType === 'individual' && (
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>Select Recipient employee:</label>
                    {loadingEmployees ? (
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Loading employees...</div>
                    ) : (
                      <select
                        value={selectedSingleEmployeeId}
                        onChange={(e) => setSelectedSingleEmployeeId(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      >
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.designation}) — {emp.email}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {recipientType === 'multiple' && (
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', maxHeight: '200px', overflowY: 'auto' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>Check employees to receive email:</label>
                    {employees.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>No active employees found.</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {employees.map(emp => (
                          <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', padding: '6px 8px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={selectedMultipleIds.includes(emp.id)}
                              onChange={() => toggleMultipleSelection(emp.id)}
                            />
                            <div>
                              <div style={{ fontWeight: 600 }}>{emp.name}</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{emp.email}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {recipientType === 'all' && (
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px 16px', borderRadius: '8px', color: '#065f46', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span><strong>Bulk Dispatch Mode:</strong> The email will be sent to all <strong>{employees.length} active employee emails</strong> simultaneously.</span>
                  </div>
                )}
              </div>

              {/* Subject */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Subject Line *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Urgent Corporate Communication regarding VAT Filing"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              {/* Body Content */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Email Content (Text/HTML) *</label>
                <textarea
                  required
                  rows={8}
                  placeholder="Type your email body here. Standard spacing will be formatted as line breaks."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  style={{ width: '100%', padding: '14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.87rem', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="btn-primary"
                  style={{ padding: '10px 24px', fontSize: '0.9rem' }}
                >
                  {sendingEmail ? (
                    <>
                      <Loader size={16} className="animate-spin" /> Dispatching...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Send Email
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: SMTP Configuration */}
        {activeTab === 'smtp' && (
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>
              SMTP Server Settings
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '20px' }}>
              Define the default outbound server credentials for corporate emails, payslip alerts, and notifications.
            </p>

            {smtpStatusMsg && (
              <div style={{
                background: smtpStatusMsg.type === 'success' ? '#ecfdf5' : '#fff5f5',
                border: `1px solid ${smtpStatusMsg.type === 'success' ? '#a7f3d0' : '#feb2b2'}`,
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                color: smtpStatusMsg.type === 'success' ? '#047857' : '#c53030',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {smtpStatusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{smtpStatusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveSmtp}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>SMTP Host / Server *</label>
                  <input
                    type="text"
                    required
                    placeholder="smtp.example.com"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Port *</label>
                  <input
                    type="number"
                    required
                    placeholder="587"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Authentication Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="user@domain.com"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Password *</label>
                  <input
                    type="password"
                    required
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Sender From Address *</label>
                <input
                  type="email"
                  required
                  placeholder="noreply@domain.com"
                  value={smtpFrom}
                  onChange={(e) => setSmtpFrom(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={smtpSecure}
                    onChange={(e) => setSmtpSecure(e.target.checked)}
                  />
                  <span>Require Secure TLS/SSL Connection</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleTestSmtp}
                  disabled={testingSmtp}
                  className="btn-secondary"
                >
                  {testingSmtp ? 'Verifying Host...' : 'Test SMTP Connection'}
                </button>

                <button
                  type="submit"
                  disabled={savingSmtp}
                  className="btn-primary"
                >
                  {savingSmtp ? 'Saving Configuration...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
