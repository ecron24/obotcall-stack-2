-- ============================================
-- MIGRATION 016: Invoice Items (SAFE/IDEMPOTENT)
-- Date: 2024-12-11
-- Description: Création de la table invoice_items pour les lignes de facture
-- Cette version est idempotente et ne plante pas si les objets existent déjà
-- ============================================

-- Create invoice_items table in inter_app schema
DO $$
BEGIN
  -- Create table only if it doesn't exist
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

    RAISE NOTICE 'Table inter_app.invoice_items created';
  ELSE
    RAISE NOTICE 'Table inter_app.invoice_items already exists, skipping creation';
  END IF;

  -- Add foreign key constraints separately (idempotent)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'invoice_items_invoice_id_fkey'
      AND connamespace = 'inter_app'::regnamespace
  ) THEN
    ALTER TABLE inter_app.invoice_items
      ADD CONSTRAINT invoice_items_invoice_id_fkey
      FOREIGN KEY (invoice_id) REFERENCES inter_app.invoices(id) ON DELETE CASCADE;
    RAISE NOTICE 'Constraint invoice_items_invoice_id_fkey created';
  ELSE
    RAISE NOTICE 'Constraint invoice_items_invoice_id_fkey already exists, skipping';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'invoice_items_product_id_fkey'
      AND connamespace = 'inter_app'::regnamespace
  ) THEN
    ALTER TABLE inter_app.invoice_items
      ADD CONSTRAINT invoice_items_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
    RAISE NOTICE 'Constraint invoice_items_product_id_fkey created';
  ELSE
    RAISE NOTICE 'Constraint invoice_items_product_id_fkey already exists, skipping';
  END IF;
END $$;

-- Indexes for performance (IF NOT EXISTS déjà géré)
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
DROP POLICY IF EXISTS "Users can view invoice items for their tenant" ON inter_app.invoice_items;
CREATE POLICY "Users can view invoice items for their tenant"
  ON inter_app.invoice_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM inter_app.invoices inv
      JOIN public.user_tenant_roles utr ON utr.tenant_id = inv.tenant_id
      WHERE inv.id = invoice_items.invoice_id
        AND utr.user_id = auth.uid()
        AND invoice_items.deleted_at IS NULL
    )
  );

-- Policy: Users can insert invoice items for their tenant
DROP POLICY IF EXISTS "Users can insert invoice items for their tenant" ON inter_app.invoice_items;
CREATE POLICY "Users can insert invoice items for their tenant"
  ON inter_app.invoice_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM inter_app.invoices inv
      JOIN public.user_tenant_roles utr ON utr.tenant_id = inv.tenant_id
      WHERE inv.id = invoice_items.invoice_id
        AND utr.user_id = auth.uid()
    )
  );

-- Policy: Users can update invoice items for their tenant
DROP POLICY IF EXISTS "Users can update invoice items for their tenant" ON inter_app.invoice_items;
CREATE POLICY "Users can update invoice items for their tenant"
  ON inter_app.invoice_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM inter_app.invoices inv
      JOIN public.user_tenant_roles utr ON utr.tenant_id = inv.tenant_id
      WHERE inv.id = invoice_items.invoice_id
        AND utr.user_id = auth.uid()
        AND invoice_items.deleted_at IS NULL
    )
  );

-- Policy: Users can delete (soft) invoice items for their tenant
DROP POLICY IF EXISTS "Users can delete invoice items for their tenant" ON inter_app.invoice_items;
CREATE POLICY "Users can delete invoice items for their tenant"
  ON inter_app.invoice_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM inter_app.invoices inv
      JOIN public.user_tenant_roles utr ON utr.tenant_id = inv.tenant_id
      WHERE inv.id = invoice_items.invoice_id
        AND utr.user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT USAGE ON SCHEMA inter_app TO authenticated;
GRANT ALL ON inter_app.invoice_items TO authenticated;

-- Comments for documentation
COMMENT ON TABLE inter_app.invoice_items IS 'Lignes de facture (items) avec calculs automatiques';
COMMENT ON COLUMN inter_app.invoice_items.subtotal_ht IS 'Montant HT (calculé automatiquement)';
COMMENT ON COLUMN inter_app.invoice_items.tva_amount IS 'Montant TVA (calculé automatiquement)';
COMMENT ON COLUMN inter_app.invoice_items.total_ttc IS 'Montant TTC (calculé automatiquement)';
