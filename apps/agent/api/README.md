# 🤖 Agent API - AI Agents Orchestration Backend

Backend API Hono pour l'orchestration d'agents IA.

## 🚀 Démarrage

### Installation

```bash
npm install
```

### Développement

```bash
npm run dev
# API disponible sur http://localhost:3013
```

### Production

```bash
npm run build
npm start
```

## 📋 Endpoints

### Health Check
- `GET /health` - Health check de l'API

### Auth
- `POST /api/auth/validate` - Validation du token JWT

### Agents (Authentification requise)
- `GET /api/agents` - Liste des agents
- `GET /api/agents/:id` - Détail d'un agent
- `POST /api/agents` - Créer un agent
- `PATCH /api/agents/:id` - Modifier un agent
- `DELETE /api/agents/:id` - Supprimer un agent

### Workflows (Authentification requise)
- `GET /api/workflows` - Liste des workflows
- `GET /api/workflows/:id` - Détail d'un workflow
- `POST /api/workflows` - Créer un workflow

### Executions (Authentification requise)
- `GET /api/executions` - Liste des exécutions
- `GET /api/executions/:id` - Détail d'une exécution

### Prompts (Authentification requise)
- `GET /api/prompts` - Liste des prompts

## 🔐 Authentification

Toutes les routes `/api/*` (sauf `/api/auth`) nécessitent un token JWT dans le header :

```
Authorization: Bearer <token>
```

## 🌐 Variables d'environnement

```env
PORT=3013
NODE_ENV=production
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
CORS_ORIGIN=http://localhost:3003,https://agent.app.obotcall.tech
```

## 🏗️ Stack technique

- **Hono** - Ultra-fast web framework
- **TypeScript** - Type safety
- **Supabase** - Database & Auth
- **Zod** - Validation
- **Jose** - JWT handling
