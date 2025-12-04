-- ============================================
-- MIGRATION: Multi-Trade Schema
-- Date: 2025-12-04
-- Description: Ajout du support multi-métiers (pisciniste, plomberie, dératisation, garagiste, etc.)
-- ============================================

-- =============================================
-- TABLE: business_types (Types de métiers)
-- =============================================
CREATE TABLE business_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identification
  code TEXT UNIQUE NOT NULL, -- 'pool', 'plumbing', 'pest_control', 'garage', 'electrical', 'hvac'
  name TEXT NOT NULL, -- 'Pisciniste', 'Plomberie', 'Dératisation', 'Garagiste'
  description TEXT,
  emoji TEXT, -- '🏊', '🔧', '🐀', '🚗', '⚡', '🌡️'
  color TEXT CHECK (color ~ '^#[0-9A-Fa-f]{6}$'), -- Couleur principale

  -- Terminologie personnalisée (permet d'adapter les termes selon le métier)
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
  default_labor_rate DECIMAL(10,2), -- Taux horaire par défaut (€/h)
  default_travel_fee DECIMAL(10,2), -- Frais déplacement par défaut (€)
  default_tax_rate DECIMAL(5,2) DEFAULT 20.00, -- TVA par défaut (%)

  -- Statut
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_business_types_code ON business_types(code);
CREATE INDEX idx_business_types_active ON business_types(is_active);

COMMENT ON TABLE business_types IS 'Types de métiers supportés par la plateforme';
COMMENT ON COLUMN business_types.terminology IS 'Terminologie adaptée au métier (JSON)';

-- =============================================
-- TABLE: intervention_types (Types d'interventions par métier)
-- =============================================
CREATE TABLE intervention_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_type_id UUID NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,

  -- Identification
  code TEXT NOT NULL, -- 'maintenance', 'repair', 'installation', 'emergency', 'diagnostic'
  name TEXT NOT NULL, -- 'Entretien', 'Réparation', 'Installation', 'Urgence'
  description TEXT,
  emoji TEXT, -- '🔧', '🛠️', '⚙️', '🚨', '🔍'
  color TEXT, -- Couleur du badge

  -- Configuration
  requires_quote BOOLEAN DEFAULT false, -- Nécessite un devis obligatoire
  default_duration INTEGER, -- Durée estimée en minutes
  default_priority TEXT CHECK (default_priority IN ('low', 'medium', 'high', 'urgent')),

  -- Ordre d'affichage
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(business_type_id, code)
);

CREATE INDEX idx_intervention_types_business ON intervention_types(business_type_id);
CREATE INDEX idx_intervention_types_code ON intervention_types(code);
CREATE INDEX idx_intervention_types_active ON intervention_types(is_active);
CREATE INDEX idx_intervention_types_display_order ON intervention_types(display_order);

COMMENT ON TABLE intervention_types IS 'Types d''interventions disponibles par métier';

-- =============================================
-- TABLE: product_categories (Catégories de produits par métier)
-- =============================================
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_type_id UUID NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES product_categories(id) ON DELETE CASCADE, -- Hiérarchie (catégorie parent)

  -- Identification
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Icône ou emoji

  -- Ordre d'affichage
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_categories_business ON product_categories(business_type_id);
CREATE INDEX idx_product_categories_parent ON product_categories(parent_id);
CREATE INDEX idx_product_categories_active ON product_categories(is_active);
CREATE INDEX idx_product_categories_display_order ON product_categories(display_order);

COMMENT ON TABLE product_categories IS 'Catégories hiérarchiques de produits par métier';

-- =============================================
-- TABLE: products (Catalogue produits/services par métier)
-- =============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_type_id UUID NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,

  -- Identification
  code TEXT NOT NULL, -- Code produit/service (SKU)
  name TEXT NOT NULL,
  description TEXT,

  -- Type
  type TEXT NOT NULL CHECK (type IN ('product', 'service', 'labor')),
  unit TEXT NOT NULL DEFAULT 'unité', -- 'unité', 'heure', 'litre', 'kg', 'm²', 'km', etc.

  -- Prix
  unit_price_ht DECIMAL(10,2) NOT NULL, -- Prix unitaire HT
  tax_rate DECIMAL(5,2) DEFAULT 20.00, -- Taux TVA (%)

  -- Stock (optionnel, surtout pour les produits physiques)
  has_stock BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  stock_alert_threshold INTEGER, -- Seuil d'alerte stock

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

CREATE INDEX idx_products_business ON products(business_type_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_name ON products(name);

COMMENT ON TABLE products IS 'Catalogue de produits et services par métier';
COMMENT ON COLUMN products.type IS 'Type : product (physique), service (prestation), labor (main d''œuvre)';

-- =============================================
-- TABLE: intervention_items (Produits/services utilisés dans interventions)
-- =============================================
CREATE TABLE intervention_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intervention_id UUID NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- Peut être NULL si produit custom

  -- Détails
  description TEXT NOT NULL, -- Description (copie du nom produit ou texte custom)
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'unité',

  -- Prix
  unit_price_ht DECIMAL(10,2) NOT NULL CHECK (unit_price_ht >= 0),
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00 CHECK (tax_rate >= 0 AND tax_rate <= 100),

  -- Totaux calculés automatiquement
  total_ht DECIMAL(10,2) GENERATED ALWAYS AS (ROUND(quantity * unit_price_ht, 2)) STORED,
  total_tax DECIMAL(10,2) GENERATED ALWAYS AS (ROUND(quantity * unit_price_ht * tax_rate / 100, 2)) STORED,
  total_ttc DECIMAL(10,2) GENERATED ALWAYS AS (ROUND(quantity * unit_price_ht * (1 + tax_rate / 100), 2)) STORED,

  -- Ordre d'affichage (pour factures/devis)
  display_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_intervention_items_intervention ON intervention_items(intervention_id);
CREATE INDEX idx_intervention_items_product ON intervention_items(product_id);
CREATE INDEX idx_intervention_items_display_order ON intervention_items(display_order);

COMMENT ON TABLE intervention_items IS 'Produits et services utilisés dans les interventions';
COMMENT ON COLUMN intervention_items.total_ht IS 'Total HT calculé automatiquement (GENERATED)';
COMMENT ON COLUMN intervention_items.total_tax IS 'Total TVA calculé automatiquement (GENERATED)';
COMMENT ON COLUMN intervention_items.total_ttc IS 'Total TTC calculé automatiquement (GENERATED)';

-- =============================================
-- TABLE: intervention_type_assignments (Liaison many-to-many)
-- =============================================
CREATE TABLE intervention_type_assignments (
  intervention_id UUID NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
  intervention_type_id UUID NOT NULL REFERENCES intervention_types(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (intervention_id, intervention_type_id)
);

CREATE INDEX idx_intervention_type_assignments_intervention ON intervention_type_assignments(intervention_id);
CREATE INDEX idx_intervention_type_assignments_type ON intervention_type_assignments(intervention_type_id);

COMMENT ON TABLE intervention_type_assignments IS 'Liaison many-to-many entre interventions et types d''interventions';

-- =============================================
-- TABLE: technicians (Techniciens/staff)
-- =============================================
CREATE TABLE technicians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Lien optionnel avec compte utilisateur

  -- Identification
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,

  -- Compétences
  specialties TEXT[], -- Spécialités (ex: ['pool_maintenance', 'pool_repair'])
  certifications TEXT[], -- Certificats/qualifications

  -- Planning
  is_available BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2), -- Taux horaire spécifique au technicien

  -- Statut
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_technicians_tenant ON technicians(tenant_id);
CREATE INDEX idx_technicians_user ON technicians(user_id);
CREATE INDEX idx_technicians_active ON technicians(is_active);
CREATE INDEX idx_technicians_available ON technicians(is_available);

COMMENT ON TABLE technicians IS 'Techniciens/staff de l''entreprise';

-- =============================================
-- TABLE: pricing_configs (Configuration tarifs par tenant)
-- =============================================
CREATE TABLE pricing_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Tarifs par défaut
  labor_rate DECIMAL(10,2) NOT NULL CHECK (labor_rate >= 0), -- Taux horaire (€/h)
  travel_fee DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (travel_fee >= 0), -- Frais déplacement (€)
  default_tax_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00 CHECK (default_tax_rate >= 0 AND default_tax_rate <= 100), -- TVA (%)

  -- Marges
  default_margin_rate DECIMAL(5,2) DEFAULT 30.00 CHECK (default_margin_rate >= 0), -- Marge sur produits (%)

  -- Pénalités
  late_payment_rate DECIMAL(5,2) DEFAULT 10.00 CHECK (late_payment_rate >= 0), -- Taux pénalités retard (%)
  recovery_fee DECIMAL(10,2) DEFAULT 40.00 CHECK (recovery_fee >= 0), -- Frais recouvrement (€)

  -- Délais
  payment_delay_days INTEGER DEFAULT 30 CHECK (payment_delay_days > 0), -- Délai paiement (jours)
  quote_validity_days INTEGER DEFAULT 30 CHECK (quote_validity_days > 0), -- Validité devis (jours)

  -- Timestamps
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),

  UNIQUE(tenant_id)
);

CREATE INDEX idx_pricing_configs_tenant ON pricing_configs(tenant_id);

COMMENT ON TABLE pricing_configs IS 'Configuration des tarifs par tenant';

-- =============================================
-- TABLE: company_settings (Paramètres entreprise)
-- =============================================
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Informations légales
  company_name TEXT NOT NULL,
  legal_form TEXT, -- 'SARL', 'SAS', 'EURL', 'Auto-entrepreneur', 'EI', etc.
  siret TEXT, -- N° SIRET (14 chiffres)
  vat_number TEXT, -- N° TVA intracommunautaire
  rcs_number TEXT, -- N° RCS
  capital DECIMAL(10,2), -- Capital social (€)

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
  invoice_prefix TEXT DEFAULT 'FAC', -- Préfixe numéros factures
  quote_prefix TEXT DEFAULT 'DEV', -- Préfixe numéros devis

  -- CGV et mentions
  invoice_footer_notes TEXT, -- Pied de page facture
  legal_mentions TEXT, -- Mentions légales
  general_conditions TEXT, -- Conditions générales de vente

  -- Branding (Starter+)
  logo_url TEXT, -- URL du logo
  primary_color TEXT CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'), -- Couleur principale
  secondary_color TEXT CHECK (secondary_color ~ '^#[0-9A-Fa-f]{6}$'), -- Couleur secondaire

  -- Timestamps
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),

  UNIQUE(tenant_id)
);

CREATE INDEX idx_company_settings_tenant ON company_settings(tenant_id);

COMMENT ON TABLE company_settings IS 'Paramètres et informations légales de l''entreprise';

-- =============================================
-- MODIFICATIONS TABLE: tenants
-- Ajout du type de métier
-- =============================================

-- Ajout de la colonne business_type_id
ALTER TABLE tenants
ADD COLUMN business_type_id UUID REFERENCES business_types(id) ON DELETE RESTRICT;

CREATE INDEX idx_tenants_business_type ON tenants(business_type_id);

COMMENT ON COLUMN tenants.business_type_id IS 'Type de métier du tenant (pisciniste, plombier, etc.)';

-- =============================================
-- MODIFICATIONS TABLE: interventions
-- Ajout champs facturation et suivi
-- =============================================

-- Ajout des colonnes manquantes
ALTER TABLE interventions
ADD COLUMN reference TEXT UNIQUE, -- Référence unique : INT-YYYYMM-NNNN
ADD COLUMN labor_hours DECIMAL(10,2) DEFAULT 0 CHECK (labor_hours >= 0), -- Heures de travail
ADD COLUMN labor_rate DECIMAL(10,2) CHECK (labor_rate >= 0), -- Taux horaire
ADD COLUMN travel_fee DECIMAL(10,2) DEFAULT 0 CHECK (travel_fee >= 0), -- Frais déplacement
ADD COLUMN subtotal_ht DECIMAL(10,2) DEFAULT 0 CHECK (subtotal_ht >= 0), -- Sous-total HT
ADD COLUMN total_tax DECIMAL(10,2) DEFAULT 0 CHECK (total_tax >= 0), -- Total TVA
ADD COLUMN total_ttc DECIMAL(10,2) DEFAULT 0 CHECK (total_ttc >= 0), -- Total TTC
ADD COLUMN client_present BOOLEAN, -- Client présent lors de l'intervention
ADD COLUMN client_signed_at TIMESTAMPTZ, -- Date/heure signature client
ADD COLUMN started_at TIMESTAMPTZ; -- Date/heure démarrage intervention

CREATE INDEX idx_interventions_reference ON interventions(reference);

COMMENT ON COLUMN interventions.reference IS 'Référence unique (ex: INT-202512-0001)';
COMMENT ON COLUMN interventions.labor_hours IS 'Heures de main d''œuvre';
COMMENT ON COLUMN interventions.labor_rate IS 'Taux horaire appliqué';
COMMENT ON COLUMN interventions.travel_fee IS 'Frais de déplacement';
COMMENT ON COLUMN interventions.subtotal_ht IS 'Sous-total HT (calculé)';
COMMENT ON COLUMN interventions.total_tax IS 'Total TVA (calculé)';
COMMENT ON COLUMN interventions.total_ttc IS 'Total TTC (calculé)';

-- =============================================
-- TRIGGER: Auto-calcul totaux interventions
-- =============================================

CREATE OR REPLACE FUNCTION calculate_intervention_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_items_ht DECIMAL(10,2);
  v_items_tax DECIMAL(10,2);
  v_labor_ht DECIMAL(10,2);
  v_labor_tax DECIMAL(10,2);
  v_travel_ht DECIMAL(10,2);
  v_travel_tax DECIMAL(10,2);
  v_tax_rate DECIMAL(5,2);
BEGIN
  -- Récupérer le taux de TVA du tenant
  SELECT COALESCE(pc.default_tax_rate, 20.00)
  INTO v_tax_rate
  FROM tenants t
  LEFT JOIN pricing_configs pc ON pc.tenant_id = t.id
  WHERE t.id = NEW.tenant_id;

  -- Calculer totaux des produits/services (intervention_items)
  SELECT
    COALESCE(SUM(total_ht), 0),
    COALESCE(SUM(total_tax), 0)
  INTO v_items_ht, v_items_tax
  FROM intervention_items
  WHERE intervention_id = NEW.id;

  -- Calculer main d'œuvre
  v_labor_ht := COALESCE(NEW.labor_hours, 0) * COALESCE(NEW.labor_rate, 0);
  v_labor_tax := ROUND(v_labor_ht * v_tax_rate / 100, 2);

  -- Calculer déplacement
  v_travel_ht := COALESCE(NEW.travel_fee, 0);
  v_travel_tax := ROUND(v_travel_ht * v_tax_rate / 100, 2);

  -- Totaux finaux
  NEW.subtotal_ht := ROUND(v_items_ht + v_labor_ht + v_travel_ht, 2);
  NEW.total_tax := ROUND(v_items_tax + v_labor_tax + v_travel_tax, 2);
  NEW.total_ttc := ROUND(NEW.subtotal_ht + NEW.total_tax, 2);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_intervention_totals
BEFORE INSERT OR UPDATE OF labor_hours, labor_rate, travel_fee
ON interventions
FOR EACH ROW
EXECUTE FUNCTION calculate_intervention_totals();

COMMENT ON FUNCTION calculate_intervention_totals IS 'Calcule automatiquement les totaux HT, TVA et TTC d''une intervention';

-- =============================================
-- TRIGGER: Recalculer intervention après modif items
-- =============================================

CREATE OR REPLACE FUNCTION recalculate_intervention_on_items_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Forcer le recalcul des totaux de l'intervention
  UPDATE interventions
  SET updated_at = NOW()
  WHERE id = COALESCE(NEW.intervention_id, OLD.intervention_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalculate_intervention_after_item_insert
AFTER INSERT ON intervention_items
FOR EACH ROW
EXECUTE FUNCTION recalculate_intervention_on_items_change();

CREATE TRIGGER trigger_recalculate_intervention_after_item_update
AFTER UPDATE ON intervention_items
FOR EACH ROW
EXECUTE FUNCTION recalculate_intervention_on_items_change();

CREATE TRIGGER trigger_recalculate_intervention_after_item_delete
AFTER DELETE ON intervention_items
FOR EACH ROW
EXECUTE FUNCTION recalculate_intervention_on_items_change();

COMMENT ON FUNCTION recalculate_intervention_on_items_change IS 'Recalcule les totaux d''intervention après modif des items';

-- =============================================
-- FONCTION: Générer référence intervention
-- =============================================

CREATE OR REPLACE FUNCTION generate_intervention_reference(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_month TEXT;
  v_sequence INTEGER;
  v_reference TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  v_month := TO_CHAR(NOW(), 'MM');

  -- Récupérer le prochain numéro de séquence pour ce mois
  SELECT COUNT(*) + 1
  INTO v_sequence
  FROM interventions
  WHERE tenant_id = p_tenant_id
    AND reference LIKE 'INT-' || v_year || v_month || '-%';

  -- Formatter la référence : INT-YYYYMM-NNNN
  v_reference := 'INT-' || v_year || v_month || '-' || LPAD(v_sequence::TEXT, 4, '0');

  RETURN v_reference;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_intervention_reference IS 'Génère une référence unique pour une intervention (INT-YYYYMM-NNNN)';

-- =============================================
-- TRIGGER: Auto-générer référence intervention
-- =============================================

CREATE OR REPLACE FUNCTION set_intervention_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference IS NULL THEN
    NEW.reference := generate_intervention_reference(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_intervention_reference
BEFORE INSERT ON interventions
FOR EACH ROW
EXECUTE FUNCTION set_intervention_reference();

-- =============================================
-- AUTO UPDATE TIMESTAMP TRIGGERS (nouvelles tables)
-- =============================================

CREATE TRIGGER update_business_types_updated_at
BEFORE UPDATE ON business_types
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intervention_types_updated_at
BEFORE UPDATE ON intervention_types
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at
BEFORE UPDATE ON product_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intervention_items_updated_at
BEFORE UPDATE ON intervention_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_technicians_updated_at
BEFORE UPDATE ON technicians
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_configs_updated_at
BEFORE UPDATE ON pricing_configs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON company_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) - Nouvelles tables
-- =============================================

-- Enable RLS sur toutes les nouvelles tables
ALTER TABLE business_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_type_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- RLS: business_types (accessible à tous, lecture seule)
CREATE POLICY business_types_select_policy ON business_types
  FOR SELECT
  USING (is_active = true);

-- RLS: intervention_types (filtrés par business_type du tenant)
CREATE POLICY intervention_types_select_policy ON intervention_types
  FOR SELECT
  USING (
    business_type_id IN (
      SELECT t.business_type_id
      FROM tenants t
      JOIN users u ON u.tenant_id = t.id
      WHERE u.id = auth.uid()
    )
    AND is_active = true
  );

-- RLS: product_categories (filtrés par business_type du tenant)
CREATE POLICY product_categories_select_policy ON product_categories
  FOR SELECT
  USING (
    business_type_id IN (
      SELECT t.business_type_id
      FROM tenants t
      JOIN users u ON u.tenant_id = t.id
      WHERE u.id = auth.uid()
    )
    AND is_active = true
  );

-- RLS: products (filtrés par business_type du tenant)
CREATE POLICY products_select_policy ON products
  FOR SELECT
  USING (
    business_type_id IN (
      SELECT t.business_type_id
      FROM tenants t
      JOIN users u ON u.tenant_id = t.id
      WHERE u.id = auth.uid()
    )
    AND is_active = true
  );

-- RLS: intervention_items (isolés par tenant via interventions)
CREATE POLICY intervention_items_select_policy ON intervention_items
  FOR SELECT
  USING (
    intervention_id IN (
      SELECT i.id
      FROM interventions i
      JOIN users u ON u.tenant_id = i.tenant_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY intervention_items_insert_policy ON intervention_items
  FOR INSERT
  WITH CHECK (
    intervention_id IN (
      SELECT i.id
      FROM interventions i
      JOIN users u ON u.tenant_id = i.tenant_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY intervention_items_update_policy ON intervention_items
  FOR UPDATE
  USING (
    intervention_id IN (
      SELECT i.id
      FROM interventions i
      JOIN users u ON u.tenant_id = i.tenant_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY intervention_items_delete_policy ON intervention_items
  FOR DELETE
  USING (
    intervention_id IN (
      SELECT i.id
      FROM interventions i
      JOIN users u ON u.tenant_id = i.tenant_id
      WHERE u.id = auth.uid() AND u.role IN ('owner', 'admin', 'manager')
    )
  );

-- RLS: intervention_type_assignments (isolés par tenant via interventions)
CREATE POLICY intervention_type_assignments_select_policy ON intervention_type_assignments
  FOR SELECT
  USING (
    intervention_id IN (
      SELECT i.id
      FROM interventions i
      JOIN users u ON u.tenant_id = i.tenant_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY intervention_type_assignments_insert_policy ON intervention_type_assignments
  FOR INSERT
  WITH CHECK (
    intervention_id IN (
      SELECT i.id
      FROM interventions i
      JOIN users u ON u.tenant_id = i.tenant_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY intervention_type_assignments_delete_policy ON intervention_type_assignments
  FOR DELETE
  USING (
    intervention_id IN (
      SELECT i.id
      FROM interventions i
      JOIN users u ON u.tenant_id = i.tenant_id
      WHERE u.id = auth.uid() AND u.role IN ('owner', 'admin', 'manager')
    )
  );

-- RLS: technicians (isolés par tenant)
CREATE POLICY technicians_select_policy ON technicians
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY technicians_insert_policy ON technicians
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY technicians_update_policy ON technicians
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY technicians_delete_policy ON technicians
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS: pricing_configs (isolés par tenant)
CREATE POLICY pricing_configs_select_policy ON pricing_configs
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY pricing_configs_insert_policy ON pricing_configs
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY pricing_configs_update_policy ON pricing_configs
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS: company_settings (isolés par tenant)
CREATE POLICY company_settings_select_policy ON company_settings
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY company_settings_insert_policy ON company_settings
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY company_settings_update_policy ON company_settings
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- =============================================
-- FIN DE LA MIGRATION
-- =============================================

COMMENT ON SCHEMA public IS 'Schema multi-trade pour inter-app - Version 2.0';
