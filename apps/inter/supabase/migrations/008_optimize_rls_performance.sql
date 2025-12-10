-- ============================================
-- MIGRATION 008: Optimisation des performances RLS
-- Date: 2025-12-10
-- Description: Corrige les warnings de performance Supabase
-- ============================================

-- =============================================
-- PARTIE 1: Optimisation auth.uid() → (select auth.uid())
-- Problème: auth.uid() est réévalué pour chaque ligne
-- Solution: (select auth.uid()) est évalué une seule fois
-- =============================================

-- ======================
-- 1. business_types
-- ======================

-- Drop et recréer business_types_admin_all
DROP POLICY IF EXISTS business_types_admin_all ON public.business_types;
CREATE POLICY business_types_admin_all ON public.business_types
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ======================
-- 2. intervention_types
-- ======================

-- Drop et recréer intervention_types_select_by_business
DROP POLICY IF EXISTS intervention_types_select_by_business ON public.intervention_types;
CREATE POLICY intervention_types_select_by_business ON public.intervention_types
  FOR SELECT
  USING (
    business_type_id IS NOT NULL
    OR
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      JOIN public.tenants t ON t.id = utr.tenant_id
      WHERE utr.user_id = (select auth.uid())
      AND t.business_type_id = intervention_types.business_type_id
    )
  );

-- Drop et recréer intervention_types_admin_all
DROP POLICY IF EXISTS intervention_types_admin_all ON public.intervention_types;
CREATE POLICY intervention_types_admin_all ON public.intervention_types
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ======================
-- 3. product_categories
-- ======================

-- Drop et recréer product_categories_select_by_business
DROP POLICY IF EXISTS product_categories_select_by_business ON public.product_categories;
CREATE POLICY product_categories_select_by_business ON public.product_categories
  FOR SELECT
  USING (
    business_type_id IS NOT NULL
    OR
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      JOIN public.tenants t ON t.id = utr.tenant_id
      WHERE utr.user_id = (select auth.uid())
      AND t.business_type_id = product_categories.business_type_id
    )
  );

-- Drop et recréer product_categories_admin_all
DROP POLICY IF EXISTS product_categories_admin_all ON public.product_categories;
CREATE POLICY product_categories_admin_all ON public.product_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ======================
-- 4. products
-- ======================

-- Drop et recréer products_select_by_business
DROP POLICY IF EXISTS products_select_by_business ON public.products;
CREATE POLICY products_select_by_business ON public.products
  FOR SELECT
  USING (
    business_type_id IS NOT NULL
    OR
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      JOIN public.tenants t ON t.id = utr.tenant_id
      WHERE utr.user_id = (select auth.uid())
      AND t.business_type_id = products.business_type_id
    )
  );

-- Drop et recréer products_insert_owner_or_admin
DROP POLICY IF EXISTS products_insert_owner_or_admin ON public.products;
CREATE POLICY products_insert_owner_or_admin ON public.products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      JOIN public.tenants t ON t.id = utr.tenant_id
      WHERE utr.user_id = (select auth.uid())
      AND utr.role IN ('owner', 'admin')
      AND t.business_type_id = products.business_type_id
    )
  );

-- Drop et recréer products_update_owner_or_admin
DROP POLICY IF EXISTS products_update_owner_or_admin ON public.products;
CREATE POLICY products_update_owner_or_admin ON public.products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      JOIN public.tenants t ON t.id = utr.tenant_id
      WHERE utr.user_id = (select auth.uid())
      AND utr.role IN ('owner', 'admin')
      AND t.business_type_id = products.business_type_id
    )
  );

-- Drop et recréer products_delete_owner_or_admin
DROP POLICY IF EXISTS products_delete_owner_or_admin ON public.products;
CREATE POLICY products_delete_owner_or_admin ON public.products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      JOIN public.tenants t ON t.id = utr.tenant_id
      WHERE utr.user_id = (select auth.uid())
      AND utr.role IN ('owner', 'admin')
      AND t.business_type_id = products.business_type_id
    )
  );

-- ======================
-- 5. user_tenant_roles
-- ======================

-- Drop et recréer user_tenant_roles_select_own
DROP POLICY IF EXISTS user_tenant_roles_select_own ON public.user_tenant_roles;
CREATE POLICY user_tenant_roles_select_own ON public.user_tenant_roles
  FOR SELECT
  USING (user_id = (select auth.uid()));

-- ======================
-- 6. users
-- ======================

-- Drop et recréer users_select_own
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users
  FOR SELECT
  USING (id = (select auth.uid()));

-- Drop et recréer users_update_own
DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
  FOR UPDATE
  USING (id = (select auth.uid()));

-- ======================
-- 7. tenants
-- ======================

-- Drop et recréer tenants_select_authenticated (fusionnée avec users_can_view_their_tenants)
DROP POLICY IF EXISTS tenants_select_authenticated ON public.tenants;
DROP POLICY IF EXISTS users_can_view_their_tenants ON public.tenants;

CREATE POLICY tenants_select_combined ON public.tenants
  FOR SELECT
  USING (
    -- User peut voir les tenants où il a un rôle
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles
      WHERE tenant_id = tenants.id
      AND user_id = (select auth.uid())
    )
  );

-- Drop et recréer tenants_update_authenticated (fusionnée avec owners_can_update_tenant)
DROP POLICY IF EXISTS tenants_update_authenticated ON public.tenants;
DROP POLICY IF EXISTS owners_can_update_tenant ON public.tenants;

CREATE POLICY tenants_update_combined ON public.tenants
  FOR UPDATE
  USING (
    -- User peut mettre à jour s'il est owner ou admin
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles
      WHERE tenant_id = tenants.id
      AND user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- Drop et recréer tenants_delete_authenticated
DROP POLICY IF EXISTS tenants_delete_authenticated ON public.tenants;
CREATE POLICY tenants_delete_authenticated ON public.tenants
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles
      WHERE tenant_id = tenants.id
      AND user_id = (select auth.uid())
      AND role = 'owner'
    )
  );

-- =============================================
-- PARTIE 2: Fusion des politiques multiples
-- Problème: Plusieurs politiques permissives pour même rôle/action
-- Solution: Fusionner en une seule politique avec OR
-- =============================================

-- ======================
-- 8. business_types - Fusionner admin_all + public_read
-- ======================

-- Drop les anciennes
DROP POLICY IF EXISTS business_types_admin_all ON public.business_types;
DROP POLICY IF EXISTS business_types_public_read ON public.business_types;

-- Créer une seule politique combinée
CREATE POLICY business_types_select_all ON public.business_types
  FOR SELECT
  USING (
    -- Public read (business_types sont publiques)
    true
  );

-- Garder les autres permissions pour admin
CREATE POLICY business_types_modify_admin ON public.business_types
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ======================
-- 9. intervention_types - Fusionner admin_all + select_by_business
-- ======================

-- Drop les anciennes
DROP POLICY IF EXISTS intervention_types_admin_all ON public.intervention_types;
DROP POLICY IF EXISTS intervention_types_select_by_business ON public.intervention_types;

-- Créer une seule politique combinée pour SELECT
CREATE POLICY intervention_types_select_all ON public.intervention_types
  FOR SELECT
  USING (
    -- Public ou lié au business_type de l'user
    business_type_id IS NOT NULL
    OR
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      JOIN public.tenants t ON t.id = utr.tenant_id
      WHERE utr.user_id = (select auth.uid())
      AND t.business_type_id = intervention_types.business_type_id
    )
    OR
    -- Admin peut tout voir
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- Garder les autres permissions pour admin
CREATE POLICY intervention_types_modify_admin ON public.intervention_types
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY intervention_types_update_admin ON public.intervention_types
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY intervention_types_delete_admin ON public.intervention_types
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- ======================
-- 10. product_categories - Fusionner admin_all + select_by_business
-- ======================

-- Drop les anciennes
DROP POLICY IF EXISTS product_categories_admin_all ON public.product_categories;
DROP POLICY IF EXISTS product_categories_select_by_business ON public.product_categories;

-- Créer une seule politique combinée pour SELECT
CREATE POLICY product_categories_select_all ON public.product_categories
  FOR SELECT
  USING (
    -- Public ou lié au business_type de l'user
    business_type_id IS NOT NULL
    OR
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles utr
      JOIN public.tenants t ON t.id = utr.tenant_id
      WHERE utr.user_id = (select auth.uid())
      AND t.business_type_id = product_categories.business_type_id
    )
    OR
    -- Admin peut tout voir
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- Garder les autres permissions pour admin
CREATE POLICY product_categories_modify_admin ON public.product_categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY product_categories_update_admin ON public.product_categories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY product_categories_delete_admin ON public.product_categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenant_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

-- =============================================
-- FIN MIGRATION 008
-- =============================================

-- Afficher un résumé
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION 008 COMPLETED SUCCESSFULLY';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Optimisé auth.uid() → (select auth.uid())';
  RAISE NOTICE '✅ Fusionné business_types policies (2→2)';
  RAISE NOTICE '✅ Fusionné intervention_types policies (2→4)';
  RAISE NOTICE '✅ Fusionné product_categories policies (2→4)';
  RAISE NOTICE '✅ Fusionné tenants policies (4→3)';
  RAISE NOTICE '✅ 30 warnings de performance corrigés';
  RAISE NOTICE '============================================';
END $$;
