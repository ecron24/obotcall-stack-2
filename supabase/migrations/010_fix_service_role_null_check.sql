-- Migration 010: Fix service_role detection using auth.uid() IS NULL
-- When service_role is used, auth.uid() returns NULL, so we can use that to bypass RLS

-- Drop existing v3 policies
DROP POLICY IF EXISTS "users_select_v3" ON public.users;
DROP POLICY IF EXISTS "user_tenant_roles_select_v3" ON public.user_tenant_roles;
DROP POLICY IF EXISTS "user_tenant_roles_update_v3" ON public.user_tenant_roles;
DROP POLICY IF EXISTS "user_tenant_roles_delete_v3" ON public.user_tenant_roles;

-- Create new SELECT policy for users table
-- Simple approach: allow service_role (auth.uid() IS NULL) OR user's own data
CREATE POLICY "users_select_v4"
ON public.users
FOR SELECT
USING (
    -- Service role has no user context (auth.uid() is NULL)
    auth.uid() IS NULL
    OR
    -- Users can see their own profile
    id = auth.uid()
);

-- Create new SELECT policy for user_tenant_roles
-- Simple approach: allow service_role (auth.uid() IS NULL) OR user's own roles
CREATE POLICY "user_tenant_roles_select_v4"
ON public.user_tenant_roles
FOR SELECT
USING (
    -- Service role has no user context (auth.uid() is NULL)
    auth.uid() IS NULL
    OR
    -- Users can see their own roles
    user_id = auth.uid()
);

-- Create new UPDATE policy for user_tenant_roles
CREATE POLICY "user_tenant_roles_update_v4"
ON public.user_tenant_roles
FOR UPDATE
USING (
    auth.uid() IS NULL OR user_id = auth.uid()
)
WITH CHECK (
    auth.uid() IS NULL OR user_id = auth.uid()
);

-- Create new DELETE policy for user_tenant_roles
CREATE POLICY "user_tenant_roles_delete_v4"
ON public.user_tenant_roles
FOR DELETE
USING (
    auth.uid() IS NULL OR user_id = auth.uid()
);

-- Also update the INSERT policy to use the same approach
DROP POLICY IF EXISTS "user_tenant_roles_insert_v3" ON public.user_tenant_roles;

CREATE POLICY "user_tenant_roles_insert_v4"
ON public.user_tenant_roles
FOR INSERT
WITH CHECK (
    -- Allow service_role (auth.uid() IS NULL)
    auth.uid() IS NULL
    OR
    -- Allow if user has no roles yet (first registration)
    NOT EXISTS (
        SELECT 1
        FROM public.user_tenant_roles AS existing
        WHERE existing.user_id = user_tenant_roles.user_id
        LIMIT 1
    )
    OR
    -- Allow if it's the user's own role
    user_id = auth.uid()
);

-- Update users INSERT policy
DROP POLICY IF EXISTS "users_insert" ON public.users;

CREATE POLICY "users_insert_v2"
ON public.users
FOR INSERT
WITH CHECK (
    auth.uid() IS NULL OR id = auth.uid()
);

-- Update users UPDATE policy
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.users;

CREATE POLICY "users_update_v2"
ON public.users
FOR UPDATE
USING (
    auth.uid() IS NULL OR id = auth.uid()
)
WITH CHECK (
    auth.uid() IS NULL OR id = auth.uid()
);
