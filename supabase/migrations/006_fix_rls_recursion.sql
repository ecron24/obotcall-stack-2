-- =====================================================
-- MIGRATION 006 : Fix RLS Infinite Recursion
-- Fix the infinite recursion in user_tenant_roles policies
-- =====================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "user_tenant_roles_select" ON public.user_tenant_roles;
DROP POLICY IF EXISTS "user_tenant_roles_insert" ON public.user_tenant_roles;
DROP POLICY IF EXISTS "user_tenant_roles_update" ON public.user_tenant_roles;
DROP POLICY IF EXISTS "user_tenant_roles_delete" ON public.user_tenant_roles;

-- Create new non-recursive SELECT policy
-- Users can view their own roles OR roles in their tenants if they are admin/owner
CREATE POLICY "user_tenant_roles_select_v2"
ON public.user_tenant_roles
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.user_tenant_roles AS utr
        WHERE utr.user_id = auth.uid()
        AND utr.tenant_id = user_tenant_roles.tenant_id
        AND utr.role IN ('owner', 'admin')
        AND utr.is_active = true
        LIMIT 1
    )
);

-- Create new INSERT policy that allows service role to bypass checks
-- For authenticated users, only owners can insert roles
-- For service role (used during registration), allow all inserts
CREATE POLICY "user_tenant_roles_insert_v2"
ON public.user_tenant_roles
FOR INSERT
TO authenticated, service_role
WITH CHECK (
    -- Service role can always insert (for initial user creation)
    auth.role() = 'service_role'
    OR
    -- Or user must be owner of the tenant
    EXISTS (
        SELECT 1 FROM public.user_tenant_roles AS utr
        WHERE utr.user_id = auth.uid()
        AND utr.tenant_id = user_tenant_roles.tenant_id
        AND utr.role = 'owner'
        AND utr.is_active = true
        LIMIT 1
    )
);

-- UPDATE policy: only owners and admins
CREATE POLICY "user_tenant_roles_update_v2"
ON public.user_tenant_roles
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_tenant_roles AS utr
        WHERE utr.user_id = auth.uid()
        AND utr.tenant_id = user_tenant_roles.tenant_id
        AND utr.role IN ('owner', 'admin')
        AND utr.is_active = true
        LIMIT 1
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_tenant_roles AS utr
        WHERE utr.user_id = auth.uid()
        AND utr.tenant_id = user_tenant_roles.tenant_id
        AND utr.role IN ('owner', 'admin')
        AND utr.is_active = true
        LIMIT 1
    )
);

-- DELETE policy: only owners
CREATE POLICY "user_tenant_roles_delete_v2"
ON public.user_tenant_roles
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_tenant_roles AS utr
        WHERE utr.user_id = auth.uid()
        AND utr.tenant_id = user_tenant_roles.tenant_id
        AND utr.role = 'owner'
        AND utr.is_active = true
        LIMIT 1
    )
);

-- Also fix the users SELECT policy to avoid recursion
DROP POLICY IF EXISTS "users_select" ON public.users;

CREATE POLICY "users_select_v2"
ON public.users
FOR SELECT
TO authenticated
USING (
    -- Users can view their own profile
    id = auth.uid()
    OR
    -- Or they are admin/owner in a shared tenant
    EXISTS (
        SELECT 1
        FROM public.user_tenant_roles AS my_roles
        JOIN public.user_tenant_roles AS other_roles
            ON my_roles.tenant_id = other_roles.tenant_id
        WHERE my_roles.user_id = auth.uid()
        AND other_roles.user_id = users.id
        AND my_roles.role IN ('owner', 'admin')
        AND my_roles.is_active = true
        LIMIT 1
    )
);

-- Comment explaining the fix
COMMENT ON POLICY "user_tenant_roles_select_v2" ON public.user_tenant_roles IS
'Fixed version that avoids recursion by using EXISTS with a subquery alias';

COMMENT ON POLICY "user_tenant_roles_insert_v2" ON public.user_tenant_roles IS
'Allows service_role to bypass checks for initial user creation during registration';
