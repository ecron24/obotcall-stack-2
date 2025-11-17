# 🏗️ Architecture - Agent App

> Architecture technique de l'application CRM pour courtiers en assurance

---

## 📐 Vision d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                     AGENT APP (Courtier)                    │
│                                                             │
│  ┌───────────────┐        ┌──────────────┐                │
│  │   Frontend    │◄──────►│   Backend    │                │
│  │   Next.js 14  │        │   Hono API   │                │
│  └───────────────┘        └──────────────┘                │
│         │                        │                          │
│         └────────────┬───────────┘                          │
│                      ▼                                      │
│              ┌──────────────┐                               │
│              │   Supabase   │                               │
│              │  PostgreSQL  │                               │
│              │  agent_app   │                               │
│              └──────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Stack technique

### Frontend
- **Framework :** Next.js 14 (App Router)
- **Language :** TypeScript
- **Styling :** Tailwind CSS
- **Components :** Shadcn/ui
- **Forms :** React Hook Form + Zod
- **State :** TanStack Query
- **Auth :** Supabase Auth (MFA obligatoire)

### Backend
- **Framework :** Hono (edge-first)
- **Runtime :** Node.js / Bun
- **Validation :** Zod
- **ORM :** Prisma (optionnel)

### Base de données
- **Database :** Supabase PostgreSQL
- **Schema :** `agent_app` (18 tables)
- **Storage :** Supabase Storage (documents)

### Services externes
- **Email :** Resend ou SendGrid
- **PDF :** Puppeteer ou @react-pdf/renderer
- **Signature :** DocuSign ou Yousign (à prévoir)

---

## 📁 Structure des dossiers

```
apps/agent/
├── src/                          # Frontend Next.js
│   ├── app/                      # App Router
│   │   ├── (auth)/              # Routes authentifiées
│   │   │   ├── contacts/        # Gestion contacts
│   │   │   ├── quotes/          # Devis
│   │   │   ├── contracts/       # Contrats
│   │   │   ├── invoices/        # Facturation
│   │   │   ├── claims/          # Réclamations
│   │   │   ├── documents/       # Documents
│   │   │   └── dashboard/       # Tableau de bord
│   │   ├── (public)/            # Routes publiques
│   │   │   └── login/           # Connexion
│   │   └── api/                 # API routes (si needed)
│   ├── components/              # Composants React
│   │   ├── ui/                  # Composants UI (shadcn)
│   │   ├── contacts/            # Composants contacts
│   │   ├── quotes/              # Composants devis
│   │   ├── contracts/           # Composants contrats
│   │   ├── forms/               # Formulaires dynamiques
│   │   └── shared/              # Composants partagés
│   ├── lib/                     # Utilitaires
│   │   ├── supabase/           # Client Supabase
│   │   ├── utils/              # Helpers
│   │   ├── hooks/              # Custom hooks
│   │   └── validations/        # Schémas Zod
│   └── types/                   # Types TypeScript
│       ├── database.types.ts   # Types générés Supabase
│       └── custom.types.ts     # Types custom
├── agent-api/                   # Backend Hono
│   ├── src/
│   │   ├── routes/             # Routes API
│   │   │   ├── contacts.ts
│   │   │   ├── quotes.ts
│   │   │   ├── contracts.ts
│   │   │   ├── invoices.ts
│   │   │   └── claims.ts
│   │   ├── services/           # Logique métier
│   │   │   ├── pdf-generator.ts
│   │   │   ├── email-sender.ts
│   │   │   └── discount-calculator.ts
│   │   ├── middleware/         # Middlewares
│   │   │   ├── auth.ts
│   │   │   └── tenant.ts
│   │   └── utils/              # Utilitaires
│   ├── package.json
│   └── tsconfig.json
├── docs/                        # Documentation
│   ├── ARCHITECTURE.md         # Ce fichier
│   ├── SCHEMA.md               # Schéma SQL
│   └── API.md                  # Documentation API (à venir)
├── package.json
├── next.config.js
├── tailwind.config.ts
└── README.md
```

---

## 🔐 Sécurité & Authentification

### 1. Authentification

**Provider :** Supabase Auth

**Flow :**
```
1. Login (email + password)
2. MFA (TOTP obligatoire)
3. Session JWT
4. Refresh token
```

**Code exemple :**
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Login avec MFA
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
})

// Vérifier MFA
const { data: mfaData } = await supabase.auth.mfa.verify({
  factorId,
  challengeId,
  code
})
```

### 2. Multi-tenant Isolation

**Méthode :** RLS (Row Level Security)

**Principe :**
```sql
-- Fonction helper
CREATE FUNCTION get_current_user_tenant_ids()
RETURNS uuid[] AS $$
  SELECT ARRAY_AGG(tenant_id)
  FROM public.user_tenant_roles
  WHERE user_id = auth.uid()
    AND is_active = true;
$$;

-- Policy sur chaque table
CREATE POLICY tenant_isolation ON agent_app.{table}
  FOR ALL
  USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));
```

### 3. Permissions

**Rôles :**
- `owner` - Propriétaire du cabinet
- `admin` - Administrateur
- `broker` - Courtier standard
- `assistant` - Assistant(e)
- `readonly` - Lecture seule

**Gestion :**
```typescript
// Middleware tenant
export async function requireTenant(c: Context, next: Next) {
  const user = c.get('user')
  const tenantId = c.req.param('tenantId')

  const { data: role } = await supabase
    .from('user_tenant_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!role) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  c.set('role', role)
  await next()
}
```

---

## 📊 Data Flow

### 1. Création d'un devis

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────►│ Frontend │────►│ Backend  │────►│   DB     │
│ (Broker) │     │ Next.js  │     │   Hono   │     │ Supabase │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                 │                 │                 │
     │ 1. Remplit      │                 │                 │
     │    formulaire   │                 │                 │
     │                 │                 │                 │
     │◄────────────────┤                 │                 │
     │                 │                 │                 │
     │ 2. Submit       │                 │                 │
     ├────────────────►│ 3. POST /quotes │                 │
     │                 ├────────────────►│ 4. INSERT       │
     │                 │                 ├────────────────►│
     │                 │                 │                 │
     │                 │                 │ 5. Auto-number  │
     │                 │                 │    DEV-2025-... │
     │                 │                 │◄────────────────┤
     │                 │ 6. Response     │                 │
     │                 │◄────────────────┤                 │
     │ 7. Redirect     │                 │                 │
     │◄────────────────┤                 │                 │
     │                 │                 │                 │
```

### 2. Signature de contrat (auto-promotion)

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Frontend │────►│   DB     │────►│ Trigger  │
│          │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘
     │                 │                 │
     │ INSERT          │                 │
     │   contract      │                 │
     ├────────────────►│                 │
     │                 │ AFTER INSERT    │
     │                 ├────────────────►│
     │                 │                 │
     │                 │ UPDATE contact  │
     │                 │ status='client' │
     │                 │◄────────────────┤
     │                 │                 │
```

---

## 🎨 UI/UX Patterns

### 1. Formulaires dynamiques

**Principe :** Formulaires adaptés selon le type d'assurance

```typescript
// components/forms/DynamicForm.tsx
interface FormField {
  name: string
  type: 'text' | 'number' | 'select' | 'date'
  label: string
  required: boolean
  condition?: (values: any) => boolean
}

const autoFormFields: FormField[] = [
  {
    name: 'vehicle.brand',
    type: 'select',
    label: 'Marque',
    required: true
  },
  {
    name: 'vehicle.model',
    type: 'text',
    label: 'Modèle',
    required: true
  },
  {
    name: 'vehicle.year',
    type: 'number',
    label: 'Année',
    required: true
  },
  // Champ conditionnel
  {
    name: 'additional_driver',
    type: 'text',
    label: 'Conducteur additionnel',
    required: false,
    condition: (values) => values.hasAdditionalDriver
  }
]
```

### 2. Tableau comparatif (Devis)

```typescript
// components/quotes/ComparisonTable.tsx
interface QuoteItem {
  company: Company
  product: Product
  annual_premium: number
  monthly_premium: number
  guarantees: Guarantee[]
}

// Affichage max 3 colonnes (selon besoins)
<ComparisonTable items={quoteItems} />
```

### 3. Dashboard widgets

```typescript
// components/dashboard/Widget.tsx
<DashboardGrid>
  <TasksWidget />           {/* Tâches du jour */}
  <AppointmentsWidget />    {/* Rendez-vous */}
  <RenewalsWidget />        {/* Contrats à renouveler */}
  <InvoicesWidget />        {/* Factures impayées */}
  <ClaimsWidget />          {/* Réclamations urgentes */}
</DashboardGrid>
```

---

## 📧 Intégrations

### 1. Emails (Resend)

```typescript
// services/email-sender.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendQuoteEmail(
  contact: Contact,
  quote: Quote,
  attachments: Attachment[]
) {
  const { data, error } = await resend.emails.send({
    from: 'courtier@domain.com',
    to: contact.email,
    subject: `Votre devis ${quote.quote_number}`,
    html: renderQuoteTemplate(quote),
    attachments
  })

  // Enregistrer dans emails table
  await supabase.from('emails').insert({
    contact_id: contact.id,
    quote_id: quote.id,
    email_type: 'quote_sent',
    subject: `Votre devis ${quote.quote_number}`,
    sent_at: new Date()
  })
}
```

### 2. Génération PDF

```typescript
// services/pdf-generator.ts
import { pdf } from '@react-pdf/renderer'

export async function generateQuotePDF(quote: Quote) {
  const document = <QuotePDFTemplate quote={quote} />
  const blob = await pdf(document).toBlob()

  // Upload vers Supabase Storage
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(`quotes/${quote.id}.pdf`, blob)

  return data.path
}
```

### 3. Signature électronique (à prévoir)

```typescript
// services/signature.ts
import { YousignClient } from '@yousign/client'

export async function createSignatureRequest(
  document: Document,
  signers: Contact[]
) {
  const yousign = new YousignClient(process.env.YOUSIGN_API_KEY)

  const signature = await yousign.createSignatureRequest({
    documentUrl: document.file_path,
    signers: signers.map(s => ({
      email: s.email,
      firstName: s.first_name,
      lastName: s.last_name
    }))
  })

  return signature
}
```

---

## 🔄 Workflows automatiques

### 1. Tâches de rappel automatiques

```sql
-- Cron job (pg_cron)
SELECT cron.schedule(
  'create-renewal-reminders',
  '0 2 * * *',  -- Tous les jours à 2h
  $$
  INSERT INTO agent_app.tasks (
    tenant_id,
    contract_id,
    title,
    task_type,
    priority,
    status,
    due_date
  )
  SELECT
    c.tenant_id,
    c.id,
    'Renouvellement contrat ' || c.contract_number,
    'renewal_reminder',
    'high',
    'todo',
    c.renewal_date - INTERVAL '180 days'
  FROM agent_app.contracts c
  WHERE c.renewal_date BETWEEN CURRENT_DATE + INTERVAL '180 days'
    AND CURRENT_DATE + INTERVAL '181 days'
    AND c.status = 'active'
    AND c.deleted_at IS NULL;
  $$
);
```

### 2. Suppression RGPD automatique

```sql
-- Cron job pour anonymisation prospects
SELECT cron.schedule(
  'rgpd-cleanup',
  '0 3 * * 0',  -- Tous les dimanches à 3h
  $$
  UPDATE agent_app.contacts
  SET
    first_name = 'ANONYMIZED',
    last_name = 'ANONYMIZED',
    email = NULL,
    mobile_phone = 'DELETED',
    deleted_at = now(),
    deleted_by = NULL
  WHERE status = 'prospect'
    AND updated_at < now() - interval '3 years'
    AND deleted_at IS NULL;
  $$
);
```

---

## 🧪 Tests

### Structure

```
apps/agent/
├── __tests__/
│   ├── unit/              # Tests unitaires
│   │   ├── utils/
│   │   └── services/
│   ├── integration/       # Tests d'intégration
│   │   └── api/
│   └── e2e/              # Tests end-to-end
│       └── scenarios/
```

### Stack de tests

- **Unit :** Vitest
- **Integration :** Vitest + Supertest
- **E2E :** Playwright

---

## 🚀 Déploiement

### Environnements

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Development  │───►│   Staging    │───►│ Production   │
└──────────────┘    └──────────────┘    └──────────────┘
     Local            Preview             Live
```

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy Agent App

on:
  push:
    branches: [main]
    paths:
      - 'apps/agent/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: vercel/action@v2
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          project-name: agent-app
```

---

## 📈 Monitoring

### Métriques clés

- Taux de conversion prospect → client
- Temps moyen de création devis
- Factures impayées
- Réclamations en cours
- Documents expirés

### Outils

- **Analytics :** Vercel Analytics
- **Errors :** Sentry
- **Logs :** Supabase Logs
- **Performance :** Lighthouse CI

---

**Date de création :** 2025-11-17
**Version :** 1.0
**Statut :** 🚧 En développement
