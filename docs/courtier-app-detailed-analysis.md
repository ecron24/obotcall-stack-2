# 📊 Analyse Détaillée - Application Courtier (Consolidée)

> Analyse technique complète combinant le questionnaire utilisateur et l'analyse métier
> Base pour la création du schéma `courtier_app`
> Date : 2025-11-17

---

## 🎯 Vue d'ensemble

**Type d'application :** CRM complet pour cabinet de courtage en assurance

**Périmètre fonctionnel :**
- Gestion relation client (prospect → client)
- Processus devis → contrat → renouvellement
- Facturation honoraires avec remises
- Conformité réglementaire (RGPD, réclamations, LCB-FT)
- Gestion documentaire sécurisée
- Formulaires dynamiques par type de produit
- Tableau de bord et reporting

**Architecture :** Multi-tenant SaaS avec niveaux d'abonnement

---

## 📋 SCHÉMA DE BASE DE DONNÉES

### 1. GESTION DES CONTACTS

#### 1.1 Table `courtier_app.contacts`

**Champs de base (déjà identifiés) :**
- id, tenant_id
- contact_type: ENUM ('individual', 'professional')
- status: ENUM ('prospect', 'client', 'inactive', 'archived')

**Informations personnelles :**
```sql
-- Identité
title ENUM ('M', 'MME', 'MLLE')
first_name TEXT NOT NULL
last_name TEXT NOT NULL
maiden_name TEXT
birth_date DATE
birth_place TEXT
birth_department TEXT
nationality TEXT DEFAULT 'FR'

-- Situation familiale
marital_status ENUM ('single', 'married', 'divorced', 'widowed', 'pacs', 'cohabitation')
marital_regime TEXT

-- Coordonnées
email TEXT
mobile_phone TEXT NOT NULL
work_phone TEXT
phone TEXT
fax TEXT
preferred_contact_method ENUM ('email', 'phone', 'mail')

-- Adresse principale
address_line1 TEXT
address_line2 TEXT
postal_code TEXT
city TEXT
country_code TEXT DEFAULT 'FR'

-- Profession
professional_status ENUM ('employee', 'self_employed', 'public_sector', 'retired', 'student', 'unemployed')
employer TEXT
profession TEXT
work_address TEXT
```

**Informations réglementaires :**
```sql
-- Documents officiels
driving_license_date DATE
social_security_number TEXT -- CHIFFRÉ
tax_number TEXT

-- Conformité
is_pep BOOLEAN DEFAULT false -- Personne Politiquement Exposée
is_fatca BOOLEAN DEFAULT false -- Soumis à FATCA (USA)
fiscal_residence ENUM ('france', 'eu', 'non_eu')
lcb_ft_verified BOOLEAN DEFAULT false -- Lutte contre le blanchiment
lcb_ft_verification_date DATE

-- Partenariats compagnies
axa_client_number TEXT
-- Ajouter d'autres compagnies si besoin
```

**Origine et suivi :**
```sql
source ENUM ('website', 'referral', 'cold_call', 'event', 'partner', 'other')
referrer_contact_id UUID REFERENCES courtier_app.contacts(id)
notes TEXT
```

**RGPD :**
```sql
data_retention_end_date DATE -- Fin de relation + 5 ans
```

**Audit :**
```sql
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
created_by UUID REFERENCES auth.users(id)
updated_by UUID REFERENCES auth.users(id)
deleted_at TIMESTAMPTZ
deleted_by UUID REFERENCES auth.users(id)
```

#### 1.2 Table `courtier_app.dependents`

Personnes à charge (conjoint, enfants, parents).

```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
contact_id UUID NOT NULL REFERENCES courtier_app.contacts(id)
relationship ENUM ('spouse', 'child', 'parent', 'other')
first_name TEXT NOT NULL
last_name TEXT NOT NULL
birth_date DATE
is_dependent BOOLEAN DEFAULT false -- À charge fiscalement
profession TEXT
address TEXT -- Si différente du contact principal
notes TEXT
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

#### 1.3 Table `courtier_app.professional_info`

Informations spécifiques aux clients professionnels (relation 1:1 avec contact).

```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
contact_id UUID NOT NULL REFERENCES courtier_app.contacts(id) UNIQUE

-- Identification entreprise
company_name TEXT NOT NULL
legal_form ENUM ('ei', 'eurl', 'sarl', 'sas', 'sasu', 'sa', 'sci', 'scop', 'association', 'other')
siret TEXT UNIQUE
siren TEXT
ape_code TEXT
naf_code_primary TEXT
naf_code_secondary TEXT
creation_date DATE
fiscal_year_end TEXT -- Format: "31/12"

-- Données financières
annual_revenue DECIMAL(12,2)
gross_margin DECIMAL(12,2)
employee_count INTEGER
professional_content DECIMAL(12,2)

-- Activité
activity_description TEXT
main_clients TEXT

-- Répartition clientèle
client_distribution_b2b DECIMAL(5,2) -- Pourcentage
client_distribution_b2c DECIMAL(5,2) -- Pourcentage

-- Sous-traitance
subcontracting_given DECIMAL(5,2) -- % CA en ST donné
subcontracting_received DECIMAL(5,2) -- % CA en ST reçu

created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

#### 1.4 Table `courtier_app.business_activities`

Répartition des activités pour les professionnels (relation 1:N avec professional_info).

```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
professional_info_id UUID NOT NULL REFERENCES courtier_app.professional_info(id)
activity_name TEXT NOT NULL
activity_description TEXT
revenue_percentage DECIMAL(5,2) -- % du CA
activity_order INTEGER -- 1, 2, 3
created_at TIMESTAMPTZ DEFAULT now()
```

---

### 2. GESTION DES COMPAGNIES & PRODUITS

#### 2.1 Table `courtier_app.companies`

**Champs existants + enrichissements :**
```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
name TEXT NOT NULL
logo_url TEXT
website TEXT
commission_rate DECIMAL(5,2) -- Taux de commission moyen
is_active BOOLEAN DEFAULT true
notes TEXT
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

#### 2.2 Table `courtier_app.products`

**Champs existants + enrichissements :**
```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
company_id UUID NOT NULL REFERENCES courtier_app.companies(id)
name TEXT NOT NULL
product_type ENUM ('auto', 'rc_pro', 'health', 'home', 'life', 'savings', 'prevoyance', 'retirement', 'other')
is_active BOOLEAN DEFAULT true
target_audience ENUM ('individual', 'professional', 'both')
min_age INTEGER
max_age INTEGER
documentation_url TEXT
commission_rate DECIMAL(5,2)
description TEXT
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

---

### 3. GESTION DES DEVIS

#### 3.1 Table `courtier_app.quotes`

**Champs existants + enrichissements :**
```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
contact_id UUID NOT NULL REFERENCES courtier_app.contacts(id)

-- Numérotation
quote_number TEXT NOT NULL UNIQUE -- Format: DEV-2025-00001

-- Catégorie
product_category ENUM ('auto', 'rc_pro', 'health', 'home', 'life', 'savings', 'prevoyance', 'retirement', 'other')

-- Statut et dates
status ENUM ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')
created_date DATE DEFAULT CURRENT_DATE
sent_at TIMESTAMPTZ
viewed_at TIMESTAMPTZ
valid_until DATE

-- Lien avec formulaire
form_submission_id UUID REFERENCES courtier_app.form_submissions(id)

notes TEXT

created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
created_by UUID REFERENCES auth.users(id)
updated_by UUID REFERENCES auth.users(id)
```

#### 3.2 Table `courtier_app.quote_items`

Lignes du tableau comparatif (max 3 compagnies selon questionnaire).

```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
quote_id UUID NOT NULL REFERENCES courtier_app.quotes(id)
company_id UUID NOT NULL REFERENCES courtier_app.companies(id)
product_id UUID NOT NULL REFERENCES courtier_app.products(id)

-- Tarification
annual_premium DECIMAL(10,2) NOT NULL
monthly_premium DECIMAL(10,2)
payment_frequency ENUM ('monthly', 'quarterly', 'semi_annual', 'annual')

-- Garanties (stockées en JSON pour flexibilité)
guarantees JSONB DEFAULT '[]'::jsonb
-- Exemple: [{"name": "Dommages tous accidents", "value": "50000€", "franchise": "500€"}, ...]

-- Documents joints
terms_conditions_url TEXT
product_info_url TEXT

display_order INTEGER -- Pour l'affichage (1, 2, 3)

created_at TIMESTAMPTZ DEFAULT now()
```

---

### 4. GESTION DES CONTRATS

#### 4.1 Table `courtier_app.contracts`

**Champs existants + enrichissements :**
```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
contact_id UUID NOT NULL REFERENCES courtier_app.contacts(id)
company_id UUID NOT NULL REFERENCES courtier_app.companies(id)
quote_id UUID REFERENCES courtier_app.quotes(id) -- Devis d'origine

-- Numérotation
contract_number TEXT NOT NULL -- Numéro de la compagnie
policy_number TEXT -- N° de police

-- Type et catégorie
product_type ENUM ('auto', 'rc_pro', 'health', 'home', 'life', 'savings', 'prevoyance', 'retirement', 'other')
product_category TEXT -- Ex: "Santé individuelle", "RC Pro TNS", etc.

-- Dates
start_date DATE NOT NULL
end_date DATE
renewal_date DATE
cancellation_date DATE
cancellation_reason TEXT

-- Statut
status ENUM ('active', 'expired', 'cancelled', 'replaced')
auto_renewal BOOLEAN DEFAULT true

-- Tarification
annual_premium DECIMAL(10,2) NOT NULL
payment_frequency ENUM ('monthly', 'quarterly', 'semi_annual', 'annual')
payment_method ENUM ('direct_debit', 'transfer', 'check', 'card')

-- Commission courtier
commission_amount DECIMAL(10,2)
commission_paid BOOLEAN DEFAULT false
commission_payment_date DATE

-- Garanties (JSONB pour flexibilité)
guarantees JSONB DEFAULT '{}'::jsonb

notes TEXT

created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
created_by UUID REFERENCES auth.users(id)
updated_by UUID REFERENCES auth.users(id)
deleted_at TIMESTAMPTZ
```

#### 4.2 Table `courtier_app.contract_amendments`

Historique des avenants.

```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
contract_id UUID NOT NULL REFERENCES courtier_app.contracts(id)
amendment_number INTEGER NOT NULL -- 1, 2, 3...
amendment_date DATE NOT NULL
reason TEXT NOT NULL
changes JSONB -- Détail des changements
previous_premium DECIMAL(10,2)
new_premium DECIMAL(10,2)
effective_date DATE NOT NULL
created_at TIMESTAMPTZ DEFAULT now()
created_by UUID REFERENCES auth.users(id)
```

---

### 5. GESTION DOCUMENTAIRE

#### 5.1 Table `courtier_app.documents`

Stockage centralisé de tous les documents.

```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL

-- Relations (au moins une doit être NOT NULL)
contact_id UUID REFERENCES courtier_app.contacts(id)
quote_id UUID REFERENCES courtier_app.quotes(id)
contract_id UUID REFERENCES courtier_app.contracts(id)
invoice_id UUID REFERENCES courtier_app.invoices(id)

-- Type de document
document_type ENUM (
  'identity_card',
  'driving_license',
  'kbis',
  'insurance_certificate',
  'vehicle_registration',
  'diploma',
  'payslip',
  'signed_contract',
  'signed_cabinet_info',
  'signed_convention',
  'invoice',
  'quote_pdf',
  'terms_conditions',
  'product_info',
  'rib',
  'other'
)

-- Fichier
file_name TEXT NOT NULL
file_path TEXT NOT NULL -- Chemin dans Supabase Storage
file_size INTEGER -- En octets
mime_type TEXT NOT NULL

-- Métadonnées
is_required BOOLEAN DEFAULT false
expiry_date DATE -- Pour CNI, permis, etc.
uploaded_at TIMESTAMPTZ DEFAULT now()
uploaded_by UUID REFERENCES auth.users(id)

-- RGPD
rgpd_consent BOOLEAN DEFAULT false

-- Tags pour recherche
tags TEXT[]

notes TEXT

-- Soft delete
deleted_at TIMESTAMPTZ
deleted_by UUID REFERENCES auth.users(id)
```

---

### 6. FACTURATION

#### 6.1 Table `courtier_app.invoices`

Facturation des honoraires de courtage.

```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
contact_id UUID NOT NULL REFERENCES courtier_app.contacts(id)
quote_id UUID REFERENCES courtier_app.quotes(id)
contract_id UUID REFERENCES courtier_app.contracts(id)

-- Numérotation
invoice_number TEXT NOT NULL UNIQUE -- Format: FAC-2025-00001

-- Dates
invoice_date DATE NOT NULL DEFAULT CURRENT_DATE
due_date DATE NOT NULL
payment_date DATE

-- Montants
amount_ht DECIMAL(10,2) NOT NULL
tva_applicable BOOLEAN DEFAULT false -- Généralement non pour courtiers
tva_rate DECIMAL(5,2)
tva_amount DECIMAL(10,2) DEFAULT 0
amount_ttc DECIMAL(10,2) NOT NULL

-- Remises
discount_type ENUM (
  'creator_50',        -- Créateur -50%
  'recommended_25',    -- Recommandé -25%
  'multi_contract_25', -- 2ème contrat -25%
  'multi_contract_50', -- 3ème contrat -50%
  'multi_contract_75', -- 4ème+ contrat -75%
  'custom',
  'none'
)
discount_percentage DECIMAL(5,2)
discount_amount DECIMAL(10,2) DEFAULT 0

-- Paiement
payment_method ENUM ('direct_debit', 'transfer', 'check', 'card', 'cash')
payment_status ENUM ('pending', 'paid', 'overdue', 'cancelled')

notes TEXT

created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
created_by UUID REFERENCES auth.users(id)
```

---

### 7. RÉCLAMATIONS (Conformité légale)

#### 7.1 Table `courtier_app.claims`

Gestion des réclamations avec processus à 3 niveaux.

```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
contact_id UUID NOT NULL REFERENCES courtier_app.contacts(id)
contract_id UUID REFERENCES courtier_app.contracts(id)

-- Numérotation
claim_number TEXT NOT NULL UNIQUE -- Format: REC-2025-00001

-- Réception
reception_date DATE NOT NULL
channel ENUM ('mail', 'email', 'phone', 'in_person')

-- Niveau de réclamation
level ENUM ('level_1', 'level_2', 'level_3') DEFAULT 'level_1'
-- level_1: Gestion interne courtier
-- level_2: Service réclamation compagnie
-- level_3: Médiation CCSF

-- Statut
status ENUM ('received', 'in_progress', 'answered', 'escalated', 'closed')

-- Contenu
subject TEXT NOT NULL
description TEXT NOT NULL
response TEXT
response_date DATE

-- Délais
deadline DATE NOT NULL -- Calculé : réception + 10 jours ouvrés
escalated_to TEXT -- Organisme de médiation si niveau 3

notes TEXT

created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
created_by UUID REFERENCES auth.users(id)
```

#### 7.2 Table `courtier_app.claims_history`

Historique des sinistres (impact tarification).

```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
contact_id UUID NOT NULL REFERENCES courtier_app.contacts(id)
contract_id UUID REFERENCES courtier_app.contracts(id)

year INTEGER NOT NULL
nature TEXT NOT NULL
responsibility_percentage DECIMAL(5,2) -- % de responsabilité
total_amount DECIMAL(10,2)
product_type ENUM ('auto', 'rc_pro', 'home', 'other')

created_at TIMESTAMPTZ DEFAULT now()
created_by UUID REFERENCES auth.users(id)
```

---

### 8. FORMULAIRES DYNAMIQUES

#### 8.1 Table `courtier_app.form_submissions`

Stockage des réponses aux formulaires de tarification.

```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
contact_id UUID NOT NULL REFERENCES courtier_app.contacts(id)
quote_id UUID REFERENCES courtier_app.quotes(id)

form_type ENUM (
  'discovery',      -- Découverte client
  'auto',           -- Tarification Auto
  'rc_pro',         -- Tarification RC Pro
  'health',         -- Santé
  'home',           -- Habitation
  'life',           -- Vie/Prévoyance
  'savings',        -- Épargne
  'retirement'      -- Retraite
)

-- Données du formulaire en JSON
form_data JSONB NOT NULL
-- Exemple pour auto:
-- {
--   "vehicle": {"brand": "Renault", "model": "Clio", "year": 2020, ...},
--   "usage": "personal",
--   "annual_mileage": 15000,
--   "parking": "garage",
--   "drivers": [{"age": 35, "license_date": "2005-06-15", ...}],
--   ...
-- }

submitted_at TIMESTAMPTZ DEFAULT now()
submitted_by UUID REFERENCES auth.users(id)
```

---

### 9. CONFORMITÉ RGPD

#### 9.1 Table `courtier_app.consents`

Traçabilité des consentements RGPD.

```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
contact_id UUID NOT NULL REFERENCES courtier_app.contacts(id)

consent_type ENUM (
  'data_processing',        -- Traitement des données
  'data_sharing_insurers',  -- Partage avec compagnies
  'marketing',              -- Communication marketing
  'lcb_ft'                  -- Lutte anti-blanchiment
)

consent_given BOOLEAN NOT NULL
consent_date TIMESTAMPTZ NOT NULL
consent_method ENUM ('web_form', 'paper_signed', 'email', 'phone')
ip_address INET -- Si web

revoked BOOLEAN DEFAULT false
revoked_date TIMESTAMPTZ

-- Preuve du consentement
proof_document_id UUID REFERENCES courtier_app.documents(id)

created_at TIMESTAMPTZ DEFAULT now()
```

---

### 10. TÂCHES & RAPPELS

#### 10.1 Table `courtier_app.tasks`

Gestion des tâches et rappels.

```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL

-- Relations optionnelles
contact_id UUID REFERENCES courtier_app.contacts(id)
contract_id UUID REFERENCES courtier_app.contracts(id)
quote_id UUID REFERENCES courtier_app.quotes(id)

title TEXT NOT NULL
description TEXT

task_type ENUM (
  'renewal_reminder',     -- Rappel renouvellement
  'follow_up_prospect',   -- Relance prospect
  'document_request',     -- Demande de document
  'claim_response',       -- Réponse réclamation
  'payment_reminder',     -- Relance paiement
  'meeting',              -- Rendez-vous
  'call',                 -- Appel téléphonique
  'email',                -- Email à envoyer
  'other'
)

priority ENUM ('low', 'medium', 'high', 'urgent')
status ENUM ('todo', 'in_progress', 'done', 'cancelled')

due_date DATE
reminder_date TIMESTAMPTZ

assigned_to UUID REFERENCES auth.users(id)

completed_at TIMESTAMPTZ

created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
created_by UUID REFERENCES auth.users(id)
```

---

### 11. HISTORIQUE EMAILS

#### 11.1 Table `courtier_app.emails`

Traçabilité des emails envoyés.

```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
contact_id UUID NOT NULL REFERENCES courtier_app.contacts(id)

-- Relations optionnelles
quote_id UUID REFERENCES courtier_app.quotes(id)
contract_id UUID REFERENCES courtier_app.contracts(id)
invoice_id UUID REFERENCES courtier_app.invoices(id)

email_type ENUM (
  'quote_sent',           -- Envoi de devis
  'contract_confirmation',-- Confirmation contrat
  'renewal_notice',       -- Avis d'échéance
  'document_request',     -- Demande de document
  'invoice',              -- Facture
  'welcome',              -- Message de bienvenue
  'follow_up',            -- Relance
  'general'               -- Communication générale
)

subject TEXT NOT NULL
body TEXT NOT NULL
recipient_email TEXT NOT NULL

sent_at TIMESTAMPTZ DEFAULT now()
sent_by UUID REFERENCES auth.users(id)

-- Tracking (si intégration SendGrid/Resend)
status ENUM ('sent', 'delivered', 'bounced', 'opened', 'clicked')
opened_at TIMESTAMPTZ
clicked_at TIMESTAMPTZ

-- Documents joints
attachments JSONB -- [{filename, url}, ...]
```

---

## 🔧 FONCTIONNALITÉS TECHNIQUES

### 1. Auto-numérotation

Implémenter des fonctions similaires à `inter_app` pour :
- Devis : `DEV-YYYY-XXXXX`
- Contrats : `CONT-YYYY-XXXXX` (ou utiliser numéro compagnie)
- Factures : `FAC-YYYY-XXXXX`
- Réclamations : `REC-YYYY-XXXXX`

### 2. Calcul automatique des remises

Fonction pour calculer les honoraires :
```sql
CREATE FUNCTION courtier_app.calculate_invoice_discount(
  p_contact_id UUID,
  p_contract_count INTEGER
) RETURNS courtier_app.discount_info AS $$
-- Logique :
-- - Créateur entreprise < 1 an : -50%
-- - Client recommandé : -25%
-- - 2ème contrat : -25%
-- - 3ème contrat : -50%
-- - 4ème+ contrat : -75%
$$;
```

### 3. Alertes automatiques

Triggers pour créer des tâches automatiquement :
- 6 mois avant échéance contrat → task renewal_reminder
- CNI expirée → task document_request
- Contact client annuel → task follow_up
- Anniversaire 50/69 ans → task (retraite)

### 4. Workflow prospect → client

Trigger sur `contracts` :
```sql
CREATE TRIGGER auto_promote_to_client
AFTER INSERT ON courtier_app.contracts
FOR EACH ROW
EXECUTE FUNCTION courtier_app.promote_prospect_to_client();
```

### 5. Suppression RGPD automatique

Job planifié (pg_cron) :
```sql
-- Tous les jours à 2h du matin
SELECT cron.schedule(
  'rgpd-cleanup',
  '0 2 * * *',
  $$
  UPDATE courtier_app.contacts
  SET deleted_at = now()
  WHERE status = 'prospect'
    AND updated_at < now() - interval '3 years'
    AND deleted_at IS NULL;
  $$
);
```

### 6. Génération PDF

Utiliser une solution comme :
- `@react-pdf/renderer` (frontend)
- `puppeteer` ou `playwright` (backend)
- Service externe (DocRaptor, PDFShift)

Templates pour :
- Devis comparatif
- Facture
- Convention de conseil
- Fiche d'information

---

## 🔒 SÉCURITÉ & CONFORMITÉ

### RLS Policies

Toutes les tables doivent avoir :
```sql
ALTER TABLE courtier_app.{table} ENABLE ROW LEVEL SECURITY;

CREATE POLICY {table}_tenant_isolation ON courtier_app.{table}
  FOR ALL
  USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));
```

### Chiffrement

Champs sensibles à chiffrer :
- `contacts.social_security_number`
- `contacts.tax_number`
- Documents (chiffrement côté Supabase Storage)

### Audit Trail

Table `public.audit_logs` (déjà dans 001_schema_public.sql) :
- Logguer tous les accès aux fiches clients
- Logguer toutes les modifications
- Logguer tous les exports de données

---

## 📊 RAPPORTS & DASHBOARD

### Indicateurs clés (KPI)

```sql
-- Vue : Synthèse quotidienne
CREATE VIEW courtier_app.daily_summary AS
SELECT
  COUNT(*) FILTER (WHERE status = 'prospect') as prospects_count,
  COUNT(*) FILTER (WHERE status = 'client') as clients_count,
  (SELECT COUNT(*) FROM courtier_app.quotes WHERE status = 'sent') as pending_quotes,
  (SELECT COUNT(*) FROM courtier_app.contracts WHERE renewal_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30) as renewals_30_days,
  (SELECT COUNT(*) FROM courtier_app.invoices WHERE payment_status = 'pending') as unpaid_invoices,
  (SELECT COUNT(*) FROM courtier_app.claims WHERE status NOT IN ('closed', 'answered')) as active_claims,
  (SELECT COUNT(*) FROM courtier_app.tasks WHERE status = 'todo' AND due_date = CURRENT_DATE) as tasks_today
FROM courtier_app.contacts
WHERE deleted_at IS NULL;
```

### Rapports à implémenter

1. **Rapport prospects**
   - Taux de conversion prospect → client
   - Source d'acquisition
   - Délai moyen de conversion

2. **Rapport portefeuille**
   - Répartition par type de contrat
   - Répartition par compagnie
   - Primes totales
   - Commissions attendues vs perçues

3. **Rapport facturation**
   - CA mensuel/annuel
   - Impayés
   - Remises accordées

4. **Rapport conformité**
   - Documents manquants
   - Réclamations en cours
   - Consentements RGPD

---

## 🎨 STACK TECHNIQUE

### Frontend
- **Framework :** Next.js 14+ (App Router)
- **Language :** TypeScript
- **Styling :** Tailwind CSS
- **Components :** Shadcn/ui
- **Forms :** React Hook Form + Zod
- **State :** TanStack Query
- **Charts :** Recharts ou Chart.js

### Backend
- **API :** Next.js API Routes ou tRPC
- **ORM :** Prisma (à générer depuis schéma PostgreSQL)
- **Database :** Supabase PostgreSQL (déjà en place)
- **Storage :** Supabase Storage
- **Auth :** Supabase Auth avec MFA

### Services
- **Email :** Resend ou SendGrid
- **PDF :** Puppeteer ou @react-pdf/renderer
- **Cron Jobs :** pg_cron (PostgreSQL extension)

### Déploiement
- **Frontend :** Vercel
- **Database :** Supabase (hébergé)
- **CDN :** Vercel Edge Network

---

## 📝 POINTS À CLARIFIER

### Questions métier

1. **Grille tarifaire des honoraires**
   - Montant de base par type de produit ?
   - Différence particulier/professionnel ?

2. **Formulaires dynamiques**
   - Modèles de formulaires existants à digitaliser ?
   - Champs obligatoires vs optionnels par produit ?

3. **Intégration compagnies**
   - API disponibles pour certaines compagnies ?
   - Ou 100% manuel comme indiqué dans questionnaire ?

4. **Signature électronique**
   - Provider préféré (DocuSign, Yousign, etc.) ?
   - Documents concernés (devis, contrats, mandats) ?

5. **Portail client**
   - Périmètre exact ?
   - Authentification séparée ou SSO ?

### Questions techniques

1. **Migration des données**
   - Existe-t-il des données à migrer depuis un système existant ?

2. **Multi-tenant**
   - Gestion des mandataires : table séparée ou rôle dans `user_tenant_roles` ?

3. **Stockage documents**
   - Limite de stockage par tenant ?
   - Politique de rétention ?

---

## 🚀 PLAN DE DÉVELOPPEMENT

### Phase 1 : MVP (P0)
1. Schéma SQL `003_schema_courtier_app.sql`
2. Module Contacts (individual)
3. Module Devis basique
4. Module Contrats basique
5. Gestion documentaire
6. Dashboard minimal

### Phase 2 : Fonctionnalités métier (P1)
1. Formulaires dynamiques
2. Facturation avec remises
3. Réclamations
4. Professionnels (PROFESSIONAL_INFO)
5. Emails avec templates
6. Tâches et rappels

### Phase 3 : Conformité (P1)
1. RGPD complet
2. LCB-FT
3. Audit trail
4. Archivage automatique

### Phase 4 : Advanced (P2)
1. Portail client
2. Signature électronique
3. Intégrations API compagnies
4. Calendrier avec sync
5. Application mobile

---

**Version :** 2.0
**Date :** 2025-11-17
**Prochaine étape :** Validation et création du schéma SQL
