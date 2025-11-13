# 🗄️ Supabase Migrations - Obotcall Stack 2

This directory contains all SQL migrations for the Obotcall Stack 2 multi-tenant SaaS platform.

## 📋 Overview

### Database Architecture

- **Single Supabase Database** with multiple PostgreSQL schemas
- **Multi-tenant** with Row Level Security (RLS)
- **Security Model**: Option B (development-ready with production migration path)
- **Applications**: Web (hub), Inter, Immo, Agent, Assist

### Security Strategy

**Option B - Development Security** (Current Implementation)
- ✅ Complete RLS policies with tenant isolation
- ✅ Audit logging on all operations
- ✅ JWT authentication via Supabase Auth
- ✅ Encryption functions prepared (pgcrypto)
- ✅ 2FA fields present but not enforced
- ✅ Rate limiting prepared via environment flags
- ✅ Soft delete with audit trail
- ✅ GDPR compliance (consent, data retention)

**Migration Path to Option C** (Production):
- Enable 2FA enforcement (change `ENABLE_2FA=true`)
- Enable rate limiting (change `ENABLE_RATE_LIMITING=true`)
- Enable account lockout (change `ENABLE_ACCOUNT_LOCKOUT=true`)
- Enable IP whitelisting per tenant (change `ENABLE_IP_WHITELIST=true`)
- Encrypt sensitive fields with `encrypt_sensitive_data()` function

---

## 📦 Migration Files

### 001_schema_public.sql
**Purpose**: Create shared public schema with transverse tables

**Tables Created**:
1. **countries** (10 European countries seeded)
2. **tenants** (organizations with legal info, security settings, limits)
3. **users** (extended auth.users with 2FA, GDPR, login tracking)
4. **user_tenant_roles** (role-based access with permission validation)
5. **domains** (custom domain management with verification)
6. **subscriptions** (Stripe integration, usage limits, trials)
7. **audit_logs** (complete audit trail with automatic triggers)
8. **revoked_tokens** (JWT revocation for security)

**Features**:
- ✅ Complete RLS policies
- ✅ Audit logging on all operations
- ✅ Permission validation function
- ✅ Encryption/decryption functions
- ✅ Auto-update timestamp triggers
- ✅ Soft delete support
- ✅ Indexes for performance

**Status**: ✅ Complete - Ready to apply

---

### 002_schema_inter_app.sql
**Purpose**: Create inter_app schema for intervention management

**Tables Created**:
1. **clients** (B2B/B2C support, geolocation, GDPR consent)
2. **technicians** (skills, availability, real-time location tracking)
3. **equipment** (maintenance scheduling, warranty tracking)
4. **interventions** (work orders with auto-numbering INT-YYYY-XXXXX)
5. **invoices** (auto-numbering FAC-YYYY-XXXXX, payment tracking)

**Features**:
- ✅ Auto-numbering for interventions and invoices
- ✅ Status workflow tracking with history
- ✅ Geolocation support (PostGIS)
- ✅ Real-time technician availability
- ✅ Equipment maintenance scheduling
- ✅ Invoice-intervention linking
- ✅ Client signature capture
- ✅ Complete RLS policies
- ✅ Audit logging
- ✅ Soft delete

**Status**: ✅ Complete - Ready to apply

---

## 🚀 How to Apply Migrations

### Method 1: Supabase Dashboard (Recommended for first-time setup)

1. **Login to Supabase Dashboard**
   ```
   https://app.supabase.com/project/gpewkappvozjuxnzfekp
   ```

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Apply 001_schema_public.sql**
   - Copy the entire content of `001_schema_public.sql`
   - Paste into SQL Editor
   - Click "Run" button
   - Wait for success message
   - Verify: Check "Database" → "public" schema → should see 8 new tables

4. **Apply 002_schema_inter_app.sql**
   - Copy the entire content of `002_schema_inter_app.sql`
   - Paste into SQL Editor
   - Click "Run" button
   - Wait for success message
   - Verify: Check "Database" → "inter_app" schema → should see 5 new tables

### Method 2: Supabase CLI (For development workflow)

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link to your project**
   ```bash
   cd ~/obotcall/obotcall-stack-2
   supabase link --project-ref gpewkappvozjuxnzfekp
   ```

4. **Apply migrations**
   ```bash
   supabase db push
   ```

   This will apply all migration files in order.

### Method 3: Direct psql connection

1. **Get connection string from Supabase Dashboard**
   - Settings → Database → Connection string
   - Use "Connection pooling" for production

2. **Apply migrations**
   ```bash
   # From your local machine
   psql "postgresql://postgres:[YOUR-PASSWORD]@db.gpewkappvozjuxnzfekp.supabase.co:5432/postgres" \
     -f supabase/migrations/001_schema_public.sql

   psql "postgresql://postgres:[YOUR-PASSWORD]@db.gpewkappvozjuxnzfekp.supabase.co:5432/postgres" \
     -f supabase/migrations/002_schema_inter_app.sql
   ```

---

## ✅ Post-Migration Verification

### 1. Check schemas exist

```sql
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name IN ('public', 'inter_app')
ORDER BY schema_name;
```

Expected result:
```
 schema_name
-------------
 inter_app
 public
```

### 2. Check public schema tables

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Expected result (8 tables):
```
 table_name
-------------------
 audit_logs
 countries
 domains
 revoked_tokens
 subscriptions
 tenants
 user_tenant_roles
 users
```

### 3. Check inter_app schema tables

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'inter_app'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Expected result (5 tables):
```
 table_name
--------------
 clients
 equipment
 interventions
 invoices
 technicians
```

### 4. Check RLS is enabled

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname IN ('public', 'inter_app')
  AND rowsecurity = true
ORDER BY schemaname, tablename;
```

All tables should have `rowsecurity = true`.

### 5. Test auto-numbering functions

```sql
-- Test intervention number generation
SELECT inter_app.generate_intervention_number('00000000-0000-0000-0000-000000000000');
-- Expected: INT-2025-00001

-- Test invoice number generation
SELECT inter_app.generate_invoice_number('00000000-0000-0000-0000-000000000000');
-- Expected: FAC-2025-00001
```

### 6. Check countries are seeded

```sql
SELECT code, name_en FROM public.countries ORDER BY name_en;
```

Expected result (10 European countries):
```
 code |    name_en
------+----------------
 AT   | Austria
 BE   | Belgium
 CH   | Switzerland
 DE   | Germany
 ES   | Spain
 FR   | France
 GB   | United Kingdom
 IT   | Italy
 LU   | Luxembourg
 NL   | Netherlands
```

---

## 🔒 Security Configuration

### Environment Variables (.env)

Make sure your `.env` file contains:

```env
# Supabase Connection
SUPABASE_URL=https://gpewkappvozjuxnzfekp.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Security Flags (Option B → Option C migration)
ENABLE_2FA=false              # Dev: false, Prod: true
ENABLE_RATE_LIMITING=false    # Dev: false, Prod: true
ENABLE_ACCOUNT_LOCKOUT=false  # Dev: false, Prod: true
ENABLE_IP_WHITELIST=false     # Dev: false, Prod: true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXTAUTH_SECRET=your-super-secret-nextauth-key-change-this

# Encryption Key (for sensitive data)
ENCRYPTION_KEY=your-32-char-encryption-key-here

# Feature Flags
ENABLE_INTER_APP=true
ENABLE_IMMO_APP=false
ENABLE_AGENT_APP=false
ENABLE_ASSIST_APP=false
```

### RLS Policies

All tables have RLS enabled with tenant isolation:

```sql
-- Example: Users can only see data from their tenants
CREATE POLICY tenant_isolation ON schema.table_name
    FOR ALL
    USING (tenant_id IN (SELECT * FROM get_current_user_tenant_ids()));
```

The `get_current_user_tenant_ids()` function automatically returns tenant IDs the current user has access to via `user_tenant_roles`.

---

## 📊 Database Diagram

### Public Schema (Transverse)

```
┌─────────────┐
│  countries  │
└──────┬──────┘
       │
       ├─────┐
       │     │
┌──────▼─────▼───────┐      ┌──────────────────┐
│     tenants        │◄─────┤  subscriptions   │
└──────┬─────────────┘      └──────────────────┘
       │
       ├───────────────┐
       │               │
┌──────▼──────┐  ┌────▼──────────────┐
│   domains   │  │ user_tenant_roles │
└─────────────┘  └────┬──────────────┘
                      │
                 ┌────▼──────┐
                 │   users   │
                 └───────────┘

┌──────────────────┐    ┌─────────────────┐
│   audit_logs     │    │ revoked_tokens  │
└──────────────────┘    └─────────────────┘
```

### Inter_App Schema

```
┌─────────────┐
│   clients   │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
┌──────▼──────┐  ┌──▼──────────────┐
│  equipment  │  │  interventions  │
└─────────────┘  └──┬───────────────┘
                    │
                    │
┌─────────────┐  ┌──▼──────────┐
│ technicians │  │  invoices   │
└─────────────┘  └─────────────┘
```

---

## 🔄 Migration Path: Option B → Option C

### Current State (Option B - Development)

- ✅ All security infrastructure present
- ✅ 2FA fields exist but not enforced
- ✅ Rate limiting prepared but disabled
- ✅ Encryption functions ready but not used
- ✅ Complete audit logging active

### To Migrate to Option C (Production)

1. **Enable 2FA Enforcement**
   ```sql
   -- Update tenants to require 2FA
   UPDATE public.tenants SET require_2fa = true WHERE id = 'your-tenant-id';

   -- Application level: Check user.totp_secret IS NOT NULL before allowing access
   ```

2. **Enable Rate Limiting**
   ```env
   ENABLE_RATE_LIMITING=true
   ```

   Application will enforce limits from `tenants.rate_limit_per_minute`.

3. **Enable Account Lockout**
   ```env
   ENABLE_ACCOUNT_LOCKOUT=true
   ```

   Application will check `users.failed_login_attempts` and `account_locked_until`.

4. **Enable IP Whitelisting**
   ```env
   ENABLE_IP_WHITELIST=true
   ```

   Application will check `tenants.allowed_ips`.

5. **Encrypt Sensitive Fields**
   ```sql
   -- Example: Encrypt client SIRET numbers
   UPDATE inter_app.clients
   SET siret = encode(encrypt_sensitive_data(siret, 'your-encryption-key'), 'base64')
   WHERE siret IS NOT NULL;

   -- Application level: Use decrypt_sensitive_data() when reading
   ```

6. **Enable Additional Security**
   - Configure Supabase Auth with email verification
   - Enable MFA in Supabase Auth settings
   - Configure password policies in Supabase Dashboard
   - Set up monitoring and alerting for audit_logs

---

## 🧪 Testing the Setup

### 1. Create a test tenant

```sql
INSERT INTO public.tenants (
    name,
    subdomain,
    country_code,
    legal_company_name,
    contact_email
) VALUES (
    'Test Company',
    'test',
    'FR',
    'Test Company SAS',
    'test@obotcall.tech'
) RETURNING id;
```

### 2. Create a test user

```sql
-- First create user in Supabase Auth via Dashboard or API
-- Then extend in public.users

INSERT INTO public.users (
    id, -- Use the auth.users.id from Supabase Auth
    email,
    first_name,
    last_name,
    gdpr_consent
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'test@obotcall.tech',
    'Test',
    'User',
    true
);
```

### 3. Assign user to tenant

```sql
INSERT INTO public.user_tenant_roles (
    user_id,
    tenant_id,
    role,
    permissions
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'your-tenant-id-from-step-1',
    'owner',
    '{
        "inter_app": {"actions": ["create", "read", "update", "delete", "export"]}
    }'::jsonb
);
```

### 4. Create a test client (in inter_app)

```sql
INSERT INTO inter_app.clients (
    tenant_id,
    client_type,
    first_name,
    last_name,
    email,
    phone,
    address_line1,
    postal_code,
    city,
    gdpr_consent
) VALUES (
    'your-tenant-id',
    'b2c',
    'John',
    'Doe',
    'john.doe@example.com',
    '+33612345678',
    '123 Rue de la Paix',
    '75001',
    'Paris',
    true
) RETURNING id;
```

### 5. Create a test intervention

```sql
INSERT INTO inter_app.interventions (
    tenant_id,
    client_id,
    intervention_type,
    priority,
    title,
    description,
    scheduled_date
) VALUES (
    'your-tenant-id',
    'your-client-id-from-step-4',
    'maintenance',
    'normal',
    'Annual boiler maintenance',
    'Regular yearly maintenance check',
    CURRENT_DATE + INTERVAL '7 days'
) RETURNING id, intervention_number;
```

You should see an auto-generated `intervention_number` like `INT-2025-00001`.

---

## 📝 Notes

### Auto-Numbering

- **Interventions**: Format `INT-YYYY-XXXXX` (e.g., `INT-2025-00001`)
- **Invoices**: Format `FAC-YYYY-XXXXX` (e.g., `FAC-2025-00001`)
- Numbering is per tenant and resets each year
- Numbers are generated automatically on INSERT

### Audit Logging

All INSERT, UPDATE, and DELETE operations are automatically logged in `public.audit_logs`:

```sql
-- View recent audit logs
SELECT
    al.operation,
    al.table_name,
    al.created_at,
    u.email as user_email,
    t.name as tenant_name
FROM public.audit_logs al
LEFT JOIN public.users u ON u.id = al.user_id
LEFT JOIN public.tenants t ON t.id = al.tenant_id
ORDER BY al.created_at DESC
LIMIT 50;
```

### Soft Delete

All tables support soft delete via `deleted_at` field:

```sql
-- Soft delete a client
UPDATE inter_app.clients
SET deleted_at = now(), deleted_by = auth.uid()
WHERE id = 'client-id';

-- Restore a client
UPDATE inter_app.clients
SET deleted_at = NULL, deleted_by = NULL
WHERE id = 'client-id';

-- Permanently delete (use with caution)
DELETE FROM inter_app.clients WHERE id = 'client-id';
```

### Geolocation

Tables with geolocation support:
- `inter_app.clients` (for routing)
- `inter_app.technicians` (real-time tracking)
- `inter_app.interventions` (if different from client address)

Uses PostGIS for distance calculations and proximity searches.

---

## 🆘 Troubleshooting

### Error: "extension uuid-ossp does not exist"

```sql
-- Run in SQL Editor as superuser
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Error: "extension pgcrypto does not exist"

```sql
-- Run in SQL Editor as superuser
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Error: "permission denied for schema inter_app"

Check that you've run the GRANT statements at the end of `002_schema_inter_app.sql`:

```sql
GRANT USAGE ON SCHEMA inter_app TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA inter_app TO authenticated;
```

### RLS Blocking All Access

Make sure user has proper tenant assignments in `user_tenant_roles`:

```sql
-- Check user's tenant assignments
SELECT * FROM public.user_tenant_roles WHERE user_id = auth.uid();
```

### Auto-Numbering Not Working

Check that triggers are properly created:

```sql
-- List triggers for interventions table
SELECT tgname FROM pg_trigger WHERE tgrelid = 'inter_app.interventions'::regclass;
-- Should see: set_intervention_number_on_insert
```

---

## 📚 Next Steps

After applying migrations:

1. ✅ **Verify all tables and RLS policies** (see Post-Migration Verification)
2. 🔐 **Configure Supabase Auth** in Dashboard
3. 🌐 **Update environment variables** in `.env`
4. 🚀 **Start building the Web (hub) application**
5. 🔧 **Start building the Inter application**
6. 📊 **Set up monitoring and alerting**
7. 🧪 **Write integration tests**

---

## 📞 Support

For questions or issues:
- Check Supabase documentation: https://supabase.com/docs
- Review audit logs in `public.audit_logs`
- Check application logs in Docker containers

---

**Migrations created**: 2025-11-13
**Security model**: Option B (dev) with migration path to Option C (prod)
**Database**: Supabase PostgreSQL
**Status**: ✅ Ready to apply
