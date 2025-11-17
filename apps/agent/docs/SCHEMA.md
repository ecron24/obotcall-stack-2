# 📊 Documentation Schéma SQL - Agent App

> Documentation technique du schéma `agent_app` pour l'application de courtage en assurance

---

## 🎯 Vue d'ensemble

**Schéma :** `agent_app`
**Fichier migration :** `supabase/migrations/004_schema_agent_app.sql`
**Nombre de tables :** 18
**Lignes de code :** 1572
**Statut :** ✅ Prêt pour développement

---

## 📋 Liste des tables

### 1. Gestion des contacts (4 tables)

#### `agent_app.contacts`
Gestion des prospects et clients (particuliers et professionnels).

**Champs clés :**
- `contact_type` : 'individual' | 'professional'
- `status` : 'prospect' | 'client' | 'inactive' | 'archived'
- `is_pep` : Personne Politiquement Exposée (conformité)
- `lcb_ft_verified` : Vérification anti-blanchiment
- `data_retention_end_date` : Fin de relation + 5 ans (RGPD)

**Auto-promotion :**
```sql
-- Trigger sur contracts.INSERT
→ UPDATE contacts SET status = 'client' WHERE status = 'prospect'
```

#### `agent_app.dependents`
Personnes à charge (conjoint, enfants, parents).

**Relations :** 1:N avec `contacts`

#### `agent_app.professional_info`
Informations spécifiques aux clients professionnels (B2B).

**Champs clés :**
- `company_name`, `siret`, `siren`
- `legal_form` : EI, EURL, SARL, SAS, etc.
- `annual_revenue`, `employee_count`
- `client_distribution_b2b`, `client_distribution_b2c`

**Relations :** 1:1 avec `contacts`

#### `agent_app.business_activities`
Répartition des activités pour professionnels.

**Relations :** 1:N avec `professional_info`

---

### 2. Assurance & Produits (6 tables)

#### `agent_app.companies`
Compagnies d'assurance partenaires.

**Champs clés :**
- `name`, `logo_url`, `website`
- `commission_rate` : Taux de commission moyen
- `is_active` : Partenariat actif

#### `agent_app.products`
Produits d'assurance offerts par les compagnies.

**Types de produits :**
- auto, rc_pro, health, home, life, savings, prevoyance, retirement, other

**Champs clés :**
- `target_audience` : 'individual' | 'professional' | 'both'
- `min_age`, `max_age`
- `commission_rate`

#### `agent_app.quotes`
Devis d'assurance avec tableau comparatif.

**Auto-numérotation :** DEV-YYYY-XXXXX

**Workflow :**
```
draft → sent → viewed → accepted/rejected/expired
```

**Champs clés :**
- `quote_number` : Auto-généré
- `product_category` : Type de produit
- `valid_until` : Date de validité
- `form_submission_id` : Lien vers formulaire

#### `agent_app.quote_items`
Lignes du tableau comparatif (max 3 compagnies selon besoins).

**Relations :** 1:N avec `quotes`

**Champs clés :**
- `annual_premium`, `monthly_premium`
- `guarantees` : JSONB pour flexibilité
- `display_order` : 1, 2, 3 pour affichage

#### `agent_app.contracts`
Contrats d'assurance.

**Champs clés :**
- `contract_number` : N° compagnie
- `status` : 'active' | 'expired' | 'cancelled' | 'replaced'
- `renewal_date` : Date de renouvellement
- `commission_amount`, `commission_paid`
- `guarantees` : JSONB

**Trigger auto-promotion :**
```sql
CREATE TRIGGER auto_promote_to_client
AFTER INSERT ON contracts
→ UPDATE contacts SET status = 'client'
```

#### `agent_app.contract_amendments`
Historique des avenants (modifications de contrats).

**Champs clés :**
- `amendment_number` : 1, 2, 3...
- `changes` : JSONB détaillant les changements
- `previous_premium`, `new_premium`

---

### 3. Opérations métier (4 tables)

#### `agent_app.documents`
Gestion documentaire centralisée.

**Types de documents :**
- identity_card, driving_license, kbis
- insurance_certificate, vehicle_registration
- signed_contract, signed_cabinet_info, signed_convention
- invoice, quote_pdf, terms_conditions, rib, other

**Multi-entity linking :**
```sql
-- Au moins une relation obligatoire
contact_id | quote_id | contract_id | invoice_id
```

**Champs clés :**
- `file_path` : Chemin Supabase Storage
- `expiry_date` : Pour CNI, permis
- `tags[]` : Recherche par tags
- `rgpd_consent` : Consentement obtenu

#### `agent_app.invoices`
Facturation des honoraires de courtage.

**Auto-numérotation :** FAC-YYYY-XXXXX

**Types de remises :**
```sql
'creator_50'        -- Créateur -50%
'recommended_25'    -- Recommandé -25%
'multi_contract_25' -- 2ème contrat -25%
'multi_contract_50' -- 3ème contrat -50%
'multi_contract_75' -- 4ème+ contrat -75%
'custom'            -- Personnalisée
'none'              -- Aucune
```

**Workflow paiement :**
```
pending → paid/overdue/cancelled
```

**Trigger overdue :**
```sql
IF payment_status = 'pending' AND due_date < CURRENT_DATE
THEN payment_status := 'overdue'
```

#### `agent_app.claims`
Réclamations clients (conformité légale).

**Auto-numérotation :** REC-YYYY-XXXXX

**Processus 3 niveaux :**
```sql
level_1  -- Courtier interne (10 jours)
level_2  -- Service réclamation compagnie
level_3  -- Médiation CCSF
```

**Calcul deadline automatique :**
```sql
deadline := reception_date + INTERVAL '14 days'  -- 10 jours ouvrés approx
```

#### `agent_app.claims_history`
Historique des sinistres (impact tarification).

**Champs clés :**
- `year` : Année du sinistre
- `responsibility_percentage` : % de responsabilité
- `total_amount` : Montant total

---

### 4. Support & Conformité (4 tables)

#### `agent_app.form_submissions`
Réponses aux formulaires dynamiques.

**Types de formulaires :**
- discovery, auto, rc_pro, health, home, life, savings, retirement

**Stockage :** JSONB pour flexibilité maximale

**Exemple (auto) :**
```json
{
  "vehicle": {
    "brand": "Renault",
    "model": "Clio",
    "year": 2020
  },
  "usage": "personal",
  "annual_mileage": 15000,
  "parking": "garage",
  "drivers": [
    {
      "age": 35,
      "license_date": "2005-06-15"
    }
  ]
}
```

#### `agent_app.consents`
Traçabilité RGPD des consentements.

**Types de consentements :**
```sql
'data_processing'       -- Traitement données
'data_sharing_insurers' -- Partage compagnies
'marketing'             -- Communications
'lcb_ft'                -- Anti-blanchiment
```

**Champs clés :**
- `consent_given` : Oui/non
- `consent_method` : 'web_form' | 'paper_signed' | 'email' | 'phone'
- `ip_address` : Si web form
- `revoked`, `revoked_date` : Révocation
- `proof_document_id` : Preuve du consentement

#### `agent_app.tasks`
Gestion des tâches et rappels.

**Types de tâches :**
- renewal_reminder, follow_up_prospect, document_request
- claim_response, payment_reminder, meeting, call, email, other

**Champs clés :**
- `priority` : 'low' | 'medium' | 'high' | 'urgent'
- `status` : 'todo' | 'in_progress' | 'done' | 'cancelled'
- `due_date`, `reminder_date`
- `assigned_to` : Utilisateur assigné

**Multi-entity :**
```sql
contact_id | contract_id | quote_id  -- Tous optionnels
```

#### `agent_app.emails`
Historique des communications email.

**Types d'emails :**
- quote_sent, contract_confirmation, renewal_notice
- document_request, invoice, welcome, follow_up, general

**Tracking (si SendGrid/Resend) :**
```sql
'sent' → 'delivered' → 'opened' → 'clicked'
```

**Champs clés :**
- `subject`, `body`, `recipient_email`
- `attachments` : JSONB [{filename, url}]
- `opened_at`, `clicked_at`

---

## 🔒 Sécurité

### Row Level Security (RLS)

**Toutes les tables :**
```sql
CREATE POLICY {table}_tenant_isolation ON agent_app.{table}
  FOR ALL
  USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));
```

### Search Path Security

**Toutes les fonctions :**
```sql
SET search_path = agent_app, public, pg_temp;
```

### Audit Trail

**Triggers sur toutes les tables :**
```sql
CREATE TRIGGER {table}_audit_log
  AFTER INSERT OR UPDATE OR DELETE ON agent_app.{table}
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_trail();
```

---

## 🔄 Workflows automatiques

### 1. Auto-numérotation

**Pattern :** PREFIX-YYYY-XXXXX

```sql
-- Devis
DEV-2025-00001

-- Factures
FAC-2025-00001

-- Réclamations
REC-2025-00001
```

**Fonction générique :**
```sql
CREATE FUNCTION agent_app.generate_{entity}_number(p_tenant_id uuid)
RETURNS text AS $$
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;
  v_sequence := COALESCE(MAX(...), 0) + 1;
  v_number := 'PREFIX-' || v_year || '-' || LPAD(v_sequence, 5, '0');
  RETURN v_number;
$$;
```

### 2. Prospect → Client

```sql
CREATE TRIGGER auto_promote_to_client
  AFTER INSERT ON agent_app.contracts
  FOR EACH ROW
  EXECUTE FUNCTION agent_app.promote_prospect_to_client();
```

### 3. Facture en retard

```sql
CREATE TRIGGER check_invoice_overdue_on_update
  BEFORE UPDATE ON agent_app.invoices
  WHEN (NEW.payment_status = 'pending')
  EXECUTE FUNCTION agent_app.check_invoice_overdue();
```

### 4. Deadline réclamation

```sql
CREATE TRIGGER set_claim_number_and_deadline_on_insert
  BEFORE INSERT ON agent_app.claims
  EXECUTE FUNCTION agent_app.set_claim_number_and_deadline();
```

---

## 📈 Indexes

**Total :** 89 indexes optimisés

**Types :**
- B-tree pour égalité/range
- GIN pour JSONB et arrays
- Partial indexes (WHERE conditions)
- Composite indexes (multi-colonnes)

**Exemples :**
```sql
-- Performance
CREATE INDEX idx_contracts_tenant_id
  ON agent_app.contracts(tenant_id)
  WHERE deleted_at IS NULL;

-- Recherche JSONB
CREATE INDEX idx_documents_tags
  ON agent_app.documents
  USING gin(tags);

-- Composite
CREATE INDEX idx_tasks_priority
  ON agent_app.tasks(priority, due_date);
```

---

## 🔍 Requêtes utiles

### Contacts à renouveler (30 jours)
```sql
SELECT c.*
FROM agent_app.contracts c
WHERE c.renewal_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  AND c.status = 'active'
  AND c.deleted_at IS NULL;
```

### Factures impayées
```sql
SELECT i.*
FROM agent_app.invoices i
WHERE i.payment_status IN ('pending', 'overdue')
  AND i.deleted_at IS NULL
ORDER BY i.due_date ASC;
```

### Réclamations en attente
```sql
SELECT cl.*
FROM agent_app.claims cl
WHERE cl.status IN ('received', 'in_progress')
  AND cl.deadline < CURRENT_DATE + INTERVAL '3 days'
ORDER BY cl.deadline ASC;
```

### Tâches du jour
```sql
SELECT t.*
FROM agent_app.tasks t
WHERE t.status IN ('todo', 'in_progress')
  AND t.due_date = CURRENT_DATE
ORDER BY t.priority DESC, t.due_date ASC;
```

---

## 📝 Notes de développement

### Soft Delete Pattern
Toutes les tables principales utilisent le soft delete :
```sql
deleted_at TIMESTAMPTZ
deleted_by UUID REFERENCES auth.users(id)
```

### Audit Trail
Toutes les modifications sont tracées :
```sql
created_at, created_by
updated_at, updated_by
```

### JSONB Usage
Utilisation stratégique pour :
- Garanties (flexibilité assurances)
- Formulaires dynamiques
- Historique de changements
- Attachments emails

### Constraints
Nombreux CHECK constraints pour intégrité :
```sql
CHECK (client_type IN ('individual', 'professional'))
CHECK (status IN ('prospect', 'client', 'inactive', 'archived'))
CHECK (amount_ht >= 0 AND amount_ttc >= 0)
```

---

## 🚀 Migration

**Exécution :**
```bash
# Via Supabase CLI
supabase db reset

# Ou directement dans SQL Editor
\i supabase/migrations/004_schema_agent_app.sql
```

**Vérification :**
```sql
-- Lister les tables
SELECT tablename
FROM pg_tables
WHERE schemaname = 'agent_app';

-- Vérifier les policies
SELECT *
FROM pg_policies
WHERE schemaname = 'agent_app';

-- Vérifier les fonctions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'agent_app';
```

---

**Date de création :** 2025-11-17
**Version :** 1.0
**Statut :** ✅ Production-ready
