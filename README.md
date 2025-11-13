# 🚀 Obotcall Stack 2 - Plateforme Multi-Applications SaaS

**Obotcall Stack 2** est une plateforme SaaS B2B multi-tenant comprenant 4 applications métiers distinctes partageant une infrastructure commune.

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Applications](#-applications)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Déploiement](#-déploiement)
- [Développement](#-développement)

---

## 🌐 Vue d'ensemble

### Domaine principal
**app.obotcall.tech** - Hub d'authentification et de sélection d'applications

### Architecture Multi-Applications
- **1 base de données Supabase** avec schémas PostgreSQL séparés
- **Authentification centralisée** via Supabase Auth
- **Isolation des données** par tenant avec Row Level Security (RLS)
- **White-label** : Support de domaines personnalisés par client
- **Multi-pays** : Support européen (FR, DE, ES, IT, etc.)

---

## 📱 Applications

### 1. 🏠 **obotcall-app** (Hub principal)
- **URL** : `app.obotcall.tech`
- **Port** : 3000
- **Rôle** :
  - Authentification centralisée
  - Sélection et routage vers les applications
  - Gestion des tenants et abonnements
  - Administration globale

### 2. 🔧 **inter-app** (Gestion d'interventions)
- **URL** : `inter-app.app.obotcall.tech`
- **Port** : 3001
- **Schéma DB** : `inter_app`
- **Métier** : Fiches d'intervention, planning, clients

### 3. 🏢 **immo-app** (Gestion immobilière)
- **URL** : `immo-app.app.obotcall.tech`
- **Port** : 3002
- **Schéma DB** : `immo_app`
- **Métier** : Contrats de location, baux, gestion locative

### 4. 🤖 **agent-app** (Agents IA)
- **URL** : `agent-app.app.obotcall.tech`
- **Port** : 3003
- **Schéma DB** : `agent_app`
- **Métier** : Orchestration d'agents IA, workflows automatisés

### 5. 📋 **assist-app** (Assistant personnel)
- **URL** : `assist-app.app.obotcall.tech`
- **Port** : 3004
- **Schéma DB** : `assist_app`
- **Métier** : Tâches, agenda, notes, gestion personnelle

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    app.obotcall.tech                        │
│                   (obotcall-app - Hub)                      │
│              Authentification & Sélection                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ JWT Token
                              ▼
        ┌─────────────────────┴─────────────────────┐
        │                                             │
┌───────▼────────┐  ┌──────────────┐  ┌─────────────▼────┐
│   inter-app    │  │   immo-app   │  │   agent-app      │
│   :3001        │  │   :3002      │  │   :3003          │
└───────┬────────┘  └──────┬───────┘  └─────────┬────────┘
        │                  │                     │
        │                  ▼                     │
        │         ┌──────────────┐              │
        │         │  assist-app  │              │
        │         │    :3004     │              │
        │         └──────┬───────┘              │
        │                │                      │
        └────────────────┴──────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Supabase          │
              │   PostgreSQL        │
              │   + Auth + Storage  │
              │                     │
              │   Schémas:          │
              │   - public (commun) │
              │   - inter_app       │
              │   - immo_app        │
              │   - agent_app       │
              │   - assist_app      │
              └─────────────────────┘
```

### Stack Technique

**Frontend (toutes les apps):**
- ⚡ Next.js 14+ (App Router)
- 🎨 Tailwind CSS + shadcn/ui
- 🔐 Supabase Auth
- 📦 TypeScript

**Backend:**
- 🔥 Hono API (ultra-rapide)
- 🛡️ JWT + Supabase Auth
- ✅ Zod (validation)

**Infrastructure:**
- 🐳 Docker + Docker Compose
- 🌐 Nginx (reverse proxy)
- 🗄️ Supabase (PostgreSQL + Auth + Storage)
- 🔒 SSL/TLS (Let's Encrypt)

---

## 📦 Installation

### Prérequis

- Docker & Docker Compose
- Node.js 20+
- Compte Supabase
- Domaine configuré (app.obotcall.tech)

### 1. Clone le repository

```bash
cd ~/obotcall
git clone https://github.com/ecron24/obotcall-stack-2.git
cd obotcall-stack-2
```

### 2. Configuration

```bash
# Copier le template d'environnement
cp .env.example .env

# Éditer avec vos valeurs
nano .env
```

**Variables importantes :**

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# JWT
JWT_SECRET=votre_jwt_secret_ici

# Domaine
DOMAIN=app.obotcall.tech
```

### 3. Configuration Supabase

Exécuter les migrations SQL dans l'ordre :

```bash
# 1. Schéma public (commun)
supabase/migrations/001_schema_public.sql

# 2. Schémas des applications
supabase/migrations/002_schema_inter_app.sql
supabase/migrations/003_schema_immo_app.sql
supabase/migrations/004_schema_agent_app.sql
supabase/migrations/005_schema_assist_app.sql
```

### 4. Démarrage

```bash
# Build et démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Vérifier les services
docker-compose ps
```

---

## 🌐 Configuration Nginx

### Configuration des domaines

Fichiers dans `nginx/conf.d/` :

- `obotcall-app.conf` → app.obotcall.tech (port 3000)
- `inter-app.conf` → inter-app.app.obotcall.tech (port 3001)
- `immo-app.conf` → immo-app.app.obotcall.tech (port 3002)
- `agent-app.conf` → agent-app.app.obotcall.tech (port 3003)
- `assist-app.conf` → assist-app.app.obotcall.tech (port 3004)

### SSL/TLS avec Let's Encrypt

```bash
# Obtenir les certificats SSL
sudo certbot --nginx -d app.obotcall.tech
sudo certbot --nginx -d inter-app.app.obotcall.tech
sudo certbot --nginx -d immo-app.app.obotcall.tech
sudo certbot --nginx -d agent-app.app.obotcall.tech
sudo certbot --nginx -d assist-app.app.obotcall.tech
```

---

## 💻 Développement

### Développement local

#### Option 1 : Docker Compose (Recommandé)

```bash
docker-compose up
```

#### Option 2 : Développement manuel

**Terminal 1 - obotcall-app:**
```bash
cd apps/obotcall-app
npm install
npm run dev
# http://localhost:3000
```

**Terminal 2 - inter-app:**
```bash
cd apps/inter-app
npm install
npm run dev
# http://localhost:3001
```

**Répéter pour les autres apps...**

### Structure du projet

```
obotcall-stack-2/
├── apps/
│   ├── obotcall-app/         # Hub principal
│   ├── inter-app/            # Interventions
│   ├── immo-app/             # Immobilier
│   ├── agent-app/            # Agents IA
│   └── assist-app/           # Assistant
│
├── packages/ (optionnel)
│   ├── supabase-client/      # Client Supabase configuré
│   ├── auth/                 # Logique auth commune
│   ├── ui/                   # Composants partagés
│   └── types/                # Types TypeScript
│
├── supabase/
│   └── migrations/           # Migrations SQL
│
├── nginx/
│   └── conf.d/               # Configurations Nginx
│
├── docs/                     # Documentation
├── scripts/                  # Scripts utilitaires
├── docker-compose.yml        # Orchestration
├── .env.example              # Template env
└── README.md                 # Ce fichier
```

---

## 🔒 Sécurité

### Row Level Security (RLS)

Toutes les tables ont des politiques RLS activées :

```sql
-- Exemple : isolation par tenant
CREATE POLICY "tenant_isolation" ON inter_app.interventions
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

### Authentification JWT

- **Émis par** : Supabase Auth
- **Valide pour** : Toutes les applications
- **Contient** : user_id, tenant_id, rôles

---

## 📊 Gestion des Tenants

### Schéma `public` (commun)

```sql
-- Organisations/Clients
tenants (id, name, slug, app_type, country_code, settings)

-- Utilisateurs globaux
users (id, email, full_name)

-- Rôles par tenant
user_tenant_roles (user_id, tenant_id, role, permissions)

-- Abonnements
subscriptions (tenant_id, plan, status, features)
```

### Rôles disponibles

| Rôle    | Permissions |
|---------|-------------|
| owner   | Toutes permissions + admin |
| admin   | Gestion complète (sauf facturation) |
| manager | Créer, lire, modifier |
| user    | Créer, lire |
| viewer  | Lecture seule |

---

## 🚀 Déploiement Production

### Checklist

- [ ] Configurer .env production
- [ ] Générer secrets sécurisés (JWT, etc.)
- [ ] Configurer DNS (A records pour sous-domaines)
- [ ] Obtenir certificats SSL (Let's Encrypt)
- [ ] Exécuter migrations Supabase
- [ ] Vérifier politiques RLS
- [ ] Configurer backups DB
- [ ] Monitoring (Sentry, logs)
- [ ] Tests de charge

### Commandes utiles

```bash
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Rebuild
docker-compose up -d --build

# Logs
docker-compose logs -f [service]

# Backup
./scripts/backup.sh

# Deploy
./scripts/deploy.sh
```

---

## 📚 Documentation

- [Architecture Supabase Multi-Apps](docs/ARCHITECTURE_SUPABASE_MULTI_APPS.md)
- [Guide de déploiement](docs/DEPLOYMENT.md)
- [API Documentation](docs/API.md)
- [Guide de migration](docs/MIGRATION.md)

---

## 🆘 Support

Pour toute question :
- **Documentation** : `/docs`
- **Issues** : GitHub Issues

---

## 📄 License

Propriétaire - Tous droits réservés

---

**Créé avec ❤️ par l'équipe Obotcall**
