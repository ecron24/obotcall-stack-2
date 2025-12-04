-- ============================================
-- MIGRATION 005: Activation RLS sur tables public
-- Date: 2025-12-04
-- Description: Active Row Level Security pour sécuriser les tables
-- ============================================

-- =============================================
-- 1. Activer RLS sur toutes les tables public
-- =============================================

ALTER TABLE public.business_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intervention_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. POLICIES pour business_types (READ-ONLY pour tous)
-- =============================================

-- Les business_types sont publics et lisibles par tous (utilisés à la registration)
CREATE POLICY "business_types_select_all"
ON public.business_types
FOR SELECT
USING (is_active = true);

-- Seul un admin peut modifier (via service_role)
CREATE POLICY "business_types_admin_all"
ON public.business_types
FOR ALL
USING (
  auth.jwt() ->> 'role' = 'service_role'
  OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
);

-- =============================================
-- 3. POLICIES pour intervention_types
-- =============================================

-- Lecture: Tout le monde peut voir les types actifs de son business type
CREATE POLICY "intervention_types_select_by_business"
ON public.intervention_types
FOR SELECT
USING (
  is_active = true
  AND (
    -- Utilisateurs connectés peuvent voir les types de leur business
    business_type_id IN (
      SELECT business_type_id
      FROM public.tenants
      WHERE id::text = auth.jwt() ->> 'tenant_id'
    )
    -- Ou service_role peut tout voir
    OR auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Admin peut créer/modifier/supprimer
CREATE POLICY "intervention_types_admin_all"
ON public.intervention_types
FOR ALL
USING (
  auth.jwt() ->> 'role' = 'service_role'
  OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
);

-- =============================================
-- 4. POLICIES pour product_categories
-- =============================================

-- Lecture: Voir les catégories de son business type
CREATE POLICY "product_categories_select_by_business"
ON public.product_categories
FOR SELECT
USING (
  is_active = true
  AND (
    business_type_id IN (
      SELECT business_type_id
      FROM public.tenants
      WHERE id::text = auth.jwt() ->> 'tenant_id'
    )
    OR auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Admin peut tout faire
CREATE POLICY "product_categories_admin_all"
ON public.product_categories
FOR ALL
USING (
  auth.jwt() ->> 'role' = 'service_role'
  OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
);

-- =============================================
-- 5. POLICIES pour products
-- =============================================

-- Lecture: Voir les produits de son business type
CREATE POLICY "products_select_by_business"
ON public.products
FOR SELECT
USING (
  is_active = true
  AND (
    business_type_id IN (
      SELECT business_type_id
      FROM public.tenants
      WHERE id::text = auth.jwt() ->> 'tenant_id'
    )
    OR auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Admin/Owner peuvent créer des produits
CREATE POLICY "products_insert_admin_owner"
ON public.products
FOR INSERT
WITH CHECK (
  auth.jwt() ->> 'role' = 'service_role'
  OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'owner')
);

-- Admin/Owner peuvent modifier leurs produits
CREATE POLICY "products_update_admin_owner"
ON public.products
FOR UPDATE
USING (
  business_type_id IN (
    SELECT business_type_id
    FROM public.tenants
    WHERE id::text = auth.jwt() ->> 'tenant_id'
  )
  AND (
    auth.jwt() ->> 'role' = 'service_role'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'owner')
  )
);

-- Admin/Owner peuvent supprimer leurs produits
CREATE POLICY "products_delete_admin_owner"
ON public.products
FOR DELETE
USING (
  business_type_id IN (
    SELECT business_type_id
    FROM public.tenants
    WHERE id::text = auth.jwt() ->> 'tenant_id'
  )
  AND (
    auth.jwt() ->> 'role' = 'service_role'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'owner')
  )
);

-- =============================================
-- 6. COMMENTAIRES
-- =============================================

COMMENT ON POLICY "business_types_select_all" ON public.business_types IS
  'Tous peuvent lire les business types actifs (nécessaire pour registration)';

COMMENT ON POLICY "intervention_types_select_by_business" ON public.intervention_types IS
  'Utilisateurs peuvent voir les types d''interventions de leur métier';

COMMENT ON POLICY "product_categories_select_by_business" ON public.product_categories IS
  'Utilisateurs peuvent voir les catégories de produits de leur métier';

COMMENT ON POLICY "products_select_by_business" ON public.products IS
  'Utilisateurs peuvent voir les produits de leur métier';

-- =============================================
-- FIN MIGRATION 005
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION 005 COMPLETED SUCCESSFULLY';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ RLS activé sur 4 tables public';
  RAISE NOTICE '✅ 11 policies créées';
  RAISE NOTICE '✅ Sécurité renforcée';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'business_types: 2 policies (read-only public)';
  RAISE NOTICE 'intervention_types: 2 policies (filtered by business)';
  RAISE NOTICE 'product_categories: 2 policies (filtered by business)';
  RAISE NOTICE 'products: 5 policies (CRUD filtered by business)';
  RAISE NOTICE '============================================';
END $$;
