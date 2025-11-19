# 🏢 Immo API - Property Management Backend

Backend API Hono pour l'application de gestion immobilière.

## 🚀 Démarrage

### Installation

```bash
npm install
```

### Développement

```bash
npm run dev
# API disponible sur http://localhost:3012
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

### Properties (Authentification requise)
- `GET /api/properties` - Liste des propriétés
- `GET /api/properties/:id` - Détail d'une propriété
- `POST /api/properties` - Créer une propriété
- `PATCH /api/properties/:id` - Modifier une propriété
- `DELETE /api/properties/:id` - Supprimer une propriété

### Contracts (Authentification requise)
- `GET /api/contracts` - Liste des contrats
- `GET /api/contracts/:id` - Détail d'un contrat
- `POST /api/contracts` - Créer un contrat

### Tenants (Authentification requise)
- `GET /api/tenants` - Liste des locataires

### Payments (Authentification requise)
- `GET /api/payments` - Liste des paiements

## 🔐 Authentification

Toutes les routes `/api/*` (sauf `/api/auth`) nécessitent un token JWT dans le header :

```
Authorization: Bearer <token>
```

## 🌐 Variables d'environnement

```env
PORT=3012
NODE_ENV=production
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
CORS_ORIGIN=http://localhost:3002,https://immo.app.obotcall.tech
```

## 🏗️ Stack technique

- **Hono** - Ultra-fast web framework
- **TypeScript** - Type safety
- **Supabase** - Database & Auth
- **Zod** - Validation
- **Jose** - JWT handling
