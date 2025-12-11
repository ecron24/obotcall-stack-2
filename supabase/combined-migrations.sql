-- ============================================
-- COMBINED MIGRATIONS
-- Generated: 2025-12-11T11:28:44.642Z
-- Total migrations: 5
-- ============================================


-- ============================================
-- Migration: 016_invoice_items.sql
-- ============================================

-- ============================================
-- MIGRATION 011: Invoice Items
-- Date: 2024-12-11
-- Description: Création de la table invoice_items pour les lignes de facture
-- ============================================

-- Create invoice_items table in inter_app schema
CREATE TABLE IF NOT EXISTS inter_app.invoice_items (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES inter_app.invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,

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
  deleted_at TIMESTAMPTZ,

  CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES inter_app.invoices(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON inter_app.invoice_items(invoice_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON inter_app.invoice_items(product_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_items_display_order ON inter_app.invoice_items(invoice_id, display_order) WHERE deleted_at IS NULL;

-- ============================================
-- FUNCTION: Update invoice totals when items change
-- ============================================
CREATE OR REPLACE FUNCTION inter_app.update_invoice_totals_from_items()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = inter_app, public, pg_catalog
AS $$
DECLARE
  v_invoice_id UUID;
  v_subtotal_ht NUMERIC(10,2);
  v_total_tax NUMERIC(10,2);
  v_total_ttc NUMERIC(10,2);
BEGIN
  -- Get invoice_id from NEW or OLD
  v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);

  -- Calculate totals from all items for this invoice
  SELECT
    COALESCE(SUM(subtotal_ht), 0),
    COALESCE(SUM(tva_amount), 0),
    COALESCE(SUM(total_ttc), 0)
  INTO v_subtotal_ht, v_total_tax, v_total_ttc
  FROM inter_app.invoice_items
  WHERE invoice_id = v_invoice_id
    AND deleted_at IS NULL;

  -- Update invoice with new totals
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

-- ============================================
-- TRIGGER: Update invoice totals on item changes
-- ============================================
DROP TRIGGER IF EXISTS trigger_update_invoice_totals ON inter_app.invoice_items;
CREATE TRIGGER trigger_update_invoice_totals
  AFTER INSERT OR UPDATE OR DELETE ON inter_app.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION inter_app.update_invoice_totals_from_items();

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
DROP TRIGGER IF EXISTS update_invoice_items_updated_at ON inter_app.invoice_items;
CREATE TRIGGER update_invoice_items_updated_at
  BEFORE UPDATE ON inter_app.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE inter_app.invoice_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invoice items for their tenant
CREATE POLICY "Users can view invoice items for their tenant"
  ON inter_app.invoice_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM inter_app.invoices i
      JOIN public.user_tenant_roles utr ON utr.tenant_id = i.tenant_id
      WHERE i.id = invoice_items.invoice_id
        AND utr.user_id = (SELECT auth.uid())
        AND invoice_items.deleted_at IS NULL
    )
  );

-- Policy: Users can insert invoice items for their tenant
CREATE POLICY "Users can insert invoice items for their tenant"
  ON inter_app.invoice_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM inter_app.invoices i
      JOIN public.user_tenant_roles utr ON utr.tenant_id = i.tenant_id
      WHERE i.id = invoice_items.invoice_id
        AND utr.user_id = (SELECT auth.uid())
    )
  );

-- Policy: Users can update invoice items for their tenant
CREATE POLICY "Users can update invoice items for their tenant"
  ON inter_app.invoice_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM inter_app.invoices i
      JOIN public.user_tenant_roles utr ON utr.tenant_id = i.tenant_id
      WHERE i.id = invoice_items.invoice_id
        AND utr.user_id = (SELECT auth.uid())
        AND invoice_items.deleted_at IS NULL
    )
  );

-- Policy: Users can delete invoice items for their tenant
CREATE POLICY "Users can delete invoice items for their tenant"
  ON inter_app.invoice_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM inter_app.invoices i
      JOIN public.user_tenant_roles utr ON utr.tenant_id = i.tenant_id
      WHERE i.id = invoice_items.invoice_id
        AND utr.user_id = (SELECT auth.uid())
    )
  );

-- Grant permissions
GRANT USAGE ON SCHEMA inter_app TO authenticated;
GRANT ALL ON inter_app.invoice_items TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA inter_app TO authenticated;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE inter_app.invoice_items IS 'Lignes de facture avec calcul automatique des totaux';
COMMENT ON COLUMN inter_app.invoice_items.subtotal_ht IS 'Montant HT calculé automatiquement (quantity * unit_price_ht)';
COMMENT ON COLUMN inter_app.invoice_items.tva_amount IS 'Montant TVA calculé automatiquement';
COMMENT ON COLUMN inter_app.invoice_items.total_ttc IS 'Montant TTC calculé automatiquement';



-- ============================================
-- Migration: 017_invoice_number_sequences.sql
-- ============================================

-- ============================================
-- MIGRATION 012: Invoice Number Sequences
-- Date: 2024-12-11
-- Description: Système de génération automatique des numéros de facture
-- ============================================

-- Create invoice_number_sequences table in inter_app schema
CREATE TABLE IF NOT EXISTS inter_app.invoice_number_sequences (
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (tenant_id, year)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_invoice_number_sequences_tenant_year
  ON inter_app.invoice_number_sequences(tenant_id, year);

-- ============================================
-- FUNCTION: Generate next invoice number
-- Format: INV-YYYY-NNNN (ex: INV-2024-0001)
-- ============================================
CREATE OR REPLACE FUNCTION inter_app.generate_invoice_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = inter_app, public, pg_catalog
AS $$
DECLARE
  v_year INTEGER;
  v_next_number INTEGER;
  v_invoice_number TEXT;
BEGIN
  -- Get current year
  v_year := EXTRACT(YEAR FROM CURRENT_DATE);

  -- Lock the row to prevent race conditions
  -- Use INSERT ... ON CONFLICT to handle first invoice of the year
  INSERT INTO inter_app.invoice_number_sequences (tenant_id, year, last_number)
  VALUES (p_tenant_id, v_year, 1)
  ON CONFLICT (tenant_id, year)
  DO UPDATE SET
    last_number = inter_app.invoice_number_sequences.last_number + 1,
    updated_at = NOW()
  RETURNING last_number INTO v_next_number;

  -- Format: INV-2024-0001
  v_invoice_number := 'INV-' || v_year || '-' || LPAD(v_next_number::TEXT, 4, '0');

  RETURN v_invoice_number;
END;
$$;

-- ============================================
-- FUNCTION: Set invoice number on insert (if not provided)
-- ============================================
CREATE OR REPLACE FUNCTION inter_app.set_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only generate if invoice_number is not provided
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := inter_app.generate_invoice_number(NEW.tenant_id);
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGER: Auto-generate invoice number on insert
-- ============================================
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_invoice_number_on_insert ON inter_app.invoices;

-- Create new trigger
CREATE TRIGGER set_invoice_number_on_insert
  BEFORE INSERT ON inter_app.invoices
  FOR EACH ROW
  EXECUTE FUNCTION inter_app.set_invoice_number();

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
DROP TRIGGER IF EXISTS update_invoice_number_sequences_updated_at ON inter_app.invoice_number_sequences;
CREATE TRIGGER update_invoice_number_sequences_updated_at
  BEFORE UPDATE ON inter_app.invoice_number_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE inter_app.invoice_number_sequences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view sequences for their tenant
CREATE POLICY "Users can view sequences for their tenant"
  ON inter_app.invoice_number_sequences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      WHERE utr.tenant_id = invoice_number_sequences.tenant_id
        AND utr.user_id = (SELECT auth.uid())
    )
  );

-- Policy: System can manage sequences (for trigger)
CREATE POLICY "System can manage sequences"
  ON inter_app.invoice_number_sequences
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT USAGE ON SCHEMA inter_app TO authenticated;
GRANT ALL ON inter_app.invoice_number_sequences TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA inter_app TO authenticated;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE inter_app.invoice_number_sequences IS 'Séquences de numérotation automatique des factures par tenant et par année';
COMMENT ON FUNCTION inter_app.generate_invoice_number(UUID) IS 'Génère le prochain numéro de facture au format INV-YYYY-NNNN';
COMMENT ON COLUMN inter_app.invoice_number_sequences.last_number IS 'Dernier numéro utilisé pour cette année';



-- ============================================
-- Migration: 018_invoice_type_proforma_final.sql
-- ============================================

-- ============================================
-- MIGRATION 013: Invoice Type (Proforma / Final)
-- Date: 2024-12-11
-- Description: Ajout du type de facture et workflow proforma → définitive
-- ============================================

-- Add invoice_type column to invoices
ALTER TABLE inter_app.invoices
ADD COLUMN IF NOT EXISTS invoice_type TEXT NOT NULL DEFAULT 'proforma'
  CHECK (invoice_type IN ('proforma', 'final'));

-- Add columns for proforma validation workflow
ALTER TABLE inter_app.invoices
ADD COLUMN IF NOT EXISTS proforma_validated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS proforma_validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS converted_to_final_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS converted_to_final_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add columns for invoice sending
ALTER TABLE inter_app.invoices
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sent_to_emails TEXT[];

-- Add column for document storage (Google Drive, S3, etc.)
ALTER TABLE inter_app.invoices
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS document_uploaded_at TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_type ON inter_app.invoices(invoice_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_proforma_validated ON inter_app.invoices(proforma_validated_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_sent_at ON inter_app.invoices(sent_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_converted_to_final ON inter_app.invoices(converted_to_final_at) WHERE deleted_at IS NULL;

-- ============================================
-- FUNCTION: Convert proforma to final invoice
-- ============================================
CREATE OR REPLACE FUNCTION inter_app.convert_proforma_to_final(
  p_invoice_id UUID,
  p_user_id UUID
)
RETURNS inter_app.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = inter_app, public, pg_catalog
AS $$
DECLARE
  v_invoice inter_app.invoices;
  v_new_invoice_number TEXT;
BEGIN
  -- Get the proforma invoice
  SELECT * INTO v_invoice
  FROM inter_app.invoices
  WHERE id = p_invoice_id
    AND invoice_type = 'proforma'
    AND deleted_at IS NULL;

  IF v_invoice IS NULL THEN
    RAISE EXCEPTION 'Facture proforma non trouvée ou déjà convertie';
  END IF;

  -- Generate new invoice number for final invoice
  v_new_invoice_number := inter_app.generate_invoice_number(v_invoice.tenant_id);

  -- Update invoice to final
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

-- ============================================
-- FUNCTION: Validate proforma invoice
-- ============================================
CREATE OR REPLACE FUNCTION inter_app.validate_proforma_invoice(
  p_invoice_id UUID,
  p_user_id UUID
)
RETURNS inter_app.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = inter_app, public, pg_catalog
AS $$
DECLARE
  v_invoice inter_app.invoices;
BEGIN
  -- Get the proforma invoice
  SELECT * INTO v_invoice
  FROM inter_app.invoices
  WHERE id = p_invoice_id
    AND invoice_type = 'proforma'
    AND deleted_at IS NULL;

  IF v_invoice IS NULL THEN
    RAISE EXCEPTION 'Facture proforma non trouvée';
  END IF;

  IF v_invoice.proforma_validated_at IS NOT NULL THEN
    RAISE EXCEPTION 'Facture proforma déjà validée';
  END IF;

  -- Validate proforma
  UPDATE inter_app.invoices
  SET
    proforma_validated_at = NOW(),
    proforma_validated_by = p_user_id,
    status = 'sent',
    updated_at = NOW()
  WHERE id = p_invoice_id
  RETURNING * INTO v_invoice;

  RETURN v_invoice;
END;
$$;

-- ============================================
-- FUNCTION: Mark invoice as sent
-- ============================================
CREATE OR REPLACE FUNCTION inter_app.mark_invoice_sent(
  p_invoice_id UUID,
  p_user_id UUID,
  p_sent_to_emails TEXT[]
)
RETURNS inter_app.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = inter_app, public, pg_catalog
AS $$
DECLARE
  v_invoice inter_app.invoices;
BEGIN
  -- Update invoice
  UPDATE inter_app.invoices
  SET
    sent_at = NOW(),
    sent_by = p_user_id,
    sent_to_emails = p_sent_to_emails,
    status = CASE
      WHEN status = 'draft' THEN 'sent'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = p_invoice_id
    AND deleted_at IS NULL
  RETURNING * INTO v_invoice;

  IF v_invoice IS NULL THEN
    RAISE EXCEPTION 'Facture non trouvée';
  END IF;

  RETURN v_invoice;
END;
$$;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON COLUMN inter_app.invoices.invoice_type IS 'Type de facture: proforma (devis) ou final (définitive)';
COMMENT ON COLUMN inter_app.invoices.proforma_validated_at IS 'Date de validation de la facture proforma';
COMMENT ON COLUMN inter_app.invoices.converted_to_final_at IS 'Date de conversion proforma → finale';
COMMENT ON COLUMN inter_app.invoices.sent_at IS 'Date d''envoi de la facture au client';
COMMENT ON COLUMN inter_app.invoices.document_url IS 'URL du document PDF (Google Drive, S3, etc.)';

COMMENT ON FUNCTION inter_app.convert_proforma_to_final(UUID, UUID) IS 'Convertit une facture proforma en facture définitive';
COMMENT ON FUNCTION inter_app.validate_proforma_invoice(UUID, UUID) IS 'Valide une facture proforma';
COMMENT ON FUNCTION inter_app.mark_invoice_sent(UUID, UUID, TEXT[]) IS 'Marque une facture comme envoyée';



-- ============================================
-- Migration: 019_stock_movements.sql
-- ============================================

-- ============================================
-- MIGRATION 014: Stock Movements
-- Date: 2024-12-11
-- Description: Gestion des mouvements de stock pour les produits
-- ============================================

-- Create ENUM for movement types
DO $$ BEGIN
  CREATE TYPE inter_app.movement_type AS ENUM (
    'purchase',      -- Achat (entrée de stock)
    'sale',          -- Vente (sortie de stock)
    'return',        -- Retour (entrée de stock)
    'adjustment',    -- Ajustement inventaire
    'loss',          -- Perte/casse
    'transfer',      -- Transfert
    'intervention'   -- Utilisé dans une intervention
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create stock_movements table in inter_app schema
CREATE TABLE IF NOT EXISTS inter_app.stock_movements (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  intervention_id UUID REFERENCES inter_app.interventions(id) ON DELETE SET NULL,

  -- Movement details
  movement_type inter_app.movement_type NOT NULL,
  quantity NUMERIC(10,2) NOT NULL CHECK (quantity != 0),
  unit_cost NUMERIC(10,2),

  -- Additional info
  reason TEXT,
  notes TEXT,
  reference_number TEXT, -- Bon de livraison, numéro de commande, etc.

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_id ON inter_app.stock_movements(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON inter_app.stock_movements(product_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stock_movements_intervention_id ON inter_app.stock_movements(intervention_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON inter_app.stock_movements(movement_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON inter_app.stock_movements(created_at DESC) WHERE deleted_at IS NULL;

-- ============================================
-- FUNCTION: Update product stock quantity
-- ============================================
CREATE OR REPLACE FUNCTION inter_app.update_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = inter_app, public, pg_catalog
AS $$
DECLARE
  v_quantity_delta NUMERIC(10,2);
BEGIN
  -- Determine quantity change based on operation
  IF TG_OP = 'INSERT' THEN
    v_quantity_delta := NEW.quantity;
  ELSIF TG_OP = 'UPDATE' THEN
    v_quantity_delta := NEW.quantity - OLD.quantity;
  ELSIF TG_OP = 'DELETE' THEN
    v_quantity_delta := -OLD.quantity;
  END IF;

  -- Update product stock
  -- Note: Assumes products table has a stock_quantity column
  -- If not, this trigger should be disabled or modified
  UPDATE public.products
  SET
    stock_quantity = COALESCE(stock_quantity, 0) + v_quantity_delta,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================
-- TRIGGER: Update product stock on movement changes
-- Note: Only enable this if products table has stock_quantity column
-- ============================================
-- DROP TRIGGER IF EXISTS trigger_update_product_stock ON inter_app.stock_movements;
-- CREATE TRIGGER trigger_update_product_stock
--   AFTER INSERT OR UPDATE OF quantity OR DELETE ON inter_app.stock_movements
--   FOR EACH ROW
--   WHEN (OLD.deleted_at IS NULL OR NEW.deleted_at IS NULL)
--   EXECUTE FUNCTION inter_app.update_product_stock();

-- ============================================
-- FUNCTION: Get current stock for a product
-- ============================================
CREATE OR REPLACE FUNCTION inter_app.get_product_stock(
  p_product_id UUID,
  p_tenant_id UUID
)
RETURNS NUMERIC(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = inter_app, public, pg_catalog
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

-- ============================================
-- FUNCTION: Record product usage in intervention
-- ============================================
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
SET search_path = inter_app, public, pg_catalog
AS $$
DECLARE
  v_movement inter_app.stock_movements;
BEGIN
  -- Record negative movement (usage)
  INSERT INTO inter_app.stock_movements (
    tenant_id,
    product_id,
    intervention_id,
    movement_type,
    quantity,
    unit_cost,
    reason,
    created_by
  )
  VALUES (
    p_tenant_id,
    p_product_id,
    p_intervention_id,
    'intervention',
    -ABS(p_quantity), -- Always negative for usage
    p_unit_cost,
    'Utilisation dans intervention',
    p_created_by
  )
  RETURNING * INTO v_movement;

  RETURN v_movement;
END;
$$;

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE inter_app.stock_movements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view stock movements for their tenant
CREATE POLICY "Users can view stock movements for their tenant"
  ON inter_app.stock_movements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      WHERE utr.tenant_id = stock_movements.tenant_id
        AND utr.user_id = (SELECT auth.uid())
        AND stock_movements.deleted_at IS NULL
    )
  );

-- Policy: Users can insert stock movements for their tenant
CREATE POLICY "Users can insert stock movements for their tenant"
  ON inter_app.stock_movements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      WHERE utr.tenant_id = stock_movements.tenant_id
        AND utr.user_id = (SELECT auth.uid())
    )
  );

-- Policy: Users can update stock movements for their tenant
CREATE POLICY "Users can update stock movements for their tenant"
  ON inter_app.stock_movements
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      WHERE utr.tenant_id = stock_movements.tenant_id
        AND utr.user_id = (SELECT auth.uid())
        AND stock_movements.deleted_at IS NULL
    )
  );

-- Policy: Users can delete (soft) stock movements for their tenant
CREATE POLICY "Users can delete stock movements for their tenant"
  ON inter_app.stock_movements
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      WHERE utr.tenant_id = stock_movements.tenant_id
        AND utr.user_id = (SELECT auth.uid())
    )
  );

-- Grant permissions
GRANT USAGE ON SCHEMA inter_app TO authenticated;
GRANT ALL ON inter_app.stock_movements TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA inter_app TO authenticated;
GRANT USAGE ON TYPE inter_app.movement_type TO authenticated;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE inter_app.stock_movements IS 'Historique des mouvements de stock par tenant';
COMMENT ON TYPE inter_app.movement_type IS 'Types de mouvements de stock: purchase, sale, return, adjustment, loss, transfer, intervention';
COMMENT ON COLUMN inter_app.stock_movements.quantity IS 'Quantité du mouvement (positive = entrée, négative = sortie)';
COMMENT ON FUNCTION inter_app.get_product_stock(UUID, UUID) IS 'Calcule le stock actuel d''un produit pour un tenant';
COMMENT ON FUNCTION inter_app.record_product_usage_in_intervention(UUID, UUID, UUID, NUMERIC, NUMERIC, UUID) IS 'Enregistre l''utilisation d''un produit dans une intervention';



-- ============================================
-- Migration: 020_cleanup_and_consistency.sql
-- ============================================

-- ============================================
-- MIGRATION 015: Cleanup and Consistency
-- Date: 2024-12-11
-- Description: Nettoyage et cohérence des structures après ajout invoice_items
-- ============================================

-- ============================================
-- 1. Migration de line_items (JSONB) vers invoice_items (table)
-- ============================================

-- Function to migrate existing line_items to invoice_items table
CREATE OR REPLACE FUNCTION inter_app.migrate_line_items_to_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice RECORD;
  v_item JSONB;
  v_index INTEGER;
BEGIN
  -- Loop through all invoices that have line_items
  FOR v_invoice IN
    SELECT id, line_items
    FROM inter_app.invoices
    WHERE line_items IS NOT NULL
      AND jsonb_array_length(line_items) > 0
      AND NOT EXISTS (
        SELECT 1 FROM inter_app.invoice_items
        WHERE invoice_id = invoices.id
      )
  LOOP
    -- Loop through each line item in the JSONB array
    v_index := 0;
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_invoice.line_items)
    LOOP
      -- Insert into invoice_items table
      INSERT INTO inter_app.invoice_items (
        invoice_id,
        product_id,
        description,
        quantity,
        unit,
        unit_price_ht,
        tva_rate,
        display_order
      )
      VALUES (
        v_invoice.id,
        (v_item->>'product_id')::UUID,
        v_item->>'description',
        (v_item->>'quantity')::NUMERIC,
        COALESCE(v_item->>'unit', 'unité'),
        (v_item->>'unit_price_ht')::NUMERIC,
        COALESCE((v_item->>'tva_rate')::NUMERIC, 20.00),
        v_index
      );

      v_index := v_index + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Migration des line_items vers invoice_items terminée';
END;
$$;

-- Execute the migration (comment out after first run)
-- SELECT inter_app.migrate_line_items_to_table();

-- ============================================
-- 2. Harmonisation des colonnes sent_date vs sent_at
-- ============================================

-- Copy sent_date to sent_at if sent_at is NULL and sent_date exists
UPDATE inter_app.invoices
SET sent_at = sent_date::TIMESTAMPTZ
WHERE sent_date IS NOT NULL
  AND sent_at IS NULL;

-- Copy sent_to_email to sent_to_emails array if exists
UPDATE inter_app.invoices
SET sent_to_emails = ARRAY[sent_to_email]
WHERE sent_to_email IS NOT NULL
  AND (sent_to_emails IS NULL OR array_length(sent_to_emails, 1) IS NULL);

-- ============================================
-- 3. Add stock_quantity column to products if not exists
-- (for stock_movements trigger to work)
-- ============================================

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC(10,2) DEFAULT 0 CHECK (stock_quantity >= 0);

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS low_stock_threshold NUMERIC(10,2) DEFAULT 0;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS track_stock BOOLEAN DEFAULT false;

-- Index for stock queries
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON public.products(stock_quantity) WHERE track_stock = true;
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON public.products(stock_quantity) WHERE track_stock = true AND stock_quantity <= low_stock_threshold;

-- ============================================
-- 4. Enable stock trigger after products table is ready
-- ============================================

DROP TRIGGER IF EXISTS trigger_update_product_stock ON inter_app.stock_movements;
CREATE TRIGGER trigger_update_product_stock
  AFTER INSERT OR UPDATE OF quantity OR DELETE ON inter_app.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION inter_app.update_product_stock();

-- ============================================
-- 5. Add missing indexes for performance
-- ============================================

-- Index on invoices for filtering by type and status
CREATE INDEX IF NOT EXISTS idx_invoices_type_status ON inter_app.invoices(invoice_type, status) WHERE deleted_at IS NULL;

-- Index on clients for search
CREATE INDEX IF NOT EXISTS idx_clients_search ON inter_app.clients USING gin(
  to_tsvector('french', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(company_name, ''))
) WHERE deleted_at IS NULL;

-- Index on interventions for filtering by status and date
CREATE INDEX IF NOT EXISTS idx_interventions_status_date ON inter_app.interventions(status, scheduled_at DESC) WHERE deleted_at IS NULL;

-- ============================================
-- 6. Function to check invoice consistency
-- ============================================

CREATE OR REPLACE FUNCTION inter_app.check_invoice_consistency(p_invoice_id UUID)
RETURNS TABLE (
  issue_type TEXT,
  issue_description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice RECORD;
  v_items_total_ht NUMERIC(10,2);
  v_items_total_tax NUMERIC(10,2);
  v_items_total_ttc NUMERIC(10,2);
BEGIN
  -- Get invoice
  SELECT * INTO v_invoice
  FROM inter_app.invoices
  WHERE id = p_invoice_id;

  IF v_invoice IS NULL THEN
    RETURN QUERY SELECT 'not_found'::TEXT, 'Invoice not found'::TEXT;
    RETURN;
  END IF;

  -- Calculate totals from items
  SELECT
    COALESCE(SUM(subtotal_ht), 0),
    COALESCE(SUM(tva_amount), 0),
    COALESCE(SUM(total_ttc), 0)
  INTO v_items_total_ht, v_items_total_tax, v_items_total_ttc
  FROM inter_app.invoice_items
  WHERE invoice_id = p_invoice_id
    AND deleted_at IS NULL;

  -- Check if items match invoice totals
  IF ABS(v_items_total_ht - v_invoice.subtotal_ht) > 0.01 THEN
    RETURN QUERY SELECT 'subtotal_mismatch'::TEXT,
      format('Items subtotal (%s) != Invoice subtotal (%s)', v_items_total_ht, v_invoice.subtotal_ht)::TEXT;
  END IF;

  IF ABS(v_items_total_tax - v_invoice.total_tax) > 0.01 THEN
    RETURN QUERY SELECT 'tax_mismatch'::TEXT,
      format('Items tax (%s) != Invoice tax (%s)', v_items_total_tax, v_invoice.total_tax)::TEXT;
  END IF;

  IF ABS(v_items_total_ttc - v_invoice.total_ttc) > 0.01 THEN
    RETURN QUERY SELECT 'total_mismatch'::TEXT,
      format('Items total (%s) != Invoice total (%s)', v_items_total_ttc, v_invoice.total_ttc)::TEXT;
  END IF;

  -- If no issues found
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'ok'::TEXT, 'No consistency issues found'::TEXT;
  END IF;
END;
$$;

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON FUNCTION inter_app.migrate_line_items_to_table() IS 'Migre les line_items JSONB vers la table invoice_items relationnelle';
COMMENT ON FUNCTION inter_app.check_invoice_consistency(UUID) IS 'Vérifie la cohérence entre invoice et invoice_items';
COMMENT ON COLUMN public.products.stock_quantity IS 'Quantité en stock (calculée automatiquement depuis stock_movements)';
COMMENT ON COLUMN public.products.track_stock IS 'Activer le suivi de stock pour ce produit';
COMMENT ON COLUMN public.products.low_stock_threshold IS 'Seuil d''alerte stock bas';



-- ============================================
-- END OF MIGRATIONS
-- ============================================
