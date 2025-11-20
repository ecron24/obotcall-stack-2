-- =====================================================
-- UPDATE RLS POLICIES - NO RESET NEEDED
-- =====================================================
-- This script updates RLS policies incrementally without dropping data
-- Fixes 14 "multiple permissive policies" warnings

-- =====================================================
-- 1. PUBLIC.USERS - Merge 2 SELECT policies
-- =====================================================

DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.users;
DROP POLICY IF EXISTS "admins_can_view_tenant_users" ON public.users;

CREATE POLICY "users_select"
ON public.users
FOR SELECT
TO authenticated
USING (
    id = (select auth.uid())
    OR id IN (
        SELECT utr.user_id
        FROM public.user_tenant_roles utr
        WHERE utr.tenant_id IN (
            SELECT tenant_id
            FROM public.user_tenant_roles
            WHERE user_id = (select auth.uid())
            AND role IN ('owner', 'admin')
            AND is_active = true
        )
    )
);

-- =====================================================
-- 2. PUBLIC.USER_TENANT_ROLES - Merge 3 SELECT + split FOR ALL
-- =====================================================

DROP POLICY IF EXISTS "users_can_view_own_roles" ON public.user_tenant_roles;
DROP POLICY IF EXISTS "admins_can_view_tenant_roles" ON public.user_tenant_roles;
DROP POLICY IF EXISTS "owners_can_manage_roles" ON public.user_tenant_roles;

CREATE POLICY "user_tenant_roles_select"
ON public.user_tenant_roles
FOR SELECT
TO authenticated
USING (
    user_id = (select auth.uid())
    OR tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = (select auth.uid())
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
);

CREATE POLICY "user_tenant_roles_insert"
ON public.user_tenant_roles
FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = (select auth.uid())
        AND role = 'owner'
        AND is_active = true
    )
);

CREATE POLICY "user_tenant_roles_update"
ON public.user_tenant_roles
FOR UPDATE
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

CREATE POLICY "user_tenant_roles_delete"
ON public.user_tenant_roles
FOR DELETE
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = (select auth.uid())
        AND role = 'owner'
        AND is_active = true
    )
);

-- =====================================================
-- 3. INTER_APP.INVOICES - Split FOR ALL + merge UPDATE
-- =====================================================

DROP POLICY IF EXISTS invoices_tenant_isolation ON inter_app.invoices;
DROP POLICY IF EXISTS invoices_paid_protection ON inter_app.invoices;

CREATE POLICY invoices_select ON inter_app.invoices
    FOR SELECT
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

CREATE POLICY invoices_insert ON inter_app.invoices
    FOR INSERT
    WITH CHECK (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

CREATE POLICY invoices_delete ON inter_app.invoices
    FOR DELETE
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

CREATE POLICY invoices_update ON inter_app.invoices
    FOR UPDATE
    USING (
        tenant_id IN (SELECT unnest(get_current_user_tenant_ids()))
        AND (
            payment_status != 'paid' OR
            created_by = (select auth.uid()) OR
            EXISTS (
                SELECT 1 FROM public.user_tenant_roles
                WHERE user_id = (select auth.uid())
                AND tenant_id = invoices.tenant_id
                AND role IN ('owner', 'admin')
            )
        )
    )
    WITH CHECK (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- =====================================================
-- 4. IMMO_APP.COUNTRIES - Split FOR ALL
-- =====================================================

DROP POLICY IF EXISTS countries_write ON immo_app.countries;

CREATE POLICY countries_insert ON immo_app.countries
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_tenant_roles
        WHERE user_id = (select auth.uid())
          AND role IN ('owner', 'admin')
    ));

CREATE POLICY countries_update ON immo_app.countries
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.user_tenant_roles
        WHERE user_id = (select auth.uid())
          AND role IN ('owner', 'admin')
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_tenant_roles
        WHERE user_id = (select auth.uid())
          AND role IN ('owner', 'admin')
    ));

CREATE POLICY countries_delete ON immo_app.countries
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.user_tenant_roles
        WHERE user_id = (select auth.uid())
          AND role IN ('owner', 'admin')
    ));

-- =====================================================
-- 5. IMMO_APP.LEASE_TEMPLATES - Split FOR ALL
-- =====================================================

DROP POLICY IF EXISTS lease_templates_write ON immo_app.lease_templates;

CREATE POLICY lease_templates_insert ON immo_app.lease_templates
    FOR INSERT
    WITH CHECK (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

CREATE POLICY lease_templates_update ON immo_app.lease_templates
    FOR UPDATE
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())))
    WITH CHECK (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

CREATE POLICY lease_templates_delete ON immo_app.lease_templates
    FOR DELETE
    USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));

-- =====================================================
-- DONE - All 14 warnings fixed
-- =====================================================
