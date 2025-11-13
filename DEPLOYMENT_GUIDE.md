# 📋 Guide de Déploiement - Obotcall Stack 2

Ce guide vous accompagne dans le déploiement complet de la plateforme Obotcall Stack 2 sur votre VPS.

## 📑 Table des Matières

1. [Prérequis](#prérequis)
2. [Configuration du VPS](#configuration-du-vps)
3. [Installation](#installation)
4. [Configuration Supabase](#configuration-supabase)
5. [Configuration DNS](#configuration-dns)
6. [Certificats SSL](#certificats-ssl)
7. [Déploiement](#déploiement)
8. [Vérification](#vérification)
9. [Maintenance](#maintenance)

---

## ✅ Prérequis

### Sur votre VPS

- **OS** : Ubuntu 20.04+ ou Debian 11+
- **RAM** : Minimum 4 GB (8 GB recommandé)
- **CPU** : Minimum 2 cores
- **Disque** : Minimum 50 GB
- **Accès** : SSH avec sudo

### Logiciels requis

- Docker & Docker Compose
- Git
- Nginx
- Certbot (Let's Encrypt)

### Comptes nécessaires

- Compte Supabase (gratuit)
- Domaine configuré (app.obotcall.tech)
- Accès aux DNS de votre domaine

---

## 🖥️ Configuration du VPS

### 1. Connexion SSH

```bash
ssh ronan@srv770425.obotcall.tech
```

### 2. Mise à jour du système

```bash
sudo apt update
sudo apt upgrade -y
```

### 3. Installation de Docker

```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Vérification
docker --version
docker-compose --version
```

### 4. Installation de Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 5. Installation de Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

---

## 📦 Installation

### 1. Cloner le repository

```bash
cd ~/obotcall/obotcall-stack-2

# Initialiser Git si ce n'est pas déjà fait
git init
git remote add origin https://github.com/ecron24/obotcall-stack-2.git

# Pull depuis GitHub
git pull origin main
```

### 2. Structure actuelle

Vous devriez avoir :

```
~/obotcall/obotcall-stack-2/
├── apps/
│   └── inter-app/          ✅ (déjà présent)
├── packages/               📦 (à créer si nécessaire)
├── supabase/               🗄️ (à créer)
├── nginx/                  🌐 (à créer)
├── docs/                   📚 (à créer)
├── scripts/                🔧 (à créer)
├── docker-compose.yml      🐳
├── .env                    🔐
└── README.md              📖
```

### 3. Configuration de l'environnement

```bash
# Copier le template
cp .env.example .env

# Éditer avec vos valeurs
nano .env
```

**Variables à configurer :**

```env
# Supabase (depuis votre dashboard Supabase)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# JWT Secret (générer avec: openssl rand -base64 32)
JWT_SECRET=votre_secret_ici
NEXTAUTH_SECRET=votre_secret_ici

# Domaine
DOMAIN=app.obotcall.tech
```

### 4. Rendre les scripts exécutables

```bash
chmod +x scripts/*.sh
```

---

## 🗄️ Configuration Supabase

### 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Choisissez la région (Europe West recommandé)
4. Notez l'URL et les clés API

### 2. Exécuter les migrations SQL

Dans le **SQL Editor** de Supabase, exécutez dans l'ordre :

#### Migration 1 : Schéma public (commun)

```sql
-- Fichier: supabase/migrations/001_schema_public.sql
-- Copier et exécuter tout le contenu
```

Cela crée :
- Table `tenants` (organisations)
- Table `users` (utilisateurs)
- Table `user_tenant_roles` (rôles)
- Table `countries` (pays)
- Table `domains` (domaines personnalisés)
- Table `subscriptions` (abonnements)
- Politiques RLS

#### Migration 2-5 : Schémas des applications

```sql
-- 002_schema_inter_app.sql
-- 003_schema_immo_app.sql
-- 004_schema_agent_app.sql
-- 005_schema_assist_app.sql
```

### 3. Activer l'authentification

Dans **Authentication > Settings** :

- ✅ Activer Email Auth
- ✅ Configurer les URL de redirection :
  - `https://app.obotcall.tech/auth/callback`
  - `https://inter-app.app.obotcall.tech/auth/callback`
  - etc.

---

## 🌐 Configuration DNS

Configurer les enregistrements DNS suivants :

| Type | Nom | Valeur | TTL |
|------|-----|--------|-----|
| A | app.obotcall.tech | IP_VPS | 3600 |
| A | inter-app.app.obotcall.tech | IP_VPS | 3600 |
| A | immo-app.app.obotcall.tech | IP_VPS | 3600 |
| A | agent-app.app.obotcall.tech | IP_VPS | 3600 |
| A | assist-app.app.obotcall.tech | IP_VPS | 3600 |

**Vérification :**

```bash
# Attendre la propagation DNS (5-30 min)
nslookup app.obotcall.tech
nslookup inter-app.app.obotcall.tech
```

---

## 🔒 Certificats SSL

### Configuration Nginx

```bash
# Copier les configurations
sudo cp nginx/nginx.conf /etc/nginx/
sudo cp nginx/conf.d/*.conf /etc/nginx/conf.d/

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

### Obtenir les certificats SSL

```bash
# Certificat pour app.obotcall.tech
sudo certbot --nginx -d app.obotcall.tech

# Certificats pour les sous-domaines
sudo certbot --nginx -d inter-app.app.obotcall.tech
sudo certbot --nginx -d immo-app.app.obotcall.tech
sudo certbot --nginx -d agent-app.app.obotcall.tech
sudo certbot --nginx -d assist-app.app.obotcall.tech

# Vérifier le renouvellement automatique
sudo certbot renew --dry-run
```

---

## 🚀 Déploiement

### Option 1 : Script automatique

```bash
./scripts/deploy.sh
```

### Option 2 : Manuel

```bash
# Build des images
docker-compose build

# Démarrer les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f
```

### Démarrer seulement certaines apps

```bash
# Seulement obotcall-app et inter-app
docker-compose up -d obotcall-app inter-app

# Avec immo-app
docker-compose --profile immo up -d

# Toutes les apps
docker-compose --profile all up -d
```

---

## ✅ Vérification

### 1. Vérifier les conteneurs

```bash
docker-compose ps
```

Tous les services doivent être "Up" :

```
NAME                COMMAND                  SERVICE             STATUS
obotcall-app        "docker-entrypoint.s…"   obotcall-app        Up
inter-app           "docker-entrypoint.s…"   inter-app           Up
inter-api           "node dist/index.js"     inter-api           Up
nginx-proxy         "/docker-entrypoint.…"   nginx               Up
```

### 2. Tester les URLs

```bash
# Test local
curl http://localhost:3000
curl http://localhost:3001

# Test public
curl https://app.obotcall.tech
curl https://inter-app.app.obotcall.tech
```

### 3. Vérifier les logs

```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f obotcall-app
docker-compose logs -f inter-app
```

### 4. Health checks

Chaque application expose un endpoint `/api/health` :

```bash
curl https://app.obotcall.tech/api/health
curl https://inter-app.app.obotcall.tech/api/health
```

---

## 🛠️ Maintenance

### Mise à jour du code

```bash
cd ~/obotcall/obotcall-stack-2
git pull origin main
docker-compose up -d --build
```

### Voir les logs

```bash
# En temps réel
docker-compose logs -f

# Dernières lignes
docker-compose logs --tail=100
```

### Redémarrer un service

```bash
docker-compose restart obotcall-app
docker-compose restart inter-app
```

### Backup

```bash
./scripts/backup.sh
```

Les backups sont sauvegardés dans `~/backups/obotcall-stack-2/`

### Restauration

```bash
cd ~/obotcall/obotcall-stack-2
tar -xzf ~/backups/obotcall-stack-2/obotcall-backup-YYYYMMDD_HHMMSS.tar.gz
docker-compose up -d --build
```

### Monitoring

```bash
# Utilisation CPU/RAM
docker stats

# Espace disque
df -h
du -sh ~/obotcall/obotcall-stack-2

# Logs Nginx
sudo tail -f /var/log/nginx/obotcall-app-access.log
sudo tail -f /var/log/nginx/inter-app-access.log
```

---

## 🐛 Dépannage

### Problème : Service ne démarre pas

```bash
# Voir les logs
docker-compose logs [service]

# Reconstruire l'image
docker-compose build --no-cache [service]
docker-compose up -d [service]
```

### Problème : Erreur de connexion Supabase

Vérifiez :
1. Les clés dans `.env` sont correctes
2. Les URL Supabase sont correctes
3. Les politiques RLS sont activées

### Problème : Certificat SSL invalide

```bash
# Renouveler
sudo certbot renew --force-renewal

# Recharger Nginx
sudo systemctl reload nginx
```

### Problème : Domaine inaccessible

1. Vérifier la propagation DNS : `nslookup app.obotcall.tech`
2. Vérifier Nginx : `sudo nginx -t`
3. Vérifier les logs : `sudo tail -f /var/log/nginx/error.log`

---

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

---

## 🆘 Support

En cas de problème :
1. Consultez les logs : `docker-compose logs`
2. Vérifiez la configuration : `.env`, `docker-compose.yml`
3. Consultez la documentation dans `docs/`

---

**Bonne chance avec votre déploiement ! 🚀**
