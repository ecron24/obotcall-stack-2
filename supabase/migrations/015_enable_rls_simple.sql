-- Migration 015: Réactiver RLS (version simple)
-- Cette migration réactive RLS sur les 3 tables critiques
-- Les policies existantes permettent déjà les opérations SELECT/UPDATE pour les utilisateurs authentifiés

-- =====================================================
-- Réactiver RLS sur toutes les tables critiques
-- =====================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenant_roles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Vérification
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

    RAISE NOTICE '✅ Migration 015 appliquée avec succès';
    RAISE NOTICE '✅ RLS activé sur: tenants, users, user_tenant_roles';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Note: L''inscription nécessitera des ajustements demain';
    RAISE NOTICE '   Les policies INSERT seront créées dans une prochaine migration';
END $$;
