# 🏗️ Architecture Supabase Multi-Applications
## Document de Spécifications Techniques

**Date :** 2025-11-13
**Version :** 1.0
**Statut :** En attente de validation

---

## 📌 Vue d'ensemble

Ce document décrit l'architecture complète d'une plateforme SaaS multi-tenant comprenant 4 applications métiers distinctes, partagent une base de données Supabase unique avec isolation des données par schémas PostgreSQL.

---

## 🎯 Objectifs principaux

1. **Isolation forte** : Chaque application dispose de son propre schéma PostgreSQL
2. **Multi-tenant** : Support de plusieurs clients par application avec isolation totale des données
3. **Sécurité maximale** : Row Level Security (RLS), authentification JWT, politiques d'accès granulaires
4. **Scalabilité** : Architecture prête pour la montée en charge (VPS → Cloud)
5. **White-label** : Personnalisation par client (domaines, branding)
6. **Multi-pays** : Support européen avec gestion des locales et réglementations

---

## 🏢 Les 4 Applications

### 1. **inter-app** (Gestion de fiches d'intervention)
- **Schéma PostgreSQL** : `inter_app`
- **Statut** : Déjà développée
- **Métier** : Gestion d'interventions techniques, planification, suivi
- **Accès** : `inter-app.app.obotcall.tech` ou domaine personnalisé

### 2. **immo-app** (Gestion de contrats immobiliers)
- **Schéma PostgreSQL** : `immo_app`
- **Statut** : À développer
- **Métier** : Contrats de location, baux, gestion locative
- **Accès** : `immo-app.app.obotcall.tech` ou domaine personnalisé

### 3. **agent-app** (Gestion d'agents IA)
- **Schéma PostgreSQL** : `agent_app`
- **Statut** : À développer
- **Métier** : Orchestration d'agents IA, workflows automatisés
- **Accès** : `agent-app.app.obotcall.tech` ou domaine personnalisé

### 4. **assist-app** (Personal assistant)
- **Schéma PostgreSQL** : `assist_app`
- **Statut** : À développer
- **Métier** : Assistance personnelle, gestion de tâches, agenda
- **Accès** : `assist-app.app.obotcall.tech` ou domaine personnalisé

---

## 🗄️ Architecture de la base de données Supabase

### Principe d'organisation

```
supabase_database
│
├── public (schéma commun)
│   ├── tenants (organisations/clients)
│   ├── users (utilisateurs globaux)
│   ├── user_tenant_roles (rôles utilisateurs par tenant)
│   ├── countries (pays supportés)
│   ├── domains (domaines personnalisés)
│   └── subscriptions (abonnements)
│
├── inter_app (schéma inter-app)
│   ├── interventions
│   ├── technicians
│   ├── equipment
│   └── ... (tables métier)
│
├── immo_app (schéma immo-app)
│   ├── contracts
│   ├── properties
│   ├── tenants_immo
│   └── ... (tables métier)
│
├── agent_app (schéma agent-app)
│   ├── agents
│   ├── workflows
│   ├── executions
│   └── ... (tables métier)
│
└── assist_app (schéma assist-app)
    ├── tasks
    ├── events
    ├── notes
    └── ... (tables métier)
```

### Schéma `public` (Commun à toutes les apps)

Ce schéma contient les entités transverses :

#### **Table `tenants`** (Clients/Organisations)
```sql
- id (uuid, PK)
- name (text)
- slug (text, unique) -- pour URLs (ex: acme-corp)
- app_type (enum: inter_app, immo_app, agent_app, assist_app)
- country_code (text) -- ISO 3166-1
- settings (jsonb) -- white-label, branding
- subscription_id (uuid, FK)
- is_active (boolean)
- created_at, updated_at
```

#### **Table `users`** (Utilisateurs globaux)
```sql
- id (uuid, PK) -- correspond à auth.users de Supabase
- email (text, unique)
- full_name (text)
- avatar_url (text)
- locale (text) -- fr-FR, en-GB, etc.
- created_at, updated_at
```

#### **Table `user_tenant_roles`** (Rôles par application)
```sql
- id (uuid, PK)
- user_id (uuid, FK → users)
- tenant_id (uuid, FK → tenants)
- role (enum: owner, admin, manager, user, viewer)
- permissions (jsonb) -- permissions granulaires
- created_at, updated_at
```

#### **Table `countries`**
```sql
- code (text, PK) -- ISO 3166-1 (FR, DE, ES, IT, etc.)
- name (text)
- currency (text) -- EUR, GBP, etc.
- locale (text)
- is_active (boolean)
```

#### **Table `domains`** (Domaines personnalisés)
```sql
- id (uuid, PK)
- tenant_id (uuid, FK → tenants)
- domain (text, unique) -- ex: app.client.com
- is_verified (boolean)
- ssl_enabled (boolean)
- created_at, updated_at
```

#### **Table `subscriptions`**
```sql
- id (uuid, PK)
- tenant_id (uuid, FK → tenants)
- plan (enum: free, starter, pro, enterprise)
- status (enum: active, suspended, cancelled)
- features (jsonb) -- limits, options
- billing_cycle (enum: monthly, yearly)
- next_billing_date (date)
- created_at, updated_at
```

---

## 🔒 Sécurité : Stratégie RLS (Row Level Security)

### Principes

1. **Isolation par tenant** : Chaque requête filtre automatiquement par `tenant_id`
2. **Authentification JWT** : Supabase Auth avec JWT contenant `user_id` et `tenant_id`
3. **Politiques RLS strictes** : Activées sur TOUTES les tables
4. **Rôles PostgreSQL** :
   - `authenticated` : utilisateurs connectés
   - `service_role` : backend uniquement (Hono API)

### Exemple de politique RLS

```sql
-- Sur inter_app.interventions
CREATE POLICY "Users can only access their tenant's data"
ON inter_app.interventions
FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id
    FROM public.user_tenant_roles
    WHERE user_id = auth.uid()
  )
);
```

### Fonction utilitaire pour récupérer le tenant actuel

```sql
CREATE OR REPLACE FUNCTION public.get_current_tenant_ids()
RETURNS uuid[] AS $$
  SELECT ARRAY_AGG(tenant_id)
  FROM public.user_tenant_roles
  WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## 🏛️ Architecture applicative

### Stack technique

- **Frontend** : Next.js 14+ (App Router), React 18+, TypeScript
- **Backend API** : Hono (ultra-rapide, edge-compatible)
- **Base de données** : Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Containerisation** : Docker + Docker Compose
- **Hébergement** : VPS (évolutif vers Kubernetes si nécessaire)

### Structure des repositories

```
ecraon24/
│
├── app-obotcall (repo principal - hub d'accès)
│   ├── apps/
│   │   ├── web-portal (portail d'accès principal)
│   │   └── admin (gestion globale des tenants)
│   ├── packages/
│   │   ├── supabase-client (client Supabase configuré)
│   │   ├── auth (logique d'authentification commune)
│   │   └── ui (composants partagés)
│   └── docker-compose.yml
│
├── inter-app (déjà existant)
│   ├── apps/web
│   ├── apps/api (Hono)
│   └── supabase/migrations (schéma inter_app)
│
├── immo-app (à créer)
│   ├── apps/web
│   ├── apps/api (Hono)
│   └── supabase/migrations (schéma immo_app)
│
├── agent-app (à créer)
│   ├── apps/web
│   ├── apps/api (Hono)
│   └── supabase/migrations (schéma agent_app)
│
└── assist-app (à créer)
    ├── apps/web
    ├── apps/api (Hono)
    └── supabase/migrations (schéma assist_app)
```

### Gestion des domaines

#### Configuration Nginx (reverse proxy sur VPS)

```nginx
# inter-app.app.obotcall.tech
server {
    server_name inter-app.app.obotcall.tech;
    location / {
        proxy_pass http://localhost:3001;
    }
}

# immo-app.app.obotcall.tech
server {
    server_name immo-app.app.obotcall.tech;
    location / {
        proxy_pass http://localhost:3002;
    }
}

# Domaine personnalisé client
server {
    server_name app.client-custom.com;
    location / {
        proxy_pass http://localhost:3001; # redirige vers inter-app
        # Header X-Tenant-Domain pour identifier le tenant
        proxy_set_header X-Tenant-Domain $host;
    }
}
```

#### Middleware Next.js pour white-label

```typescript
// middleware.ts dans chaque app
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');

  // Récupérer le tenant depuis le domaine ou sous-domaine
  const tenant = await getTenantByDomain(hostname);

  // Injecter tenant_id dans les headers pour Supabase
  request.headers.set('X-Tenant-ID', tenant.id);

  // Appliquer le branding
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}
```

---

## 📊 Schémas métiers par application

### 1. inter_app (Fiches d'intervention)

**Tables principales :**
- `interventions` : Les interventions
- `technicians` : Les techniciens
- `clients` : Clients finaux
- `equipment` : Équipements/machines
- `contracts` : Contrats de maintenance
- `time_tracking` : Suivi temps réel

**Relations :**
- Toutes les tables ont `tenant_id` (uuid, FK → public.tenants)
- Toutes les tables ont RLS activé

### 2. immo_app (Contrats immobiliers)

**Tables principales :**
- `properties` : Biens immobiliers
- `contracts` : Contrats de location/baux
- `tenants_immo` : Locataires (attention : différent de tenants SaaS)
- `owners` : Propriétaires
- `payments` : Loyers et paiements
- `documents` : Documents légaux
- `maintenance_requests` : Demandes d'entretien

### 3. agent_app (Agents IA)

**Tables principales :**
- `agents` : Définitions d'agents IA
- `workflows` : Workflows automatisés
- `executions` : Historique d'exécutions
- `prompts` : Templates de prompts
- `integrations` : Intégrations externes (APIs)
- `logs` : Logs détaillés

### 4. assist_app (Personal assistant)

**Tables principales :**
- `tasks` : Tâches personnelles
- `events` : Événements/agenda
- `notes` : Notes et documents
- `contacts` : Contacts
- `reminders` : Rappels
- `files` : Fichiers (avec Supabase Storage)

---

## 🔐 Gestion des accès et rôles

### Matrice des rôles

| Rôle       | Lecture | Écriture | Modification | Suppression | Admin |
|------------|---------|----------|--------------|-------------|-------|
| owner      | ✅      | ✅       | ✅           | ✅          | ✅    |
| admin      | ✅      | ✅       | ✅           | ✅          | ❌    |
| manager    | ✅      | ✅       | ✅           | ❌          | ❌    |
| user       | ✅      | ✅       | ❌           | ❌          | ❌    |
| viewer     | ✅      | ❌       | ❌           | ❌          | ❌    |

### Permissions granulaires (jsonb)

```json
{
  "inter_app": {
    "interventions": ["create", "read", "update"],
    "technicians": ["read"],
    "reports": ["read", "export"]
  },
  "immo_app": {
    "contracts": ["read", "update"],
    "payments": ["read"]
  }
}
```

---

## 🚀 Déploiement et scalabilité

### Phase 1 : VPS (actuellement)
- Docker Compose
- Nginx reverse proxy
- 1 instance Supabase (cloud)
- Monitoring : Sentry + Prometheus

### Phase 2 : Scalabilité (future)
- Kubernetes (K8s)
- Load balancer
- Auto-scaling horizontal
- Supabase self-hosted ou pool de connexions
- CDN pour les assets statiques

### CI/CD
- GitHub Actions
- Tests automatisés
- Migrations Supabase automatiques
- Déploiement blue-green

---

## 📋 Plan d'implémentation

### Étape 1 : Schéma `public` (commun)
1. Création des tables transverses
2. Mise en place des politiques RLS
3. Fonctions utilitaires SQL
4. Seeds de données (pays, etc.)

### Étape 2 : Migration inter-app existante
1. Audit de la structure actuelle
2. Migration vers schéma `inter_app`
3. Ajout de `tenant_id` partout
4. Activation RLS

### Étape 3 : Nouveaux schémas (immo, agent, assist)
1. Création des schémas PostgreSQL
2. Définition des tables métiers (à détailler avec vous)
3. Politiques RLS
4. Indexes pour performance

### Étape 4 : Repo app-obotcall (hub)
1. Création du portail d'accès
2. Système d'authentification centralisé
3. Gestion des domaines
4. Admin global

### Étape 5 : Tests et documentation
1. Tests de sécurité (pénétration)
2. Tests de performance
3. Documentation API
4. Guides d'utilisation

---

## 📝 Prochaines étapes

**Pour valider ce document, j'ai besoin de :**

1. ✅ **Validation de l'architecture générale** : Êtes-vous d'accord avec cette approche ?

2. 📋 **Détails métiers par application** :
   - Pour **immo-app** : Quels types de contrats ? Quelles fonctionnalités principales ?
   - Pour **agent-app** : Quels types d'agents IA ? Cas d'usage ?
   - Pour **assist-app** : Fonctionnalités prioritaires ?

3. 🔧 **Choix techniques** :
   - Monorepo (Turborepo) ou repos séparés ?
   - Authentification : Supabase Auth uniquement ou OAuth (Google, Microsoft) ?
   - Paiements : Stripe intégré ?

4. 🌍 **Pays prioritaires** : Quels pays européens en premier ? (timezone, locale, devise)

5. 📊 **Volumétrie estimée** : Nombre de tenants attendus ? Nombre d'utilisateurs par tenant ?

---

## ✅ Validation requise

**Merci de confirmer ou d'ajuster les points suivants :**

- [ ] L'architecture Supabase avec schémas séparés vous convient
- [ ] La stratégie RLS et multi-tenant est claire
- [ ] La structure des repositories est cohérente
- [ ] Le système de domaines personnalisés répond au besoin
- [ ] Vous êtes prêt à fournir les détails métiers de chaque app

Une fois validé, je pourrai :
1. Générer les migrations SQL complètes
2. Créer les structures de projet
3. Implémenter les schémas Supabase
4. Configurer le système d'authentification multi-tenant

---

**Auteur :** Claude (AI Assistant)
**Contact :** Attendez votre validation pour continuer 🚀
