-- Migration 013: Généraliser l'approche GRANT pour service_role
-- Solution définitive au problème RLS avec Supabase JS client

-- =====================================================
-- PARTIE 1: GRANT ALL à service_role (bypass automatique)
-- =====================================================

GRANT ALL ON public.countries TO service_role;
GRANT ALL ON public.tenants TO service_role;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.user_tenant_roles TO service_role;
GRANT ALL ON public.domains TO service_role;
GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.audit_logs TO service_role;
GRANT ALL ON public.revoked_tokens TO service_role;

-- =====================================================
-- PARTIE 2: Nettoyer les anciennes policies problématiques
-- =====================================================

-- Users: Supprimer policies avec auth.uid() IS NULL
DROP POLICY IF EXISTS "users_select_v4" ON public.users;
DROP POLICY IF EXISTS "users_select_v3" ON public.users;
DROP POLICY IF EXISTS "users_insert_v2" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update_v2" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;

-- User_tenant_roles: Supprimer policies avec auth.uid() IS NULL
DROP POLICY IF EXISTS "user_tenant_roles_select_v4" ON public.user_tenant_roles;
DROP POLICY IF EXISTS "user_tenant_roles_select_v3" ON public.user_tenant_roles;
DROP POLICY IF EXISTS "user_tenant_roles_insert_v4" ON public.user_tenant_roles;
DROP POLICY IF EXISTS "user_tenant_roles_insert_v3" ON public.user_tenant_roles;
DROP POLICY IF EXISTS "user_tenant_roles_update_v4" ON public.user_tenant_roles;
DROP POLICY IF EXISTS "user_tenant_roles_update_v3" ON public.user_tenant_roles;
DROP POLICY IF EXISTS "user_tenant_roles_delete_v4" ON public.user_tenant_roles;
DROP POLICY IF EXISTS "user_tenant_roles_delete_v3" ON public.user_tenant_roles;

-- Tenants: Supprimer anciennes policies
DROP POLICY IF EXISTS "tenants_insert_v3" ON public.tenants;
DROP POLICY IF EXISTS "tenants_insert_v2" ON public.tenants;
DROP POLICY IF EXISTS "tenants_insert_service_role" ON public.tenants;
DROP POLICY IF EXISTS "tenants_insert_allow_all" ON public.tenants;

-- =====================================================
-- PARTIE 3: Créer policies UNIQUEMENT pour authenticated
-- =====================================================

-- USERS: Policies pour utilisateurs authentifiés
CREATE POLICY "users_select_authenticated"
ON public.users
FOR SELECT
TO authenticated
USING (
    -- Peut voir son propre profil
    id = auth.uid()
    OR
    -- Ou profils d'utilisateurs du même tenant (si owner/admin)
    id IN (
        SELECT other_roles.user_id
        FROM public.user_tenant_roles AS my_roles
        JOIN public.user_tenant_roles AS other_roles
            ON my_roles.tenant_id = other_roles.tenant_id
        WHERE my_roles.user_id = auth.uid()
            AND my_roles.role IN ('owner', 'admin')
            AND my_roles.is_active = true
    )
);

CREATE POLICY "users_update_authenticated"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Pas de policy INSERT pour users (uniquement via service_role lors inscription)

-- USER_TENANT_ROLES: Policies pour utilisateurs authentifiés
CREATE POLICY "user_tenant_roles_select_authenticated"
ON public.user_tenant_roles
FOR SELECT
TO authenticated
USING (
    -- Peut voir ses propres rôles
    user_id = auth.uid()
    OR
    -- Ou rôles du tenant si owner/admin
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND is_active = true
    )
);

CREATE POLICY "user_tenant_roles_update_authenticated"
ON public.user_tenant_roles
FOR UPDATE
TO authenticated
USING (
    -- Seulement owner/admin peuvent modifier les rôles
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND is_active = true
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND is_active = true
    )
);

CREATE POLICY "user_tenant_roles_delete_authenticated"
ON public.user_tenant_roles
FOR DELETE
TO authenticated
USING (
    -- Seulement owner peut supprimer des rôles
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = auth.uid()
            AND role = 'owner'
            AND is_active = true
    )
);

-- Pas de policy INSERT pour user_tenant_roles (uniquement via service_role)

-- TENANTS: Garder les policies existantes de migration 012
-- (déjà créées avec TO authenticated)

-- =====================================================
-- PARTIE 4: Vérification
-- =====================================================

DO $$
DECLARE
    grant_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Compter les GRANTs service_role
    SELECT COUNT(*) INTO grant_count
    FROM information_schema.table_privileges
    WHERE grantee = 'service_role'
        AND table_schema = 'public'
        AND privilege_type = 'INSERT';

    -- Compter les policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';

    RAISE NOTICE '✅ GRANTs service_role créés: %', grant_count;
    RAISE NOTICE '✅ Policies RLS actives: %', policy_count;
    RAISE NOTICE '✅ Migration 013 appliquée avec succès';
    RAISE NOTICE 'ℹ️  service_role peut maintenant bypasser RLS via GRANT';
    RAISE NOTICE 'ℹ️  authenticated users ont des policies spécifiques';
END $$;
