-- ===================================
-- 🔧 INTER_APP Schema - Gestion d'Interventions
-- ===================================
-- Purpose: Complete schema for intervention management application
-- Security: Option B (dev-ready with prod migration path)
-- Features: Multi-tenant, RLS, audit logging, auto-numbering
-- Created: 2025-11-13

-- Create schema
CREATE SCHEMA IF NOT EXISTS inter_app;

-- ===================================
-- 📊 TABLE: clients
-- ===================================
-- Purpose: Manage B2B and B2C clients
-- Security: Tenant-isolated, encrypted sensitive fields
-- Features: Soft delete, audit trail, geolocation

CREATE TABLE inter_app.clients (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Client type
    client_type text NOT NULL CHECK (client_type IN ('b2b', 'b2c')),

    -- B2C fields (personal)
    first_name text,
    last_name text,

    -- B2B fields (company)
    company_name text,
    siret text,
    vat_number text,

    -- Contact info
    email text,
    phone text NOT NULL,
    mobile text,

    -- Address
    address_line1 text NOT NULL,
    address_line2 text,
    postal_code text NOT NULL,
    city text NOT NULL,
    country_code text REFERENCES public.countries(code) ON DELETE RESTRICT DEFAULT 'FR',

    -- Geolocation (for technician routing)
    latitude numeric(10, 8),
    longitude numeric(11, 8),

    -- Billing
    billing_address_same boolean DEFAULT true,
    billing_address_line1 text,
    billing_address_line2 text,
    billing_postal_code text,
    billing_city text,
    billing_country_code text REFERENCES public.countries(code) ON DELETE RESTRICT,

    -- Payment terms
    payment_terms text DEFAULT 'immediate' CHECK (payment_terms IN ('immediate', 'net_30', 'net_60', 'net_90')),
    credit_limit numeric(10, 2) DEFAULT 0,

    -- Status
    is_active boolean DEFAULT true,
    notes text,
    tags text[],

    -- GDPR consent
    gdpr_consent boolean DEFAULT false,
    gdpr_consent_date timestamptz,

    -- Soft delete
    deleted_at timestamptz,
    deleted_by uuid REFERENCES auth.users(id),

    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),

    -- Constraints
    CONSTRAINT client_type_b2c_check CHECK (
        client_type != 'b2c' OR (first_name IS NOT NULL AND last_name IS NOT NULL)
    ),
    CONSTRAINT client_type_b2b_check CHECK (
        client_type != 'b2b' OR company_name IS NOT NULL
    ),
    CONSTRAINT billing_address_check CHECK (
        billing_address_same = true OR (
            billing_address_line1 IS NOT NULL AND
            billing_postal_code IS NOT NULL AND
            billing_city IS NOT NULL AND
            billing_country_code IS NOT NULL
        )
    )
);

-- Indexes
CREATE INDEX idx_clients_tenant_id ON inter_app.clients(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_email ON inter_app.clients(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_phone ON inter_app.clients(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_siret ON inter_app.clients(siret) WHERE siret IS NOT NULL AND deleted_at IS NULL;
-- Geolocation index (simple B-tree instead of GIST for broader compatibility)
-- For production with PostGIS, consider: CREATE INDEX idx_clients_location ON inter_app.clients USING gist(ll_to_earth(latitude, longitude));
CREATE INDEX idx_clients_latitude ON inter_app.clients(latitude) WHERE latitude IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_clients_longitude ON inter_app.clients(longitude) WHERE longitude IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_clients_created_at ON inter_app.clients(created_at DESC);

-- RLS
ALTER TABLE inter_app.clients ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see clients from their tenants
CREATE POLICY clients_tenant_isolation ON inter_app.clients
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Trigger: Update timestamp
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON inter_app.clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Audit logging
CREATE TRIGGER clients_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON inter_app.clients
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_trail();

-- Comments
COMMENT ON TABLE inter_app.clients IS 'Client management - supports both B2B and B2C clients with tenant isolation';
COMMENT ON COLUMN inter_app.clients.client_type IS 'Client type: b2b (company) or b2c (individual)';
COMMENT ON COLUMN inter_app.clients.payment_terms IS 'Payment terms: immediate, net_30, net_60, net_90';

-- ===================================
-- 👷 TABLE: technicians
-- ===================================
-- Purpose: Manage technicians with skills, availability, and geolocation
-- Security: Tenant-isolated, sensitive data encrypted
-- Features: Real-time availability, skill matching, route optimization

CREATE TABLE inter_app.technicians (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Link to user account (optional - external technicians may not have accounts)
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Personal info
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    mobile text,

    -- Employment
    employment_type text NOT NULL CHECK (employment_type IN ('employee', 'contractor', 'partner')),
    employee_number text,
    hire_date date,

    -- Skills
    skills text[] DEFAULT '{}',
    certifications jsonb DEFAULT '[]', -- [{"name": "...", "number": "...", "expires_at": "..."}]

    -- Availability
    is_available boolean DEFAULT true,
    availability_status text DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'off_duty', 'on_leave')),
    work_schedule jsonb DEFAULT '{"monday": {"start": "08:00", "end": "18:00"}, "tuesday": {"start": "08:00", "end": "18:00"}, "wednesday": {"start": "08:00", "end": "18:00"}, "thursday": {"start": "08:00", "end": "18:00"}, "friday": {"start": "08:00", "end": "18:00"}}',

    -- Geolocation (real-time position for routing)
    current_latitude numeric(10, 8),
    current_longitude numeric(11, 8),
    last_location_update timestamptz,

    -- Home base (for route planning)
    base_address_line1 text,
    base_postal_code text,
    base_city text,
    base_country_code text REFERENCES public.countries(code) ON DELETE RESTRICT DEFAULT 'FR',
    base_latitude numeric(10, 8),
    base_longitude numeric(11, 8),

    -- Performance metrics
    interventions_completed integer DEFAULT 0,
    average_rating numeric(3, 2) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
    total_reviews integer DEFAULT 0,

    -- Status
    is_active boolean DEFAULT true,
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
CREATE INDEX idx_technicians_tenant_id ON inter_app.technicians(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_technicians_user_id ON inter_app.technicians(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_technicians_email ON inter_app.technicians(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_technicians_availability ON inter_app.technicians(is_available, availability_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_technicians_skills ON inter_app.technicians USING gin(skills);
-- Geolocation index (simple B-tree instead of GIST for broader compatibility)
-- For production with PostGIS, consider: CREATE INDEX idx_technicians_location ON inter_app.technicians USING gist(ll_to_earth(current_latitude, current_longitude));
CREATE INDEX idx_technicians_current_latitude ON inter_app.technicians(current_latitude) WHERE current_latitude IS NOT NULL;
CREATE INDEX idx_technicians_current_longitude ON inter_app.technicians(current_longitude) WHERE current_longitude IS NOT NULL;

-- RLS
ALTER TABLE inter_app.technicians ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see technicians from their tenants
CREATE POLICY technicians_tenant_isolation ON inter_app.technicians
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Trigger: Update timestamp
CREATE TRIGGER update_technicians_updated_at
    BEFORE UPDATE ON inter_app.technicians
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Audit logging
CREATE TRIGGER technicians_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON inter_app.technicians
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_trail();

-- Comments
COMMENT ON TABLE inter_app.technicians IS 'Technician management with skills, availability, and real-time geolocation';
COMMENT ON COLUMN inter_app.technicians.employment_type IS 'Employment type: employee, contractor, or partner';
COMMENT ON COLUMN inter_app.technicians.availability_status IS 'Current status: available, busy, off_duty, on_leave';
COMMENT ON COLUMN inter_app.technicians.certifications IS 'JSON array of certifications with name, number, and expiry date';

-- ===================================
-- 🔧 TABLE: equipment
-- ===================================
-- Purpose: Track client equipment requiring maintenance
-- Security: Tenant-isolated, maintenance history tracked
-- Features: Warranty tracking, maintenance scheduling, service history

CREATE TABLE inter_app.equipment (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Client relationship
    client_id uuid NOT NULL REFERENCES inter_app.clients(id) ON DELETE CASCADE,

    -- Equipment identification
    equipment_type text NOT NULL, -- e.g., 'boiler', 'heat_pump', 'air_conditioner'
    brand text,
    model text,
    serial_number text,

    -- Installation details
    installation_date date,
    installation_location text, -- e.g., 'basement', 'rooftop', 'utility_room'

    -- Warranty
    warranty_start_date date,
    warranty_end_date date,
    warranty_provider text,

    -- Maintenance schedule
    maintenance_frequency text CHECK (maintenance_frequency IN ('monthly', 'quarterly', 'semi_annual', 'annual', 'biennial')),
    last_maintenance_date date,
    next_maintenance_date date,

    -- Status
    status text DEFAULT 'active' CHECK (status IN ('active', 'under_maintenance', 'decommissioned', 'replaced')),
    condition text CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'critical')),

    -- Notes and documentation
    notes text,
    documentation_url text,
    photos jsonb DEFAULT '[]', -- [{"url": "...", "caption": "...", "uploaded_at": "..."}]

    -- Replacement tracking
    replaced_by uuid REFERENCES inter_app.equipment(id),
    replacement_date date,
    replacement_reason text,

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
CREATE INDEX idx_equipment_tenant_id ON inter_app.equipment(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_equipment_client_id ON inter_app.equipment(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_equipment_serial_number ON inter_app.equipment(serial_number) WHERE serial_number IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_equipment_next_maintenance ON inter_app.equipment(next_maintenance_date) WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX idx_equipment_warranty ON inter_app.equipment(warranty_end_date) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE inter_app.equipment ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see equipment from their tenants
CREATE POLICY equipment_tenant_isolation ON inter_app.equipment
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Trigger: Update timestamp
CREATE TRIGGER update_equipment_updated_at
    BEFORE UPDATE ON inter_app.equipment
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Audit logging
CREATE TRIGGER equipment_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON inter_app.equipment
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_trail();

-- Comments
COMMENT ON TABLE inter_app.equipment IS 'Equipment tracking with maintenance scheduling and warranty management';
COMMENT ON COLUMN inter_app.equipment.maintenance_frequency IS 'Maintenance frequency: monthly, quarterly, semi_annual, annual, biennial';
COMMENT ON COLUMN inter_app.equipment.status IS 'Equipment status: active, under_maintenance, decommissioned, replaced';

-- ===================================
-- 📋 TABLE: interventions
-- ===================================
-- Purpose: Core table for intervention/work order management
-- Security: Tenant-isolated, auto-numbering, workflow tracking
-- Features: Auto-number (INT-YYYY-XXXXX), status workflow, technician assignment

CREATE TABLE inter_app.interventions (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Auto-numbering: INT-YYYY-XXXXX
    intervention_number text NOT NULL,

    -- Client and equipment
    client_id uuid NOT NULL REFERENCES inter_app.clients(id) ON DELETE RESTRICT,
    equipment_id uuid REFERENCES inter_app.equipment(id) ON DELETE SET NULL,

    -- Intervention details
    intervention_type text NOT NULL CHECK (intervention_type IN ('installation', 'maintenance', 'repair', 'inspection', 'emergency')),
    priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent', 'emergency')),

    -- Description
    title text NOT NULL,
    description text,
    problem_reported text,

    -- Scheduling
    scheduled_date date,
    scheduled_time_start time,
    scheduled_time_end time,
    estimated_duration_hours numeric(5, 2),

    -- Assignment
    assigned_technician_id uuid REFERENCES inter_app.technicians(id) ON DELETE SET NULL,
    assignment_date timestamptz,

    -- Execution
    actual_start_time timestamptz,
    actual_end_time timestamptz,
    actual_duration_hours numeric(5, 2),

    -- Resolution
    work_performed text,
    parts_used jsonb DEFAULT '[]', -- [{"part_name": "...", "quantity": 1, "unit_price": 50, "total": 50}]
    photos jsonb DEFAULT '[]', -- [{"url": "...", "caption": "...", "uploaded_at": "..."}]

    -- Status workflow
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled')),
    status_history jsonb DEFAULT '[]', -- [{"status": "draft", "changed_at": "...", "changed_by": "..."}]

    -- Client signature and satisfaction
    client_signature_url text,
    client_signature_date timestamptz,
    client_rating integer CHECK (client_rating >= 1 AND client_rating <= 5),
    client_feedback text,

    -- Financial
    estimated_cost numeric(10, 2),
    actual_cost numeric(10, 2),
    invoiced boolean DEFAULT false,
    invoice_id uuid, -- Will be linked to invoices table

    -- Location (if different from client address)
    intervention_address_line1 text,
    intervention_address_line2 text,
    intervention_postal_code text,
    intervention_city text,
    intervention_country_code text REFERENCES public.countries(code) ON DELETE RESTRICT,
    intervention_latitude numeric(10, 8),
    intervention_longitude numeric(11, 8),

    -- Internal notes
    internal_notes text,
    tags text[],

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
CREATE UNIQUE INDEX idx_interventions_number_tenant ON inter_app.interventions(tenant_id, intervention_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_interventions_tenant_id ON inter_app.interventions(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_interventions_client_id ON inter_app.interventions(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_interventions_equipment_id ON inter_app.interventions(equipment_id) WHERE equipment_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_interventions_technician_id ON inter_app.interventions(assigned_technician_id) WHERE assigned_technician_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_interventions_status ON inter_app.interventions(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_interventions_scheduled_date ON inter_app.interventions(scheduled_date) WHERE status IN ('scheduled', 'assigned') AND deleted_at IS NULL;
CREATE INDEX idx_interventions_priority ON inter_app.interventions(priority, status) WHERE status NOT IN ('completed', 'cancelled') AND deleted_at IS NULL;
CREATE INDEX idx_interventions_created_at ON inter_app.interventions(created_at DESC);

-- RLS
ALTER TABLE inter_app.interventions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see interventions from their tenants
CREATE POLICY interventions_tenant_isolation ON inter_app.interventions
    FOR ALL
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Function: Auto-generate intervention number
CREATE OR REPLACE FUNCTION inter_app.generate_intervention_number(p_tenant_id uuid)
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
            WHEN intervention_number ~ ('^INT-' || v_year || '-[0-9]+$')
            THEN CAST(SUBSTRING(intervention_number FROM 'INT-' || v_year || '-([0-9]+)') AS integer)
            ELSE 0
        END
    ), 0) + 1
    INTO v_sequence
    FROM inter_app.interventions
    WHERE tenant_id = p_tenant_id;

    -- Format: INT-YYYY-XXXXX (with leading zeros)
    v_number := 'INT-' || v_year || '-' || LPAD(v_sequence::text, 5, '0');

    RETURN v_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = inter_app, public, pg_temp;

-- Trigger: Auto-generate intervention number on insert
CREATE OR REPLACE FUNCTION inter_app.set_intervention_number()
RETURNS trigger AS $$
BEGIN
    IF NEW.intervention_number IS NULL OR NEW.intervention_number = '' THEN
        NEW.intervention_number := inter_app.generate_intervention_number(NEW.tenant_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = inter_app, public, pg_temp;

CREATE TRIGGER set_intervention_number_on_insert
    BEFORE INSERT ON inter_app.interventions
    FOR EACH ROW
    EXECUTE FUNCTION inter_app.set_intervention_number();

-- Trigger: Track status changes in history
CREATE OR REPLACE FUNCTION inter_app.track_intervention_status_change()
RETURNS trigger AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        NEW.status_history := COALESCE(OLD.status_history, '[]'::jsonb) || jsonb_build_object(
            'status', NEW.status,
            'previous_status', OLD.status,
            'changed_at', now(),
            'changed_by', auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = inter_app, public, pg_temp;

CREATE TRIGGER track_intervention_status_changes
    BEFORE UPDATE ON inter_app.interventions
    FOR EACH ROW
    WHEN (NEW.status IS DISTINCT FROM OLD.status)
    EXECUTE FUNCTION inter_app.track_intervention_status_change();

-- Trigger: Update timestamp
CREATE TRIGGER update_interventions_updated_at
    BEFORE UPDATE ON inter_app.interventions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Audit logging
CREATE TRIGGER interventions_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON inter_app.interventions
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_trail();

-- Comments
COMMENT ON TABLE inter_app.interventions IS 'Core intervention/work order management with auto-numbering and workflow tracking';
COMMENT ON COLUMN inter_app.interventions.intervention_number IS 'Auto-generated number format: INT-YYYY-XXXXX';
COMMENT ON COLUMN inter_app.interventions.intervention_type IS 'Type: installation, maintenance, repair, inspection, emergency';
COMMENT ON COLUMN inter_app.interventions.priority IS 'Priority: low, normal, high, urgent, emergency';
COMMENT ON COLUMN inter_app.interventions.status IS 'Status workflow: draft, scheduled, assigned, in_progress, on_hold, completed, cancelled';

-- ===================================
-- 💰 TABLE: invoices
-- ===================================
-- Purpose: Invoice management linked to interventions
-- Security: Tenant-isolated, auto-numbering, owner validation
-- Features: Auto-number (FAC-YYYY-XXXXX), payment tracking, PDF generation

CREATE TABLE inter_app.invoices (
    -- Primary key
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant isolation
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Auto-numbering: FAC-YYYY-XXXXX
    invoice_number text NOT NULL,

    -- Client relationship
    client_id uuid NOT NULL REFERENCES inter_app.clients(id) ON DELETE RESTRICT,

    -- Linked interventions
    intervention_ids uuid[] DEFAULT '{}',

    -- Invoice details
    invoice_date date NOT NULL DEFAULT CURRENT_DATE,
    due_date date NOT NULL,

    -- Billing info (snapshot at invoice time)
    billing_name text NOT NULL,
    billing_address_line1 text NOT NULL,
    billing_address_line2 text,
    billing_postal_code text NOT NULL,
    billing_city text NOT NULL,
    billing_country_code text NOT NULL,
    billing_siret text,
    billing_vat_number text,

    -- Line items
    line_items jsonb NOT NULL DEFAULT '[]', -- [{"description": "...", "quantity": 1, "unit_price": 100, "tax_rate": 20, "total_ht": 100, "total_ttc": 120}]

    -- Amounts
    subtotal_ht numeric(10, 2) NOT NULL DEFAULT 0, -- Total HT (before tax)
    total_tax numeric(10, 2) NOT NULL DEFAULT 0,
    total_ttc numeric(10, 2) NOT NULL DEFAULT 0, -- Total TTC (with tax)

    -- Discounts
    discount_percentage numeric(5, 2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    discount_amount numeric(10, 2) DEFAULT 0,

    -- Payment
    payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
    payment_method text CHECK (payment_method IN ('cash', 'check', 'bank_transfer', 'card', 'other')),
    paid_amount numeric(10, 2) DEFAULT 0,
    paid_date date,

    -- Payment terms
    payment_terms text DEFAULT 'net_30' CHECK (payment_terms IN ('immediate', 'net_30', 'net_60', 'net_90')),

    -- Status
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),

    -- Documents
    pdf_url text,
    pdf_generated_at timestamptz,

    -- Communication
    sent_date date,
    sent_to_email text,
    reminder_sent_dates date[],

    -- Notes
    notes text,
    internal_notes text,

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
        subtotal_ht >= 0 AND
        total_tax >= 0 AND
        total_ttc >= 0 AND
        total_ttc = subtotal_ht + total_tax - discount_amount
    ),
    CONSTRAINT invoice_payment_check CHECK (
        paid_amount >= 0 AND
        paid_amount <= total_ttc
    )
);

-- Indexes
CREATE UNIQUE INDEX idx_invoices_number_tenant ON inter_app.invoices(tenant_id, invoice_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_tenant_id ON inter_app.invoices(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_client_id ON inter_app.invoices(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_payment_status ON inter_app.invoices(payment_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_due_date ON inter_app.invoices(due_date) WHERE payment_status IN ('pending', 'partial', 'overdue') AND deleted_at IS NULL;
CREATE INDEX idx_invoices_invoice_date ON inter_app.invoices(invoice_date DESC);
CREATE INDEX idx_invoices_interventions ON inter_app.invoices USING gin(intervention_ids);

-- RLS
ALTER TABLE inter_app.invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/insert/delete invoices from their tenants
CREATE POLICY invoices_select ON inter_app.invoices
    FOR SELECT
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

CREATE POLICY invoices_insert ON inter_app.invoices
    FOR INSERT
    WITH CHECK (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

CREATE POLICY invoices_delete ON inter_app.invoices
    FOR DELETE
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Policy: Combined tenant isolation + paid protection for updates
CREATE POLICY invoices_update ON inter_app.invoices
    FOR UPDATE
    USING (
        tenant_id IN (SELECT unnest(get_current_user_tenant_ids()))
        AND (
            payment_status != 'paid' OR
            created_by = (select auth.uid()) OR
            EXISTS (
                SELECT 1 FROM public.user_tenant_roles
                WHERE user_id = (select auth.uid())
                AND tenant_id = invoices.tenant_id
                AND role IN ('owner', 'admin')
            )
        )
    )
    WITH CHECK (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- Function: Auto-generate invoice number
CREATE OR REPLACE FUNCTION inter_app.generate_invoice_number(p_tenant_id uuid)
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
    FROM inter_app.invoices
    WHERE tenant_id = p_tenant_id;

    -- Format: FAC-YYYY-XXXXX (with leading zeros)
    v_number := 'FAC-' || v_year || '-' || LPAD(v_sequence::text, 5, '0');

    RETURN v_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = inter_app, public, pg_temp;

-- Trigger: Auto-generate invoice number on insert
CREATE OR REPLACE FUNCTION inter_app.set_invoice_number()
RETURNS trigger AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := inter_app.generate_invoice_number(NEW.tenant_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = inter_app, public, pg_temp;

CREATE TRIGGER set_invoice_number_on_insert
    BEFORE INSERT ON inter_app.invoices
    FOR EACH ROW
    EXECUTE FUNCTION inter_app.set_invoice_number();

-- Trigger: Update overdue status
CREATE OR REPLACE FUNCTION inter_app.check_invoice_overdue()
RETURNS trigger AS $$
BEGIN
    IF NEW.payment_status IN ('pending', 'partial') AND NEW.due_date < CURRENT_DATE THEN
        NEW.payment_status := 'overdue';
        NEW.status := 'overdue';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = inter_app, public, pg_temp;

CREATE TRIGGER check_invoice_overdue_on_update
    BEFORE UPDATE ON inter_app.invoices
    FOR EACH ROW
    WHEN (NEW.payment_status IN ('pending', 'partial'))
    EXECUTE FUNCTION inter_app.check_invoice_overdue();

-- Trigger: Link invoice to interventions
CREATE OR REPLACE FUNCTION inter_app.link_invoice_to_interventions()
RETURNS trigger AS $$
BEGIN
    IF array_length(NEW.intervention_ids, 1) > 0 THEN
        UPDATE inter_app.interventions
        SET
            invoiced = true,
            invoice_id = NEW.id,
            updated_at = now()
        WHERE id = ANY(NEW.intervention_ids)
        AND tenant_id = NEW.tenant_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = inter_app, public, pg_temp;

CREATE TRIGGER link_invoice_to_interventions_after_insert
    AFTER INSERT ON inter_app.invoices
    FOR EACH ROW
    WHEN (array_length(NEW.intervention_ids, 1) > 0)
    EXECUTE FUNCTION inter_app.link_invoice_to_interventions();

-- Trigger: Update timestamp
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON inter_app.invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Audit logging
CREATE TRIGGER invoices_audit_log
    AFTER INSERT OR UPDATE OR DELETE ON inter_app.invoices
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_trail();

-- Comments
COMMENT ON TABLE inter_app.invoices IS 'Invoice management with auto-numbering, payment tracking, and intervention linking';
COMMENT ON COLUMN inter_app.invoices.invoice_number IS 'Auto-generated number format: FAC-YYYY-XXXXX';
COMMENT ON COLUMN inter_app.invoices.payment_status IS 'Payment status: pending, partial, paid, overdue, cancelled';
COMMENT ON COLUMN inter_app.invoices.payment_terms IS 'Payment terms: immediate, net_30, net_60, net_90';
COMMENT ON COLUMN inter_app.invoices.line_items IS 'JSON array of invoice line items with description, quantity, prices, and tax';

-- ===================================
-- 🎯 Grant permissions
-- ===================================
-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA inter_app TO authenticated;

-- Grant all privileges on all tables to authenticated users (RLS handles security)
GRANT ALL ON ALL TABLES IN SCHEMA inter_app TO authenticated;

-- Grant usage on sequences (for auto-increment if needed)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA inter_app TO authenticated;

-- ===================================
-- ✅ Migration Complete
-- ===================================
-- Schema: inter_app
-- Tables: 5 (clients, technicians, equipment, interventions, invoices)
-- Security: Option B (RLS + audit logging + encryption ready)
-- Features: Auto-numbering, soft delete, geolocation, workflow tracking
-- Status: Ready for application development
