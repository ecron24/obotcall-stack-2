-- ============================================
-- AJOUT POLICIES RLS MANQUANTES
-- Date: 2025-12-11
-- Tables: invoice_number_sequences, stock_movements
-- ============================================

-- ============================================
-- 1. RLS Policies pour invoice_number_sequences
-- ============================================

ALTER TABLE inter_app.invoice_number_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view sequences for their tenant" ON inter_app.invoice_number_sequences;
CREATE POLICY "Users can view sequences for their tenant"
  ON inter_app.invoice_number_sequences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      WHERE utr.tenant_id = invoice_number_sequences.tenant_id
        AND utr.user_id = (SELECT auth.uid())
    )
  );

GRANT SELECT ON inter_app.invoice_number_sequences TO authenticated;

-- ============================================
-- 2. RLS Policies pour stock_movements
-- ============================================

ALTER TABLE inter_app.stock_movements ENABLE ROW LEVEL SECURITY;

-- SELECT Policy
DROP POLICY IF EXISTS "Users can view stock movements for their tenant" ON inter_app.stock_movements;
CREATE POLICY "Users can view stock movements for their tenant"
  ON inter_app.stock_movements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      WHERE utr.tenant_id = stock_movements.tenant_id
        AND utr.user_id = (SELECT auth.uid())
        AND stock_movements.deleted_at IS NULL
    )
  );

-- INSERT Policy
DROP POLICY IF EXISTS "Users can insert stock movements for their tenant" ON inter_app.stock_movements;
CREATE POLICY "Users can insert stock movements for their tenant"
  ON inter_app.stock_movements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      WHERE utr.tenant_id = stock_movements.tenant_id
        AND utr.user_id = (SELECT auth.uid())
    )
  );

-- UPDATE Policy
DROP POLICY IF EXISTS "Users can update stock movements for their tenant" ON inter_app.stock_movements;
CREATE POLICY "Users can update stock movements for their tenant"
  ON inter_app.stock_movements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      WHERE utr.tenant_id = stock_movements.tenant_id
        AND utr.user_id = (SELECT auth.uid())
        AND stock_movements.deleted_at IS NULL
    )
  );

-- DELETE Policy
DROP POLICY IF EXISTS "Users can delete stock movements for their tenant" ON inter_app.stock_movements;
CREATE POLICY "Users can delete stock movements for their tenant"
  ON inter_app.stock_movements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      WHERE utr.tenant_id = stock_movements.tenant_id
        AND utr.user_id = (SELECT auth.uid())
    )
  );

GRANT ALL ON inter_app.stock_movements TO authenticated;

-- ============================================
-- FIN
-- ============================================
RAISE NOTICE '✅ Policies RLS ajoutées pour invoice_number_sequences et stock_movements';
