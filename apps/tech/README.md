# ObotCall Tech - Site Marketing

Site vitrine et plateforme d'authentification/paiement pour l'écosystème ObotCall.

## 🚀 Fonctionnalités

- ✅ Site marketing responsive (mobile-first)
- ✅ Authentification Supabase (login/signup)
- ✅ Intégration Stripe pour paiements récurrents
- ✅ Sélection de produits (Inter, Agent, Immo)
- ✅ Gestion des abonnements via webhooks
- ✅ Pages légales (CGU, CGV, confidentialité, mentions légales)

## 📋 Prérequis

- Node.js 18+
- Compte Supabase
- Compte Stripe

## ⚙️ Configuration

### 1. Installer les dépendances

```bash
npm install
```

### 2. Variables d'environnement

Créer un fichier `.env.local` à partir de `.env.example`:

```bash
cp .env.example .env.local
```

Remplir les variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# URLs des apps (après paiement)
NEXT_PUBLIC_INTER_APP_URL=http://localhost:3001
NEXT_PUBLIC_AGENT_APP_URL=http://localhost:3000
NEXT_PUBLIC_IMMO_APP_URL=http://localhost:3002

# Price IDs Stripe (créer dans Stripe Dashboard)
STRIPE_INTER_STARTER_PRICE_ID=price_xxx
STRIPE_INTER_PRO_PRICE_ID=price_xxx
STRIPE_AGENT_SOLO_PRICE_ID=price_xxx
STRIPE_AGENT_TEAM_PRICE_ID=price_xxx
STRIPE_IMMO_STARTER_PRICE_ID=price_xxx
STRIPE_IMMO_PRO_PRICE_ID=price_xxx
STRIPE_IMMO_ENTERPRISE_PRICE_ID=price_xxx
```

### 3. Configuration Supabase

#### Créer la table `subscriptions`

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  product TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);
```

### 4. Configuration Stripe

#### Créer les produits et prix

Dans le Dashboard Stripe (https://dashboard.stripe.com):

1. **Produits → Créer un produit**
2. Créer les produits:
   - **Inter Starter** (29€/mois récurrent)
   - **Inter Pro** (99€/mois récurrent)
   - **Agent Solo** (49€/mois récurrent)
   - **Agent Team** (39€/utilisateur/mois récurrent)
   - **Immo Starter** (10€ paiement unique)
   - **Immo Pro** (50€ paiement unique)
   - **Immo Enterprise** (200€ paiement unique)

3. Copier les Price IDs dans `.env.local`

#### Configurer les webhooks

1. **Développeurs → Webhooks → Ajouter un endpoint**
2. URL: `https://votre-domaine.com/api/stripe-webhook`
3. Événements à écouter:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

4. Copier le **Webhook Secret** dans `.env.local`

#### Test local avec Stripe CLI

```bash
# Installer Stripe CLI
brew install stripe/stripe-brew/stripe

# Se connecter
stripe login

# Écouter les webhooks en local
stripe listen --forward-to localhost:3003/api/stripe-webhook

# Copier le webhook secret dans .env.local
```

## 🏃 Démarrage

### Développement

```bash
npm run dev
```

Site accessible sur `http://localhost:3003`

### Production

```bash
npm run build
npm start
```

## 📁 Structure

```
apps/tech/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── create-checkout-session/  # Création session Stripe
│   │   │   └── stripe-webhook/           # Gestion webhooks
│   │   ├── checkout/                     # Pages checkout
│   │   │   ├── page.tsx                  # Redirection Stripe
│   │   │   └── success/                  # Page succès
│   │   ├── login/                        # Authentification
│   │   ├── signup/                       # Inscription
│   │   ├── select-product/               # Sélection produit/plan
│   │   ├── page.tsx                      # Homepage
│   │   ├── produits/                     # Page produits
│   │   ├── tarifs/                       # Page tarifs
│   │   ├── contact/                      # Page contact
│   │   └── [legal pages]/                # CGU, CGV, etc.
│   ├── components/
│   │   ├── layout/                       # Header, Footer
│   │   └── ui/                           # shadcn components
│   └── lib/
│       └── supabase/                     # Client Supabase
└── .env.example
```

## 🔄 Flow utilisateur

1. **Découverte** → Homepage, Produits, Tarifs
2. **Inscription** → `/signup` ou `/login`
3. **Sélection** → `/select-product` (choix produit + plan)
4. **Paiement** → `/checkout` → Redirection Stripe
5. **Confirmation** → `/checkout/success` → Redirection vers l'app
6. **Webhook** → Stripe envoie événement → Enregistrement dans Supabase

## 🔐 Sécurité

- Authentification via Supabase Auth (JWT)
- Paiements sécurisés via Stripe
- Webhooks signés (vérification signature)
- RLS activé sur Supabase
- Variables d'environnement pour secrets

## 📝 Notes importantes

- Les Price IDs doivent être configurés dans `.env.local`
- Pour la production, utiliser les clés Stripe **live** (pas test)
- Configurer les URL de redirection en production
- Tester les webhooks avec `stripe listen` en local
- Vérifier que la table `subscriptions` existe dans Supabase

## 🐛 Troubleshooting

**Webhook ne fonctionne pas:**
- Vérifier que `STRIPE_WEBHOOK_SECRET` est correct
- Tester avec `stripe listen --forward-to ...`
- Vérifier les logs dans Stripe Dashboard

**Auth ne fonctionne pas:**
- Vérifier les clés Supabase
- Vérifier que l'utilisateur a confirmé son email
- Vérifier les politiques RLS

**Redirection après paiement échoue:**
- Vérifier les URLs des apps dans `.env.local`
- Vérifier que les apps tournent sur les bons ports
