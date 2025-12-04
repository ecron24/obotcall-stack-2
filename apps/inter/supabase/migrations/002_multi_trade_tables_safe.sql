-- ============================================
-- MIGRATION 002: Tables Multi-Métiers SAFE
-- Date: 2025-12-04
-- Description: Ajoute les tables multi-métiers SANS toucher à l'existant
-- SAFE: Compatible avec inter_app, agent_app, immo_app existants
-- ============================================

-- =============================================
-- TABLE: business_types (dans public car partageable)
-- =============================================
CREATE TABLE IF NOT EXISTS public.business_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  color TEXT CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),

  -- Terminologie personnalisée
  terminology JSONB DEFAULT '{
    "intervention": "Intervention",
    "client": "Client",
    "technician": "Technicien",
    "quote": "Devis",
    "invoice": "Facture",
    "product": "Produit",
    "service": "Service"
  }'::jsonb,

  -- Configuration par défaut
  default_labor_rate NUMERIC(10,2),
  default_travel_fee NUMERIC(10,2),
  default_tax_rate NUMERIC(5,2) DEFAULT 20.00,

  -- Statut
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_types_code ON public.business_types(code);
CREATE INDEX IF NOT EXISTS idx_business_types_active ON public.business_types(is_active);

COMMENT ON TABLE public.business_types IS 'Types de métiers supportés (pisciniste, plombier, etc.)';

-- =============================================
-- TABLE: intervention_types (dans public car partageable)
-- =============================================
CREATE TABLE IF NOT EXISTS public.intervention_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type_id UUID NOT NULL REFERENCES public.business_types(id) ON DELETE CASCADE,

  -- Identification
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  color TEXT,

  -- Configuration
  requires_quote BOOLEAN DEFAULT false,
  default_duration INTEGER,
  default_priority TEXT CHECK (default_priority IN ('low', 'medium', 'high', 'urgent')),

  -- Ordre d'affichage
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(business_type_id, code)
);

CREATE INDEX IF NOT EXISTS idx_intervention_types_business ON public.intervention_types(business_type_id);
CREATE INDEX IF NOT EXISTS idx_intervention_types_code ON public.intervention_types(code);
CREATE INDEX IF NOT EXISTS idx_intervention_types_active ON public.intervention_types(is_active);
CREATE INDEX IF NOT EXISTS idx_intervention_types_display_order ON public.intervention_types(display_order);

COMMENT ON TABLE public.intervention_types IS 'Types d''interventions par métier';

-- =============================================
-- TABLE: product_categories (dans public car partageable)
-- =============================================
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type_id UUID NOT NULL REFERENCES public.business_types(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.product_categories(id) ON DELETE CASCADE,

  -- Identification
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,

  -- Ordre d'affichage
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_categories_business ON public.product_categories(business_type_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_parent ON public.product_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON public.product_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_product_categories_display_order ON public.product_categories(display_order);

COMMENT ON TABLE public.product_categories IS 'Catégories hiérarchiques de produits par métier';

-- =============================================
-- TABLE: products (dans public car partageable)
-- =============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type_id UUID NOT NULL REFERENCES public.business_types(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,

  -- Identification
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Type
  type TEXT NOT NULL CHECK (type IN ('product', 'service', 'labor')),
  unit TEXT NOT NULL DEFAULT 'unité',

  -- Prix
  unit_price_ht NUMERIC(10,2) NOT NULL,
  tax_rate NUMERIC(5,2) DEFAULT 20.00,

  -- Stock (optionnel)
  has_stock BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  stock_alert_threshold INTEGER,

  -- Fournisseur
  supplier_name TEXT,
  supplier_reference TEXT,

  -- Statut
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(business_type_id, code)
);

CREATE INDEX IF NOT EXISTS idx_products_business ON public.products(business_type_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);

COMMENT ON TABLE public.products IS 'Catalogue de produits/services par métier';

-- =============================================
-- TABLE: intervention_items (dans inter_app, liée aux interventions)
-- =============================================
CREATE TABLE IF NOT EXISTS inter_app.intervention_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intervention_id UUID NOT NULL REFERENCES inter_app.interventions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,

  -- Détails
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'unité',

  -- Prix
  unit_price_ht NUMERIC(10,2) NOT NULL CHECK (unit_price_ht >= 0),
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 20.00 CHECK (tax_rate >= 0 AND tax_rate <= 100),

  -- Totaux calculés automatiquement
  total_ht NUMERIC(10,2) GENERATED ALWAYS AS (ROUND(quantity * unit_price_ht, 2)) STORED,
  total_tax NUMERIC(10,2) GENERATED ALWAYS AS (ROUND(quantity * unit_price_ht * tax_rate / 100, 2)) STORED,
  total_ttc NUMERIC(10,2) GENERATED ALWAYS AS (ROUND(quantity * unit_price_ht * (1 + tax_rate / 100), 2)) STORED,

  -- Ordre d'affichage
  display_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intervention_items_intervention ON inter_app.intervention_items(intervention_id);
CREATE INDEX IF NOT EXISTS idx_intervention_items_product ON inter_app.intervention_items(product_id);
CREATE INDEX IF NOT EXISTS idx_intervention_items_display_order ON inter_app.intervention_items(display_order);

COMMENT ON TABLE inter_app.intervention_items IS 'Produits et services utilisés dans les interventions';

-- =============================================
-- TABLE: intervention_type_assignments (dans inter_app)
-- =============================================
CREATE TABLE IF NOT EXISTS inter_app.intervention_type_assignments (
  intervention_id UUID NOT NULL REFERENCES inter_app.interventions(id) ON DELETE CASCADE,
  intervention_type_id UUID NOT NULL REFERENCES public.intervention_types(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (intervention_id, intervention_type_id)
);

CREATE INDEX IF NOT EXISTS idx_intervention_type_assignments_intervention ON inter_app.intervention_type_assignments(intervention_id);
CREATE INDEX IF NOT EXISTS idx_intervention_type_assignments_type ON inter_app.intervention_type_assignments(intervention_type_id);

COMMENT ON TABLE inter_app.intervention_type_assignments IS 'Liaison many-to-many interventions ↔ types';

-- =============================================
-- TABLE: pricing_configs (dans inter_app, par tenant)
-- =============================================
CREATE TABLE IF NOT EXISTS inter_app.pricing_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Tarifs par défaut
  labor_rate NUMERIC(10,2) NOT NULL CHECK (labor_rate >= 0),
  travel_fee NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (travel_fee >= 0),
  default_tax_rate NUMERIC(5,2) NOT NULL DEFAULT 20.00 CHECK (default_tax_rate >= 0 AND default_tax_rate <= 100),

  -- Marges
  default_margin_rate NUMERIC(5,2) DEFAULT 30.00 CHECK (default_margin_rate >= 0),

  -- Pénalités
  late_payment_rate NUMERIC(5,2) DEFAULT 10.00 CHECK (late_payment_rate >= 0),
  recovery_fee NUMERIC(10,2) DEFAULT 40.00 CHECK (recovery_fee >= 0),

  -- Délais
  payment_delay_days INTEGER DEFAULT 30 CHECK (payment_delay_days > 0),
  quote_validity_days INTEGER DEFAULT 30 CHECK (quote_validity_days > 0),

  -- Timestamps
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,

  UNIQUE(tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_pricing_configs_tenant ON inter_app.pricing_configs(tenant_id);

COMMENT ON TABLE inter_app.pricing_configs IS 'Configuration des tarifs par tenant';

-- =============================================
-- TABLE: company_settings (dans inter_app, par tenant)
-- =============================================
CREATE TABLE IF NOT EXISTS inter_app.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Informations légales
  company_name TEXT NOT NULL,
  legal_form TEXT,
  siret TEXT,
  vat_number TEXT,
  rcs_number TEXT,
  capital NUMERIC(10,2),

  -- Contact
  email TEXT,
  phone TEXT,
  website TEXT,

  -- Adresse
  address TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'FR',

  -- Facturation
  invoice_prefix TEXT DEFAULT 'FAC',
  quote_prefix TEXT DEFAULT 'DEV',

  -- CGV et mentions
  invoice_footer_notes TEXT,
  legal_mentions TEXT,
  general_conditions TEXT,

  -- Branding
  logo_url TEXT,
  primary_color TEXT CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_color TEXT CHECK (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),

  -- Timestamps
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,

  UNIQUE(tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_company_settings_tenant ON inter_app.company_settings(tenant_id);

COMMENT ON TABLE inter_app.company_settings IS 'Paramètres et informations légales de l''entreprise';

-- =============================================
-- AUTO UPDATE TIMESTAMP TRIGGERS
-- =============================================

-- Fonction update_updated_at déjà existante dans public, on la réutilise

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour les nouvelles tables
CREATE TRIGGER update_business_types_updated_at
BEFORE UPDATE ON public.business_types
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intervention_types_updated_at
BEFORE UPDATE ON public.intervention_types
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at
BEFORE UPDATE ON public.product_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intervention_items_updated_at
BEFORE UPDATE ON inter_app.intervention_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_configs_updated_at
BEFORE UPDATE ON inter_app.pricing_configs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON inter_app.company_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FIN MIGRATION 002
-- =============================================

COMMENT ON SCHEMA inter_app IS 'Schema inter-app avec support multi-métiers - Version 2.0';
