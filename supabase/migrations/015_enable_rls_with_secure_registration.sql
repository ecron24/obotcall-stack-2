-- Migration 015: Réactiver RLS avec function sécurisée pour l'inscription
-- Problème: RLS était désactivé car le client JS Supabase ne bypasse pas RLS même avec service_role_key
-- Solution: Function PostgreSQL SECURITY DEFINER pour l'inscription + RLS strict pour le reste

-- =====================================================
-- PARTIE 1: Réactiver RLS sur toutes les tables critiques
-- =====================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenant_roles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PARTIE 2: Policies INSERT strictes (seulement via function)
-- =====================================================

-- TENANTS: Aucun INSERT direct autorisé pour authenticated
-- Les insertions se font uniquement via la function register_user_and_tenant()
DROP POLICY IF EXISTS "tenants_insert_via_function" ON public.tenants;

-- USERS: Aucun INSERT direct autorisé pour authenticated
-- Les insertions se font uniquement via la function ou lors de la création auth.users (trigger)
DROP POLICY IF EXISTS "users_insert_via_function" ON public.users;

-- USER_TENANT_ROLES: Aucun INSERT direct autorisé pour authenticated
-- Les insertions se font uniquement via la function register_user_and_tenant()
DROP POLICY IF EXISTS "user_tenant_roles_insert_via_function" ON public.user_tenant_roles;

-- Note: Les policies SELECT/UPDATE existantes de la migration 014 restent actives

-- =====================================================
-- PARTIE 3: Function sécurisée pour l'inscription
-- =====================================================

-- Cette function s'exécute avec les privilèges du propriétaire (postgres)
-- Elle bypasse RLS grâce à SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.register_user_and_tenant(
    p_user_id UUID,
    p_email TEXT,
    p_full_name TEXT,
    p_tenant_name TEXT,
    p_tenant_slug TEXT,
    p_app_type TEXT DEFAULT 'inter_app'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_tenant_id UUID;
    v_user_record RECORD;
    v_tenant_record RECORD;
    v_role_record RECORD;
    v_result JSON;
BEGIN
    -- Validation: Vérifier que l'utilisateur existe dans auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User % does not exist in auth.users', p_user_id;
    END IF;

    -- Validation: Vérifier que le tenant_slug est unique
    IF EXISTS (SELECT 1 FROM public.tenants WHERE slug = p_tenant_slug) THEN
        RAISE EXCEPTION 'Tenant slug % already exists', p_tenant_slug;
    END IF;

    -- Validation: Vérifier que l'utilisateur n'existe pas déjà
    IF EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User % already exists in public.users', p_user_id;
    END IF;

    -- 1. Créer le tenant
    v_tenant_id := gen_random_uuid();

    INSERT INTO public.tenants (
        id,
        name,
        slug,
        created_by,
        subscription_status,
        subscription_plan,
        app_type
    )
    VALUES (
        v_tenant_id,
        p_tenant_name,
        p_tenant_slug,
        p_user_id,
        'trial',
        'free',
        p_app_type
    )
    RETURNING * INTO v_tenant_record;

    -- 2. Créer l'utilisateur
    INSERT INTO public.users (
        id,
        email,
        full_name
    )
    VALUES (
        p_user_id,
        p_email,
        p_full_name
    )
    RETURNING * INTO v_user_record;

    -- 3. Créer le rôle owner
    INSERT INTO public.user_tenant_roles (
        user_id,
        tenant_id,
        role
    )
    VALUES (
        p_user_id,
        v_tenant_id,
        'owner'
    )
    RETURNING * INTO v_role_record;

    -- 4. Construire le résultat JSON
    v_result := json_build_object(
        'success', true,
        'user', row_to_json(v_user_record),
        'tenant', row_to_json(v_tenant_record),
        'role', row_to_json(v_role_record)
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur, PostgreSQL rollback automatiquement la transaction
        RAISE EXCEPTION 'Registration failed: %', SQLERRM;
END;
$$;

-- Donner les droits d'exécution à authenticated et anon
-- anon: Pour permettre l'inscription sans être connecté
-- authenticated: Pour les cas où l'utilisateur est déjà authentifié mais pas encore enregistré
GRANT EXECUTE ON FUNCTION public.register_user_and_tenant(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_user_and_tenant(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;

-- =====================================================
-- PARTIE 4: Function pour obtenir les infos utilisateur
-- =====================================================

-- Function pour que les utilisateurs authentifiés puissent récupérer leurs infos complètes
-- Utile pour le frontend après login
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
    v_result JSON;
BEGIN
    -- Récupérer l'ID de l'utilisateur authentifié
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Construire le profil complet avec tenants et rôles
    SELECT json_build_object(
        'user', (
            SELECT row_to_json(u.*)
            FROM public.users u
            WHERE u.id = v_user_id
        ),
        'tenants', (
            SELECT json_agg(
                json_build_object(
                    'tenant', row_to_json(t.*),
                    'role', utr.role
                )
            )
            FROM public.user_tenant_roles utr
            JOIN public.tenants t ON t.id = utr.tenant_id
            WHERE utr.user_id = v_user_id
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_profile() TO authenticated;

-- =====================================================
-- PARTIE 5: Vérification et validation
-- =====================================================

DO $$
DECLARE
    rls_enabled_count INTEGER;
    rls_disabled_count INTEGER;
BEGIN
    -- Compter les tables avec RLS activé
    SELECT COUNT(*) INTO rls_enabled_count
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename IN ('tenants', 'users', 'user_tenant_roles')
        AND rowsecurity = true;

    -- Compter les tables avec RLS désactivé
    SELECT COUNT(*) INTO rls_disabled_count
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename IN ('tenants', 'users', 'user_tenant_roles')
        AND rowsecurity = false;

    IF rls_disabled_count > 0 THEN
        RAISE EXCEPTION 'RLS not enabled on all required tables. Enabled: %, Disabled: %',
            rls_enabled_count, rls_disabled_count;
    END IF;

    -- Vérifier que les functions existent
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'register_user_and_tenant'
    ) THEN
        RAISE EXCEPTION 'Function register_user_and_tenant was not created';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'get_user_profile'
    ) THEN
        RAISE EXCEPTION 'Function get_user_profile was not created';
    END IF;

    RAISE NOTICE '✅ Migration 015 appliquée avec succès';
    RAISE NOTICE '✅ RLS activé sur: tenants, users, user_tenant_roles';
    RAISE NOTICE '✅ Function register_user_and_tenant() créée';
    RAISE NOTICE '✅ Function get_user_profile() créée';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Le code backend doit maintenant utiliser register_user_and_tenant()';
    RAISE NOTICE '   au lieu de faire des INSERT directs dans les tables';
END $$;
