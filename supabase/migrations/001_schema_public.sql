-- =====================================================
-- OBOTCALL STACK 2 - MIGRATION 001
-- Schéma PUBLIC : Tables transverses et sécurité
-- Option B : Sécurité renforcée (dev → prod ready)
-- =====================================================

-- =====================================================
-- 1. EXTENSIONS
-- =====================================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cryptographie pour chiffrement des données sensibles
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 2. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour valider le format des permissions (jsonb)
CREATE OR REPLACE FUNCTION validate_permissions(perms jsonb)
RETURNS boolean AS $$
DECLARE
    allowed_apps text[] := ARRAY['inter_app', 'immo_app', 'agent_app', 'assist_app'];
    allowed_actions text[] := ARRAY['create', 'read', 'update', 'delete', 'export'];
    app_key text;
    resource_key text;
    action text;
BEGIN
    -- Vérifier que chaque clé d'app est valide
    FOR app_key IN SELECT jsonb_object_keys(perms) LOOP
        IF NOT (app_key = ANY(allowed_apps)) THEN
            RETURN false;
        END IF;

        -- Vérifier que chaque resource existe
        FOR resource_key IN SELECT jsonb_object_keys(perms->app_key) LOOP
            -- Vérifier que chaque action est valide
            FOR action IN SELECT jsonb_array_elements_text(perms->app_key->resource_key) LOOP
                IF NOT (action = ANY(allowed_actions)) THEN
                    RETURN false;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les tenant_ids de l'utilisateur courant
CREATE OR REPLACE FUNCTION get_current_user_tenant_ids()
RETURNS uuid[] AS $$
    SELECT ARRAY_AGG(tenant_id)
    FROM public.user_tenant_roles
    WHERE user_id = auth.uid()
    AND is_active = true
    AND (valid_until IS NULL OR valid_until > now());
$$ LANGUAGE sql SECURITY DEFINER;

-- Fonctions de chiffrement/déchiffrement pour données sensibles
-- NOTE: Ces fonctions sont commentées car pgcrypto peut ne pas être disponible sur tous les environnements Supabase
-- Décommenter si nécessaire et si pgcrypto est activé
-- CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data text, key text)
-- RETURNS bytea AS $$
--     SELECT pgp_sym_encrypt(data, key);
-- $$ LANGUAGE sql;
--
-- CREATE OR REPLACE FUNCTION decrypt_sensitive_data(data bytea, key text)
-- RETURNS text AS $$
--     SELECT pgp_sym_decrypt(data, key);
-- $$ LANGUAGE sql;

-- =====================================================
-- 3. TABLE : countries (Pays supportés)
-- =====================================================

CREATE TABLE public.countries (
    code text PRIMARY KEY CHECK (length(code) = 2), -- ISO 3166-1 alpha-2
    name text NOT NULL,
    currency text NOT NULL CHECK (length(currency) = 3), -- ISO 4217
    locale text NOT NULL,
    timezone text DEFAULT 'Europe/Paris',
    vat_rate numeric(5,2) DEFAULT 20.00,
    date_format text DEFAULT 'DD/MM/YYYY',
    phone_prefix text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX idx_countries_active ON public.countries(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "countries_public_read"
ON public.countries
FOR SELECT
TO authenticated
USING (is_active = true);

-- Seed data (pays européens)
INSERT INTO public.countries (code, name, currency, locale, timezone, vat_rate, phone_prefix) VALUES
('FR', 'France', 'EUR', 'fr-FR', 'Europe/Paris', 20.00, '+33'),
('DE', 'Allemagne', 'EUR', 'de-DE', 'Europe/Berlin', 19.00, '+49'),
('ES', 'Espagne', 'EUR', 'es-ES', 'Europe/Madrid', 21.00, '+34'),
('IT', 'Italie', 'EUR', 'it-IT', 'Europe/Rome', 22.00, '+39'),
('GB', 'Royaume-Uni', 'GBP', 'en-GB', 'Europe/London', 20.00, '+44'),
('BE', 'Belgique', 'EUR', 'fr-BE', 'Europe/Brussels', 21.00, '+32'),
('CH', 'Suisse', 'CHF', 'fr-CH', 'Europe/Zurich', 7.70, '+41'),
('NL', 'Pays-Bas', 'EUR', 'nl-NL', 'Europe/Amsterdam', 21.00, '+31'),
('PT', 'Portugal', 'EUR', 'pt-PT', 'Europe/Lisbon', 23.00, '+351'),
('AT', 'Autriche', 'EUR', 'de-AT', 'Europe/Vienna', 20.00, '+43')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 4. TABLE : tenants (Organisations/Clients)
-- =====================================================

CREATE TABLE public.tenants (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    app_type text NOT NULL CHECK (app_type IN ('inter_app', 'immo_app', 'agent_app', 'assist_app')),
    country_code text NOT NULL REFERENCES public.countries(code),

    -- Informations légales
    legal_entity_name text,
    tax_id text,
    siret text,
    vat_number text,

    -- Contact
    billing_email text,
    support_email text,
    phone text,

    -- Limites
    max_users integer DEFAULT 10,
    max_storage_gb integer DEFAULT 10,

    -- Configuration
    settings jsonb DEFAULT '{}'::jsonb,

    -- Sécurité
    ip_whitelist inet[],
    require_2fa boolean DEFAULT false,

    -- Abonnement
    subscription_id uuid,

    -- Statut
    is_active boolean DEFAULT true,

    -- Audit
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

-- Index
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_app_type ON public.tenants(app_type);
CREATE INDEX idx_tenants_active ON public.tenants(is_active) WHERE is_active = true;
CREATE INDEX idx_tenants_deleted ON public.tenants(deleted_at) WHERE deleted_at IS NULL;

-- Trigger
CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_their_tenants"
ON public.tenants
FOR SELECT
TO authenticated
USING (
    id IN (SELECT unnest(get_current_user_tenant_ids()))
);

CREATE POLICY "owners_can_update_tenant"
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

-- =====================================================
-- 5. TABLE : users (Utilisateurs globaux)
-- =====================================================

CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    full_name text NOT NULL,
    avatar_url text,
    locale text DEFAULT 'fr-FR',
    timezone text DEFAULT 'Europe/Paris',

    -- Contact
    phone_number text,
    phone_verified boolean DEFAULT false,

    -- Sécurité (Option B → Option C)
    two_factor_enabled boolean DEFAULT false,
    two_factor_secret text, -- TOTP secret
    backup_codes text[], -- Codes de secours chiffrés
    last_login_at timestamptz,
    last_login_ip inet,
    failed_login_attempts integer DEFAULT 0,
    locked_until timestamptz,

    -- Préférences
    notification_preferences jsonb DEFAULT '{
        "email": true,
        "push": false,
        "sms": false
    }'::jsonb,

    -- RGPD
    data_processing_consent boolean DEFAULT false,
    data_processing_consent_date timestamptz,
    marketing_consent boolean DEFAULT false,

    -- Audit
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

-- Index
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_deleted ON public.users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_locked ON public.users(locked_until) WHERE locked_until IS NOT NULL;

-- Trigger
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour réinitialiser les tentatives de connexion
CREATE OR REPLACE FUNCTION reset_failed_login_attempts()
RETURNS trigger AS $$
BEGIN
    IF NEW.last_login_at > OLD.last_login_at THEN
        NEW.failed_login_attempts := 0;
        NEW.locked_until := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reset_login_attempts
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION reset_failed_login_attempts();

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_profile"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "users_can_update_own_profile"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "admins_can_view_tenant_users"
ON public.users
FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT utr.user_id
        FROM public.user_tenant_roles utr
        WHERE utr.tenant_id IN (
            SELECT tenant_id
            FROM public.user_tenant_roles
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND is_active = true
        )
    )
);

-- =====================================================
-- 6. TABLE : user_tenant_roles (Rôles utilisateurs)
-- =====================================================

CREATE TABLE public.user_tenant_roles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'user', 'viewer')),
    permissions jsonb DEFAULT '{}'::jsonb,

    -- Activation et validité
    is_active boolean DEFAULT true,
    valid_from timestamptz DEFAULT now(),
    valid_until timestamptz,

    -- Audit
    created_by uuid REFERENCES public.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    -- Contraintes
    UNIQUE(user_id, tenant_id),
    CONSTRAINT valid_permissions_format CHECK (validate_permissions(permissions))
);

-- Index
CREATE INDEX idx_user_tenant_roles_user ON public.user_tenant_roles(user_id);
CREATE INDEX idx_user_tenant_roles_tenant ON public.user_tenant_roles(tenant_id);
CREATE INDEX idx_user_tenant_roles_active ON public.user_tenant_roles(is_active, valid_until);

-- Trigger
CREATE TRIGGER update_user_tenant_roles_updated_at
BEFORE UPDATE ON public.user_tenant_roles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour s'assurer qu'il y a toujours un owner par tenant
CREATE OR REPLACE FUNCTION ensure_tenant_has_owner()
RETURNS trigger AS $$
DECLARE
    owner_count integer;
BEGIN
    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.role = 'owner' AND NEW.role != 'owner') THEN
        SELECT COUNT(*) INTO owner_count
        FROM public.user_tenant_roles
        WHERE tenant_id = OLD.tenant_id
        AND role = 'owner'
        AND is_active = true
        AND id != OLD.id;

        IF owner_count = 0 THEN
            RAISE EXCEPTION 'Cannot remove the last owner of a tenant';
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_owner_exists
BEFORE UPDATE OR DELETE ON public.user_tenant_roles
FOR EACH ROW EXECUTE FUNCTION ensure_tenant_has_owner();

-- RLS
ALTER TABLE public.user_tenant_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_roles"
ON public.user_tenant_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "admins_can_view_tenant_roles"
ON public.user_tenant_roles
FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
);

CREATE POLICY "owners_can_manage_roles"
ON public.user_tenant_roles
FOR ALL
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = auth.uid()
        AND role = 'owner'
        AND is_active = true
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = auth.uid()
        AND role = 'owner'
        AND is_active = true
    )
);

-- =====================================================
-- 7. TABLE : domains (Domaines personnalisés)
-- =====================================================

CREATE TABLE public.domains (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    domain text UNIQUE NOT NULL,

    -- Vérification
    is_verified boolean DEFAULT false,
    verification_token text UNIQUE,
    verification_method text CHECK (verification_method IN ('dns', 'http', 'email')),
    verified_at timestamptz,

    -- SSL
    ssl_enabled boolean DEFAULT false,
    ssl_certificate_expiry timestamptz,

    -- Redirection
    redirect_to text,

    -- Audit
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX idx_domains_tenant ON public.domains(tenant_id);
CREATE INDEX idx_domains_verified ON public.domains(is_verified) WHERE is_verified = true;

-- Trigger
CREATE TRIGGER update_domains_updated_at
BEFORE UPDATE ON public.domains
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour générer un token de vérification
CREATE OR REPLACE FUNCTION generate_domain_verification_token()
RETURNS trigger AS $$
BEGIN
    IF NEW.verification_token IS NULL THEN
        NEW.verification_token := encode(gen_random_bytes(32), 'hex');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_verification_token
BEFORE INSERT ON public.domains
FOR EACH ROW EXECUTE FUNCTION generate_domain_verification_token();

-- RLS
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_can_manage_domains"
ON public.domains
FOR ALL
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = auth.uid()
        AND role = 'owner'
        AND is_active = true
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = auth.uid()
        AND role = 'owner'
        AND is_active = true
    )
);

-- =====================================================
-- 8. TABLE : subscriptions (Abonnements)
-- =====================================================

CREATE TABLE public.subscriptions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Plan et statut
    plan text NOT NULL CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
    status text NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'suspended', 'cancelled')),
    billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly')),

    -- Prix
    price_amount numeric(10,2),
    price_currency text DEFAULT 'EUR',

    -- Stripe
    stripe_customer_id text,
    stripe_subscription_id text,

    -- Périodes
    current_period_start timestamptz,
    current_period_end timestamptz,
    next_billing_date date,

    -- Annulation
    cancel_at_period_end boolean DEFAULT false,
    cancelled_at timestamptz,

    -- Essai
    trial_start timestamptz,
    trial_end timestamptz,

    -- Limites et features
    usage_limits jsonb DEFAULT '{
        "max_users": 10,
        "max_storage_gb": 10,
        "max_api_calls_per_month": 10000
    }'::jsonb,
    features jsonb DEFAULT '{}'::jsonb,

    -- Historique
    previous_plan text,
    upgraded_at timestamptz,
    downgraded_at timestamptz,

    -- Audit
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX idx_subscriptions_tenant ON public.subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing ON public.subscriptions(next_billing_date);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);

-- Trigger
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour mettre à jour le statut automatiquement
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS trigger AS $$
BEGIN
    -- Si la période d'essai est terminée et pas de paiement
    IF NEW.trial_end < now() AND NEW.status = 'trialing' THEN
        NEW.status := 'past_due';
    END IF;

    -- Si annulation à la fin de la période
    IF NEW.cancel_at_period_end AND NEW.current_period_end < now() THEN
        NEW.status := 'cancelled';
        NEW.cancelled_at := now();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_subscription_status
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION update_subscription_status();

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_can_manage_subscription"
ON public.subscriptions
FOR ALL
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = auth.uid()
        AND role = 'owner'
        AND is_active = true
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = auth.uid()
        AND role = 'owner'
        AND is_active = true
    )
);

-- Ajouter la FK maintenant que subscriptions existe
ALTER TABLE public.tenants
ADD CONSTRAINT fk_tenants_subscription
FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id);

ALTER TABLE public.tenants
ADD CONSTRAINT fk_tenants_created_by
FOREIGN KEY (created_by) REFERENCES public.users(id);

-- =====================================================
-- 9. TABLE : audit_logs (Logs d'audit)
-- =====================================================

CREATE TABLE public.audit_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid REFERENCES public.tenants(id),
    user_id uuid REFERENCES public.users(id),

    -- Action
    app_schema text NOT NULL, -- inter_app, immo_app, etc.
    table_name text NOT NULL,
    operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT')),
    record_id uuid,

    -- Données
    old_data jsonb,
    new_data jsonb,

    -- Contexte
    ip_address inet,
    user_agent text,

    -- Timestamp
    created_at timestamptz DEFAULT now()
);

-- Index (Partition par date recommandée en production)
CREATE INDEX idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_operation ON public.audit_logs(operation);

-- Fonction pour logger automatiquement
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.audit_logs (
        tenant_id,
        user_id,
        app_schema,
        table_name,
        operation,
        record_id,
        old_data,
        new_data,
        ip_address
    ) VALUES (
        COALESCE(NEW.tenant_id, OLD.tenant_id),
        auth.uid(),
        TG_TABLE_SCHEMA,
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        inet_client_addr()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_can_view_tenant_audit_logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id
        FROM public.user_tenant_roles
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
);

-- =====================================================
-- 10. TABLE : revoked_tokens (Tokens JWT révoqués)
-- =====================================================

CREATE TABLE public.revoked_tokens (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    token_jti text UNIQUE NOT NULL, -- JWT ID
    revoked_at timestamptz DEFAULT now(),
    reason text,
    expires_at timestamptz NOT NULL
);

-- Index
CREATE INDEX idx_revoked_tokens_jti ON public.revoked_tokens(token_jti);
CREATE INDEX idx_revoked_tokens_user ON public.revoked_tokens(user_id);
CREATE INDEX idx_revoked_tokens_expires ON public.revoked_tokens(expires_at);

-- Fonction pour nettoyer les tokens expirés (à exécuter via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_revoked_tokens()
RETURNS integer AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM public.revoked_tokens
    WHERE expires_at < now();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- RLS
ALTER TABLE public.revoked_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_revoked_tokens"
ON public.revoked_tokens
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- FIN MIGRATION 001
-- =====================================================

-- Commentaire
COMMENT ON SCHEMA public IS 'Schéma public contenant les tables transverses partagées entre toutes les applications';
COMMENT ON TABLE public.tenants IS 'Organisations/Clients utilisant la plateforme';
COMMENT ON TABLE public.users IS 'Utilisateurs globaux avec authentification Supabase';
COMMENT ON TABLE public.user_tenant_roles IS 'Rôles et permissions des utilisateurs par tenant';
COMMENT ON TABLE public.audit_logs IS 'Logs d''audit pour traçabilité et conformité';
COMMENT ON TABLE public.revoked_tokens IS 'Tokens JWT révoqués pour sécurité renforcée';
