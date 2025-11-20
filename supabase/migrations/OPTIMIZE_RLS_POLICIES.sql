-- =====================================================
-- MIGRATION: Optimize RLS Policies Performance
-- Description: Replace auth.uid() with (select auth.uid())
-- Date: 2025-11-20
-- =====================================================

-- This script only updates RLS policies to improve performance
-- It does NOT modify tables or data

BEGIN;

-- =====================================================
-- 1. SCHEMA PUBLIC - Optimized Policies
-- =====================================================

-- Drop and recreate users policies
DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.users;
CREATE POLICY "users_can_view_own_profile"
ON public.users
FOR SELECT
TO authenticated
USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.users;
CREATE POLICY "users_can_update_own_profile"
ON public.users
FOR UPDATE
TO authenticated
USING (id = (select auth.uid()))
WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "admins_can_view_tenant_users" ON public.users;
CREATE POLICY "admins_can_view_tenant_users"
ON public.users
FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT user_id
        FROM public.user_tenant_roles
        WHERE tenant_id IN (
            SELECT tenant_id
            FROM public.user_tenant_roles
            WHERE user_id = (select auth.uid())
            AND role IN ('owner', 'admin')
            AND is_active = true
        )
    )
);

-- Drop and recreate user_tenant_roles policies
DROP POLICY IF EXISTS "users_can_view_own_roles" ON public.user_tenant_roles;
CREATE POLICY "users_can_view_own_roles"
ON public.user_tenant_roles
FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "admins_can_view_tenant_roles" ON public.user_tenant_roles;
CREATE POLICY "admins_can_view_tenant_roles"
ON public.user_tenant_roles
FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = (select auth.uid())
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
);

DROP POLICY IF EXISTS "owners_can_manage_roles" ON public.user_tenant_roles;
CREATE POLICY "owners_can_manage_roles"
ON public.user_tenant_roles
FOR ALL
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = (select auth.uid())
        AND role = 'owner'
        AND is_active = true
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = (select auth.uid())
        AND role = 'owner'
        AND is_active = true
    )
);

-- Drop and recreate tenants policies
DROP POLICY IF EXISTS "owners_can_update_tenant" ON public.tenants;
CREATE POLICY "owners_can_update_tenant"
ON public.tenants
FOR UPDATE
TO authenticated
USING (
    id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = (select auth.uid())
        AND role = 'owner'
        AND is_active = true
    )
)
WITH CHECK (
    id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = (select auth.uid())
        AND role = 'owner'
        AND is_active = true
    )
);

-- Drop and recreate domains policies
DROP POLICY IF EXISTS "owners_can_manage_domains" ON public.domains;
CREATE POLICY "owners_can_manage_domains"
ON public.domains
FOR ALL
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = (select auth.uid())
        AND role = 'owner'
        AND is_active = true
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = (select auth.uid())
        AND role = 'owner'
        AND is_active = true
    )
);

-- Drop and recreate subscriptions policies
DROP POLICY IF EXISTS "owners_can_manage_subscription" ON public.subscriptions;
CREATE POLICY "owners_can_manage_subscription"
ON public.subscriptions
FOR ALL
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = (select auth.uid())
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = (select auth.uid())
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
);

-- Drop and recreate audit_logs policies
DROP POLICY IF EXISTS "admins_can_view_tenant_audit_logs" ON public.audit_logs;
CREATE POLICY "admins_can_view_tenant_audit_logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = (select auth.uid())
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
);

-- Drop and recreate revoked_tokens policies
DROP POLICY IF EXISTS "users_can_view_own_revoked_tokens" ON public.revoked_tokens;
CREATE POLICY "users_can_view_own_revoked_tokens"
ON public.revoked_tokens
FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

-- =====================================================
-- 2. SCHEMA INTER_APP - Optimized Policies
-- =====================================================

DROP POLICY IF EXISTS "invoices_paid_protection" ON inter_app.invoices;
CREATE POLICY "invoices_paid_protection"
ON inter_app.invoices
FOR UPDATE
TO authenticated
USING (
    payment_status != 'paid' OR
    created_by = (select auth.uid()) OR
    EXISTS (
        SELECT 1 FROM public.user_tenant_roles
        WHERE user_id = (select auth.uid())
        AND tenant_id = invoices.tenant_id
        AND role IN ('owner', 'admin')
    )
);

-- =====================================================
-- 3. SCHEMA IMMO_APP - Optimized Policies
-- =====================================================

DROP POLICY IF EXISTS "countries_write" ON immo_app.countries;
CREATE POLICY "countries_write"
ON immo_app.countries
FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.user_tenant_roles
    WHERE user_id = (select auth.uid())
    AND role IN ('owner', 'admin')
));

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Run this query to verify the policies were updated:
-- SELECT schemaname, tablename, policyname
-- FROM pg_policies
-- WHERE schemaname IN ('public', 'inter_app', 'immo_app')
-- ORDER BY schemaname, tablename, policyname;
