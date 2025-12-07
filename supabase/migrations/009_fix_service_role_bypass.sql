-- Migration 009: Fix RLS policies to allow service_role bypass
-- The service_role should be able to query all tables without RLS checks

-- Drop existing problematic policies
DROP POLICY IF EXISTS "users_select_v2" ON public.users;
DROP POLICY IF EXISTS "user_tenant_roles_select_v2" ON public.user_tenant_roles;
DROP POLICY IF EXISTS "user_tenant_roles_update_v2" ON public.user_tenant_roles;
DROP POLICY IF EXISTS "user_tenant_roles_delete_v2" ON public.user_tenant_roles;

-- Create new SELECT policy for users table that allows service_role bypass
CREATE POLICY "users_select_v3"
ON public.users
FOR SELECT
USING (
    -- Allow service_role to bypass RLS
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR
    -- Allow users to see their own profile
    id = auth.uid()
    OR
    -- Allow users to see other users in their tenant (without recursion)
    id IN (
        SELECT other_roles.user_id
        FROM public.user_tenant_roles AS my_roles
        JOIN public.user_tenant_roles AS other_roles
            ON my_roles.tenant_id = other_roles.tenant_id
        WHERE my_roles.user_id = auth.uid()
            AND my_roles.role IN ('owner', 'admin')
            AND my_roles.is_active = true
        LIMIT 100
    )
);

-- Create new SELECT policy for user_tenant_roles that allows service_role bypass
CREATE POLICY "user_tenant_roles_select_v3"
ON public.user_tenant_roles
FOR SELECT
USING (
    -- Allow service_role to bypass RLS
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR
    -- Allow users to see their own roles
    user_id = auth.uid()
    OR
    -- Allow admins/owners to see roles in their tenant (without recursion)
    tenant_id IN (
        SELECT utr.tenant_id
        FROM public.user_tenant_roles AS utr
        WHERE utr.user_id = auth.uid()
            AND utr.role IN ('owner', 'admin')
            AND utr.is_active = true
        LIMIT 100
    )
);

-- Create new UPDATE policy for user_tenant_roles that allows service_role bypass
CREATE POLICY "user_tenant_roles_update_v3"
ON public.user_tenant_roles
FOR UPDATE
USING (
    -- Allow service_role to bypass RLS
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR
    -- Allow owners/admins to update roles in their tenant
    tenant_id IN (
        SELECT utr.tenant_id
        FROM public.user_tenant_roles AS utr
        WHERE utr.user_id = auth.uid()
            AND utr.role IN ('owner', 'admin')
            AND utr.is_active = true
        LIMIT 100
    )
)
WITH CHECK (
    -- Same check for the updated data
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR
    tenant_id IN (
        SELECT utr.tenant_id
        FROM public.user_tenant_roles AS utr
        WHERE utr.user_id = auth.uid()
            AND utr.role IN ('owner', 'admin')
            AND utr.is_active = true
        LIMIT 100
    )
);

-- Create new DELETE policy for user_tenant_roles that allows service_role bypass
CREATE POLICY "user_tenant_roles_delete_v3"
ON public.user_tenant_roles
FOR DELETE
USING (
    -- Allow service_role to bypass RLS
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR
    -- Allow owners to delete roles in their tenant
    tenant_id IN (
        SELECT utr.tenant_id
        FROM public.user_tenant_roles AS utr
        WHERE utr.user_id = auth.uid()
            AND utr.role = 'owner'
            AND utr.is_active = true
        LIMIT 100
    )
);
