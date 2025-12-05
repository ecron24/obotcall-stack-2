# Configuration Supabase pour Inter-App

## Vue d'ensemble

Inter-App utilise Supabase comme backend (base de données PostgreSQL + authentification) avec un schéma dédié `inter_app` pour le système multi-métiers.

## Prérequis

1. Un compte Supabase (gratuit sur [supabase.com](https://supabase.com))
2. Un projet Supabase créé

## Configuration

### 1. Variables d'environnement

Créez un fichier `.env.local` basé sur `.env.example` :

```bash
cp .env.example .env.local
```

Remplissez les variables :

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Où trouver ces valeurs ?**
- Allez dans votre projet Supabase
- Settings > API
- Copiez `Project URL` et `anon public`

### 2. Schéma de base de données

Le schéma `inter_app` doit être créé dans Supabase. Exécutez les migrations suivantes :

#### Migration 001 - Schéma de base

```sql
-- Créer le schéma inter_app
CREATE SCHEMA IF NOT EXISTS inter_app;

-- Activer Row Level Security
ALTER DEFAULT PRIVILEGES IN SCHEMA inter_app GRANT ALL ON TABLES TO authenticated;
```

#### Migration 002 - Tables principales

Voir `/supabase/migrations/002_create_tables.sql` dans delmas-app pour la structure complète.

Les tables principales sont :
- `users` : Utilisateurs et techniciens
- `business_types` : Types de métiers (pisciniste, plombier, etc.)
- `clients` : Clients
- `prospects` : Prospects
- `interventions` : Interventions
- `intervention_types` : Types d'intervention par métier
- `invoices` : Factures
- `products` : Produits

### 3. Authentification

Inter-App utilise Supabase Auth avec les cookies pour gérer l'authentification.

Les helpers sont dans :
- `/lib/supabase/client.ts` : Pour les composants client
- `/lib/supabase/server.ts` : Pour les Server Components et API Routes

### 4. Server Actions

Les opérations de base de données utilisent les Server Actions Next.js 14 :

- `/lib/actions/stats.ts` : Statistiques dashboard
- `/lib/actions/interventions.ts` : CRUD interventions
- `/lib/actions/clients.ts` : CRUD clients
- `/lib/actions/prospects.ts` : CRUD prospects
- `/lib/actions/invoices.ts` : CRUD factures

## Utilisation

### Dans un composant client

```tsx
'use client'

import { getDashboardStats } from '@/lib/actions/stats'

export default function Dashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getDashboardStats().then(setStats)
  }, [])

  return <div>{/* Afficher les stats */}</div>
}
```

### Dans un Server Component

```tsx
import { getDashboardStats } from '@/lib/actions/stats'

export default async function Dashboard() {
  const stats = await getDashboardStats()

  return <div>{/* Afficher les stats */}</div>
}
```

## Row Level Security (RLS)

Activez RLS sur toutes les tables et créez des policies pour sécuriser l'accès multi-tenant :

```sql
-- Exemple pour la table clients
ALTER TABLE inter_app.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clients"
  ON inter_app.clients
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients"
  ON inter_app.clients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Migration depuis delmas-app

Si vous migrez depuis delmas-app :

1. Exportez les données du schéma `piscine_delmas_public`
2. Adaptez les références de schéma
3. Importez dans `inter_app`
4. Ajoutez la colonne `business_type_id` aux tables nécessaires

## Troubleshooting

### Erreur : "relation does not exist"

Le schéma ou les tables n'existent pas dans Supabase. Exécutez les migrations.

### Erreur : "No API key found"

Les variables d'environnement ne sont pas configurées. Vérifiez `.env.local`.

### Erreur : "new row violates row-level security policy"

Les policies RLS sont mal configurées. Vérifiez les policies dans Supabase Dashboard > Authentication > Policies.

## Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
