-- Migration 014: Fix infinite recursion in user_tenant_roles policies
-- Les policies avec self-reference causent une récursion infinie
-- Solution: Simplifier les policies pour éviter les subqueries sur la même table

-- =====================================================
-- PARTIE 1: Supprimer les policies récursives
-- =====================================================

DROP POLICY IF EXISTS "user_tenant_roles_select_authenticated" ON public.user_tenant_roles;
DROP POLICY IF EXISTS "user_tenant_roles_update_authenticated" ON public.user_tenant_roles;
DROP POLICY IF EXISTS "user_tenant_roles_delete_authenticated" ON public.user_tenant_roles;

-- =====================================================
-- PARTIE 2: Créer policies simplifiées sans récursion
-- =====================================================

-- SELECT: Utilisateurs peuvent voir leurs propres rôles uniquement
-- Note: Les admins/owners qui veulent voir d'autres rôles passeront par l'API backend
CREATE POLICY "user_tenant_roles_select_own"
ON public.user_tenant_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- UPDATE: Pas de policy UPDATE pour authenticated
-- Les modifications de rôles doivent passer par l'API backend avec service_role

-- DELETE: Pas de policy DELETE pour authenticated
-- La suppression de rôles doit passer par l'API backend avec service_role

-- =====================================================
-- PARTIE 3: Faire de même pour users (prévention)
-- =====================================================

-- Vérifier si users a aussi des policies récursives
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_update_authenticated" ON public.users;

-- SELECT: Utilisateurs peuvent voir leur propre profil uniquement
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- UPDATE: Utilisateurs peuvent modifier leur propre profil
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- =====================================================
-- PARTIE 4: Vérification
-- =====================================================

DO $$
DECLARE
    recursive_policies INTEGER;
BEGIN
    -- Compter les policies qui pourraient causer des récursions
    -- (policies qui ont des subqueries sur la même table)
    SELECT COUNT(*) INTO recursive_policies
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename IN ('users', 'user_tenant_roles')
        AND (
            qual LIKE '%FROM users %'
            OR qual LIKE '%FROM user_tenant_roles %'
            OR with_check LIKE '%FROM users %'
            OR with_check LIKE '%FROM user_tenant_roles %'
        );

    IF recursive_policies > 0 THEN
        RAISE WARNING 'Attention: % policies avec possibles récursions détectées', recursive_policies;
    ELSE
        RAISE NOTICE '✅ Aucune policy récursive détectée';
    END IF;

    RAISE NOTICE '✅ Migration 014 appliquée avec succès';
    RAISE NOTICE 'ℹ️  Les policies sont maintenant simplifiées sans self-reference';
    RAISE NOTICE 'ℹ️  Les opérations complexes (voir autres users, modifier rôles) passent par API backend';
END $$;
