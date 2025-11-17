-- =====================================================
-- SCHEMA: immo_app
-- Description: Générateur de Baux Immobiliers (Real Estate Lease Generator)
-- Features:
--   - Multi-country lease generation (8 European countries)
--   - Credit-based pricing system
--   - Template management
--   - Document generation (DOCX/PDF)
--   - Email integration
--   - N8N workflow automation
-- Created: 2025-11-17
-- =====================================================

-- Create schema
CREATE SCHEMA IF NOT EXISTS immo_app;

-- Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. COUNTRIES & REGIONS
-- =====================================================

-- Supported countries for lease generation
CREATE TABLE immo_app.countries (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    code text NOT NULL UNIQUE, -- FR, BE, CH, DE, ES, IT, PT, LU
    name text NOT NULL,
    currency_code text NOT NULL DEFAULT 'EUR', -- EUR, CHF
    locale text NOT NULL DEFAULT 'fr_FR', -- fr_FR, de_DE, es_ES, it_IT, pt_PT
    is_active boolean NOT NULL DEFAULT true,
    legal_requirements jsonb, -- Country-specific legal requirements
    metadata jsonb,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_countries_code ON immo_app.countries(code) WHERE is_active = true;
CREATE INDEX idx_countries_active ON immo_app.countries(is_active);

-- =====================================================
-- 2. CREDIT SYSTEM
-- =====================================================

-- Credit packages available for purchase
CREATE TABLE immo_app.credit_packages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    name text NOT NULL,
    description text,
    credit_amount integer NOT NULL CHECK (credit_amount > 0),
    price_ht decimal(10,2) NOT NULL CHECK (price_ht >= 0),
    price_ttc decimal(10,2) NOT NULL CHECK (price_ttc >= price_ht),
    currency text NOT NULL DEFAULT 'EUR',

    -- Bonus credits (promotional)
    bonus_credits integer DEFAULT 0 CHECK (bonus_credits >= 0),

    -- Validity
    validity_days integer, -- NULL = unlimited

    -- Display
    display_order integer DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    is_featured boolean DEFAULT false,

    metadata jsonb,

    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id),
    deleted_at timestamptz,
    deleted_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_credit_packages_tenant ON immo_app.credit_packages(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_credit_packages_active ON immo_app.credit_packages(is_active) WHERE deleted_at IS NULL;

-- Credit purchases by users
CREATE TABLE immo_app.credit_purchases (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id uuid NOT NULL REFERENCES immo_app.credit_packages(id),

    -- Purchase details
    credits_purchased integer NOT NULL CHECK (credits_purchased > 0),
    bonus_credits integer DEFAULT 0 CHECK (bonus_credits >= 0),
    total_credits integer GENERATED ALWAYS AS (credits_purchased + bonus_credits) STORED,

    price_ht decimal(10,2) NOT NULL CHECK (price_ht >= 0),
    price_ttc decimal(10,2) NOT NULL CHECK (price_ttc >= price_ht),
    currency text NOT NULL DEFAULT 'EUR',

    -- Validity
    valid_from timestamptz NOT NULL DEFAULT now(),
    valid_until timestamptz, -- NULL = unlimited

    -- Payment
    payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method text, -- stripe, paypal, invoice, etc.
    payment_reference text,
    paid_at timestamptz,

    -- Invoice
    invoice_number text,
    invoice_url text,

    metadata jsonb,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_purchases_tenant ON immo_app.credit_purchases(tenant_id);
CREATE INDEX idx_credit_purchases_user ON immo_app.credit_purchases(user_id);
CREATE INDEX idx_credit_purchases_status ON immo_app.credit_purchases(payment_status);
CREATE INDEX idx_credit_purchases_validity ON immo_app.credit_purchases(valid_from, valid_until);

-- Credit balance and transaction tracking
CREATE TABLE immo_app.credit_transactions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Transaction type
    transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'adjustment', 'expiration')),

    -- Credits
    credits_added integer DEFAULT 0 CHECK (credits_added >= 0),
    credits_used integer DEFAULT 0 CHECK (credits_used >= 0),
    credits_balance integer NOT NULL CHECK (credits_balance >= 0), -- Running balance

    -- References
    purchase_id uuid REFERENCES immo_app.credit_purchases(id),
    lease_id uuid, -- References immo_app.generated_leases(id) - created later

    description text,
    metadata jsonb,

    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_credit_transactions_tenant ON immo_app.credit_transactions(tenant_id);
CREATE INDEX idx_credit_transactions_user ON immo_app.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON immo_app.credit_transactions(transaction_type);
CREATE INDEX idx_credit_transactions_created ON immo_app.credit_transactions(created_at DESC);

-- =====================================================
-- 3. LEASE TEMPLATES
-- =====================================================

-- Lease templates for different countries and types
CREATE TABLE immo_app.lease_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Template info
    name text NOT NULL,
    description text,
    country_id uuid NOT NULL REFERENCES immo_app.countries(id),

    -- Lease type
    lease_type text NOT NULL CHECK (lease_type IN ('residential', 'commercial', 'professional', 'mixed', 'seasonal', 'parking', 'storage')),

    -- Template file
    template_file_path text NOT NULL, -- Path to DOCX template in storage
    template_version text NOT NULL DEFAULT '1.0',

    -- Legal compliance
    legal_framework text, -- Law reference (e.g., "Loi Alur 2014")
    last_legal_update date,

    -- Fields configuration (JSONB for flexibility)
    required_fields jsonb NOT NULL DEFAULT '[]', -- Array of field names
    optional_fields jsonb DEFAULT '[]',
    conditional_fields jsonb DEFAULT '{}', -- Fields shown based on conditions

    -- Pricing
    credit_cost integer NOT NULL DEFAULT 1 CHECK (credit_cost > 0),

    -- Status
    is_active boolean NOT NULL DEFAULT true,
    is_public boolean DEFAULT true, -- Available to all tenants or custom

    -- Display
    display_order integer DEFAULT 0,
    thumbnail_url text,

    metadata jsonb,

    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id),
    deleted_at timestamptz,
    deleted_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_lease_templates_tenant ON immo_app.lease_templates(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_lease_templates_country ON immo_app.lease_templates(country_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_lease_templates_type ON immo_app.lease_templates(lease_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_lease_templates_active ON immo_app.lease_templates(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_lease_templates_public ON immo_app.lease_templates(is_public) WHERE deleted_at IS NULL;

-- Template field definitions
CREATE TABLE immo_app.template_fields (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id uuid NOT NULL REFERENCES immo_app.lease_templates(id) ON DELETE CASCADE,

    -- Field info
    field_name text NOT NULL,
    field_label text NOT NULL,
    field_type text NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'currency', 'select', 'multiselect', 'boolean', 'textarea', 'email', 'phone', 'address')),

    -- Validation
    is_required boolean DEFAULT false,
    validation_rules jsonb, -- Min/max, regex, etc.

    -- Options for select/multiselect
    options jsonb, -- Array of {value, label}

    -- Default value
    default_value text,

    -- Conditional display
    condition jsonb, -- {field: 'lease_type', operator: 'equals', value: 'commercial'}

    -- Help text
    placeholder text,
    help_text text,

    -- Display
    display_order integer DEFAULT 0,
    section text, -- Group fields into sections

    metadata jsonb,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_template_fields_template ON immo_app.template_fields(template_id);
CREATE INDEX idx_template_fields_order ON immo_app.template_fields(template_id, display_order);

-- =====================================================
-- 4. PROPERTIES
-- =====================================================

-- Properties (for reuse across leases)
CREATE TABLE immo_app.properties (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Property identification
    property_type text NOT NULL CHECK (property_type IN ('apartment', 'house', 'commercial', 'office', 'parking', 'storage', 'land', 'other')),

    -- Address
    address_line1 text NOT NULL,
    address_line2 text,
    postal_code text NOT NULL,
    city text NOT NULL,
    country_id uuid NOT NULL REFERENCES immo_app.countries(id),

    -- Details
    surface_area decimal(10,2), -- m²
    rooms integer,
    bedrooms integer,
    bathrooms integer,
    floor integer,
    building_year integer,

    -- Features (JSONB for flexibility)
    features jsonb, -- {elevator: true, parking: true, garage: false, ...}

    -- Energy performance
    energy_class text CHECK (energy_class IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
    ges_class text CHECK (ges_class IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),

    -- Cadastral reference
    cadastral_reference text,

    -- Photos/documents
    photos jsonb, -- Array of URLs
    documents jsonb, -- Array of {name, url, type}

    -- Notes
    description text,
    internal_notes text,

    metadata jsonb,

    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id),
    deleted_at timestamptz,
    deleted_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_properties_tenant ON immo_app.properties(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_country ON immo_app.properties(country_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_type ON immo_app.properties(property_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_city ON immo_app.properties(city) WHERE deleted_at IS NULL;

-- =====================================================
-- 5. LEASE PARTIES (Lessors & Lessees)
-- =====================================================

-- Parties involved in leases (lessors and lessees)
CREATE TABLE immo_app.lease_parties (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Party type
    party_type text NOT NULL CHECK (party_type IN ('lessor', 'lessee')),
    entity_type text NOT NULL CHECK (entity_type IN ('individual', 'company')),

    -- Individual
    title text CHECK (title IN ('M', 'MME', 'MLLE', 'MR', 'MRS', 'MS')),
    first_name text,
    last_name text,
    birth_date date,
    birth_place text,
    nationality text,

    -- Company
    company_name text,
    legal_form text, -- SARL, SAS, SA, etc.
    siret text,
    siren text,
    vat_number text,

    -- Contact
    email text,
    phone text,
    mobile_phone text,

    -- Address
    address_line1 text,
    address_line2 text,
    postal_code text,
    city text,
    country_id uuid REFERENCES immo_app.countries(id),

    -- Legal representative (for companies)
    legal_representative jsonb, -- {first_name, last_name, title, function}

    -- Identity documents
    identity_type text CHECK (identity_type IN ('id_card', 'passport', 'residence_permit', 'driving_license')),
    identity_number text,
    identity_expiry_date date,
    identity_document_url text,

    -- Bank details (for lessees - rent payment)
    iban text,
    bic text,
    bank_name text,

    -- Notes
    notes text,

    metadata jsonb,

    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id),
    deleted_at timestamptz,
    deleted_by uuid REFERENCES auth.users(id),

    -- Constraints
    CONSTRAINT valid_individual_name CHECK (
        entity_type != 'individual' OR (first_name IS NOT NULL AND last_name IS NOT NULL)
    ),
    CONSTRAINT valid_company_name CHECK (
        entity_type != 'company' OR company_name IS NOT NULL
    )
);

CREATE INDEX idx_lease_parties_tenant ON immo_app.lease_parties(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_lease_parties_type ON immo_app.lease_parties(party_type, entity_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_lease_parties_email ON immo_app.lease_parties(email) WHERE deleted_at IS NULL;

-- =====================================================
-- 6. GENERATED LEASES
-- =====================================================

-- Generated lease documents
CREATE TABLE immo_app.generated_leases (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id),

    -- Lease identification
    lease_number text, -- Auto-generated: BAIL-YYYY-XXXXX
    lease_name text, -- User-friendly name

    -- Template
    template_id uuid NOT NULL REFERENCES immo_app.lease_templates(id),
    country_id uuid NOT NULL REFERENCES immo_app.countries(id),
    lease_type text NOT NULL,

    -- Property
    property_id uuid REFERENCES immo_app.properties(id),

    -- Parties
    lessor_id uuid NOT NULL REFERENCES immo_app.lease_parties(id),
    lessee_id uuid NOT NULL REFERENCES immo_app.lease_parties(id),
    co_lessees jsonb, -- Array of additional lessee IDs

    -- Lease dates
    start_date date NOT NULL,
    end_date date,
    duration_months integer,

    -- Financial
    monthly_rent decimal(10,2) NOT NULL CHECK (monthly_rent >= 0),
    charges decimal(10,2) DEFAULT 0 CHECK (charges >= 0),
    deposit decimal(10,2) DEFAULT 0 CHECK (deposit >= 0),
    currency text NOT NULL DEFAULT 'EUR',

    -- Form data (all user inputs)
    form_data jsonb NOT NULL,

    -- Generation status
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'failed', 'archived')),
    generation_error text,

    -- Generated files
    docx_url text,
    pdf_url text,

    -- Credits
    credits_used integer NOT NULL DEFAULT 1,
    credit_transaction_id uuid REFERENCES immo_app.credit_transactions(id),

    -- Email sent
    email_sent boolean DEFAULT false,
    email_sent_at timestamptz,

    -- Workflow
    workflow_webhook_id uuid, -- References immo_app.webhooks(id)
    workflow_triggered boolean DEFAULT false,
    workflow_triggered_at timestamptz,

    metadata jsonb,

    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id),
    deleted_at timestamptz,
    deleted_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_generated_leases_tenant ON immo_app.generated_leases(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_generated_leases_user ON immo_app.generated_leases(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_generated_leases_number ON immo_app.generated_leases(lease_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_generated_leases_template ON immo_app.generated_leases(template_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_generated_leases_status ON immo_app.generated_leases(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_generated_leases_dates ON immo_app.generated_leases(start_date, end_date);
CREATE INDEX idx_generated_leases_property ON immo_app.generated_leases(property_id) WHERE deleted_at IS NULL;

-- Add foreign key constraint after table creation
ALTER TABLE immo_app.credit_transactions
    ADD CONSTRAINT fk_credit_transactions_lease
    FOREIGN KEY (lease_id)
    REFERENCES immo_app.generated_leases(id);

-- =====================================================
-- 7. EMAIL TRACKING
-- =====================================================

-- Email sending history
CREATE TABLE immo_app.email_history (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Email details
    recipient_email text NOT NULL,
    recipient_name text,
    subject text NOT NULL,
    body_html text,
    body_text text,

    -- Attachments
    attachments jsonb, -- Array of {filename, url, size}

    -- Related lease
    lease_id uuid REFERENCES immo_app.generated_leases(id),

    -- Email service
    email_provider text, -- resend, sendgrid, mailgun, etc.
    provider_message_id text,

    -- Status tracking
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
    sent_at timestamptz,
    delivered_at timestamptz,
    opened_at timestamptz,
    clicked_at timestamptz,
    bounced_at timestamptz,

    -- Error handling
    error_message text,
    retry_count integer DEFAULT 0,

    metadata jsonb,

    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_email_history_tenant ON immo_app.email_history(tenant_id);
CREATE INDEX idx_email_history_lease ON immo_app.email_history(lease_id);
CREATE INDEX idx_email_history_status ON immo_app.email_history(status);
CREATE INDEX idx_email_history_recipient ON immo_app.email_history(recipient_email);
CREATE INDEX idx_email_history_created ON immo_app.email_history(created_at DESC);

-- =====================================================
-- 8. WEBHOOKS & N8N INTEGRATION
-- =====================================================

-- Webhook configurations for N8N workflows
CREATE TABLE immo_app.webhooks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Webhook info
    name text NOT NULL,
    description text,

    -- Trigger event
    event_type text NOT NULL CHECK (event_type IN ('lease_generated', 'lease_signed', 'email_sent', 'credit_purchased', 'custom')),

    -- Webhook URL
    webhook_url text NOT NULL,
    method text NOT NULL DEFAULT 'POST' CHECK (method IN ('POST', 'PUT', 'PATCH')),

    -- Authentication
    auth_type text CHECK (auth_type IN ('none', 'bearer', 'basic', 'api_key')),
    auth_credentials jsonb, -- Encrypted credentials

    -- Headers
    custom_headers jsonb,

    -- Payload configuration
    payload_template jsonb, -- Template for webhook payload

    -- Filters
    filters jsonb, -- Conditions to trigger webhook

    -- Status
    is_active boolean NOT NULL DEFAULT true,

    -- Statistics
    total_calls integer DEFAULT 0,
    last_called_at timestamptz,
    last_status_code integer,
    last_error text,

    metadata jsonb,

    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id),
    deleted_at timestamptz,
    deleted_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_webhooks_tenant ON immo_app.webhooks(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_webhooks_event ON immo_app.webhooks(event_type) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_webhooks_active ON immo_app.webhooks(is_active) WHERE deleted_at IS NULL;

-- Webhook call logs
CREATE TABLE immo_app.webhook_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id uuid NOT NULL REFERENCES immo_app.webhooks(id) ON DELETE CASCADE,

    -- Request
    request_url text NOT NULL,
    request_method text NOT NULL,
    request_headers jsonb,
    request_payload jsonb,

    -- Response
    response_status_code integer,
    response_body text,
    response_time_ms integer, -- Response time in milliseconds

    -- Status
    success boolean NOT NULL,
    error_message text,

    -- Related entity
    lease_id uuid REFERENCES immo_app.generated_leases(id),

    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_logs_webhook ON immo_app.webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_lease ON immo_app.webhook_logs(lease_id);
CREATE INDEX idx_webhook_logs_created ON immo_app.webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_success ON immo_app.webhook_logs(success);

-- =====================================================
-- 9. FUNCTIONS
-- =====================================================

-- Generate lease number: BAIL-YYYY-XXXXX
CREATE OR REPLACE FUNCTION immo_app.generate_lease_number(p_tenant_id uuid)
RETURNS text AS $$
DECLARE
    v_year text;
    v_sequence integer;
    v_number text;
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;

    SELECT COALESCE(MAX(
        CASE
            WHEN lease_number ~ ('^BAIL-' || v_year || '-[0-9]+$')
            THEN CAST(SUBSTRING(lease_number FROM 'BAIL-' || v_year || '-([0-9]+)') AS integer)
            ELSE 0
        END
    ), 0) + 1
    INTO v_sequence
    FROM immo_app.generated_leases
    WHERE tenant_id = p_tenant_id;

    v_number := 'BAIL-' || v_year || '-' || LPAD(v_sequence::text, 5, '0');

    RETURN v_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = immo_app, public, pg_temp;

-- Get user credit balance
CREATE OR REPLACE FUNCTION immo_app.get_user_credit_balance(p_user_id uuid, p_tenant_id uuid)
RETURNS integer AS $$
DECLARE
    v_balance integer;
BEGIN
    SELECT COALESCE(credits_balance, 0)
    INTO v_balance
    FROM immo_app.credit_transactions
    WHERE user_id = p_user_id
      AND tenant_id = p_tenant_id
    ORDER BY created_at DESC
    LIMIT 1;

    RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = immo_app, public, pg_temp;

-- Check if user has sufficient credits
CREATE OR REPLACE FUNCTION immo_app.check_user_credits(p_user_id uuid, p_tenant_id uuid, p_credits_needed integer)
RETURNS boolean AS $$
DECLARE
    v_balance integer;
BEGIN
    v_balance := immo_app.get_user_credit_balance(p_user_id, p_tenant_id);
    RETURN v_balance >= p_credits_needed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = immo_app, public, pg_temp;

-- Use credits (deduct from balance)
CREATE OR REPLACE FUNCTION immo_app.use_credits(
    p_user_id uuid,
    p_tenant_id uuid,
    p_credits integer,
    p_lease_id uuid,
    p_description text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_current_balance integer;
    v_new_balance integer;
    v_transaction_id uuid;
BEGIN
    -- Get current balance
    v_current_balance := immo_app.get_user_credit_balance(p_user_id, p_tenant_id);

    -- Check sufficient credits
    IF v_current_balance < p_credits THEN
        RAISE EXCEPTION 'Insufficient credits. Balance: %, Required: %', v_current_balance, p_credits;
    END IF;

    -- Calculate new balance
    v_new_balance := v_current_balance - p_credits;

    -- Create transaction
    INSERT INTO immo_app.credit_transactions (
        tenant_id,
        user_id,
        transaction_type,
        credits_used,
        credits_balance,
        lease_id,
        description,
        created_by
    ) VALUES (
        p_tenant_id,
        p_user_id,
        'usage',
        p_credits,
        v_new_balance,
        p_lease_id,
        COALESCE(p_description, 'Lease generation'),
        p_user_id
    )
    RETURNING id INTO v_transaction_id;

    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = immo_app, public, pg_temp;

-- Add credits (purchase or adjustment)
CREATE OR REPLACE FUNCTION immo_app.add_credits(
    p_user_id uuid,
    p_tenant_id uuid,
    p_credits integer,
    p_purchase_id uuid DEFAULT NULL,
    p_transaction_type text DEFAULT 'purchase',
    p_description text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_current_balance integer;
    v_new_balance integer;
    v_transaction_id uuid;
BEGIN
    -- Get current balance
    v_current_balance := immo_app.get_user_credit_balance(p_user_id, p_tenant_id);

    -- Calculate new balance
    v_new_balance := v_current_balance + p_credits;

    -- Create transaction
    INSERT INTO immo_app.credit_transactions (
        tenant_id,
        user_id,
        transaction_type,
        credits_added,
        credits_balance,
        purchase_id,
        description,
        created_by
    ) VALUES (
        p_tenant_id,
        p_user_id,
        p_transaction_type,
        p_credits,
        v_new_balance,
        p_purchase_id,
        COALESCE(p_description, 'Credit purchase'),
        p_user_id
    )
    RETURNING id INTO v_transaction_id;

    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = immo_app, public, pg_temp;

-- Trigger: Auto-generate lease number
CREATE OR REPLACE FUNCTION immo_app.set_lease_number()
RETURNS trigger AS $$
BEGIN
    IF NEW.lease_number IS NULL THEN
        NEW.lease_number := immo_app.generate_lease_number(NEW.tenant_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = immo_app, public, pg_temp;

CREATE TRIGGER set_lease_number_on_insert
    BEFORE INSERT ON immo_app.generated_leases
    FOR EACH ROW
    EXECUTE FUNCTION immo_app.set_lease_number();

-- Trigger: Trigger webhook on lease generation
CREATE OR REPLACE FUNCTION immo_app.trigger_lease_webhook()
RETURNS trigger AS $$
BEGIN
    -- This would be implemented to call webhooks
    -- For now, just a placeholder
    -- In production, use pg_notify or external service
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        PERFORM pg_notify('lease_generated', json_build_object(
            'lease_id', NEW.id,
            'tenant_id', NEW.tenant_id,
            'user_id', NEW.user_id
        )::text);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = immo_app, public, pg_temp;

CREATE TRIGGER trigger_lease_webhook_on_update
    AFTER UPDATE ON immo_app.generated_leases
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION immo_app.trigger_lease_webhook();

-- Trigger: Update timestamps
CREATE OR REPLACE FUNCTION immo_app.update_timestamp()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = immo_app, public, pg_temp;

-- Apply update_timestamp trigger to all tables with updated_at
CREATE TRIGGER update_countries_timestamp
    BEFORE UPDATE ON immo_app.countries
    FOR EACH ROW
    EXECUTE FUNCTION immo_app.update_timestamp();

CREATE TRIGGER update_credit_packages_timestamp
    BEFORE UPDATE ON immo_app.credit_packages
    FOR EACH ROW
    EXECUTE FUNCTION immo_app.update_timestamp();

CREATE TRIGGER update_credit_purchases_timestamp
    BEFORE UPDATE ON immo_app.credit_purchases
    FOR EACH ROW
    EXECUTE FUNCTION immo_app.update_timestamp();

CREATE TRIGGER update_lease_templates_timestamp
    BEFORE UPDATE ON immo_app.lease_templates
    FOR EACH ROW
    EXECUTE FUNCTION immo_app.update_timestamp();

CREATE TRIGGER update_template_fields_timestamp
    BEFORE UPDATE ON immo_app.template_fields
    FOR EACH ROW
    EXECUTE FUNCTION immo_app.update_timestamp();

CREATE TRIGGER update_properties_timestamp
    BEFORE UPDATE ON immo_app.properties
    FOR EACH ROW
    EXECUTE FUNCTION immo_app.update_timestamp();

CREATE TRIGGER update_lease_parties_timestamp
    BEFORE UPDATE ON immo_app.lease_parties
    FOR EACH ROW
    EXECUTE FUNCTION immo_app.update_timestamp();

CREATE TRIGGER update_generated_leases_timestamp
    BEFORE UPDATE ON immo_app.generated_leases
    FOR EACH ROW
    EXECUTE FUNCTION immo_app.update_timestamp();

CREATE TRIGGER update_webhooks_timestamp
    BEFORE UPDATE ON immo_app.webhooks
    FOR EACH ROW
    EXECUTE FUNCTION immo_app.update_timestamp();

-- =====================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE immo_app.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE immo_app.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE immo_app.credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE immo_app.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE immo_app.lease_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE immo_app.template_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE immo_app.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE immo_app.lease_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE immo_app.generated_leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE immo_app.email_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE immo_app.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE immo_app.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Countries: Public read, admin write
CREATE POLICY countries_read ON immo_app.countries
    FOR SELECT
    USING (true); -- Public read

CREATE POLICY countries_write ON immo_app.countries
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.user_tenant_roles
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
    ));

-- Credit packages: Tenant isolation
CREATE POLICY credit_packages_tenant_isolation ON immo_app.credit_packages
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Credit purchases: User and tenant isolation
CREATE POLICY credit_purchases_tenant_isolation ON immo_app.credit_purchases
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Credit transactions: User and tenant isolation
CREATE POLICY credit_transactions_tenant_isolation ON immo_app.credit_transactions
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Lease templates: Public templates OR tenant-specific
CREATE POLICY lease_templates_read ON immo_app.lease_templates
    FOR SELECT
    USING (
        is_public = true OR
        tenant_id IN (SELECT unnest(get_current_user_tenant_ids()))
    );

CREATE POLICY lease_templates_write ON immo_app.lease_templates
    FOR INSERT OR UPDATE OR DELETE
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Template fields: Via template
CREATE POLICY template_fields_access ON immo_app.template_fields
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM immo_app.lease_templates t
            WHERE t.id = template_fields.template_id
              AND (t.is_public = true OR t.tenant_id IN (SELECT unnest(get_current_user_tenant_ids())))
        )
    );

-- Properties: Tenant isolation
CREATE POLICY properties_tenant_isolation ON immo_app.properties
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Lease parties: Tenant isolation
CREATE POLICY lease_parties_tenant_isolation ON immo_app.lease_parties
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Generated leases: Tenant isolation
CREATE POLICY generated_leases_tenant_isolation ON immo_app.generated_leases
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Email history: Tenant isolation
CREATE POLICY email_history_tenant_isolation ON immo_app.email_history
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Webhooks: Tenant isolation
CREATE POLICY webhooks_tenant_isolation ON immo_app.webhooks
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Webhook logs: Via webhook
CREATE POLICY webhook_logs_access ON immo_app.webhook_logs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM immo_app.webhooks w
            WHERE w.id = webhook_logs.webhook_id
              AND w.tenant_id IN (SELECT unnest(get_current_user_tenant_ids()))
        )
    );

-- =====================================================
-- 11. SEED DATA - SUPPORTED COUNTRIES
-- =====================================================

INSERT INTO immo_app.countries (code, name, currency_code, locale, legal_requirements) VALUES
('FR', 'France', 'EUR', 'fr_FR', '{"law": "Loi ALUR 2014", "min_duration_residential": 36, "deposit_limit": 1}'::jsonb),
('BE', 'Belgique', 'EUR', 'fr_BE', '{"law": "Code Civil Belge", "min_duration_residential": 9, "deposit_limit": 2}'::jsonb),
('CH', 'Suisse', 'CHF', 'fr_CH', '{"law": "Code des obligations", "min_duration_residential": 12}'::jsonb),
('DE', 'Allemagne', 'EUR', 'de_DE', '{"law": "BGB", "min_duration_residential": 12, "deposit_limit": 3}'::jsonb),
('ES', 'Espagne', 'EUR', 'es_ES', '{"law": "LAU", "min_duration_residential": 12, "deposit_limit": 1}'::jsonb),
('IT', 'Italie', 'EUR', 'it_IT', '{"law": "Legge 431/98", "min_duration_residential": 48}'::jsonb),
('PT', 'Portugal', 'EUR', 'pt_PT', '{"law": "NRAU", "min_duration_residential": 12, "deposit_limit": 2}'::jsonb),
('LU', 'Luxembourg', 'EUR', 'fr_LU', '{"law": "Code Civil Luxembourgeois", "min_duration_residential": 12, "deposit_limit": 3}'::jsonb);

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================

-- Total tables: 12
-- Total indexes: 70+
-- Total functions: 8
-- Total triggers: 11
-- Total RLS policies: 12
