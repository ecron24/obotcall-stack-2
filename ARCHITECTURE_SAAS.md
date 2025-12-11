# 🏗️ Architecture SaaS Multi-Applications

**Date:** 2025-12-11
**Version:** 1.0
**Status:** Phase 4 implémentée

---

## 📊 Vue d'ensemble

Obotcall Stack 2 est une **plateforme SaaS B2B multi-tenant** avec un hub centralisé et 4 applications métiers indépendantes.

```
┌─────────────────────────────────────────────────┐
│         tech (app.obotcall.tech)                │
│         Hub SaaS Centralisé                      │
│  - Signup/Login                                  │
│  - Onboarding                                    │
│  - Gestion abonnements Stripe                   │
│  - Création tenants                              │
└─────────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬────────────┐
        │            │            │            │
        ▼            ▼            ▼            ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
   │  Inter  │  │  Immo   │  │  Agent  │  │ Assist  │
   │  :3001  │  │  :3002  │  │  :3003  │  │ :3004   │
   └─────────┘  └─────────┘  └─────────┘  └─────────┘
        │            │            │            │
        └────────────┴────────────┴────────────┘
                     │
              ┌──────▼──────┐
              │  Supabase   │
              │  PostgreSQL │
              └─────────────┘
```

---

## 🎯 Séparation des responsabilités

### 🏠 Tech (Hub SaaS) - `app.obotcall.tech`

**Rôle:** Gestion centralisée du SaaS

**Fonctionnalités:**
- ✅ **Landing page** - Marketing, présentation produits
- ✅ **Signup** - Création compte (wizard 3 étapes)
- ✅ **Onboarding** - Configuration initiale
- ✅ **Stripe** - Gestion plans et paiements
- ✅ **Tenant management** - Création et gestion tenants

**Technologies:**
- Next.js 14
- Supabase Auth
- Stripe SDK
- Tailwind CSS

### 🔧 Inter-App - `inter-app.app.obotcall.tech`

**Rôle:** Gestion d'interventions multi-métiers

**Fonctionnalités:**
- Interventions (CRUD)
- Clients
- Devis/Factures
- Planning
- Stock
- Business types: pisciniste, plombier, électricien, etc.

**Base de données:** Schema `inter_app`

### 🏢 Immo-App - `immo-app.app.obotcall.tech`

**Rôle:** Gestion locative et baux immobiliers

**Fonctionnalités:**
- Baux et contrats
- Quittances
- Gestion locataires
- Propriétaires

**Base de données:** Schema `immo_app`

### 🤖 Agent-App - `agent-app.app.obotcall.tech`

**Rôle:** CRM pour courtiers d'assurance

**Fonctionnalités:**
- Contacts
- Devis et contrats
- Sinistres

**Base de données:** Schema `agent_app`

### 📋 Assist-App - `assist-app.app.obotcall.tech`

**Rôle:** Assistant personnel

**Fonctionnalités:**
- Tâches
- Agenda
- Notes

**Base de données:** Schema `assist_app`

---

## 🔄 Flow utilisateur complet

### 1. Inscription (Signup)

**URL:** `https://app.obotcall.tech/signup`

**Étapes:**

1. **Compte utilisateur**
   - Email
   - Mot de passe (min 8 caractères)
   - Nom complet

2. **Informations société**
   - Nom de la société
   - Slug (identifiant unique) → génère l'URL
   - Pays

3. **Choix du produit**
   - Inter / Immo / Agent / Assist
   - Si Inter → Business type (pisciniste, plombier, etc.)

**Résultat:**
- ✅ Compte Supabase Auth créé
- ✅ User dans `public.users`
- ✅ Tenant dans `public.tenants`
- ✅ Owner role dans `public.user_tenant_roles`
- ✅ Subscription FREE dans `public.subscriptions`
- ✅ Company settings initialisés (pour inter_app)

**Redirect:** `/select-product?tenant=slug&product=inter_app`

---

### 2. Sélection de plan (Optionnel)

**URL:** `https://app.obotcall.tech/select-product`

**Options:**

| Plan | Prix | Caractéristiques |
|------|------|------------------|
| **FREE** | Gratuit | 2 users, 1 GB, 1k API calls |
| **Starter** | 49€/mois | 10 users, 10 GB, 10k API calls |
| **Pro** | 99€/mois | Unlimited users, 50 GB, 100k API calls |

**Actions:**
- User peut **rester en FREE** → skip vers onboarding
- User peut **upgrader** → Stripe Checkout

**Si upgrade:**
1. Checkout Stripe
2. Webhook reçu
3. Subscription mise à jour dans `public.subscriptions`
4. Redirect `/checkout/success` → `/onboarding`

---

### 3. Onboarding

**URL:** `https://app.obotcall.tech/onboarding`

**Configuration:**
- Nom société (pré-rempli)
- Email et téléphone
- Adresse (optionnel)
- SIRET et TVA (optionnel)

**Résultat:**
- ✅ `company_settings` mis à jour dans le schema de l'app (`inter_app`, `immo_app`, etc.)

**Redirect:** Vers l'app métier
- Inter → `https://inter-app.app.obotcall.tech/dashboard?tenant=slug`
- Immo → `https://immo-app.app.obotcall.tech/dashboard?tenant=slug`
- etc.

---

## 🗄️ Structure Base de Données

### Schema `public` (Partagé)

```sql
-- Tenants (organisations)
public.tenants
├── id (uuid)
├── name
├── slug (unique)
├── app_type ('inter_app' | 'immo_app' | 'agent_app' | 'assist_app')
├── country_code
└── is_active

-- Utilisateurs globaux
public.users
├── id (uuid, FK auth.users)
├── email
├── full_name
└── locale

-- Rôles utilisateurs par tenant
public.user_tenant_roles
├── user_id (FK users)
├── tenant_id (FK tenants)
├── role ('owner' | 'admin' | 'manager' | 'user' | 'viewer')
└── is_active

-- Abonnements
public.subscriptions
├── tenant_id (FK tenants)
├── plan ('free' | 'starter' | 'pro' | 'enterprise')
├── status ('active' | 'trialing' | 'suspended' | 'cancelled')
├── stripe_customer_id
├── stripe_subscription_id
└── usage_limits (jsonb)
```

### Schema `inter_app` (Exemple)

```sql
-- Configuration société
inter_app.company_settings
├── tenant_id (FK tenants)
├── company_name
├── email, phone
├── siret, tva_number
└── business_type

-- Tables métier
inter_app.clients (tenant_id)
inter_app.interventions (tenant_id)
inter_app.invoices (tenant_id)
inter_app.products (tenant_id)
...
```

**Isolation:** Toutes les tables métier ont une colonne `tenant_id` avec RLS policies.

---

## 🔐 Sécurité & Isolation

### Row Level Security (RLS)

Toutes les tables métier ont des policies RLS :

```sql
-- Exemple: Seuls les users du tenant peuvent voir les données
CREATE POLICY "tenant_isolation_select"
ON inter_app.clients
FOR SELECT TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.user_tenant_roles
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);
```

### Fonctions SECURITY DEFINER

Toutes les fonctions sensibles ont `search_path` fixé :

```sql
CREATE FUNCTION inter_app.generate_invoice_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = inter_app, public, pg_catalog  -- ✅ Sécurisé
AS $$
...
$$;
```

---

## 💳 Stripe Integration

### Checkout Flow

1. User choisit un plan (Starter/Pro)
2. API `/api/create-checkout-session` crée une session Stripe
3. Redirect vers Stripe Checkout
4. User paie
5. Webhook Stripe `/api/stripe-webhook` reçoit `checkout.session.completed`
6. **TODO:** Mettre à jour `subscriptions.plan` et `subscriptions.status`
7. Redirect `/checkout/success` → `/onboarding`

### Events Stripe supportés

- ✅ `checkout.session.completed` - Paiement réussi
- ✅ `customer.subscription.updated` - Changement plan
- ✅ `customer.subscription.deleted` - Annulation
- ✅ `invoice.paid` - Paiement facture
- ✅ `invoice.payment_failed` - Échec paiement

---

## 📁 Structure Fichiers

```
apps/
├── tech/                    # Hub SaaS
│   ├── src/
│   │   ├── app/
│   │   │   ├── signup/
│   │   │   │   └── page.tsx           ✅ Wizard 3 étapes
│   │   │   ├── onboarding/
│   │   │   │   └── page.tsx           ✅ Config société
│   │   │   ├── select-product/
│   │   │   │   └── page.tsx           (Existant)
│   │   │   ├── checkout/
│   │   │   │   └── page.tsx           (Existant)
│   │   │   └── api/
│   │   │       ├── tenants/create/
│   │   │       │   └── route.ts       ✅ Création tenant
│   │   │       ├── create-checkout-session/
│   │   │       │   └── route.ts       (Existant)
│   │   │       └── stripe-webhook/
│   │   │           └── route.ts       (Existant - à adapter)
│   │   └── components/
│   └── package.json                   (Stripe déjà installé)
│
├── inter/                   # App métier
│   ├── inter-api/           # Backend Hono
│   ├── src/
│   │   ├── app/
│   │   │   └── dashboard/   # ✅ Fonctionnalités métier uniquement
│   │   └── lib/
│   └── supabase/
│       └── migrations/      # ✅ Migrations Phase 3
│
├── immo/                    # App métier
├── agent/                   # App métier
└── assist/                  # App métier
```

---

## 🚀 Variables d'environnement

### Tech (.env)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx  # Pour API tenants

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# URLs des apps métier (pour redirect après onboarding)
NEXT_PUBLIC_INTER_APP_URL=http://localhost:3001
NEXT_PUBLIC_IMMO_APP_URL=http://localhost:3002
NEXT_PUBLIC_AGENT_APP_URL=http://localhost:3003
NEXT_PUBLIC_ASSIST_APP_URL=http://localhost:3004

# Production
NEXT_PUBLIC_APP_URL=https://app.obotcall.tech
```

### Inter-App (.env)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Retour vers tech (pour logout, settings globaux)
NEXT_PUBLIC_TECH_APP_URL=https://app.obotcall.tech
```

---

## ✅ Phase 4 - Status

### ✅ Implémenté

- [x] API `/api/tenants/create` dans tech
- [x] Page signup complète (wizard 3 étapes)
- [x] Page onboarding universelle
- [x] Initialisation company_settings pour inter_app
- [x] Support business_type (pisciniste, plombier, etc.)
- [x] Plan FREE par défaut
- [x] Redirection vers apps métier

### ⏳ TODO

- [ ] **Adapter webhook Stripe** pour upgrade plan
  - Mettre à jour `subscriptions.plan` et `status`
  - Notifier user par email

- [ ] **Gestion utilisateurs dans apps métier**
  - Page `/dashboard/settings/users`
  - Invitations par email
  - Gestion des rôles

- [ ] **Page subscription dans tech**
  - Voir plan actuel
  - Upgrade/downgrade
  - Historique paiements

- [ ] **Middleware tenant detection**
  - Lire `tenant` depuis subdomain ou query param
  - Injecter dans headers
  - Vérifier accès user

- [ ] **Tests E2E**
  - Signup complet
  - Checkout Stripe
  - Onboarding
  - Isolation tenants

---

## 📚 Documentation complémentaire

- **Migrations DB:** `supabase/migrations/README_MIGRATIONS.md`
- **Plan SaaS:** `apps/inter/docs/PLAN_TRANSFORMATION_SAAS.md`
- **Multi-trade:** `apps/inter/IMPLEMENTATION_MULTI_TRADE.md`

---

**Architecture validée et prête pour Phase 5 (Tests & Déploiement) ✅**
