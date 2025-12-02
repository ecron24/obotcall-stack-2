-- Migration 012: Fix tenants RLS with proper role grants
-- The issue: service_role should bypass RLS but in some configurations it doesn't
-- Solution: Explicitly grant permissions and use role-based policies

-- First, ensure RLS is enabled
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "tenants_insert" ON public.tenants;
DROP POLICY IF EXISTS "tenants_insert_v2" ON public.tenants;
DROP POLICY IF EXISTS "tenants_select" ON public.tenants;
DROP POLICY IF EXISTS "tenants_select_v2" ON public.tenants;
DROP POLICY IF EXISTS "tenants_update" ON public.tenants;
DROP POLICY IF EXISTS "tenants_update_v2" ON public.tenants;
DROP POLICY IF EXISTS "tenants_delete" ON public.tenants;
DROP POLICY IF EXISTS "tenants_delete_v2" ON public.tenants;

-- Grant full access to service_role (bypasses policies)
GRANT ALL ON public.tenants TO service_role;
GRANT ALL ON public.tenants TO postgres;

-- For authenticated users, use policies
-- Policy for SELECT: Users can see tenants they belong to
CREATE POLICY "tenants_select_authenticated"
ON public.tenants
FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = auth.uid()
        AND is_active = true
    )
);

-- Policy for INSERT: Only via backend (service_role handles this)
-- We don't create an INSERT policy for authenticated users
-- because registration is handled by the API with service_role

-- Policy for UPDATE: Only owners can update
CREATE POLICY "tenants_update_authenticated"
ON public.tenants
FOR UPDATE
TO authenticated
USING (
    id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = auth.uid()
        AND role = 'owner'
        AND is_active = true
    )
)
WITH CHECK (
    id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = auth.uid()
        AND role = 'owner'
        AND is_active = true
    )
);

-- Policy for DELETE: Only owners can delete (soft delete preferred)
CREATE POLICY "tenants_delete_authenticated"
ON public.tenants
FOR DELETE
TO authenticated
USING (
    id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = auth.uid()
        AND role = 'owner'
        AND is_active = true
    )
);

-- Verify the grants
DO $$
BEGIN
    RAISE NOTICE 'RLS enabled on tenants: %', (
        SELECT rowsecurity::text
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'tenants'
    );

    RAISE NOTICE 'Policies created: %', (
        SELECT count(*)::text
        FROM pg_policies
        WHERE tablename = 'tenants'
    );
END $$;
