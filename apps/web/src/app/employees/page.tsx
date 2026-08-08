'use client';

import React, { useState, useEffect } from 'react';
import { Users, FileText, Plus, Search, Edit2, Trash2, Mail, CheckCircle2, AlertCircle, X, Loader, DollarSign, Send } from 'lucide-react';
import { api } from '@/lib/apiClient';

interface EmployeeItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  joinDate: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function EmployeesPage() {
  const [activeTab, setActiveTab] = useState<'registry' | 'payroll'>('registry');
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Payroll period states
  const [payMonth, setPayMonth] = useState('August');
  const [payYear, setPayYear] = useState(2026);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [payslipStatus, setPayslipStatus] = useState<Record<string, 'NOT_SENT' | 'SENDING' | 'SENT' | 'FAILED'>>({});
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentEmpId, setCurrentEmpId] = useState('');
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empDesignation, setEmpDesignation] = useState('');
  const [empDepartment, setEmpDepartment] = useState('');
  const [empBasicSalary, setEmpBasicSalary] = useState(10000);
  const [empAllowances, setEmpAllowances] = useState(1500);
  const [empDeductions, setEmpDeductions] = useState(500);
  const [empJoinDate, setEmpJoinDate] = useState(new Date().toISOString().substring(0, 10));

  // Notification status
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await api.getEmployees();
      setEmployees(data);
      
      // Initialize payslip sending statuses
      const statuses: typeof payslipStatus = {};
      data.forEach(e => {
        statuses[e.id] = 'NOT_SENT';
      });
      setPayslipStatus(statuses);
    } catch (err: any) {
      console.error('Failed to load employees:', err);
      setNotification({ type: 'error', message: 'Failed to retrieve employees from backend.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('create');
    setCurrentEmpId('');
    setEmpName('');
    setEmpEmail('');
    setEmpPhone('');
    setEmpDesignation('Accountant');
    setEmpDepartment('Finance & Accounts');
    setEmpBasicSalary(10000);
    setEmpAllowances(1500);
    setEmpDeductions(500);
    setEmpJoinDate(new Date().toISOString().substring(0, 10));
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: EmployeeItem) => {
    setModalMode('edit');
    setCurrentEmpId(emp.id);
    setEmpName(emp.name);
    setEmpEmail(emp.email);
    setEmpPhone(emp.phone);
    setEmpDesignation(emp.designation);
    setEmpDepartment(emp.department);
    setEmpBasicSalary(emp.basicSalary);
    setEmpAllowances(emp.allowances);
    setEmpDeductions(emp.deductions);
    setEmpJoinDate(emp.joinDate);
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empEmail || !empPhone) {
      setNotification({ type: 'error', message: 'Please fill in Name, Email, and Phone fields.' });
      return;
    }

    const payload = {
      name: empName,
      email: empEmail,
      phone: empPhone,
      designation: empDesignation,
      department: empDepartment,
      basicSalary: Number(empBasicSalary),
      allowances: Number(empAllowances),
      deductions: Number(empDeductions),
      joinDate: empJoinDate,
    };

    try {
      if (modalMode === 'create') {
        const newEmp = await api.createEmployee(payload);
        setEmployees([newEmp, ...employees]);
        setPayslipStatus(prev => ({ ...prev, [newEmp.id]: 'NOT_SENT' }));
        setNotification({ type: 'success', message: `Employee "${newEmp.name}" registered successfully.` });
      } else {
        const updated = await api.updateEmployee(currentEmpId, payload);
        setEmployees(employees.map(e => e.id === currentEmpId ? updated : e));
        setNotification({ type: 'success', message: `Employee "${updated.name}" details updated.` });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setNotification({ type: 'error', message: `Save failed: ${err.message || err}` });
    }
  };

  const handleDeactivateEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this employee?')) return;
    try {
      const updated = await api.deleteEmployee(id);
      setEmployees(employees.map(e => e.id === id ? updated : e));
      setNotification({ type: 'success', message: 'Employee status changed to INACTIVE.' });
    } catch (err: any) {
      setNotification({ type: 'error', message: `Action failed: ${err.message || err}` });
    }
  };

  const handleSendSinglePayslip = async (id: string) => {
    try {
      setPayslipStatus(prev => ({ ...prev, [id]: 'SENDING' }));
      const result = await api.sendPayslip(id, { month: payMonth, year: payYear });
      if (result.success) {
        setPayslipStatus(prev => ({ ...prev, [id]: 'SENT' }));
        setNotification({ type: 'success', message: `Pay slip dispatched to ${result.details.email} (${result.mode} mode).` });
      } else {
        setPayslipStatus(prev => ({ ...prev, [id]: 'FAILED' }));
      }
    } catch (err: any) {
      setPayslipStatus(prev => ({ ...prev, [id]: 'FAILED' }));
      setNotification({ type: 'error', message: `Failed to deliver pay slip: ${err.message || err}` });
    }
  };

  const handleSendSelectedPayslips = async () => {
    if (selectedEmpIds.length === 0) return;
    try {
      setBulkProcessing(true);
      // Mark all selected as sending
      const nextStatuses = { ...payslipStatus };
      selectedEmpIds.forEach(id => {
        nextStatuses[id] = 'SENDING';
      });
      setPayslipStatus(nextStatuses);

      const result = await api.sendBulkPayslips({
        employeeIds: selectedEmpIds,
        month: payMonth,
        year: payYear,
      });

      // Update statuses based on results
      const finalStatuses = { ...payslipStatus };
      result.forEach((item: any) => {
        finalStatuses[item.employeeId] = item.success ? 'SENT' : 'FAILED';
      });
      setPayslipStatus(finalStatuses);
      
      const successCount = result.filter((r: any) => r.success).length;
      setNotification({
        type: 'success',
        message: `Bulk payroll delivery completed! ${successCount} of ${selectedEmpIds.length} pay slips sent successfully.`
      });
      setSelectedEmpIds([]);
    } catch (err: any) {
      setNotification({ type: 'error', message: `Bulk dispatch failed: ${err.message || err}` });
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleSelectAllActive = () => {
    const activeIds = employees.filter(e => e.status === 'ACTIVE').map(e => e.id);
    if (selectedEmpIds.length === activeIds.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(activeIds);
    }
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.department.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Employee Registry & Payroll Suite</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            Track employee profiles, calculate base currencies, and execute automated pay slip delivery.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'registry' && (
            <button onClick={handleOpenAddModal} className="btn-primary">
              <Plus size={16} /> Add Employee Record
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
          onClick={() => setActiveTab('registry')}
          style={{
            background: activeTab === 'registry' ? '#0f172a' : '#ffffff',
            color: activeTab === 'registry' ? '#ffffff' : '#475569',
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
          <Users size={15} /> Employee Registry
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          style={{
            background: activeTab === 'payroll' ? '#0f172a' : '#ffffff',
            color: activeTab === 'payroll' ? '#ffffff' : '#475569',
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
          <FileText size={15} /> Pay Slip Delivery
        </button>
      </div>

      {/* SEARCH BAR (For Registry Mode) */}
      {activeTab === 'registry' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '6px', marginBottom: '20px' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search employees by name, department, designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.85rem' }}
          />
        </div>
      )}

      {/* Content panes */}
      {activeTab === 'registry' && (
        <div className="card-enterprise" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <Loader size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} /> Loading employee roster...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              No employees matching the search are registered.
            </div>
          ) : (
            <table className="table-enterprise">
              <thead>
                <tr>
                  <th>Employee Info</th>
                  <th>Department & Role</th>
                  <th style={{ textAlign: 'right' }}>Basic Salary</th>
                  <th style={{ textAlign: 'right' }}>Allowances</th>
                  <th style={{ textAlign: 'right' }}>Deductions</th>
                  <th style={{ textAlign: 'right' }}>Net Salary</th>
                  <th>Join Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => {
                  const net = emp.basicSalary + emp.allowances - emp.deductions;
                  return (
                    <tr key={emp.id} style={{ opacity: emp.status === 'INACTIVE' ? 0.6 : 1 }}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{emp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{emp.email} • {emp.phone}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{emp.designation}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{emp.department}</div>
                      </td>
                      <td style={{ textAlign: 'right' }} className="num-tabular">AED {emp.basicSalary.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: '#059669' }} className="num-tabular">+ AED {emp.allowances.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: '#dc2626' }} className="num-tabular">- AED {emp.deductions.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="num-tabular">AED {net.toLocaleString()}</td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{emp.joinDate}</td>
                      <td>
                        <span className={`badge-status ${emp.status === 'ACTIVE' ? 'badge-status-green' : 'badge-status-red'}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => handleOpenEditModal(emp)} style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer' }} title="Edit Employee">
                            <Edit2 size={14} />
                          </button>
                          {emp.status === 'ACTIVE' && (
                            <button onClick={() => handleDeactivateEmployee(emp.id)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer' }} title="Deactivate Employee">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Pay Slip Delivery Page */}
      {activeTab === 'payroll' && (
        <div>
          {/* Controls Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Billing Month</label>
                <select
                  value={payMonth}
                  onChange={(e) => setPayMonth(e.target.value)}
                  style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Billing Year</label>
                <input
                  type="number"
                  value={payYear}
                  onChange={(e) => setPayYear(Number(e.target.value))}
                  style={{ width: '80px', padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSelectAllActive}
                className="btn-secondary"
                disabled={bulkProcessing || employees.length === 0}
              >
                {selectedEmpIds.length === employees.filter(e=>e.status==='ACTIVE').length ? 'Deselect All' : 'Select All Active'}
              </button>

              <button
                onClick={handleSendSelectedPayslips}
                className="btn-primary"
                disabled={selectedEmpIds.length === 0 || bulkProcessing}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {bulkProcessing ? (
                  <>
                    <Loader size={14} className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Send Selected ({selectedEmpIds.length})
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Payroll grid */}
          <div className="card-enterprise" style={{ padding: '0', overflow: 'hidden' }}>
            <table className="table-enterprise">
              <thead>
                <tr>
                  <th style={{ width: '40px', paddingLeft: '20px' }}>
                    <input
                      type="checkbox"
                      checked={employees.length > 0 && selectedEmpIds.length === employees.filter(e => e.status === 'ACTIVE').length}
                      onChange={handleSelectAllActive}
                    />
                  </th>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th style={{ textAlign: 'right' }}>Salary Snapshot</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>One-Click Dispatch</th>
                </tr>
              </thead>
              <tbody>
                {employees.filter(e => e.status === 'ACTIVE').map(emp => {
                  const net = emp.basicSalary + emp.allowances - emp.deductions;
                  const currentStatus = payslipStatus[emp.id] || 'NOT_SENT';
                  const isSelected = selectedEmpIds.includes(emp.id);

                  return (
                    <tr key={emp.id}>
                      <td style={{ paddingLeft: '20px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedEmpIds(selectedEmpIds.filter(id => id !== emp.id));
                            } else {
                              setSelectedEmpIds([...selectedEmpIds, emp.id]);
                            }
                          }}
                        />
                      </td>
                      <td style={{ fontWeight: 600 }}>{emp.name}</td>
                      <td style={{ color: '#64748b' }}>{emp.designation}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }} className="num-tabular">AED {net.toLocaleString()}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }} className="num-tabular">
                          ({emp.basicSalary} + {emp.allowances} - {emp.deductions})
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {currentStatus === 'NOT_SENT' && (
                          <span className="badge-status" style={{ background: '#f1f5f9', color: '#475569' }}>Not Sent</span>
                        )}
                        {currentStatus === 'SENDING' && (
                          <span className="badge-status badge-status-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Loader size={11} className="animate-spin" /> Emailing...
                          </span>
                        )}
                        {currentStatus === 'SENT' && (
                          <span className="badge-status badge-status-green">Emailed</span>
                        )}
                        {currentStatus === 'FAILED' && (
                          <span className="badge-status badge-status-red">Failed</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => handleSendSinglePayslip(emp.id)}
                          disabled={currentStatus === 'SENDING' || bulkProcessing}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Mail size={12} /> Send Pay Slip
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card-enterprise" style={{ width: '560px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#2563eb" /> {modalMode === 'create' ? 'Register New Employee' : 'Edit Employee Details'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hamdan Al Suwaidi"
                    value={empName}
                    onChange={(e) => setEmpName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.ae"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+971 50 123 4567"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Join Date *</label>
                  <input
                    type="date"
                    required
                    value={empJoinDate}
                    onChange={(e) => setEmpJoinDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Designation / Job Role</label>
                  <select
                    value={empDesignation}
                    onChange={(e) => setEmpDesignation(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    <option value="Accountant">Accountant</option>
                    <option value="Senior Accountant">Senior Accountant</option>
                    <option value="Biller / Cashier">Biller / Cashier</option>
                    <option value="HR Manager">HR Manager</option>
                    <option value="Sales Representative">Sales Representative</option>
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="Inventory & Operations Manager">Inventory & Operations Manager</option>
                    <option value="Office Administrator">Office Administrator</option>
                    <option value="Driver / Logistics Assistant">Driver / Logistics Assistant</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Department</label>
                  <select
                    value={empDepartment}
                    onChange={(e) => setEmpDepartment(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Logistics & Warehouse">Logistics & Warehouse</option>
                    <option value="Administration">Administration</option>
                    <option value="Customer Support">Customer Support</option>
                  </select>
                </div>
              </div>

              {/* Financial components */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign size={14} color="#059669" /> Monthly Salary Structure (AED)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>Basic Salary *</label>
                    <input
                      type="number"
                      required
                      value={empBasicSalary}
                      onChange={(e) => setEmpBasicSalary(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>Allowances</label>
                    <input
                      type="number"
                      value={empAllowances}
                      onChange={(e) => setEmpAllowances(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>Deductions</label>
                    <input
                      type="number"
                      value={empDeductions}
                      onChange={(e) => setEmpDeductions(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'create' ? 'Save Employee' : 'Update details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
