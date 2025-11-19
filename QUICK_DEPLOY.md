# 🚀 Guide de Déploiement Rapide - Obotcall Stack 2

## ✅ Ce qui a été préparé

### Applications prêtes pour le déploiement :
- ✅ **tech** (Site vitrine) - Port 3000 → `app.obotcall.tech`
- ✅ **inter** (Interventions) - Port 3001 → `inter.app.obotcall.tech`
- ✅ **inter-api** (Backend Hono) - Port 3011
- ✅ **immo** (Immobilier) - Port 3002 → `immo.app.obotcall.tech`
- ✅ **agent** (Agents IA) - Port 3003 → `agent.app.obotcall.tech`

### Ce qui a été créé :
- ✅ Dockerfiles optimisés (multi-stage builds)
- ✅ Health checks (`/api/health`) pour tous les services
- ✅ docker-compose.yml adapté aux apps existantes
- ✅ Configuration Next.js standalone mode
- ✅ .dockerignore pour builds optimisés

### Ce qui est en pause :
- ⏸️ **assist-app** (Assistant personnel) - Non implémenté pour le moment

---

## 🔧 Étapes de déploiement sur le serveur

### 1. Se connecter au serveur

```bash
ssh ronan@srv770425.obotcall.tech
cd ~/obotcall/obotcall-stack-2
```

### 2. Récupérer les derniers changements

```bash
git fetch origin
git checkout claude/review-obotcall-stack-01EXkX8F9Mi3p1nwevccEY4H
# ou fusionner dans main si validé
git checkout main
git merge claude/review-obotcall-stack-01EXkX8F9Mi3p1nwevccEY4H
```

### 3. Créer le fichier .env

```bash
# Copier le template
cp .env.example .env

# Éditer avec vos vraies valeurs
nano .env
```

**Variables critiques à configurer :**

```env
# Supabase (depuis dashboard.supabase.com)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Secrets (générer avec: openssl rand -base64 32)
JWT_SECRET=votre_secret_genere_ici
NEXTAUTH_SECRET=votre_secret_genere_ici

# Stripe (si utilisé pour tech app)
STRIPE_PUBLIC_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 4. Vérifier le réseau Docker Traefik

Le docker-compose.yml utilise le réseau `docker_oppsys-network` pour Traefik.

```bash
# Vérifier que le réseau existe
docker network ls | grep oppsys

# Si le réseau n'existe pas, le créer
docker network create docker_oppsys-network
```

### 5. Build et démarrage des services

#### Option A : Démarrer toutes les apps

```bash
docker-compose --profile all up -d --build
```

#### Option B : Démarrer seulement certaines apps

```bash
# Tech + Inter seulement (sans profiles)
docker-compose up -d --build tech inter inter-api

# Avec Immo
docker-compose --profile immo up -d --build

# Avec Agent
docker-compose --profile agent up -d --build
```

### 6. Vérifier les conteneurs

```bash
# Status des conteneurs
docker-compose ps

# Logs en temps réel
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f tech
docker-compose logs -f inter
docker-compose logs -f inter-api
```

### 7. Vérifier les health checks

```bash
# Via Traefik (URLs publiques)
curl https://app.obotcall.tech/api/health
curl https://inter.app.obotcall.tech/api/health
curl https://immo.app.obotcall.tech/api/health
curl https://agent.app.obotcall.tech/api/health

# Directement sur les conteneurs (ports internes)
docker exec obotcall-tech curl http://localhost:3000/api/health
docker exec obotcall-inter curl http://localhost:3001/api/health
docker exec obotcall-inter-api curl http://localhost:3011/health
```

---

## 📊 Configuration Traefik

Les labels Traefik sont déjà configurés dans le docker-compose.yml :

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.obotcall-tech.rule=Host(`app.obotcall.tech`)"
  - "traefik.http.routers.obotcall-tech.entrypoints=websecure"
  - "traefik.http.routers.obotcall-tech.tls.certresolver=letsencrypt"
```

**Assurez-vous que :**
- ✅ Traefik est déjà en cours d'exécution
- ✅ Les domaines DNS pointent vers le serveur
- ✅ Les certificats SSL sont configurés (Let's Encrypt)

---

## 🗄️ Configuration Supabase

### Migrations SQL à exécuter

Dans le **SQL Editor** de Supabase Dashboard, exécutez dans l'ordre :

1. **Schéma public** (commun à toutes les apps)
   ```sql
   -- Contenu de: supabase/migrations/001_schema_public.sql
   ```

2. **Schéma Inter App**
   ```sql
   -- Contenu de: supabase/migrations/002_schema_inter_app.sql
   ```

3. **Schéma Immo App**
   ```sql
   -- Contenu de: supabase/migrations/003_schema_immo_app.sql
   ```

4. **Schéma Agent App**
   ```sql
   -- Contenu de: supabase/migrations/004_schema_agent_app.sql
   ```

### Configuration Auth Supabase

Dans **Authentication > Settings** :

**URL de redirection autorisées :**
- `https://app.obotcall.tech/auth/callback`
- `https://inter.app.obotcall.tech/auth/callback`
- `https://immo.app.obotcall.tech/auth/callback`
- `https://agent.app.obotcall.tech/auth/callback`

**Site URL :**
- `https://app.obotcall.tech`

---

## 🔍 Dépannage

### Les conteneurs ne démarrent pas

```bash
# Voir les logs d'erreur
docker-compose logs

# Rebuild sans cache
docker-compose build --no-cache
docker-compose up -d
```

### Erreur "network not found"

```bash
# Créer le réseau Traefik
docker network create docker_oppsys-network
```

### Erreur de connexion Supabase

Vérifiez :
1. Les clés Supabase dans `.env`
2. Les politiques RLS sont activées
3. Les migrations SQL ont été exécutées

### Port déjà utilisé

```bash
# Voir les ports utilisés
sudo netstat -tlnp | grep :3000

# Arrêter le processus conflictuel
docker stop <container-id>
```

---

## 📝 Commandes utiles

```bash
# Redémarrer un service
docker-compose restart tech

# Arrêter tous les services
docker-compose down

# Voir l'utilisation des ressources
docker stats

# Nettoyer les images inutilisées
docker system prune -a
```

---

## 🎯 Prochaines étapes

1. ✅ Valider que toutes les apps sont accessibles
2. ✅ Tester l'authentification Supabase
3. ✅ Vérifier les endpoints API
4. ✅ Configurer le monitoring (logs, métriques)
5. ⏳ Implémenter assist-app plus tard

---

## 📞 Support

En cas de problème :
1. Vérifiez les logs : `docker-compose logs -f`
2. Consultez `DEPLOYMENT_GUIDE.md`
3. Vérifiez la config Traefik
4. Vérifiez les DNS et certificats SSL

---

**Déploiement préparé le :** 2025-11-19
**Branch :** `claude/review-obotcall-stack-01EXkX8F9Mi3p1nwevccEY4H`
**Status :** ✅ Prêt pour le déploiement
