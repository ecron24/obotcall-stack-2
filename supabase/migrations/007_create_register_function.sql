-- =====================================================
-- MIGRATION 007 : Function to bypass RLS for registration
-- Creates a SECURITY DEFINER function that can insert without RLS checks
-- =====================================================

-- Function to create a new user with their first tenant role
-- This function bypasses RLS policies to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.create_user_with_role(
    p_user_id uuid,
    p_tenant_id uuid,
    p_email text,
    p_full_name text,
    p_role text DEFAULT 'owner'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user jsonb;
    v_role jsonb;
BEGIN
    -- Insert user into public.users
    INSERT INTO public.users (
        id,
        email,
        full_name,
        is_active,
        email_verified,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_email,
        p_full_name,
        true,
        true,
        now(),
        now()
    )
    RETURNING to_jsonb(users.*) INTO v_user;

    -- Insert role into user_tenant_roles
    INSERT INTO public.user_tenant_roles (
        user_id,
        tenant_id,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_tenant_id,
        p_role,
        true,
        now(),
        now()
    )
    RETURNING to_jsonb(user_tenant_roles.*) INTO v_role;

    -- Return both records
    RETURN jsonb_build_object(
        'user', v_user,
        'role', v_role
    );
END;
$$;

-- Grant execute permission to authenticated users and service_role
GRANT EXECUTE ON FUNCTION public.create_user_with_role TO authenticated, service_role;

-- Add comment
COMMENT ON FUNCTION public.create_user_with_role IS
'Creates a user and their initial tenant role without triggering RLS policies. Used during registration to avoid infinite recursion.';
