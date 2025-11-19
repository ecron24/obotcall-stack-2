# 🏗️ Architecture Obotcall Stack 2

## Vue d'ensemble

Architecture **multi-tenant SaaS** avec séparation Frontend/Backend pour une scalabilité maximale.

```
┌─────────────────────────────────────────────────────────────┐
│                    Traefik Reverse Proxy                     │
│                   (SSL/TLS + Load Balancing)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
        ┌───────────▼──────┐  ┌─────────▼──────────┐
        │   TECH STACK     │  │   INTER STACK      │
        │   (Site vitrine) │  │  (Interventions)   │
        │                  │  │                    │
        │  tech:3000       │  │  inter:3001        │
        │  (Next.js)       │  │  (Next.js)         │
        │                  │  │      │             │
        └──────────────────┘  │  inter-api:3011    │
                              │  (Hono API)        │
                              └────────────────────┘
                    │                   │
        ┌───────────▼──────┐  ┌─────────▼──────────┐
        │   IMMO STACK     │  │   AGENT STACK      │
        │   (Immobilier)   │  │   (Agents IA)      │
        │                  │  │                    │
        │  immo:3002       │  │  agent:3003        │
        │  (Next.js)       │  │  (Next.js)         │
        │      │           │  │      │             │
        │  immo-api:3012   │  │  agent-api:3013    │
        │  (Hono API)      │  │  (Hono API)        │
        └──────────────────┘  └────────────────────┘
                    │
                    ▼
        ┌─────────────────────┐
        │   Supabase Cloud    │
        │                     │
        │  - PostgreSQL       │
        │  - Auth             │
        │  - Storage          │
        │  - Row Level        │
        │    Security (RLS)   │
        │                     │
        │  Schémas:           │
        │  • public (commun)  │
        │  • inter_app        │
        │  • immo_app         │
        │  • agent_app        │
        └─────────────────────┘
```

## 🎯 Principes architecturaux

### 1. Séparation Frontend/Backend

**Frontend (Next.js 14)**
- Server-Side Rendering (SSR)
- Static Site Generation (SSG) où possible
- API Routes pour les opérations simples
- Appels aux backends Hono pour la logique métier

**Backend (Hono)**
- Ultra-rapide et léger
- RESTful APIs
- Validation avec Zod
- JWT Authentication
- Rate limiting
- Middleware CORS

### 2. Scalabilité

**Avantages :**
- ✅ Scale frontend et backend **indépendamment**
- ✅ Déploiement indépendant (zéro downtime)
- ✅ Performance optimale (Hono > Next.js API Routes)
- ✅ Réutilisable (mobile, desktop, CLI)
- ✅ Équipes peuvent travailler en parallèle

**Exemple de scaling :**
```bash
# 3 instances du backend, 1 du frontend
docker-compose up -d --scale immo-api=3 --scale immo=1
```

### 3. Multi-tenant avec RLS

**Isolation des données :**
- Chaque requête vérifie le `tenant_id`
- Row Level Security (RLS) sur toutes les tables
- Politiques Supabase empêchent l'accès cross-tenant
- JWT contient le tenant_id de l'utilisateur

## 📦 Stack technique

### Frontend

| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js | 14+ | Framework React (App Router) |
| TypeScript | 5.3+ | Type safety |
| Tailwind CSS | 3.4+ | Styling |
| shadcn/ui | Latest | Composants UI |
| Supabase Client | 2.39+ | Auth + DB client |

### Backend

| Technologie | Version | Usage |
|-------------|---------|-------|
| Hono | 4.0+ | Web framework ultra-rapide |
| TypeScript | 5.3+ | Type safety |
| Supabase JS | 2.39+ | Database client |
| Zod | 3.22+ | Validation schémas |
| Jose | 5.2+ | JWT handling |
| Bcrypt | 5.1+ | Password hashing |

### Infrastructure

| Service | Usage |
|---------|-------|
| Docker | Containerisation |
| Traefik | Reverse proxy + SSL |
| Supabase | PostgreSQL + Auth + Storage |
| Let's Encrypt | Certificats SSL gratuits |

## 🔐 Sécurité

### Authentification

```typescript
// Frontend (Next.js)
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token

// Appel à l'API Backend
const response = await fetch('http://immo-api:3012/api/properties', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

// Backend (Hono) - Middleware auth
const { data: { user }, error } = await supabase.auth.getUser(token)
if (error || !user) {
  return c.json({ error: 'Unauthorized' }, 401)
}
```

### Row Level Security (RLS)

```sql
-- Exemple: isolation par tenant
CREATE POLICY "tenant_isolation" ON immo_app.properties
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

### Rate Limiting

```typescript
// Backend Hono - 100 requêtes/minute par utilisateur
app.use('/api/*', rateLimiter({
  maxRequests: 100,
  windowMs: 60000
}))
```

## 📊 Flux de données

### Exemple: Créer une propriété (Immo App)

```
1. User clique "Créer" dans immo (Next.js)
   │
2. immo frontend appelle immo-api
   │
   POST http://immo-api:3012/api/properties
   Headers: { Authorization: Bearer <token> }
   Body: { name: "Appartement Paris", ... }
   │
3. immo-api vérifie le token (middleware auth)
   │
4. immo-api valide les données (Zod)
   │
5. immo-api insère dans Supabase
   │
   INSERT INTO immo_app.properties (...)
   │
6. RLS vérifie que user appartient au bon tenant
   │
7. immo-api retourne les données
   │
8. immo frontend affiche la nouvelle propriété
```

## 🚀 Déploiement

### Production

```bash
# Tout déployer
docker-compose --profile all up -d --build

# Seulement tech + inter
docker-compose up -d --build tech inter inter-api

# Avec immo
docker-compose --profile immo up -d --build

# Avec agent
docker-compose --profile agent up -d --build
```

### Environnements

| Env | Frontend | Backend API |
|-----|----------|-------------|
| **Dev** | localhost:300X | localhost:301X |
| **Prod** | *.app.obotcall.tech | (interne Docker) |

## 📈 Évolution future

### Court terme (v1.1)
- [ ] Implémenter **assist-app** + **assist-api**
- [ ] Ajouter monitoring (Prometheus + Grafana)
- [ ] Tests E2E (Playwright)
- [ ] CI/CD (GitHub Actions)

### Moyen terme (v2.0)
- [ ] WebSockets pour temps réel
- [ ] GraphQL en plus de REST
- [ ] Message queue (BullMQ/Redis)
- [ ] Caching Redis
- [ ] Multi-région

### Long terme (v3.0)
- [ ] Microservices complets
- [ ] Kubernetes (K8s)
- [ ] Service mesh (Istio)
- [ ] Event sourcing
- [ ] CQRS pattern

## 📝 Notes techniques

### Pourquoi Hono vs Next.js API Routes ?

| Critère | Hono | Next.js API Routes |
|---------|------|-------------------|
| **Performance** | ⚡ Ultra-rapide | Rapide |
| **Scalabilité** | ✅ Indépendante | ⚠️ Couplée au frontend |
| **Taille bundle** | 🪶 ~50KB | 📦 ~300KB |
| **Multi-plateforme** | ✅ Web, Mobile, CLI | ❌ Web uniquement |
| **Déploiement** | ✅ Indépendant | ⚠️ Avec frontend |
| **Équipes** | ✅ Séparées | ⚠️ Couplées |

### Conventions de code

**Nommage des routes API :**
- GET `/api/properties` - Liste
- GET `/api/properties/:id` - Détail
- POST `/api/properties` - Créer
- PATCH `/api/properties/:id` - Modifier
- DELETE `/api/properties/:id` - Supprimer

**Réponses API :**
```typescript
// Success
{ property: {...} }
{ properties: [...] }

// Error
{ error: "Message d'erreur" }
```

---

**Créé le :** 2025-11-19
**Auteur :** Obotcall Team
**Version :** 1.0.0
