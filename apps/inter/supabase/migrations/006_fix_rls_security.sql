-- Migration 006: Correction faille sécurité RLS - Remplacement user_metadata par app_metadata
-- user_metadata est ÉDITABLE par l'utilisateur → FAILLE DE SÉCURITÉ
-- app_metadata n'est PAS éditable par l'utilisateur → SÉCURISÉ

-- ============================================
-- SUPPRESSION DES POLICIES VULNÉRABLES
-- ============================================

-- Business types
DROP POLICY IF EXISTS "business_types_select_all" ON public.business_types;
DROP POLICY IF EXISTS "business_types_admin_all" ON public.business_types;
DROP POLICY IF EXISTS "business_types_public_read" ON public.business_types;

-- Intervention types
DROP POLICY IF EXISTS "intervention_types_select_by_business" ON public.intervention_types;
DROP POLICY IF EXISTS "intervention_types_admin_all" ON public.intervention_types;

-- Product categories
DROP POLICY IF EXISTS "product_categories_select_by_business" ON public.product_categories;
DROP POLICY IF EXISTS "product_categories_admin_all" ON public.product_categories;

-- Products
DROP POLICY IF EXISTS "products_select_by_business" ON public.products;
DROP POLICY IF EXISTS "products_insert_admin_owner" ON public.products;
DROP POLICY IF EXISTS "products_update_admin_owner" ON public.products;
DROP POLICY IF EXISTS "products_delete_admin_owner" ON public.products;
DROP POLICY IF EXISTS "products_insert_owner_or_admin" ON public.products;
DROP POLICY IF EXISTS "products_update_owner_or_admin" ON public.products;
DROP POLICY IF EXISTS "products_delete_owner_or_admin" ON public.products;

-- ============================================
-- CRÉATION DES POLICIES SÉCURISÉES
-- ============================================

-- 1. BUSINESS TYPES
-- Public en lecture seule (pour sélection lors inscription)
-- Admin via app_metadata (non modifiable par user)
CREATE POLICY "business_types_public_read"
ON public.business_types
FOR SELECT
USING (is_active = true);

CREATE POLICY "business_types_admin_all"
ON public.business_types
FOR ALL
USING (
  -- Vérifier app_metadata.role (SÉCURISÉ - non modifiable par user)
  COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin',
    false
  )
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- 2. INTERVENTION TYPES
-- Lecture: utilisateurs du même business_type
-- Modification: admin uniquement via app_metadata
CREATE POLICY "intervention_types_select_by_business"
ON public.intervention_types
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

CREATE POLICY "intervention_types_admin_all"
ON public.intervention_types
FOR ALL
USING (
  COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin',
    false
  )
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- 3. PRODUCT CATEGORIES
-- Lecture: utilisateurs du même business_type
-- Modification: admin uniquement via app_metadata
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

CREATE POLICY "product_categories_admin_all"
ON public.product_categories
FOR ALL
USING (
  COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin',
    false
  )
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- 4. PRODUCTS
-- Lecture: utilisateurs du même business_type
-- Insert/Update/Delete: propriétaire du tenant OU admin via app_metadata
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

-- Insert: vérifier que le business_type_id correspond au tenant de l'utilisateur
CREATE POLICY "products_insert_owner_or_admin"
ON public.products
FOR INSERT
WITH CHECK (
  -- Admin via app_metadata (SÉCURISÉ)
  (
    COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin',
      false
    )
    OR auth.jwt() ->> 'role' = 'service_role'
  )
  OR
  -- Ou utilisateur du tenant avec le bon business_type_id
  (
    business_type_id IN (
      SELECT business_type_id
      FROM public.tenants
      WHERE id::text = auth.jwt() ->> 'tenant_id'
    )
  )
);

-- Update: vérifier ownership du tenant OU admin
CREATE POLICY "products_update_owner_or_admin"
ON public.products
FOR UPDATE
USING (
  (
    COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin',
      false
    )
    OR auth.jwt() ->> 'role' = 'service_role'
  )
  OR
  (
    business_type_id IN (
      SELECT business_type_id
      FROM public.tenants
      WHERE id::text = auth.jwt() ->> 'tenant_id'
    )
  )
)
WITH CHECK (
  (
    COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin',
      false
    )
    OR auth.jwt() ->> 'role' = 'service_role'
  )
  OR
  (
    business_type_id IN (
      SELECT business_type_id
      FROM public.tenants
      WHERE id::text = auth.jwt() ->> 'tenant_id'
    )
  )
);

-- Delete: vérifier ownership du tenant OU admin
CREATE POLICY "products_delete_owner_or_admin"
ON public.products
FOR DELETE
USING (
  (
    COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin',
      false
    )
    OR auth.jwt() ->> 'role' = 'service_role'
  )
  OR
  (
    business_type_id IN (
      SELECT business_type_id
      FROM public.tenants
      WHERE id::text = auth.jwt() ->> 'tenant_id'
    )
  )
);

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON POLICY "business_types_admin_all" ON public.business_types IS
'Admin all operations - Uses app_metadata (secure, not user-editable)';

COMMENT ON POLICY "intervention_types_admin_all" ON public.intervention_types IS
'Admin all operations - Uses app_metadata (secure, not user-editable)';

COMMENT ON POLICY "product_categories_admin_all" ON public.product_categories IS
'Admin all operations - Uses app_metadata (secure, not user-editable)';

COMMENT ON POLICY "products_insert_owner_or_admin" ON public.products IS
'Insert: tenant members or admin via app_metadata (secure, non user-editable)';

COMMENT ON POLICY "products_update_owner_or_admin" ON public.products IS
'Update: tenant members or admin via app_metadata (secure, non user-editable)';

COMMENT ON POLICY "products_delete_owner_or_admin" ON public.products IS
'Delete: tenant members or admin via app_metadata (secure, non user-editable)';
