-- Migration 011: Fix RLS policies for tenants table
-- Allow service_role to insert tenants during registration

-- Check existing INSERT policy on tenants
DROP POLICY IF EXISTS "tenants_insert" ON public.tenants;
DROP POLICY IF EXISTS "tenants_insert_v2" ON public.tenants;

-- Create new INSERT policy that allows service_role
CREATE POLICY "tenants_insert_v2"
ON public.tenants
FOR INSERT
WITH CHECK (
    -- Allow service_role (auth.uid() IS NULL)
    auth.uid() IS NULL
    OR
    -- Allow authenticated users (for future use)
    auth.uid() IS NOT NULL
);

-- Update SELECT policy if needed
DROP POLICY IF EXISTS "tenants_select" ON public.tenants;
DROP POLICY IF EXISTS "tenants_select_v2" ON public.tenants;

CREATE POLICY "tenants_select_v2"
ON public.tenants
FOR SELECT
USING (
    -- Allow service_role
    auth.uid() IS NULL
    OR
    -- Allow users who have a role in this tenant
    id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = auth.uid()
        AND is_active = true
    )
);

-- Update UPDATE policy
DROP POLICY IF EXISTS "tenants_update" ON public.tenants;
DROP POLICY IF EXISTS "tenants_update_v2" ON public.tenants;

CREATE POLICY "tenants_update_v2"
ON public.tenants
FOR UPDATE
USING (
    -- Allow service_role
    auth.uid() IS NULL
    OR
    -- Allow owners
    id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = auth.uid()
        AND role = 'owner'
        AND is_active = true
    )
)
WITH CHECK (
    auth.uid() IS NULL
    OR
    id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = auth.uid()
        AND role = 'owner'
        AND is_active = true
    )
);
