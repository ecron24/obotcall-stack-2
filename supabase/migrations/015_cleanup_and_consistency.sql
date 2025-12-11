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
  WHEN (OLD IS NULL OR OLD.deleted_at IS NULL)
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
