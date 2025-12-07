-- =====================================================
-- MIGRATION 008 : Fix RLS for first role insertion (Secure way)
-- Allow insertion of first role without recursive checks
-- =====================================================

-- Drop the potentially dangerous SECURITY DEFINER function
DROP FUNCTION IF EXISTS public.create_user_with_role(uuid, uuid, text, text, text);

-- Drop existing insert policy
DROP POLICY IF EXISTS "user_tenant_roles_insert_v2" ON public.user_tenant_roles;

-- Create a new secure INSERT policy
-- Allows insertion if:
-- 1. User has no existing roles yet (first registration)
-- 2. OR user is already owner of the tenant
CREATE POLICY "user_tenant_roles_insert_v3"
ON public.user_tenant_roles
FOR INSERT
TO authenticated, service_role
WITH CHECK (
    -- Allow if user has no roles yet (first registration)
    NOT EXISTS (
        SELECT 1
        FROM public.user_tenant_roles AS existing
        WHERE existing.user_id = user_tenant_roles.user_id
        LIMIT 1
    )
    OR
    -- Allow if user is already owner of this tenant
    EXISTS (
        SELECT 1
        FROM public.user_tenant_roles AS utr
        WHERE utr.user_id = auth.uid()
        AND utr.tenant_id = user_tenant_roles.tenant_id
        AND utr.role = 'owner'
        AND utr.is_active = true
        LIMIT 1
    )
);

-- Also need to allow INSERT on users table
-- Check if policy exists first
DO $$
BEGIN
    -- Drop existing INSERT policy if it exists
    DROP POLICY IF EXISTS "users_insert" ON public.users;

    -- Create INSERT policy for users
    -- Allow authenticated users to create their own user record
    -- Or service_role can create any user record
    CREATE POLICY "users_insert"
    ON public.users
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (
        -- User can only insert their own record
        id = auth.uid()
        OR
        -- Or it's being done by service_role (during registration via API)
        current_setting('role') = 'service_role'
    );
END $$;

-- Add helpful comments
COMMENT ON POLICY "user_tenant_roles_insert_v3" ON public.user_tenant_roles IS
'Allows insertion of first role for new users without recursive checks. Also allows owners to add new roles.';

COMMENT ON POLICY "users_insert" ON public.users IS
'Allows users to create their own record during registration, or service_role to create any user.';
