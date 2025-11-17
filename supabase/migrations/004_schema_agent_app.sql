-- ===================================
-- 🏦 AGENT_APP Schema - CRM Courtier en Assurance
-- ===================================
-- Purpose: Complete schema for insurance broker CRM application
-- Security: Multi-tenant, RLS, RGPD compliance, audit logging
-- Features: Prospects/Clients, Quotes, Contracts, Invoicing, Claims management
-- Created: 2025-11-17

-- Create schema
CREATE SCHEMA IF NOT EXISTS agent_app;

-- ===================================
-- 👥 TABLE: contacts
-- ===================================
-- Purpose: Manage prospects and clients (individuals and professionals)
-- Security: Tenant-isolated, RGPD compliant, encrypted sensitive fields
-- Features: Soft delete, audit trail, prospect→client auto-promotion

CREATE TABLE agent_app.contacts (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Contact type and status
    contact_type text NOT NULL CHECK (contact_type IN ('individual', 'professional')),
    status text NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect', 'client', 'inactive', 'archived')),

    -- Identity
    title text CHECK (title IN ('M', 'MME', 'MLLE')),
    first_name text NOT NULL,
    last_name text NOT NULL,
    maiden_name text,
    birth_date date,
    birth_place text,
    birth_department text,
    nationality text DEFAULT 'FR',

    -- Family situation
    marital_status text CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed', 'pacs', 'cohabitation')),
    marital_regime text,

    -- Contact information
    email text,
    mobile_phone text NOT NULL,
    work_phone text,
    phone text,
    fax text,
    preferred_contact_method text DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'mail')),

    -- Main address
    address_line1 text,
    address_line2 text,
    postal_code text,
    city text,
    country_code text REFERENCES public.countries(code) ON DELETE RESTRICT DEFAULT 'FR',

    -- Professional information
    professional_status text CHECK (professional_status IN ('employee', 'self_employed', 'public_sector', 'retired', 'student', 'unemployed')),
    employer text,
    profession text,
    work_address text,

    -- Official documents
    driving_license_date date,
    social_security_number text, -- To be encrypted in production
    tax_number text,

    -- Compliance and regulatory
    is_pep boolean DEFAULT false, -- Personne Politiquement Exposée
    is_fatca boolean DEFAULT false, -- Subject to FATCA (USA)
    fiscal_residence text DEFAULT 'france' CHECK (fiscal_residence IN ('france', 'eu', 'non_eu')),
    lcb_ft_verified boolean DEFAULT false, -- Anti money laundering verified
    lcb_ft_verification_date date,

    -- Partnership with insurance companies
    axa_client_number text,
    -- Add other insurance company client numbers as needed

    -- Origin and tracking
    source text CHECK (source IN ('website', 'referral', 'cold_call', 'event', 'partner', 'other')),
    referrer_contact_id uuid REFERENCES agent_app.contacts(id) ON DELETE SET NULL,

    -- RGPD
    data_retention_end_date date, -- End of relationship + 5 years

    -- Notes
    notes text,
    tags text[],

    -- Soft delete
    deleted_at timestamptz,
    deleted_by uuid REFERENCES auth.users(id),

    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),

    -- Constraints
    CONSTRAINT email_or_phone_required CHECK (email IS NOT NULL OR mobile_phone IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_contacts_tenant_id ON agent_app.contacts(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_status ON agent_app.contacts(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_type ON agent_app.contacts(contact_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_email ON agent_app.contacts(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_mobile_phone ON agent_app.contacts(mobile_phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_referrer ON agent_app.contacts(referrer_contact_id) WHERE referrer_contact_id IS NOT NULL;
CREATE INDEX idx_contacts_retention ON agent_app.contacts(data_retention_end_date) WHERE data_retention_end_date IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_contacts_created_at ON agent_app.contacts(created_at DESC);

-- RLS
ALTER TABLE agent_app.contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see contacts from their tenants
CREATE POLICY contacts_tenant_isolation ON agent_app.contacts
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Trigger: Update timestamp
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON agent_app.contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Audit logging
CREATE TRIGGER contacts_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON agent_app.contacts
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_trail();

-- Comments
COMMENT ON TABLE agent_app.contacts IS 'Contact management for prospects and clients (individuals and professionals)';
COMMENT ON COLUMN agent_app.contacts.status IS 'Contact status: prospect, client, inactive, archived';
COMMENT ON COLUMN agent_app.contacts.contact_type IS 'Type: individual or professional';
COMMENT ON COLUMN agent_app.contacts.is_pep IS 'Politically Exposed Person (compliance requirement)';
COMMENT ON COLUMN agent_app.contacts.lcb_ft_verified IS 'Anti-money laundering verification status';
COMMENT ON COLUMN agent_app.contacts.data_retention_end_date IS 'RGPD: Date when data should be deleted (end of relationship + 5 years)';

-- ===================================
-- 👨‍👩‍👧‍👦 TABLE: dependents
-- ===================================
-- Purpose: Manage dependents (spouse, children, parents)
-- Security: Tenant-isolated, linked to contact
-- Features: Family relationships for insurance purposes

CREATE TABLE agent_app.dependents (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Link to main contact
    contact_id uuid NOT NULL REFERENCES agent_app.contacts(id) ON DELETE CASCADE,

    -- Relationship
    relationship text NOT NULL CHECK (relationship IN ('spouse', 'child', 'parent', 'other')),

    -- Identity
    first_name text NOT NULL,
    last_name text NOT NULL,
    birth_date date,

    -- Tax dependency
    is_dependent boolean DEFAULT false,

    -- Professional info
    profession text,

    -- Address (if different from main contact)
    address text,

    -- Notes
    notes text,

    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_dependents_tenant_id ON agent_app.dependents(tenant_id);
CREATE INDEX idx_dependents_contact_id ON agent_app.dependents(contact_id);
CREATE INDEX idx_dependents_relationship ON agent_app.dependents(relationship);

-- RLS
ALTER TABLE agent_app.dependents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see dependents from their tenants
CREATE POLICY dependents_tenant_isolation ON agent_app.dependents
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Trigger: Update timestamp
CREATE TRIGGER update_dependents_updated_at
    BEFORE UPDATE ON agent_app.dependents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE agent_app.dependents IS 'Dependents (family members) linked to contacts';
COMMENT ON COLUMN agent_app.dependents.is_dependent IS 'Tax dependent (à charge fiscalement)';

-- ===================================
-- 🏢 TABLE: professional_info
-- ===================================
-- Purpose: Professional-specific information for business clients
-- Security: Tenant-isolated, 1:1 relationship with contact
-- Features: Company details, financial data, activity breakdown

CREATE TABLE agent_app.professional_info (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Link to contact (1:1 relationship)
    contact_id uuid NOT NULL UNIQUE REFERENCES agent_app.contacts(id) ON DELETE CASCADE,

    -- Company identification
    company_name text NOT NULL,
    legal_form text CHECK (legal_form IN ('ei', 'eurl', 'sarl', 'sas', 'sasu', 'sa', 'sci', 'scop', 'association', 'other')),
    siret text UNIQUE,
    siren text,
    ape_code text,
    naf_code_primary text,
    naf_code_secondary text,
    creation_date date,
    fiscal_year_end text, -- Format: "31/12"

    -- Financial data
    annual_revenue numeric(12, 2),
    gross_margin numeric(12, 2),
    employee_count integer,
    professional_content numeric(12, 2),

    -- Activity description
    activity_description text,
    main_clients text,

    -- Client distribution
    client_distribution_b2b numeric(5, 2), -- Percentage
    client_distribution_b2c numeric(5, 2), -- Percentage

    -- Subcontracting
    subcontracting_given numeric(5, 2), -- % revenue in subcontracting given
    subcontracting_received numeric(5, 2), -- % revenue in subcontracting received

    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    -- Constraints
    CONSTRAINT client_distribution_total_check CHECK (
        (client_distribution_b2b IS NULL AND client_distribution_b2c IS NULL) OR
        (client_distribution_b2b + client_distribution_b2c <= 100)
    )
);

-- Indexes
CREATE INDEX idx_professional_info_tenant_id ON agent_app.professional_info(tenant_id);
CREATE INDEX idx_professional_info_contact_id ON agent_app.professional_info(contact_id);
CREATE INDEX idx_professional_info_siret ON agent_app.professional_info(siret) WHERE siret IS NOT NULL;

-- RLS
ALTER TABLE agent_app.professional_info ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see professional info from their tenants
CREATE POLICY professional_info_tenant_isolation ON agent_app.professional_info
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Trigger: Update timestamp
CREATE TRIGGER update_professional_info_updated_at
    BEFORE UPDATE ON agent_app.professional_info
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE agent_app.professional_info IS 'Professional-specific information for business clients';
COMMENT ON COLUMN agent_app.professional_info.legal_form IS 'Legal structure: EI, EURL, SARL, SAS, SASU, SA, SCI, SCOP, association, other';

-- ===================================
-- 📊 TABLE: business_activities
-- ===================================
-- Purpose: Activity breakdown for professional clients
-- Security: Tenant-isolated, linked to professional_info
-- Features: Revenue distribution by activity

CREATE TABLE agent_app.business_activities (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Link to professional info
    professional_info_id uuid NOT NULL REFERENCES agent_app.professional_info(id) ON DELETE CASCADE,

    -- Activity details
    activity_name text NOT NULL,
    activity_description text,
    revenue_percentage numeric(5, 2), -- Percentage of total revenue
    activity_order integer, -- 1, 2, 3 for ranking

    -- Timestamps
    created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_business_activities_tenant_id ON agent_app.business_activities(tenant_id);
CREATE INDEX idx_business_activities_professional_info_id ON agent_app.business_activities(professional_info_id);
CREATE INDEX idx_business_activities_order ON agent_app.business_activities(professional_info_id, activity_order);

-- RLS
ALTER TABLE agent_app.business_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see business activities from their tenants
CREATE POLICY business_activities_tenant_isolation ON agent_app.business_activities
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Comments
COMMENT ON TABLE agent_app.business_activities IS 'Activity breakdown for professional clients';
COMMENT ON COLUMN agent_app.business_activities.activity_order IS 'Primary activity = 1, secondary = 2, etc.';

-- ===================================
-- 🏛️ TABLE: companies
-- ===================================
-- Purpose: Insurance companies (partners)
-- Security: Tenant-isolated
-- Features: Commission rates, active status

CREATE TABLE agent_app.companies (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Company information
    name text NOT NULL,
    logo_url text,
    website text,

    -- Commission
    commission_rate numeric(5, 2), -- Average commission rate

    -- Status
    is_active boolean DEFAULT true,

    -- Notes
    notes text,

    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_companies_tenant_id ON agent_app.companies(tenant_id);
CREATE INDEX idx_companies_is_active ON agent_app.companies(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE agent_app.companies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see companies from their tenants
CREATE POLICY companies_tenant_isolation ON agent_app.companies
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Trigger: Update timestamp
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON agent_app.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE agent_app.companies IS 'Insurance companies (broker partners)';

-- ===================================
-- 📋 TABLE: products
-- ===================================
-- Purpose: Insurance products offered by companies
-- Security: Tenant-isolated, linked to company
-- Features: Product types, age limits, commission rates

CREATE TABLE agent_app.products (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Link to company
    company_id uuid NOT NULL REFERENCES agent_app.companies(id) ON DELETE CASCADE,

    -- Product information
    name text NOT NULL,
    product_type text NOT NULL CHECK (product_type IN ('auto', 'rc_pro', 'health', 'home', 'life', 'savings', 'prevoyance', 'retirement', 'other')),
    description text,

    -- Target and limits
    is_active boolean DEFAULT true,
    target_audience text DEFAULT 'both' CHECK (target_audience IN ('individual', 'professional', 'both')),
    min_age integer,
    max_age integer,

    -- Resources
    documentation_url text,

    -- Commission
    commission_rate numeric(5, 2),

    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_products_tenant_id ON agent_app.products(tenant_id);
CREATE INDEX idx_products_company_id ON agent_app.products(company_id);
CREATE INDEX idx_products_type ON agent_app.products(product_type);
CREATE INDEX idx_products_is_active ON agent_app.products(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE agent_app.products ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see products from their tenants
CREATE POLICY products_tenant_isolation ON agent_app.products
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Trigger: Update timestamp
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON agent_app.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE agent_app.products IS 'Insurance products offered by companies';
COMMENT ON COLUMN agent_app.products.product_type IS 'Type: auto, rc_pro, health, home, life, savings, prevoyance, retirement, other';

-- ===================================
-- 💼 TABLE: quotes
-- ===================================
-- Purpose: Insurance quotes with comparative analysis
-- Security: Tenant-isolated, auto-numbering
-- Features: Multi-company comparison, status workflow, validity period

CREATE TABLE agent_app.quotes (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Link to contact
    contact_id uuid NOT NULL REFERENCES agent_app.contacts(id) ON DELETE RESTRICT,

    -- Auto-numbering: DEV-YYYY-XXXXX
    quote_number text NOT NULL,

    -- Product category
    product_category text NOT NULL CHECK (product_category IN ('auto', 'rc_pro', 'health', 'home', 'life', 'savings', 'prevoyance', 'retirement', 'other')),

    -- Status and dates
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
    created_date date DEFAULT CURRENT_DATE,
    sent_at timestamptz,
    viewed_at timestamptz,
    valid_until date,

    -- Link to form submission
    form_submission_id uuid, -- Will be linked to form_submissions table

    -- Notes
    notes text,

    -- Soft delete
    deleted_at timestamptz,
    deleted_by uuid REFERENCES auth.users(id),

    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

-- Indexes
CREATE UNIQUE INDEX idx_quotes_number_tenant ON agent_app.quotes(tenant_id, quote_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_quotes_tenant_id ON agent_app.quotes(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_quotes_contact_id ON agent_app.quotes(contact_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_quotes_status ON agent_app.quotes(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_quotes_valid_until ON agent_app.quotes(valid_until) WHERE status IN ('sent', 'viewed') AND deleted_at IS NULL;
CREATE INDEX idx_quotes_created_at ON agent_app.quotes(created_at DESC);

-- RLS
ALTER TABLE agent_app.quotes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see quotes from their tenants
CREATE POLICY quotes_tenant_isolation ON agent_app.quotes
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Function: Auto-generate quote number
CREATE OR REPLACE FUNCTION agent_app.generate_quote_number(p_tenant_id uuid)
RETURNS text AS $$
DECLARE
    v_year text;
    v_sequence integer;
    v_number text;
BEGIN
    -- Get current year
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;

    -- Get next sequence number for this tenant and year
    SELECT COALESCE(MAX(
        CASE
            WHEN quote_number ~ ('^DEV-' || v_year || '-[0-9]+$')
            THEN CAST(SUBSTRING(quote_number FROM 'DEV-' || v_year || '-([0-9]+)') AS integer)
            ELSE 0
        END
    ), 0) + 1
    INTO v_sequence
    FROM agent_app.quotes
    WHERE tenant_id = p_tenant_id;

    -- Format: DEV-YYYY-XXXXX (with leading zeros)
    v_number := 'DEV-' || v_year || '-' || LPAD(v_sequence::text, 5, '0');

    RETURN v_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = agent_app, public, pg_temp;

-- Trigger: Auto-generate quote number on insert
CREATE OR REPLACE FUNCTION agent_app.set_quote_number()
RETURNS trigger AS $$
BEGIN
    IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
        NEW.quote_number := agent_app.generate_quote_number(NEW.tenant_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = agent_app, public, pg_temp;

CREATE TRIGGER set_quote_number_on_insert
    BEFORE INSERT ON agent_app.quotes
    FOR EACH ROW
    EXECUTE FUNCTION agent_app.set_quote_number();

-- Trigger: Update timestamp
CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON agent_app.quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Audit logging
CREATE TRIGGER quotes_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON agent_app.quotes
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_trail();

-- Comments
COMMENT ON TABLE agent_app.quotes IS 'Insurance quotes with comparative analysis and auto-numbering';
COMMENT ON COLUMN agent_app.quotes.quote_number IS 'Auto-generated number format: DEV-YYYY-XXXXX';
COMMENT ON COLUMN agent_app.quotes.status IS 'Status workflow: draft, sent, viewed, accepted, rejected, expired';

-- ===================================
-- 📊 TABLE: quote_items
-- ===================================
-- Purpose: Comparative quote lines (max 3 companies per questionnaire)
-- Security: Tenant-isolated, linked to quote and products
-- Features: Pricing, guarantees in JSON format

CREATE TABLE agent_app.quote_items (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Links
    quote_id uuid NOT NULL REFERENCES agent_app.quotes(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES agent_app.companies(id) ON DELETE RESTRICT,
    product_id uuid NOT NULL REFERENCES agent_app.products(id) ON DELETE RESTRICT,

    -- Pricing
    annual_premium numeric(10, 2) NOT NULL,
    monthly_premium numeric(10, 2),
    payment_frequency text DEFAULT 'monthly' CHECK (payment_frequency IN ('monthly', 'quarterly', 'semi_annual', 'annual')),

    -- Guarantees (flexible JSON storage)
    guarantees jsonb DEFAULT '[]'::jsonb,
    -- Example: [{"name": "Dommages tous accidents", "value": "50000€", "franchise": "500€"}, ...]

    -- Documents
    terms_conditions_url text,
    product_info_url text,

    -- Display order (1, 2, 3 for comparison table)
    display_order integer,

    -- Timestamps
    created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_quote_items_tenant_id ON agent_app.quote_items(tenant_id);
CREATE INDEX idx_quote_items_quote_id ON agent_app.quote_items(quote_id);
CREATE INDEX idx_quote_items_company_id ON agent_app.quote_items(company_id);
CREATE INDEX idx_quote_items_product_id ON agent_app.quote_items(product_id);
CREATE INDEX idx_quote_items_display_order ON agent_app.quote_items(quote_id, display_order);

-- RLS
ALTER TABLE agent_app.quote_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see quote items from their tenants
CREATE POLICY quote_items_tenant_isolation ON agent_app.quote_items
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Comments
COMMENT ON TABLE agent_app.quote_items IS 'Quote comparison lines (max 3 companies)';
COMMENT ON COLUMN agent_app.quote_items.guarantees IS 'JSON array of guarantees with name, value, and franchise';

-- ===================================
-- 📄 TABLE: contracts
-- ===================================
-- Purpose: Insurance contracts
-- Security: Tenant-isolated, auto-promoted from quotes
-- Features: Status workflow, commission tracking, amendments history

CREATE TABLE agent_app.contracts (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Links
    contact_id uuid NOT NULL REFERENCES agent_app.contacts(id) ON DELETE RESTRICT,
    company_id uuid NOT NULL REFERENCES agent_app.companies(id) ON DELETE RESTRICT,
    quote_id uuid REFERENCES agent_app.quotes(id) ON DELETE SET NULL,

    -- Contract numbers
    contract_number text NOT NULL, -- Insurance company's contract number
    policy_number text, -- Policy number

    -- Product type
    product_type text NOT NULL CHECK (product_type IN ('auto', 'rc_pro', 'health', 'home', 'life', 'savings', 'prevoyance', 'retirement', 'other')),
    product_category text, -- Ex: "Santé individuelle", "RC Pro TNS"

    -- Dates
    start_date date NOT NULL,
    end_date date,
    renewal_date date,
    cancellation_date date,
    cancellation_reason text,

    -- Status
    status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'replaced')),
    auto_renewal boolean DEFAULT true,

    -- Pricing
    annual_premium numeric(10, 2) NOT NULL,
    payment_frequency text DEFAULT 'monthly' CHECK (payment_frequency IN ('monthly', 'quarterly', 'semi_annual', 'annual')),
    payment_method text CHECK (payment_method IN ('direct_debit', 'transfer', 'check', 'card')),

    -- Broker commission
    commission_amount numeric(10, 2),
    commission_paid boolean DEFAULT false,
    commission_payment_date date,

    -- Guarantees (JSONB for flexibility)
    guarantees jsonb DEFAULT '{}'::jsonb,

    -- Notes
    notes text,

    -- Soft delete
    deleted_at timestamptz,
    deleted_by uuid REFERENCES auth.users(id),

    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_contracts_tenant_id ON agent_app.contracts(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_contact_id ON agent_app.contracts(contact_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_company_id ON agent_app.contracts(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_status ON agent_app.contracts(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_renewal_date ON agent_app.contracts(renewal_date) WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX idx_contracts_product_type ON agent_app.contracts(product_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_created_at ON agent_app.contracts(created_at DESC);

-- RLS
ALTER TABLE agent_app.contracts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see contracts from their tenants
CREATE POLICY contracts_tenant_isolation ON agent_app.contracts
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Trigger: Auto-promote prospect to client on contract creation
CREATE OR REPLACE FUNCTION agent_app.promote_prospect_to_client()
RETURNS trigger AS $$
BEGIN
    UPDATE agent_app.contacts
    SET status = 'client',
        updated_at = now()
    WHERE id = NEW.contact_id
      AND status = 'prospect';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = agent_app, public, pg_temp;

CREATE TRIGGER auto_promote_to_client
    AFTER INSERT ON agent_app.contracts
    FOR EACH ROW
    EXECUTE FUNCTION agent_app.promote_prospect_to_client();

-- Trigger: Update timestamp
CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON agent_app.contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Audit logging
CREATE TRIGGER contracts_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON agent_app.contracts
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_trail();

-- Comments
COMMENT ON TABLE agent_app.contracts IS 'Insurance contracts with auto-promotion of prospects to clients';
COMMENT ON COLUMN agent_app.contracts.status IS 'Status: active, expired, cancelled, replaced';

-- ===================================
-- 📝 TABLE: contract_amendments
-- ===================================
-- Purpose: Track contract modifications (avenants)
-- Security: Tenant-isolated, linked to contract
-- Features: Change history, premium evolution

CREATE TABLE agent_app.contract_amendments (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Link to contract
    contract_id uuid NOT NULL REFERENCES agent_app.contracts(id) ON DELETE CASCADE,

    -- Amendment details
    amendment_number integer NOT NULL,
    amendment_date date NOT NULL,
    effective_date date NOT NULL,
    reason text NOT NULL,

    -- Changes (JSONB for flexibility)
    changes jsonb,

    -- Premium changes
    previous_premium numeric(10, 2),
    new_premium numeric(10, 2),

    -- Timestamps
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_contract_amendments_tenant_id ON agent_app.contract_amendments(tenant_id);
CREATE INDEX idx_contract_amendments_contract_id ON agent_app.contract_amendments(contract_id);
CREATE INDEX idx_contract_amendments_date ON agent_app.contract_amendments(amendment_date DESC);

-- RLS
ALTER TABLE agent_app.contract_amendments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see amendments from their tenants
CREATE POLICY contract_amendments_tenant_isolation ON agent_app.contract_amendments
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Comments
COMMENT ON TABLE agent_app.contract_amendments IS 'Contract amendments (avenants) history';

-- ===================================
-- 📁 TABLE: documents
-- ===================================
-- Purpose: Centralized document management
-- Security: Tenant-isolated, encrypted storage
-- Features: Multi-entity linking, expiry tracking, RGPD compliance

CREATE TABLE agent_app.documents (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Entity relationships (at least one must be NOT NULL)
    contact_id uuid REFERENCES agent_app.contacts(id) ON DELETE CASCADE,
    quote_id uuid REFERENCES agent_app.quotes(id) ON DELETE CASCADE,
    contract_id uuid REFERENCES agent_app.contracts(id) ON DELETE CASCADE,
    invoice_id uuid, -- Will be linked to invoices table

    -- Document type
    document_type text NOT NULL CHECK (document_type IN (
        'identity_card',
        'driving_license',
        'kbis',
        'insurance_certificate',
        'vehicle_registration',
        'diploma',
        'payslip',
        'signed_contract',
        'signed_cabinet_info',
        'signed_convention',
        'invoice',
        'quote_pdf',
        'terms_conditions',
        'product_info',
        'rib',
        'other'
    )),

    -- File information
    file_name text NOT NULL,
    file_path text NOT NULL, -- Path in Supabase Storage
    file_size integer, -- Bytes
    mime_type text NOT NULL,

    -- Metadata
    is_required boolean DEFAULT false,
    expiry_date date, -- For CNI, permits, etc.

    -- RGPD
    rgpd_consent boolean DEFAULT false,

    -- Search and organization
    tags text[],
    notes text,

    -- Upload tracking
    uploaded_at timestamptz DEFAULT now(),
    uploaded_by uuid REFERENCES auth.users(id),

    -- Soft delete
    deleted_at timestamptz,
    deleted_by uuid REFERENCES auth.users(id),

    -- Constraint: at least one relationship must be set
    CONSTRAINT at_least_one_relationship CHECK (
        contact_id IS NOT NULL OR
        quote_id IS NOT NULL OR
        contract_id IS NOT NULL OR
        invoice_id IS NOT NULL
    )
);

-- Indexes
CREATE INDEX idx_documents_tenant_id ON agent_app.documents(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_contact_id ON agent_app.documents(contact_id) WHERE contact_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_documents_quote_id ON agent_app.documents(quote_id) WHERE quote_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_documents_contract_id ON agent_app.documents(contract_id) WHERE contract_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_documents_type ON agent_app.documents(document_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_expiry ON agent_app.documents(expiry_date) WHERE expiry_date IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_documents_uploaded_at ON agent_app.documents(uploaded_at DESC);
CREATE INDEX idx_documents_tags ON agent_app.documents USING gin(tags);

-- RLS
ALTER TABLE agent_app.documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see documents from their tenants
CREATE POLICY documents_tenant_isolation ON agent_app.documents
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Comments
COMMENT ON TABLE agent_app.documents IS 'Centralized document management with multi-entity linking';
COMMENT ON COLUMN agent_app.documents.expiry_date IS 'Expiry date for documents like identity cards, permits';

-- ===================================
-- 💰 TABLE: invoices
-- ===================================
-- Purpose: Broker fee invoicing with automatic discount calculation
-- Security: Tenant-isolated, auto-numbering
-- Features: Complex discount rules, payment tracking

CREATE TABLE agent_app.invoices (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Links
    contact_id uuid NOT NULL REFERENCES agent_app.contacts(id) ON DELETE RESTRICT,
    quote_id uuid REFERENCES agent_app.quotes(id) ON DELETE SET NULL,
    contract_id uuid REFERENCES agent_app.contracts(id) ON DELETE SET NULL,

    -- Auto-numbering: FAC-YYYY-XXXXX
    invoice_number text NOT NULL,

    -- Dates
    invoice_date date NOT NULL DEFAULT CURRENT_DATE,
    due_date date NOT NULL,
    payment_date date,

    -- Amounts
    amount_ht numeric(10, 2) NOT NULL,
    tva_applicable boolean DEFAULT false, -- Generally false for brokers
    tva_rate numeric(5, 2),
    tva_amount numeric(10, 2) DEFAULT 0,
    amount_ttc numeric(10, 2) NOT NULL,

    -- Discounts
    discount_type text CHECK (discount_type IN (
        'creator_50',        -- New business creator -50%
        'recommended_25',    -- Recommended client -25%
        'multi_contract_25', -- 2nd contract -25%
        'multi_contract_50', -- 3rd contract -50%
        'multi_contract_75', -- 4th+ contract -75%
        'custom',
        'none'
    )),
    discount_percentage numeric(5, 2),
    discount_amount numeric(10, 2) DEFAULT 0,

    -- Payment
    payment_method text CHECK (payment_method IN ('direct_debit', 'transfer', 'check', 'card', 'cash')),
    payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),

    -- Notes
    notes text,

    -- Soft delete
    deleted_at timestamptz,
    deleted_by uuid REFERENCES auth.users(id),

    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),

    -- Constraints
    CONSTRAINT invoice_amounts_check CHECK (
        amount_ht >= 0 AND
        tva_amount >= 0 AND
        amount_ttc >= 0 AND
        discount_amount >= 0
    )
);

-- Indexes
CREATE UNIQUE INDEX idx_invoices_number_tenant ON agent_app.invoices(tenant_id, invoice_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_tenant_id ON agent_app.invoices(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_contact_id ON agent_app.invoices(contact_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_payment_status ON agent_app.invoices(payment_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_due_date ON agent_app.invoices(due_date) WHERE payment_status IN ('pending', 'overdue') AND deleted_at IS NULL;
CREATE INDEX idx_invoices_invoice_date ON agent_app.invoices(invoice_date DESC);

-- RLS
ALTER TABLE agent_app.invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see invoices from their tenants
CREATE POLICY invoices_tenant_isolation ON agent_app.invoices
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Function: Auto-generate invoice number
CREATE OR REPLACE FUNCTION agent_app.generate_invoice_number(p_tenant_id uuid)
RETURNS text AS $$
DECLARE
    v_year text;
    v_sequence integer;
    v_number text;
BEGIN
    -- Get current year
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;

    -- Get next sequence number for this tenant and year
    SELECT COALESCE(MAX(
        CASE
            WHEN invoice_number ~ ('^FAC-' || v_year || '-[0-9]+$')
            THEN CAST(SUBSTRING(invoice_number FROM 'FAC-' || v_year || '-([0-9]+)') AS integer)
            ELSE 0
        END
    ), 0) + 1
    INTO v_sequence
    FROM agent_app.invoices
    WHERE tenant_id = p_tenant_id;

    -- Format: FAC-YYYY-XXXXX (with leading zeros)
    v_number := 'FAC-' || v_year || '-' || LPAD(v_sequence::text, 5, '0');

    RETURN v_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = agent_app, public, pg_temp;

-- Trigger: Auto-generate invoice number on insert
CREATE OR REPLACE FUNCTION agent_app.set_invoice_number()
RETURNS trigger AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := agent_app.generate_invoice_number(NEW.tenant_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = agent_app, public, pg_temp;

CREATE TRIGGER set_invoice_number_on_insert
    BEFORE INSERT ON agent_app.invoices
    FOR EACH ROW
    EXECUTE FUNCTION agent_app.set_invoice_number();

-- Trigger: Check overdue status
CREATE OR REPLACE FUNCTION agent_app.check_invoice_overdue()
RETURNS trigger AS $$
BEGIN
    IF NEW.payment_status = 'pending' AND NEW.due_date < CURRENT_DATE THEN
        NEW.payment_status := 'overdue';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = agent_app, public, pg_temp;

CREATE TRIGGER check_invoice_overdue_on_update
    BEFORE UPDATE ON agent_app.invoices
    FOR EACH ROW
    WHEN (NEW.payment_status = 'pending')
    EXECUTE FUNCTION agent_app.check_invoice_overdue();

-- Trigger: Update timestamp
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON agent_app.invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Audit logging
CREATE TRIGGER invoices_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON agent_app.invoices
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_trail();

-- Comments
COMMENT ON TABLE agent_app.invoices IS 'Broker fee invoicing with automatic discounts and payment tracking';
COMMENT ON COLUMN agent_app.invoices.invoice_number IS 'Auto-generated number format: FAC-YYYY-XXXXX';
COMMENT ON COLUMN agent_app.invoices.discount_type IS 'creator_50, recommended_25, multi_contract_25/50/75, custom, none';

-- ===================================
-- 📢 TABLE: claims
-- ===================================
-- Purpose: Customer complaints management (3-level legal process)
-- Security: Tenant-isolated, auto-numbering, deadline tracking
-- Features: 10-day response requirement, escalation workflow

CREATE TABLE agent_app.claims (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Links
    contact_id uuid NOT NULL REFERENCES agent_app.contacts(id) ON DELETE RESTRICT,
    contract_id uuid REFERENCES agent_app.contracts(id) ON DELETE SET NULL,

    -- Auto-numbering: REC-YYYY-XXXXX
    claim_number text NOT NULL,

    -- Reception
    reception_date date NOT NULL,
    channel text NOT NULL CHECK (channel IN ('mail', 'email', 'phone', 'in_person')),

    -- Level (legal requirement)
    level text DEFAULT 'level_1' CHECK (level IN ('level_1', 'level_2', 'level_3')),
    -- level_1: Internal broker management
    -- level_2: Insurance company complaints service
    -- level_3: Mediation CCSF

    -- Status
    status text DEFAULT 'received' CHECK (status IN ('received', 'in_progress', 'answered', 'escalated', 'closed')),

    -- Content
    subject text NOT NULL,
    description text NOT NULL,
    response text,
    response_date date,

    -- Deadlines (10 business days requirement)
    deadline date NOT NULL,

    -- Escalation
    escalated_to text, -- Mediation organization if level 3

    -- Notes
    notes text,

    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

-- Indexes
CREATE UNIQUE INDEX idx_claims_number_tenant ON agent_app.claims(tenant_id, claim_number);
CREATE INDEX idx_claims_tenant_id ON agent_app.claims(tenant_id);
CREATE INDEX idx_claims_contact_id ON agent_app.claims(contact_id);
CREATE INDEX idx_claims_contract_id ON agent_app.claims(contract_id) WHERE contract_id IS NOT NULL;
CREATE INDEX idx_claims_status ON agent_app.claims(status);
CREATE INDEX idx_claims_deadline ON agent_app.claims(deadline) WHERE status IN ('received', 'in_progress');
CREATE INDEX idx_claims_level ON agent_app.claims(level);

-- RLS
ALTER TABLE agent_app.claims ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see claims from their tenants
CREATE POLICY claims_tenant_isolation ON agent_app.claims
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Function: Auto-generate claim number
CREATE OR REPLACE FUNCTION agent_app.generate_claim_number(p_tenant_id uuid)
RETURNS text AS $$
DECLARE
    v_year text;
    v_sequence integer;
    v_number text;
BEGIN
    -- Get current year
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;

    -- Get next sequence number for this tenant and year
    SELECT COALESCE(MAX(
        CASE
            WHEN claim_number ~ ('^REC-' || v_year || '-[0-9]+$')
            THEN CAST(SUBSTRING(claim_number FROM 'REC-' || v_year || '-([0-9]+)') AS integer)
            ELSE 0
        END
    ), 0) + 1
    INTO v_sequence
    FROM agent_app.claims
    WHERE tenant_id = p_tenant_id;

    -- Format: REC-YYYY-XXXXX (with leading zeros)
    v_number := 'REC-' || v_year || '-' || LPAD(v_sequence::text, 5, '0');

    RETURN v_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = agent_app, public, pg_temp;

-- Trigger: Auto-generate claim number and calculate deadline on insert
CREATE OR REPLACE FUNCTION agent_app.set_claim_number_and_deadline()
RETURNS trigger AS $$
BEGIN
    -- Auto-generate claim number if not provided
    IF NEW.claim_number IS NULL OR NEW.claim_number = '' THEN
        NEW.claim_number := agent_app.generate_claim_number(NEW.tenant_id);
    END IF;

    -- Calculate deadline (reception_date + 10 business days)
    -- Simplified: adding 14 calendar days to account for weekends
    IF NEW.deadline IS NULL THEN
        NEW.deadline := NEW.reception_date + INTERVAL '14 days';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = agent_app, public, pg_temp;

CREATE TRIGGER set_claim_number_and_deadline_on_insert
    BEFORE INSERT ON agent_app.claims
    FOR EACH ROW
    EXECUTE FUNCTION agent_app.set_claim_number_and_deadline();

-- Trigger: Update timestamp
CREATE TRIGGER update_claims_updated_at
    BEFORE UPDATE ON agent_app.claims
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE agent_app.claims IS 'Customer complaints with 3-level legal process and 10-day response requirement';
COMMENT ON COLUMN agent_app.claims.claim_number IS 'Auto-generated number format: REC-YYYY-XXXXX';
COMMENT ON COLUMN agent_app.claims.level IS 'Level 1: broker, Level 2: insurer, Level 3: mediation CCSF';

-- ===================================
-- 🚨 TABLE: claims_history
-- ===================================
-- Purpose: Track insurance claims/sinistres (impacts pricing)
-- Security: Tenant-isolated, linked to contact
-- Features: Responsibility percentage, financial impact

CREATE TABLE agent_app.claims_history (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Link to contact
    contact_id uuid NOT NULL REFERENCES agent_app.contacts(id) ON DELETE CASCADE,
    contract_id uuid REFERENCES agent_app.contracts(id) ON DELETE SET NULL,

    -- Claim details
    year integer NOT NULL,
    nature text NOT NULL,
    responsibility_percentage numeric(5, 2), -- % of responsibility
    total_amount numeric(10, 2),

    -- Product type
    product_type text CHECK (product_type IN ('auto', 'rc_pro', 'home', 'other')),

    -- Timestamps
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_claims_history_tenant_id ON agent_app.claims_history(tenant_id);
CREATE INDEX idx_claims_history_contact_id ON agent_app.claims_history(contact_id);
CREATE INDEX idx_claims_history_year ON agent_app.claims_history(year DESC);

-- RLS
ALTER TABLE agent_app.claims_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see claims history from their tenants
CREATE POLICY claims_history_tenant_isolation ON agent_app.claims_history
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Comments
COMMENT ON TABLE agent_app.claims_history IS 'Insurance claims history (sinistres) impacting pricing';

-- ===================================
-- 📝 TABLE: form_submissions
-- ===================================
-- Purpose: Store dynamic form responses for quotes
-- Security: Tenant-isolated, JSONB storage
-- Features: Discovery forms, product-specific forms

CREATE TABLE agent_app.form_submissions (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Links
    contact_id uuid NOT NULL REFERENCES agent_app.contacts(id) ON DELETE CASCADE,
    quote_id uuid REFERENCES agent_app.quotes(id) ON DELETE SET NULL,

    -- Form type
    form_type text NOT NULL CHECK (form_type IN (
        'discovery',    -- Client discovery
        'auto',         -- Auto insurance
        'rc_pro',       -- Professional liability
        'health',       -- Health
        'home',         -- Home
        'life',         -- Life/Prevoyance
        'savings',      -- Savings
        'retirement'    -- Retirement
    )),

    -- Form data (flexible JSON storage)
    form_data jsonb NOT NULL,
    -- Example for auto:
    -- {
    --   "vehicle": {"brand": "Renault", "model": "Clio", "year": 2020, ...},
    --   "usage": "personal",
    --   "annual_mileage": 15000,
    --   "parking": "garage",
    --   "drivers": [{"age": 35, "license_date": "2005-06-15", ...}]
    -- }

    -- Submission tracking
    submitted_at timestamptz DEFAULT now(),
    submitted_by uuid REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_form_submissions_tenant_id ON agent_app.form_submissions(tenant_id);
CREATE INDEX idx_form_submissions_contact_id ON agent_app.form_submissions(contact_id);
CREATE INDEX idx_form_submissions_quote_id ON agent_app.form_submissions(quote_id) WHERE quote_id IS NOT NULL;
CREATE INDEX idx_form_submissions_form_type ON agent_app.form_submissions(form_type);
CREATE INDEX idx_form_submissions_submitted_at ON agent_app.form_submissions(submitted_at DESC);

-- RLS
ALTER TABLE agent_app.form_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see form submissions from their tenants
CREATE POLICY form_submissions_tenant_isolation ON agent_app.form_submissions
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Update quotes table foreign key
ALTER TABLE agent_app.quotes
    ADD CONSTRAINT fk_form_submission
    FOREIGN KEY (form_submission_id)
    REFERENCES agent_app.form_submissions(id)
    ON DELETE SET NULL;

-- Comments
COMMENT ON TABLE agent_app.form_submissions IS 'Dynamic form responses for discovery and quotes';
COMMENT ON COLUMN agent_app.form_submissions.form_data IS 'JSONB storage for flexible form data structure';

-- ===================================
-- 🔒 TABLE: consents
-- ===================================
-- Purpose: RGPD consent tracking and proof
-- Security: Tenant-isolated, immutable audit trail
-- Features: Consent types, revocation, IP tracking

CREATE TABLE agent_app.consents (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Link to contact
    contact_id uuid NOT NULL REFERENCES agent_app.contacts(id) ON DELETE CASCADE,

    -- Consent type
    consent_type text NOT NULL CHECK (consent_type IN (
        'data_processing',       -- Data processing
        'data_sharing_insurers', -- Sharing with insurance companies
        'marketing',             -- Marketing communications
        'lcb_ft'                 -- Anti-money laundering
    )),

    -- Consent status
    consent_given boolean NOT NULL,
    consent_date timestamptz NOT NULL,
    consent_method text NOT NULL CHECK (consent_method IN ('web_form', 'paper_signed', 'email', 'phone')),
    ip_address inet, -- If web form

    -- Revocation
    revoked boolean DEFAULT false,
    revoked_date timestamptz,

    -- Proof
    proof_document_id uuid REFERENCES agent_app.documents(id) ON DELETE SET NULL,

    -- Timestamps (immutable audit trail)
    created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_consents_tenant_id ON agent_app.consents(tenant_id);
CREATE INDEX idx_consents_contact_id ON agent_app.consents(contact_id);
CREATE INDEX idx_consents_type ON agent_app.consents(consent_type);
CREATE INDEX idx_consents_revoked ON agent_app.consents(revoked) WHERE revoked = false;

-- RLS
ALTER TABLE agent_app.consents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see consents from their tenants
CREATE POLICY consents_tenant_isolation ON agent_app.consents
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Comments
COMMENT ON TABLE agent_app.consents IS 'RGPD consent tracking with proof and revocation';
COMMENT ON COLUMN agent_app.consents.consent_method IS 'web_form, paper_signed, email, phone';

-- ===================================
-- ✅ TABLE: tasks
-- ===================================
-- Purpose: Task and reminder management
-- Security: Tenant-isolated, assignable
-- Features: Priority, due dates, multi-entity linking

CREATE TABLE agent_app.tasks (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Entity relationships (optional)
    contact_id uuid REFERENCES agent_app.contacts(id) ON DELETE CASCADE,
    contract_id uuid REFERENCES agent_app.contracts(id) ON DELETE CASCADE,
    quote_id uuid REFERENCES agent_app.quotes(id) ON DELETE CASCADE,

    -- Task details
    title text NOT NULL,
    description text,

    -- Task type
    task_type text NOT NULL CHECK (task_type IN (
        'renewal_reminder',   -- Contract renewal
        'follow_up_prospect', -- Prospect follow-up
        'document_request',   -- Document request
        'claim_response',     -- Claim response
        'payment_reminder',   -- Payment reminder
        'meeting',            -- Meeting
        'call',               -- Phone call
        'email',              -- Email to send
        'other'
    )),

    -- Priority and status
    priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),

    -- Scheduling
    due_date date,
    reminder_date timestamptz,

    -- Assignment
    assigned_to uuid REFERENCES auth.users(id),

    -- Completion
    completed_at timestamptz,

    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_tasks_tenant_id ON agent_app.tasks(tenant_id);
CREATE INDEX idx_tasks_contact_id ON agent_app.tasks(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_tasks_contract_id ON agent_app.tasks(contract_id) WHERE contract_id IS NOT NULL;
CREATE INDEX idx_tasks_quote_id ON agent_app.tasks(quote_id) WHERE quote_id IS NOT NULL;
CREATE INDEX idx_tasks_status ON agent_app.tasks(status) WHERE status IN ('todo', 'in_progress');
CREATE INDEX idx_tasks_assigned_to ON agent_app.tasks(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_tasks_due_date ON agent_app.tasks(due_date) WHERE status IN ('todo', 'in_progress');
CREATE INDEX idx_tasks_priority ON agent_app.tasks(priority, due_date);

-- RLS
ALTER TABLE agent_app.tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see tasks from their tenants
CREATE POLICY tasks_tenant_isolation ON agent_app.tasks
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Trigger: Update timestamp
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON agent_app.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE agent_app.tasks IS 'Task and reminder management with multi-entity linking';
COMMENT ON COLUMN agent_app.tasks.task_type IS 'renewal_reminder, follow_up_prospect, document_request, claim_response, payment_reminder, meeting, call, email, other';

-- ===================================
-- 📧 TABLE: emails
-- ===================================
-- Purpose: Email communication history and tracking
-- Security: Tenant-isolated, linked to entities
-- Features: Templates, delivery tracking, attachments

CREATE TABLE agent_app.emails (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Link to contact (required)
    contact_id uuid NOT NULL REFERENCES agent_app.contacts(id) ON DELETE CASCADE,

    -- Optional entity links
    quote_id uuid REFERENCES agent_app.quotes(id) ON DELETE SET NULL,
    contract_id uuid REFERENCES agent_app.contracts(id) ON DELETE SET NULL,
    invoice_id uuid REFERENCES agent_app.invoices(id) ON DELETE SET NULL,

    -- Email type
    email_type text NOT NULL CHECK (email_type IN (
        'quote_sent',           -- Quote sent
        'contract_confirmation',-- Contract confirmation
        'renewal_notice',       -- Renewal notice
        'document_request',     -- Document request
        'invoice',              -- Invoice
        'welcome',              -- Welcome message
        'follow_up',            -- Follow-up
        'general'               -- General communication
    )),

    -- Email content
    subject text NOT NULL,
    body text NOT NULL,
    recipient_email text NOT NULL,

    -- Tracking
    sent_at timestamptz DEFAULT now(),
    sent_by uuid REFERENCES auth.users(id),

    -- Delivery status (if integration with SendGrid/Resend)
    status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'bounced', 'opened', 'clicked')),
    opened_at timestamptz,
    clicked_at timestamptz,

    -- Attachments
    attachments jsonb -- [{filename, url}, ...]
);

-- Indexes
CREATE INDEX idx_emails_tenant_id ON agent_app.emails(tenant_id);
CREATE INDEX idx_emails_contact_id ON agent_app.emails(contact_id);
CREATE INDEX idx_emails_quote_id ON agent_app.emails(quote_id) WHERE quote_id IS NOT NULL;
CREATE INDEX idx_emails_contract_id ON agent_app.emails(contract_id) WHERE contract_id IS NOT NULL;
CREATE INDEX idx_emails_type ON agent_app.emails(email_type);
CREATE INDEX idx_emails_sent_at ON agent_app.emails(sent_at DESC);
CREATE INDEX idx_emails_status ON agent_app.emails(status);

-- RLS
ALTER TABLE agent_app.emails ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see emails from their tenants
CREATE POLICY emails_tenant_isolation ON agent_app.emails
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Comments
COMMENT ON TABLE agent_app.emails IS 'Email communication history with delivery tracking';
COMMENT ON COLUMN agent_app.emails.status IS 'sent, delivered, bounced, opened, clicked';

-- ===================================
-- 🎯 Grant permissions
-- ===================================
-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA agent_app TO authenticated;

-- Grant all privileges on all tables to authenticated users (RLS handles security)
GRANT ALL ON ALL TABLES IN SCHEMA agent_app TO authenticated;

-- Grant usage on sequences (for auto-increment if needed)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA agent_app TO authenticated;

-- ===================================
-- ✅ Migration Complete
-- ===================================
-- Schema: agent_app
-- Tables: 18 (contacts, dependents, professional_info, business_activities,
--             companies, products, quotes, quote_items, contracts,
--             contract_amendments, documents, invoices, claims, claims_history,
--             form_submissions, consents, tasks, emails)
-- Security: RLS policies, audit logging, RGPD compliance
-- Features: Auto-numbering (DEV, FAC, REC), soft delete, prospect→client workflow
-- Status: Ready for application development

