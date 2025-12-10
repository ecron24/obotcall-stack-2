-- ============================================
-- MIGRATION 009: Correction finale policies multiples
-- Date: 2025-12-10
-- Description: Corrige les 4 derniers warnings sur business_types
-- ============================================

-- Le problème: business_types_modify_admin utilise FOR ALL (qui inclut SELECT)
-- Donc il y a 2 policies pour SELECT:
--   1. business_types_select_all
--   2. business_types_modify_admin (FOR ALL inclut SELECT)
--
-- Solution: Remplacer FOR ALL par des policies spécifiques INSERT/UPDATE/DELETE

-- ======================
-- 1. business_types - Séparer les permissions
-- ======================

-- Drop la policy ALL qui cause le doublon
DROP POLICY IF EXISTS business_types_modify_admin ON public.business_types;

-- Créer des policies séparées pour INSERT, UPDATE, DELETE
CREATE POLICY business_types_insert_admin ON public.business_types
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY business_types_update_admin ON public.business_types
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY business_types_delete_admin ON public.business_types
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- =============================================
-- FIN MIGRATION 009
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION 009 COMPLETED SUCCESSFULLY';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Corrigé business_types (FOR ALL → INSERT/UPDATE/DELETE)';
  RAISE NOTICE '✅ Plus aucune politique multiple sur SELECT';
  RAISE NOTICE '✅ 4 derniers warnings éliminés';
  RAISE NOTICE '============================================';
END $$;
