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
