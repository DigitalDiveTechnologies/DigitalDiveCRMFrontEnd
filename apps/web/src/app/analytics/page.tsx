'use client';

import React from 'react';
import { TrendingUp, DollarSign, BarChart2, Globe, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Financial Analytics & Multi-Currency Engine</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            Multi-currency exchange rates, cash flow forecasting, and executive gross margin analytics
          </p>
        </div>
        <span className="badge-status badge-status-blue">Base Currency: AED (United Arab Emirates Dirham)</span>
      </div>

      {/* Multi-Currency Exchange Rates Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { pair: 'USD / AED', rate: '3.6725', change: '+0.00%', status: 'Pegged' },
          { pair: 'EUR / AED', rate: '3.9850', change: '+0.42%', status: 'Floating' },
          { pair: 'SAR / AED', rate: '0.9792', change: '+0.01%', status: 'Pegged' },
          { pair: 'GBP / AED', rate: '4.6810', change: '-0.15%', status: 'Floating' },
        ].map((c) => (
          <div key={c.pair} className="card-enterprise">
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{c.pair}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }} className="num-tabular">{c.rate}</div>
            <div style={{ fontSize: '0.75rem', color: c.change.startsWith('+') ? '#059669' : '#dc2626', fontWeight: 600, marginTop: '4px' }}>
              {c.change} ({c.status})
            </div>
          </div>
        ))}
      </div>

      {/* Executive Financial Forecast Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card-enterprise">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Gross Revenue & Profit Margins</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Gross Sales Revenue</span>
              <strong className="num-tabular">AED 224,850.00</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Cost of Goods Sold (COGS)</span>
              <strong className="num-tabular" style={{ color: '#dc2626' }}>- AED 82,400.00</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#ecfdf5', padding: '10px', borderRadius: '6px', fontWeight: 700 }}>
              <span style={{ fontSize: '0.9rem', color: '#047857' }}>Gross Profit Margin</span>
              <span style={{ fontSize: '0.9rem', color: '#047857' }} className="num-tabular">63.35% (AED 142,450.00)</span>
            </div>
          </div>
        </div>

        <div className="card-enterprise">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Cash Flow Projection (Q4 2026)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Projected Accounts Receivable Collection</span>
              <strong className="num-tabular" style={{ color: '#059669' }}>+ AED 95,000.00</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Projected Supplier Accounts Payable Due</span>
              <strong className="num-tabular" style={{ color: '#dc2626' }}>- AED 38,325.00</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#eff6ff', padding: '10px', borderRadius: '6px', fontWeight: 700 }}>
              <span style={{ fontSize: '0.9rem', color: '#1d4ed8' }}>Net Operating Cash Flow</span>
              <span style={{ fontSize: '0.9rem', color: '#1d4ed8' }} className="num-tabular">+ AED 56,675.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
