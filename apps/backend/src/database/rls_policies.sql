-- PostgreSQL Row-Level Security (RLS) Policies for UAE Accounting Platform
-- Defense-in-depth multi-tenant isolation

-- Enable RLS on core tenant-owned tables
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;

-- Create Tenant Isolation Policies (evaluates against app.current_tenant session variable)

CREATE POLICY party_tenant_isolation ON parties
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

CREATE POLICY item_tenant_isolation ON items
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

CREATE POLICY account_tenant_isolation ON accounts
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

CREATE POLICY journal_entry_tenant_isolation ON journal_entries
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

CREATE POLICY sales_invoice_tenant_isolation ON sales_invoices
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);
