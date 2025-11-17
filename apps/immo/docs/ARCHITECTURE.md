# 🏗️ Architecture - Immo App

> Architecture technique de l'application de génération de baux immobiliers

---

## 📐 Vision d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                     IMMO APP (Baux)                         │
│                                                             │
│  ┌───────────────┐        ┌──────────────┐                │
│  │   Frontend    │◄──────►│   Backend    │                │
│  │   Next.js 14  │        │   Hono API   │                │
│  └───────────────┘        └──────────────┘                │
│         │                        │                          │
│         │                        ├──────►  Pandoc          │
│         │                        │        (DOCX→PDF)       │
│         │                        │                          │
│         └────────────┬───────────┘                          │
│                      ▼                                      │
│              ┌──────────────┐                               │
│              │   Supabase   │                               │
│              │  PostgreSQL  │                               │
│              │  immo_app    │                               │
│              │   Storage    │                               │
│              └──────────────┘                               │
│                      │                                      │
│                      ▼                                      │
│              ┌──────────────┐                               │
│              │     N8N      │                               │
│              │  Workflows   │                               │
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
- **Document Generation :** Pandoc (DOCX → PDF)
- **Template Engine :** Mustache / Handlebars

### Base de données
- **Database :** Supabase PostgreSQL
- **Schema :** `immo_app` (12 tables)
- **Storage :** Supabase Storage ou Cloudinary/S3

### Services externes
- **Email :** Resend ou SendGrid
- **PDF :** Pandoc
- **Workflows :** N8N
- **Paiements :** Stripe ou PayPal
- **Signature :** Yousign (à prévoir)

---

## 📁 Structure des dossiers

```
apps/immo/
├── src/                          # Frontend Next.js
│   ├── app/                      # App Router
│   │   ├── (auth)/              # Routes authentifiées
│   │   │   ├── dashboard/       # Tableau de bord
│   │   │   ├── credits/         # Gestion crédits
│   │   │   ├── leases/          # Baux générés
│   │   │   │   ├── new/         # Wizard génération
│   │   │   │   ├── [id]/        # Détail bail
│   │   │   │   └── history/     # Historique
│   │   │   ├── templates/       # Gestion templates
│   │   │   ├── parties/         # Bailleurs/locataires
│   │   │   ├── properties/      # Biens immobiliers
│   │   │   └── webhooks/        # Configuration N8N
│   │   ├── (public)/            # Routes publiques
│   │   │   └── login/           # Connexion
│   │   └── api/                 # API routes (proxy)
│   ├── components/              # Composants React
│   │   ├── ui/                  # Composants UI (shadcn)
│   │   ├── wizard/              # Wizard de génération
│   │   ├── templates/           # Composants templates
│   │   ├── credits/             # Composants crédits
│   │   ├── parties/             # Composants parties
│   │   ├── properties/          # Composants biens
│   │   └── shared/              # Composants partagés
│   ├── lib/                     # Utilitaires
│   │   ├── supabase/           # Client Supabase
│   │   ├── utils/              # Helpers
│   │   ├── hooks/              # Custom hooks
│   │   └── validations/        # Schémas Zod
│   └── types/                   # Types TypeScript
│       ├── database.types.ts   # Types générés Supabase
│       └── custom.types.ts     # Types custom
├── immo-api/                    # Backend Hono
│   ├── src/
│   │   ├── routes/             # Routes API
│   │   │   ├── credits.ts
│   │   │   ├── templates.ts
│   │   │   ├── leases.ts
│   │   │   ├── parties.ts
│   │   │   ├── properties.ts
│   │   │   └── webhooks.ts
│   │   ├── services/           # Logique métier
│   │   │   ├── template-processor.ts
│   │   │   ├── pdf-generator.ts
│   │   │   ├── credit-manager.ts
│   │   │   ├── email-sender.ts
│   │   │   └── webhook-caller.ts
│   │   ├── middleware/         # Middlewares
│   │   │   ├── auth.ts
│   │   │   └── tenant.ts
│   │   └── utils/              # Utilitaires
│   ├── templates/              # Templates DOCX
│   │   ├── FR/
│   │   │   ├── residential.docx
│   │   │   ├── commercial.docx
│   │   │   └── professional.docx
│   │   ├── BE/
│   │   ├── CH/
│   │   └── ...
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
CREATE POLICY tenant_isolation ON immo_app.{table}
  FOR ALL
  USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));
```

### 3. Permissions

**Rôles :**
- `owner` - Propriétaire
- `admin` - Administrateur
- `manager` - Gestionnaire
- `user` - Utilisateur standard
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

### 1. Génération d'un bail

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────►│ Frontend │────►│ Backend  │────►│   DB     │
│  (User)  │     │ Next.js  │     │   Hono   │     │ Supabase │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                 │                 │                 │
     │ 1. Wizard       │                 │                 │
     │    multi-étapes │                 │                 │
     │                 │                 │                 │
     │ 2. Submit       │                 │                 │
     ├────────────────►│ 3. POST /leases │                 │
     │                 ├────────────────►│ 4. Validate     │
     │                 │                 │                 │
     │                 │                 │ 5. Check credits│
     │                 │                 ├────────────────►│
     │                 │                 │◄────────────────┤
     │                 │                 │                 │
     │                 │                 │ 6. INSERT lease │
     │                 │                 ├────────────────►│
     │                 │                 │                 │
     │                 │                 │ 7. Auto-number  │
     │                 │                 │    BAIL-2025-...│
     │                 │                 │◄────────────────┤
     │                 │                 │                 │
     │                 │                 │ 8. Process DOCX │
     │                 │                 │    (Pandoc)     │
     │                 │                 │                 │
     │                 │                 │ 9. Upload PDF   │
     │                 │                 ├────────────────►│
     │                 │                 │                 │
     │                 │                 │ 10. Deduct      │
     │                 │                 │     credits     │
     │                 │                 ├────────────────►│
     │                 │                 │                 │
     │                 │                 │ 11. Trigger     │
     │                 │                 │     webhook N8N │
     │                 │                 │                 │
     │                 │ 12. Response    │                 │
     │                 │◄────────────────┤                 │
     │ 13. Download    │                 │                 │
     │◄────────────────┤                 │                 │
     │                 │                 │                 │
```

### 2. Achat de crédits

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Frontend │────►│ Backend  │────►│  Stripe  │
│          │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘
     │                 │                 │
     │ 1. Select       │                 │
     │    package      │                 │
     │                 │                 │
     │ 2. Checkout     │                 │
     ├────────────────►│ 3. Create       │
     │                 │    session      │
     │                 ├────────────────►│
     │                 │                 │
     │                 │ 4. Session URL  │
     │                 │◄────────────────┤
     │ 5. Redirect     │                 │
     │◄────────────────┤                 │
     │                 │                 │
     │ 6. Pay          │                 │
     ├────────────────────────────────►  │
     │                 │                 │
     │                 │ 7. Webhook      │
     │                 │    (payment OK) │
     │                 │◄────────────────┤
     │                 │                 │
     │                 │ 8. Add credits  │
     │                 │    to user      │
     │                 │                 │
```

---

## 🎨 UI/UX Patterns

### 1. Wizard de génération

**Principe :** Multi-étapes avec validation progressive

```typescript
// components/wizard/LeaseWizard.tsx
const steps = [
  { id: 'country', title: 'Pays' },
  { id: 'type', title: 'Type de bail' },
  { id: 'template', title: 'Template' },
  { id: 'lessor', title: 'Bailleur' },
  { id: 'lessee', title: 'Locataire' },
  { id: 'property', title: 'Bien' },
  { id: 'details', title: 'Détails' },
  { id: 'fields', title: 'Informations' },
  { id: 'review', title: 'Révision' },
  { id: 'generate', title: 'Génération' }
]

// Validation conditionnelle
const schema = useMemo(() => {
  return getSchemaForStep(currentStep, formData)
}, [currentStep, formData])
```

### 2. Formulaires dynamiques

**Principe :** Champs adaptés selon pays + type de bail

```typescript
// components/wizard/DynamicFields.tsx
interface FieldConfig {
  name: string
  type: 'text' | 'number' | 'date' | 'select' | 'currency'
  label: string
  required: boolean
  condition?: (data: FormData) => boolean
  validation?: ZodSchema
}

// Champs conditionnels
const fields: FieldConfig[] = [
  {
    name: 'commercial_activity',
    type: 'text',
    label: 'Activité commerciale',
    required: true,
    condition: (data) => data.lease_type === 'commercial'
  },
  {
    name: 'guarantor',
    type: 'text',
    label: 'Garant',
    required: false,
    condition: (data) => data.requires_guarantor
  }
]
```

### 3. Dashboard widgets

```typescript
// components/dashboard/Widget.tsx
<DashboardGrid>
  <CreditBalanceWidget />     {/* Solde de crédits */}
  <RecentLeasesWidget />      {/* Derniers baux */}
  <TemplatesWidget />         {/* Templates disponibles */}
  <StatsWidget />             {/* Statistiques */}
</DashboardGrid>
```

---

## 📧 Intégrations

### 1. Génération DOCX → PDF (Pandoc)

```typescript
// services/pdf-generator.ts
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function generatePDF(
  docxPath: string,
  outputPath: string
): Promise<string> {
  // Utiliser Pandoc pour conversion DOCX → PDF
  const command = `pandoc ${docxPath} -o ${outputPath}`

  await execAsync(command)

  return outputPath
}
```

### 2. Template Processing (Mustache)

```typescript
// services/template-processor.ts
import Mustache from 'mustache'
import { readFile, writeFile } from 'fs/promises'

export async function processTemplate(
  templatePath: string,
  data: Record<string, any>
): Promise<Buffer> {
  // Lire template DOCX
  const template = await readFile(templatePath)

  // Extraire XML du DOCX
  const xml = await extractDocxXml(template)

  // Remplacer variables avec Mustache
  const rendered = Mustache.render(xml, data)

  // Re-créer DOCX
  const docx = await createDocxFromXml(rendered)

  return docx
}
```

### 3. Emails (Resend)

```typescript
// services/email-sender.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendLeaseEmail(
  recipient: { email: string, name: string },
  lease: Lease,
  attachments: { filename: string, path: string }[]
) {
  const { data, error } = await resend.emails.send({
    from: 'baux@domain.com',
    to: recipient.email,
    subject: `Votre bail ${lease.lease_number}`,
    html: renderLeaseTemplate(lease),
    attachments: attachments.map(a => ({
      filename: a.filename,
      path: a.path
    }))
  })

  // Enregistrer dans email_history
  await supabase.from('email_history').insert({
    tenant_id: lease.tenant_id,
    recipient_email: recipient.email,
    lease_id: lease.id,
    subject: `Votre bail ${lease.lease_number}`,
    status: 'sent',
    sent_at: new Date()
  })

  return data
}
```

### 4. Webhooks N8N

```typescript
// services/webhook-caller.ts
export async function triggerWebhook(
  webhook: Webhook,
  payload: Record<string, any>
) {
  // Construire payload depuis template
  const finalPayload = interpolateTemplate(
    webhook.payload_template,
    payload
  )

  // Préparer headers
  const headers = {
    'Content-Type': 'application/json',
    ...webhook.custom_headers
  }

  // Ajouter auth si nécessaire
  if (webhook.auth_type === 'bearer') {
    headers['Authorization'] = `Bearer ${webhook.auth_credentials.token}`
  }

  const startTime = Date.now()

  try {
    const response = await fetch(webhook.webhook_url, {
      method: webhook.method,
      headers,
      body: JSON.stringify(finalPayload)
    })

    const responseTime = Date.now() - startTime

    // Logger l'appel
    await supabase.from('webhook_logs').insert({
      webhook_id: webhook.id,
      request_url: webhook.webhook_url,
      request_method: webhook.method,
      request_payload: finalPayload,
      response_status_code: response.status,
      response_time_ms: responseTime,
      success: response.ok
    })

    // Mettre à jour statistiques
    await supabase
      .from('webhooks')
      .update({
        total_calls: webhook.total_calls + 1,
        last_called_at: new Date(),
        last_status_code: response.status
      })
      .eq('id', webhook.id)

    return { success: true, status: response.status }
  } catch (error) {
    // Logger l'erreur
    await supabase.from('webhook_logs').insert({
      webhook_id: webhook.id,
      request_url: webhook.webhook_url,
      success: false,
      error_message: error.message
    })

    throw error
  }
}
```

---

## 🔄 Workflows automatiques

### 1. Auto-numérotation des baux

```sql
-- Trigger sur INSERT
CREATE TRIGGER set_lease_number_on_insert
  BEFORE INSERT ON immo_app.generated_leases
  FOR EACH ROW
  EXECUTE FUNCTION immo_app.set_lease_number();

-- Résultat: BAIL-2025-00001, BAIL-2025-00002, etc.
```

### 2. Déduction automatique de crédits

```typescript
// routes/leases.ts
app.post('/leases', async (c) => {
  const data = await c.req.json()
  const user = c.get('user')
  const tenant = c.get('tenant')

  // Récupérer template
  const template = await getTemplate(data.template_id)

  // Vérifier crédits
  const hasCredits = await checkUserCredits(
    user.id,
    tenant.id,
    template.credit_cost
  )

  if (!hasCredits) {
    return c.json({ error: 'Insufficient credits' }, 402)
  }

  // Créer bail
  const lease = await createLease(data)

  // Déduire crédits
  const transaction = await useCredits(
    user.id,
    tenant.id,
    template.credit_cost,
    lease.id
  )

  // Générer document
  await generateLeaseDocument(lease)

  return c.json({ lease, transaction })
})
```

### 3. Webhook sur génération complète

```sql
-- Trigger sur UPDATE
CREATE TRIGGER trigger_lease_webhook_on_update
  AFTER UPDATE ON immo_app.generated_leases
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION immo_app.trigger_lease_webhook();
```

---

## 🧪 Tests

### Structure

```
apps/immo/
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
name: Deploy Immo App

on:
  push:
    branches: [main]
    paths:
      - 'apps/immo/**'

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
          project-name: immo-app
```

---

## 📈 Monitoring

### Métriques clés

- Nombre de baux générés par jour/mois
- Taux de conversion (visiteur → achat crédits)
- Crédits vendus vs utilisés
- Temps moyen de génération
- Taux d'erreur génération
- Appels webhooks (succès/échec)

### Outils

- **Analytics :** Vercel Analytics
- **Errors :** Sentry
- **Logs :** Supabase Logs
- **Performance :** Lighthouse CI

---

**Date de création :** 2025-11-17
**Version :** 1.0
**Statut :** 🚧 En développement
