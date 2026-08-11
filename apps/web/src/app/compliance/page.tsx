'use client';

import React, { useState, useEffect } from 'react';
import { FileCode, RefreshCw, Send, CheckCircle2, QrCode, Clipboard, FileText, Building, Check, ArrowRight } from 'lucide-react';
import { api } from '@/lib/apiClient';

export default function CompliancePage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Active Organization contexts
  const [orgName, setOrgName] = useState('My Business');
  const [trn, setTrn] = useState('100999888700001');

  // Submission response console
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [clearanceResult, setClearanceResult] = useState<any | null>(null);
  const [xmlContent, setXmlContent] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedOrg = localStorage.getItem('org_name');
      const savedTrn = localStorage.getItem('org_trn');
      if (savedOrg) setOrgName(savedOrg);
      if (savedTrn) setTrn(savedTrn);
    }
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await api.getInvoices();
      setInvoices(data || []);
    } catch (e) {
      console.error('Failed to load sales invoices', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTransmitEInvoice = async (invoice: any) => {
    setSubmittingId(invoice.id);
    setSelectedInvoice(invoice);
    setClearanceResult(null);

    // Mock XML structure conforming to UBL 2.1 Invoice
    const generatedXml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>urn:fdp:gov:ae:e-invoicing:v1.0</cbc:CustomizationID>
  <cbc:ID>${invoice.invoiceNumber || 'INV-TEMP'}</cbc:ID>
  <cbc:UUID>${crypto.randomUUID()}</cbc:UUID>
  <cbc:IssueDate>${new Date(invoice.createdAt).toISOString().split('T')[0]}</cbc:IssueDate>
  <cbc:InvoiceTypeCode name="0100000">388</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>AED</cbc:DocumentCurrencyCode>

  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${orgName}</cbc:Name>
      </cac:PartyName>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${trn}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${invoice.customerName || 'Walk-in Customer'}</cbc:Name>
      </cac:PartyName>
      ${invoice.customerTrn ? `
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${invoice.customerTrn}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>` : ''}
    </cac:Party>
  </cac:AccountingCustomerParty>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="AED">${Number(invoice.subtotal).toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="AED">${Number(invoice.subtotal).toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="AED">${Number(invoice.grandTotal).toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="AED">0.00</cbc:AllowanceTotalAmount>
    <cbc:ChargeTotalAmount currencyID="AED">0.00</cbc:ChargeTotalAmount>
    <cbc:PayableAmount currencyID="AED">${Number(invoice.grandTotal).toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;

    setXmlContent(generatedXml);

    try {
      const res = await api.submitEInvoice({
        invoiceNumber: invoice.invoiceNumber,
        issueDate: new Date(invoice.createdAt).toISOString().split('T')[0],
        sellerTrn: trn.replace(/[^0-9]/g, '') || '100999888700001',
        sellerName: orgName,
        buyerTrn: invoice.customerTrn || 'N/A',
        buyerName: invoice.customerName || 'Walk-in Customer',
        subtotal: Number(invoice.subtotal),
        vatTotal: Number(invoice.vatTotal),
        grandTotal: Number(invoice.grandTotal),
        items: (invoice.lines || []).map((l: any) => ({
          description: l.description || 'Product Item',
          quantity: Number(l.quantity || 1),
          unitPrice: Number(l.unitPrice || 0),
          vatAmount: Number(l.vatAmount || 0),
        })),
      });

      setClearanceResult(res);
    } catch (e: any) {
      console.error(e);
      alert(`FTA Gateway Rejected: ${e.message || e}`);
    } finally {
      setSubmittingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCode size={28} color="#2563eb" /> UAE FTA E-Invoicing Gateway
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '2px' }}>
            Submit sales invoices to ASP / Federal Tax Authority Sandbox. Generate UBL 2.1 XML and cryptographic QR clearance.
          </p>
        </div>
        <button onClick={loadInvoices} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Invoices
        </button>
      </div>

      {/* Corporate profile card */}
      <div className="card-enterprise" style={{ marginBottom: '24px', display: 'flex', gap: '24px', alignItems: 'center', background: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px', color: '#2563eb' }}>
            <Building size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>TRANSMITTING BUSINESS (SELLER)</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{orgName}</div>
          </div>
        </div>
        <div style={{ width: '1px', height: '40px', background: '#cbd5e1' }} />
        <div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>UAE FTA TAX REGISTRATION NUMBER (TRN)</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{trn}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span className="badge-status badge-status-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> Connected to ASP Sandbox
          </span>
        </div>
      </div>

      {/* Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px' }}>
        {/* Left pane: Invoices list */}
        <div className="card-enterprise" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#0f172a' }}>
            Sales Invoices Awaiting Transmission
          </div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading invoices list...</div>
          ) : invoices.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No sales invoices registered in system.</div>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: '550px' }}>
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    background: selectedInvoice?.id === inv.id ? '#eff6ff' : '#ffffff',
                  }}
                  onClick={() => { setSelectedInvoice(inv); setClearanceResult(null); setXmlContent(''); }}
                >
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0f172a' }}>{inv.invoiceNumber}</strong>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{inv.customerName || 'Walk-in Customer'}</span>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>AED {Number(inv.grandTotal).toFixed(2)}</div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleTransmitEInvoice(inv); }}
                      disabled={submittingId === inv.id}
                      style={{
                        marginTop: '6px',
                        border: 'none',
                        background: '#2563eb',
                        color: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {submittingId === inv.id ? 'Sending...' : 'Transmit'} <Send size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right pane: E-Invoicing Console */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedInvoice ? (
            <>
              {/* Submission console */}
              <div className="card-enterprise">
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px', color: '#0f172a' }}>
                  Compliance Console: {selectedInvoice.invoiceNumber}
                </h3>

                {clearanceResult ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#ecfdf5', padding: '12px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                      <CheckCircle2 color="#059669" size={24} />
                      <div>
                        <strong style={{ color: '#065f46', fontSize: '0.9rem', display: 'block' }}>E-INVOICE CLEARED & REPORTED Successfully</strong>
                        <span style={{ fontSize: '0.78rem', color: '#047857' }}>Cleared via FTA ASP Sandbox at {new Date(clearanceResult.submissionTimestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.82rem' }}>
                      <div>
                        <span style={{ color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '2px' }}>E-INVOICE UUID</span>
                        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', display: 'block', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {clearanceResult.eInvoiceUuid}
                        </code>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '2px' }}>CRYPTOGRAPHIC SHA-256 HASH</span>
                        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', display: 'block', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {clearanceResult.xmlHash}
                        </code>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                      <div>
                        <span style={{ color: '#64748b', fontWeight: 600, display: 'block', fontSize: '0.82rem', marginBottom: '6px' }}>FTA Compliance QR Output</span>
                        <div style={{ border: '1px solid #cbd5e1', padding: '8px', borderRadius: '6px', background: '#ffffff', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <QrCode size={80} color="#0f172a" />
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ color: '#64748b', fontWeight: 600, display: 'block', fontSize: '0.82rem', marginBottom: '4px' }}>QR Code Decoded Content</span>
                        <textarea
                          readOnly
                          value={atob(clearanceResult.qrCodePayload)}
                          style={{ width: '100%', height: '70px', padding: '6px', fontSize: '0.75rem', fontFamily: 'monospace', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', resize: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                    <p style={{ fontSize: '0.88rem' }}>This invoice has not been transmitted to the tax authority yet.</p>
                    <button
                      onClick={() => handleTransmitEInvoice(selectedInvoice)}
                      style={{
                        marginTop: '12px',
                        border: 'none',
                        background: '#2563eb',
                        color: '#ffffff',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      Transmit Invoice to FTA Gateway <Send size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* XML Code previewer */}
              {xmlContent && (
                <div className="card-enterprise" style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} /> Generated UBL 2.1 XML Payload
                    </span>
                    <button
                      onClick={() => copyToClipboard(xmlContent)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 600 }}
                    >
                      <Clipboard size={12} /> Copy XML
                    </button>
                  </div>
                  <pre style={{ margin: 0, padding: '12px', fontSize: '0.72rem', fontFamily: 'monospace', background: '#0f172a', color: '#38bdf8', height: '240px', overflowY: 'auto' }}>
                    {xmlContent}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="card-enterprise" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              Select a sales invoice from the left panel to begin UBL 2.1 compliance check.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
