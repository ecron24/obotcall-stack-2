-- ============================================
-- MIGRATIONS 016-020 ADAPTÉES À L'ÉTAT ACTUEL
-- Générées: 2025-12-11
-- Cette version s'adapte à la structure existante
-- ============================================

-- ============================================
-- MIGRATION 016: Invoice Items (ADAPTÉ)
-- ============================================

-- 1. Créer table invoice_items SI elle n'existe PAS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'inter_app' AND tablename = 'invoice_items'
  ) THEN

    CREATE TABLE inter_app.invoice_items (
      id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
      invoice_id UUID NOT NULL,
      product_id UUID,

      -- Item details
      description TEXT NOT NULL,
      quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
      unit TEXT NOT NULL DEFAULT 'unité',
      unit_price_ht NUMERIC(10,2) NOT NULL CHECK (unit_price_ht >= 0),
      tva_rate NUMERIC(5,2) NOT NULL DEFAULT 20.00 CHECK (tva_rate >= 0 AND tva_rate <= 100),

      -- Calculated amounts (GENERATED COLUMNS)
      subtotal_ht NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price_ht) STORED,
      tva_amount NUMERIC(10,2) GENERATED ALWAYS AS ((quantity * unit_price_ht * tva_rate) / 100) STORED,
      total_ttc NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price_ht * (1 + tva_rate / 100)) STORED,

      -- Display order for items
      display_order INTEGER NOT NULL DEFAULT 0,

      -- Audit
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    );

    RAISE NOTICE 'Table inter_app.invoice_items créée';
  ELSE
    RAISE NOTICE 'Table inter_app.invoice_items existe déjà, skip';
  END IF;

  -- Ajouter FK séparément
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'invoice_items_invoice_id_fkey'
  ) THEN
    ALTER TABLE inter_app.invoice_items
      ADD CONSTRAINT invoice_items_invoice_id_fkey
      FOREIGN KEY (invoice_id) REFERENCES inter_app.invoices(id) ON DELETE CASCADE;
    RAISE NOTICE 'FK invoice_items_invoice_id_fkey créée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'invoice_items_product_id_fkey'
  ) THEN
    ALTER TABLE inter_app.invoice_items
      ADD CONSTRAINT invoice_items_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
    RAISE NOTICE 'FK invoice_items_product_id_fkey créée';
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON inter_app.invoice_items(invoice_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON inter_app.invoice_items(product_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_items_display_order ON inter_app.invoice_items(invoice_id, display_order) WHERE deleted_at IS NULL;

-- Fonctions et triggers
CREATE OR REPLACE FUNCTION inter_app.update_invoice_totals_from_items()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice_id UUID;
  v_subtotal_ht NUMERIC(10,2);
  v_total_tax NUMERIC(10,2);
  v_total_ttc NUMERIC(10,2);
BEGIN
  v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);

  SELECT
    COALESCE(SUM(subtotal_ht), 0),
    COALESCE(SUM(tva_amount), 0),
    COALESCE(SUM(total_ttc), 0)
  INTO v_subtotal_ht, v_total_tax, v_total_ttc
  FROM inter_app.invoice_items
  WHERE invoice_id = v_invoice_id
    AND deleted_at IS NULL;

  UPDATE inter_app.invoices
  SET
    subtotal_ht = v_subtotal_ht,
    total_tax = v_total_tax,
    total_ttc = v_total_ttc,
    updated_at = NOW()
  WHERE id = v_invoice_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_invoice_totals ON inter_app.invoice_items;
CREATE TRIGGER trigger_update_invoice_totals
  AFTER INSERT OR UPDATE OR DELETE ON inter_app.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION inter_app.update_invoice_totals_from_items();

-- RLS
ALTER TABLE inter_app.invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view invoice items for their tenant" ON inter_app.invoice_items;
CREATE POLICY "Users can view invoice items for their tenant"
  ON inter_app.invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM inter_app.invoices inv
      JOIN public.user_tenant_roles utr ON utr.tenant_id = inv.tenant_id
      WHERE inv.id = invoice_items.invoice_id
        AND utr.user_id = auth.uid()
        AND invoice_items.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can insert invoice items for their tenant" ON inter_app.invoice_items;
CREATE POLICY "Users can insert invoice items for their tenant"
  ON inter_app.invoice_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM inter_app.invoices inv
      JOIN public.user_tenant_roles utr ON utr.tenant_id = inv.tenant_id
      WHERE inv.id = invoice_items.invoice_id
        AND utr.user_id = auth.uid()
    )
  );

GRANT ALL ON inter_app.invoice_items TO authenticated;

-- ============================================
-- MIGRATION 017: Invoice Number Sequences
-- ============================================

CREATE TABLE IF NOT EXISTS inter_app.invoice_number_sequences (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, year)
);

CREATE INDEX IF NOT EXISTS idx_invoice_number_sequences_tenant_year
  ON inter_app.invoice_number_sequences(tenant_id, year);

CREATE OR REPLACE FUNCTION inter_app.generate_invoice_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year INTEGER;
  v_next_number INTEGER;
  v_invoice_number TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE);

  INSERT INTO inter_app.invoice_number_sequences (tenant_id, year, last_number)
  VALUES (p_tenant_id, v_year, 1)
  ON CONFLICT (tenant_id, year)
  DO UPDATE SET
    last_number = inter_app.invoice_number_sequences.last_number + 1,
    updated_at = NOW()
  RETURNING last_number INTO v_next_number;

  v_invoice_number := 'INV-' || v_year || '-' || LPAD(v_next_number::TEXT, 4, '0');
  RETURN v_invoice_number;
END;
$$;

ALTER TABLE inter_app.invoice_number_sequences ENABLE ROW LEVEL SECURITY;
GRANT ALL ON inter_app.invoice_number_sequences TO authenticated;

-- ============================================
-- MIGRATION 018: Invoice Type Proforma/Final
-- ============================================

-- Ajouter colonnes SI elles n'existent PAS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'inter_app' AND table_name = 'invoices' AND column_name = 'invoice_type'
  ) THEN
    ALTER TABLE inter_app.invoices
      ADD COLUMN invoice_type TEXT NOT NULL DEFAULT 'proforma'
      CHECK (invoice_type IN ('proforma', 'final'));
    RAISE NOTICE 'Colonne invoice_type ajoutée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'inter_app' AND table_name = 'invoices' AND column_name = 'proforma_validated_at'
  ) THEN
    ALTER TABLE inter_app.invoices ADD COLUMN proforma_validated_at TIMESTAMPTZ;
    ALTER TABLE inter_app.invoices ADD COLUMN proforma_validated_by UUID REFERENCES auth.users(id);
    RAISE NOTICE 'Colonnes proforma_validated ajoutées';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'inter_app' AND table_name = 'invoices' AND column_name = 'converted_to_final_at'
  ) THEN
    ALTER TABLE inter_app.invoices ADD COLUMN converted_to_final_at TIMESTAMPTZ;
    ALTER TABLE inter_app.invoices ADD COLUMN converted_to_final_by UUID REFERENCES auth.users(id);
    RAISE NOTICE 'Colonnes converted_to_final ajoutées';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'inter_app' AND table_name = 'invoices' AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE inter_app.invoices ADD COLUMN sent_at TIMESTAMPTZ;
    ALTER TABLE inter_app.invoices ADD COLUMN sent_by UUID REFERENCES auth.users(id);
    ALTER TABLE inter_app.invoices ADD COLUMN sent_to_emails TEXT[];
    RAISE NOTICE 'Colonnes sent ajoutées';
  END IF;
END $$;

-- Fonctions workflow
CREATE OR REPLACE FUNCTION inter_app.validate_proforma(
  p_invoice_id UUID,
  p_user_id UUID
)
RETURNS inter_app.invoices
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice inter_app.invoices;
BEGIN
  UPDATE inter_app.invoices
  SET
    proforma_validated_at = NOW(),
    proforma_validated_by = p_user_id,
    updated_at = NOW()
  WHERE id = p_invoice_id
    AND invoice_type = 'proforma'
    AND proforma_validated_at IS NULL
  RETURNING * INTO v_invoice;

  IF v_invoice IS NULL THEN
    RAISE EXCEPTION 'Invoice not found or already validated';
  END IF;

  RETURN v_invoice;
END;
$$;

CREATE OR REPLACE FUNCTION inter_app.convert_proforma_to_final(
  p_invoice_id UUID,
  p_user_id UUID
)
RETURNS inter_app.invoices
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice inter_app.invoices;
  v_new_invoice_number TEXT;
BEGIN
  SELECT * INTO v_invoice
  FROM inter_app.invoices
  WHERE id = p_invoice_id
    AND invoice_type = 'proforma'
    AND proforma_validated_at IS NOT NULL;

  IF v_invoice IS NULL THEN
    RAISE EXCEPTION 'Proforma not found or not validated';
  END IF;

  v_new_invoice_number := inter_app.generate_invoice_number(v_invoice.tenant_id);

  UPDATE inter_app.invoices
  SET
    invoice_type = 'final',
    invoice_number = v_new_invoice_number,
    converted_to_final_at = NOW(),
    converted_to_final_by = p_user_id,
    updated_at = NOW()
  WHERE id = p_invoice_id
  RETURNING * INTO v_invoice;

  RETURN v_invoice;
END;
$$;

CREATE OR REPLACE FUNCTION inter_app.send_invoice(
  p_invoice_id UUID,
  p_user_id UUID,
  p_emails TEXT[]
)
RETURNS inter_app.invoices
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice inter_app.invoices;
BEGIN
  UPDATE inter_app.invoices
  SET
    sent_at = NOW(),
    sent_by = p_user_id,
    sent_to_emails = p_emails,
    status = 'sent',
    updated_at = NOW()
  WHERE id = p_invoice_id
  RETURNING * INTO v_invoice;

  RETURN v_invoice;
END;
$$;

-- ============================================
-- MIGRATION 019: Stock Movements
-- ============================================

-- Créer ENUM movement_type
DO $$ BEGIN
  CREATE TYPE inter_app.movement_type AS ENUM (
    'purchase', 'sale', 'return', 'adjustment', 'loss', 'transfer', 'intervention'
  );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Type movement_type existe déjà';
END $$;

-- Créer table stock_movements
CREATE TABLE IF NOT EXISTS inter_app.stock_movements (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  intervention_id UUID REFERENCES inter_app.interventions(id) ON DELETE SET NULL,

  movement_type inter_app.movement_type NOT NULL,
  quantity NUMERIC(10,2) NOT NULL CHECK (quantity != 0),
  unit_cost NUMERIC(10,2),

  reason TEXT,
  notes TEXT,
  reference_number TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_id ON inter_app.stock_movements(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON inter_app.stock_movements(product_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stock_movements_intervention_id ON inter_app.stock_movements(intervention_id) WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION inter_app.update_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quantity_delta NUMERIC(10,2);
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_quantity_delta := NEW.quantity;
  ELSIF TG_OP = 'UPDATE' THEN
    v_quantity_delta := NEW.quantity - OLD.quantity;
  ELSIF TG_OP = 'DELETE' THEN
    v_quantity_delta := -OLD.quantity;
  END IF;

  UPDATE public.products
  SET
    stock_quantity = COALESCE(stock_quantity, 0) + v_quantity_delta,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION inter_app.get_product_stock(
  p_product_id UUID,
  p_tenant_id UUID
)
RETURNS NUMERIC(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_stock NUMERIC(10,2);
BEGIN
  SELECT COALESCE(SUM(quantity), 0)
  INTO v_total_stock
  FROM inter_app.stock_movements
  WHERE product_id = p_product_id
    AND tenant_id = p_tenant_id
    AND deleted_at IS NULL;

  RETURN v_total_stock;
END;
$$;

CREATE OR REPLACE FUNCTION inter_app.record_product_usage_in_intervention(
  p_tenant_id UUID,
  p_intervention_id UUID,
  p_product_id UUID,
  p_quantity NUMERIC,
  p_unit_cost NUMERIC,
  p_created_by UUID
)
RETURNS inter_app.stock_movements
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_movement inter_app.stock_movements;
BEGIN
  INSERT INTO inter_app.stock_movements (
    tenant_id, product_id, intervention_id, movement_type,
    quantity, unit_cost, reason, created_by
  )
  VALUES (
    p_tenant_id, p_product_id, p_intervention_id, 'intervention',
    -ABS(p_quantity), p_unit_cost, 'Utilisation dans intervention', p_created_by
  )
  RETURNING * INTO v_movement;

  RETURN v_movement;
END;
$$;

ALTER TABLE inter_app.stock_movements ENABLE ROW LEVEL SECURITY;
GRANT ALL ON inter_app.stock_movements TO authenticated;
GRANT USAGE ON TYPE inter_app.movement_type TO authenticated;

-- ============================================
-- MIGRATION 020: Cleanup & Consistency
-- ============================================

-- Ajouter colonnes stock SI elles n'existent PAS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'track_stock'
  ) THEN
    ALTER TABLE public.products ADD COLUMN track_stock BOOLEAN DEFAULT false;
    RAISE NOTICE 'Colonne track_stock ajoutée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'low_stock_threshold'
  ) THEN
    ALTER TABLE public.products ADD COLUMN low_stock_threshold NUMERIC(10,2) DEFAULT 0;
    RAISE NOTICE 'Colonne low_stock_threshold ajoutée';
  END IF;
END $$;

-- Activer trigger stock
DROP TRIGGER IF EXISTS trigger_update_product_stock ON inter_app.stock_movements;
CREATE TRIGGER trigger_update_product_stock
  AFTER INSERT OR UPDATE OF quantity OR DELETE ON inter_app.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION inter_app.update_product_stock();

-- Indexes performance
CREATE INDEX IF NOT EXISTS idx_invoices_type_status ON inter_app.invoices(invoice_type, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON public.products(stock_quantity) WHERE track_stock = true;
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON public.products(stock_quantity) WHERE track_stock = true AND stock_quantity <= low_stock_threshold;

-- ============================================
-- FIN DES MIGRATIONS
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migrations 016-020 appliquées avec succès !';
END $$;
