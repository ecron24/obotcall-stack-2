# 📊 Documentation Schéma SQL - Immo App

> Documentation technique du schéma `immo_app` pour le générateur de baux immobiliers

---

## 🎯 Vue d'ensemble

**Schéma :** `immo_app`
**Fichier migration :** `supabase/migrations/003_schema_immo_app.sql`
**Nombre de tables :** 12
**Lignes de code :** ~1100
**Statut :** ✅ Prêt pour développement

---

## 📋 Liste des tables

### 1. Configuration & Pays (1 table)

#### `immo_app.countries`
Pays supportés avec règles légales spécifiques.

**Champs clés :**
- `code` : FR, BE, CH, DE, ES, IT, PT, LU
- `name` : Nom du pays
- `currency_code` : EUR, CHF
- `locale` : fr_FR, de_DE, etc.
- `legal_requirements` : JSONB avec règles légales

**Données pré-chargées :**
```json
{
  "FR": {
    "law": "Loi ALUR 2014",
    "min_duration_residential": 36,
    "deposit_limit": 1
  },
  "BE": {
    "law": "Code Civil Belge",
    "min_duration_residential": 9,
    "deposit_limit": 2
  }
}
```

---

### 2. Système de crédits (3 tables)

#### `immo_app.credit_packages`
Packages de crédits disponibles à l'achat.

**Champs clés :**
- `name`, `description`
- `credit_amount` : Nombre de crédits
- `price_ht`, `price_ttc`, `currency`
- `bonus_credits` : Crédits bonus promotionnels
- `validity_days` : Durée de validité (NULL = illimité)
- `is_active`, `is_featured`

**Exemple :**
```sql
INSERT INTO immo_app.credit_packages (
  tenant_id, name, credit_amount,
  price_ht, price_ttc, bonus_credits
) VALUES (
  '...', 'Pack Starter', 10,
  49.00, 58.80, 0
);
```

#### `immo_app.credit_purchases`
Achats de crédits par les utilisateurs.

**Champs clés :**
- `user_id`, `package_id`
- `credits_purchased`, `bonus_credits`
- `total_credits` : Colonne générée (purchased + bonus)
- `valid_from`, `valid_until`
- `payment_status` : 'pending' | 'paid' | 'failed' | 'refunded'
- `payment_method`, `payment_reference`
- `invoice_number`, `invoice_url`

**Workflow paiement :**
```
pending → paid (crédits activés)
       → failed (aucun crédit)
       → refunded (crédits retirés)
```

#### `immo_app.credit_transactions`
Historique de toutes les transactions de crédits.

**Types de transactions :**
- `purchase` : Achat de crédits
- `usage` : Utilisation pour générer un bail
- `refund` : Remboursement
- `adjustment` : Ajustement manuel
- `expiration` : Expiration de crédits

**Champs clés :**
- `credits_added` : Crédits ajoutés (purchase, refund)
- `credits_used` : Crédits utilisés (usage)
- `credits_balance` : Solde après transaction
- `purchase_id`, `lease_id` : Références

**Calcul du solde :**
```sql
-- Via fonction
SELECT immo_app.get_user_credit_balance(user_id, tenant_id);

-- Dernière transaction = solde actuel
SELECT credits_balance
FROM immo_app.credit_transactions
WHERE user_id = '...'
ORDER BY created_at DESC
LIMIT 1;
```

---

### 3. Templates (2 tables)

#### `immo_app.lease_templates`
Templates de baux par pays et type.

**Types de baux :**
- residential, commercial, professional, mixed, seasonal, parking, storage

**Champs clés :**
- `name`, `description`
- `country_id` : Pays du template
- `lease_type` : Type de bail
- `template_file_path` : Chemin vers DOCX dans storage
- `template_version` : Versioning (1.0, 1.1, etc.)
- `legal_framework` : Référence légale
- `required_fields`, `optional_fields`, `conditional_fields` : JSONB
- `credit_cost` : Nombre de crédits nécessaires
- `is_active`, `is_public` : Disponibilité

**Structure des champs :**
```json
{
  "required_fields": ["lessor_name", "lessee_name", "property_address", "monthly_rent"],
  "optional_fields": ["charges", "deposit", "guarantor"],
  "conditional_fields": {
    "commercial_activity": {
      "condition": {"lease_type": "commercial"},
      "required": true
    }
  }
}
```

#### `immo_app.template_fields`
Définition détaillée des champs des templates.

**Types de champs :**
- text, number, date, currency, select, multiselect, boolean, textarea, email, phone, address

**Champs clés :**
- `field_name` : Nom technique
- `field_label` : Label affiché
- `field_type` : Type de champ
- `is_required` : Obligatoire ou non
- `validation_rules` : JSONB (min, max, regex, etc.)
- `options` : Pour select/multiselect
- `default_value` : Valeur par défaut
- `condition` : JSONB pour affichage conditionnel
- `section` : Regroupement par section
- `display_order` : Ordre d'affichage

**Exemple :**
```json
{
  "field_name": "monthly_rent",
  "field_label": "Loyer mensuel",
  "field_type": "currency",
  "is_required": true,
  "validation_rules": {
    "min": 0,
    "max": 100000
  },
  "section": "financial"
}
```

---

### 4. Entités (2 tables)

#### `immo_app.properties`
Base de données des biens immobiliers.

**Types de biens :**
- apartment, house, commercial, office, parking, storage, land, other

**Champs clés :**
- `property_type` : Type de bien
- `address_line1`, `address_line2`, `postal_code`, `city`, `country_id`
- `surface_area` : Surface en m²
- `rooms`, `bedrooms`, `bathrooms`, `floor`
- `building_year` : Année de construction
- `features` : JSONB (ascenseur, parking, etc.)
- `energy_class`, `ges_class` : DPE (A-G)
- `cadastral_reference` : Référence cadastrale
- `photos`, `documents` : JSONB (URLs)

**Exemple features :**
```json
{
  "elevator": true,
  "parking": true,
  "garage": false,
  "balcony": true,
  "terrace": false,
  "garden": false,
  "swimming_pool": false,
  "cellar": true,
  "bike_storage": true
}
```

#### `immo_app.lease_parties`
Bailleurs et locataires (particuliers et professionnels).

**Types de parties :**
- `party_type` : 'lessor' (bailleur) | 'lessee' (locataire)
- `entity_type` : 'individual' (particulier) | 'company' (société)

**Champs particuliers :**
- `title`, `first_name`, `last_name`
- `birth_date`, `birth_place`, `nationality`
- `identity_type`, `identity_number`, `identity_expiry_date`

**Champs sociétés :**
- `company_name`, `legal_form`
- `siret`, `siren`, `vat_number`
- `legal_representative` : JSONB

**Champs communs :**
- `email`, `phone`, `mobile_phone`
- `address` : Complète
- `iban`, `bic`, `bank_name` : Pour prélèvements

**Contraintes :**
```sql
-- Particulier → first_name + last_name obligatoires
CHECK (entity_type != 'individual' OR (first_name IS NOT NULL AND last_name IS NOT NULL))

-- Société → company_name obligatoire
CHECK (entity_type != 'company' OR company_name IS NOT NULL)
```

---

### 5. Génération (1 table)

#### `immo_app.generated_leases`
Baux générés par les utilisateurs.

**Auto-numérotation :** BAIL-YYYY-XXXXX

**Statuts :**
```
draft → generating → completed
                  → failed
                  → archived
```

**Champs clés :**
- `lease_number` : Auto-généré
- `lease_name` : Nom personnalisé
- `template_id`, `country_id`, `lease_type`
- `property_id` : Bien loué (optionnel)
- `lessor_id`, `lessee_id` : Parties obligatoires
- `co_lessees` : JSONB (IDs des co-locataires)
- `start_date`, `end_date`, `duration_months`
- `monthly_rent`, `charges`, `deposit`, `currency`
- `form_data` : JSONB (toutes les données du formulaire)
- `status` : Statut de génération
- `generation_error` : Message d'erreur si échec
- `docx_url`, `pdf_url` : Documents générés
- `credits_used` : Nombre de crédits consommés
- `credit_transaction_id` : Lien vers transaction

**Workflow & Intégrations :**
- `email_sent`, `email_sent_at`
- `workflow_webhook_id`, `workflow_triggered`, `workflow_triggered_at`

**Exemple form_data :**
```json
{
  "lessor_name": "Jean Dupont",
  "lessee_name": "Marie Martin",
  "property_address": "123 Rue de la Paix, 75001 Paris",
  "monthly_rent": 1200,
  "charges": 150,
  "deposit": 1200,
  "start_date": "2025-01-01",
  "duration_months": 36,
  "energy_class": "C",
  "furnished": false,
  "special_clauses": "Animaux acceptés"
}
```

---

### 6. Communication (1 table)

#### `immo_app.email_history`
Historique des emails envoyés.

**Champs clés :**
- `recipient_email`, `recipient_name`
- `subject`, `body_html`, `body_text`
- `attachments` : JSONB [{filename, url, size}]
- `lease_id` : Bail associé
- `email_provider` : resend, sendgrid, etc.
- `provider_message_id` : ID externe

**Tracking :**
```sql
'pending' → 'sent' → 'delivered' → 'opened' → 'clicked'
                  → 'bounced'
                  → 'failed'
```

**Horodatage :**
- `sent_at`, `delivered_at`, `opened_at`, `clicked_at`, `bounced_at`

**Gestion erreurs :**
- `error_message` : Message d'erreur
- `retry_count` : Nombre de tentatives

---

### 7. Automation (2 tables)

#### `immo_app.webhooks`
Configurations de webhooks pour N8N.

**Types d'événements :**
- lease_generated, lease_signed, email_sent, credit_purchased, custom

**Champs clés :**
- `name`, `description`
- `event_type` : Type d'événement déclencheur
- `webhook_url` : URL à appeler
- `method` : POST, PUT, PATCH
- `auth_type` : none, bearer, basic, api_key
- `auth_credentials` : JSONB chiffré
- `custom_headers` : JSONB
- `payload_template` : JSONB (structure du payload)
- `filters` : JSONB (conditions de déclenchement)
- `is_active` : Actif ou non

**Statistiques :**
- `total_calls` : Nombre d'appels total
- `last_called_at` : Dernier appel
- `last_status_code` : Code HTTP
- `last_error` : Dernière erreur

**Exemple payload_template :**
```json
{
  "event": "{{event_type}}",
  "lease": {
    "id": "{{lease_id}}",
    "number": "{{lease_number}}",
    "type": "{{lease_type}}",
    "country": "{{country_code}}"
  },
  "tenant_id": "{{tenant_id}}",
  "timestamp": "{{created_at}}"
}
```

#### `immo_app.webhook_logs`
Logs de tous les appels webhooks.

**Champs clés :**
- `webhook_id` : Webhook appelé
- `request_url`, `request_method`, `request_headers`, `request_payload`
- `response_status_code`, `response_body`, `response_time_ms`
- `success` : true/false
- `error_message` : Si échec
- `lease_id` : Bail associé

**Utilité :**
- Debugging des intégrations
- Monitoring des performances
- Audit des appels API

---

## 🔒 Sécurité

### Row Level Security (RLS)

**Toutes les tables avec tenant_id :**
```sql
CREATE POLICY {table}_tenant_isolation ON immo_app.{table}
  FOR ALL
  USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));
```

**Tables publiques (countries) :**
```sql
-- Lecture publique
CREATE POLICY countries_read ON immo_app.countries
  FOR SELECT
  USING (true);

-- Écriture admin uniquement
CREATE POLICY countries_write ON immo_app.countries
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_tenant_roles
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));
```

**Templates publics :**
```sql
-- Lecture : templates publics OU templates du tenant
CREATE POLICY lease_templates_read ON immo_app.lease_templates
  FOR SELECT
  USING (
    is_public = true OR
    tenant_id IN (SELECT unnest(get_current_user_tenant_ids()))
  );

-- Écriture : tenant uniquement
CREATE POLICY lease_templates_write ON immo_app.lease_templates
  FOR INSERT OR UPDATE OR DELETE
  USING (tenant_id IN (SELECT unnest(get_current_user_tenant_ids())));
```

### Search Path Security

**Toutes les fonctions :**
```sql
SET search_path = immo_app, public, pg_temp;
```

### Audit Trail

**Triggers sur toutes les tables :**
```sql
CREATE TRIGGER update_{table}_timestamp
  BEFORE UPDATE ON immo_app.{table}
  FOR EACH ROW
  EXECUTE FUNCTION immo_app.update_timestamp();
```

---

## 🔄 Workflows automatiques

### 1. Auto-numérotation (BAIL-YYYY-XXXXX)

**Fonction :**
```sql
CREATE FUNCTION immo_app.generate_lease_number(p_tenant_id uuid)
RETURNS text;

-- Résultat : BAIL-2025-00001, BAIL-2025-00002, etc.
```

**Trigger :**
```sql
CREATE TRIGGER set_lease_number_on_insert
  BEFORE INSERT ON immo_app.generated_leases
  FOR EACH ROW
  EXECUTE FUNCTION immo_app.set_lease_number();
```

### 2. Gestion des crédits

**Vérifier le solde :**
```sql
SELECT immo_app.get_user_credit_balance(user_id, tenant_id);
-- Retourne le solde actuel
```

**Vérifier si crédits suffisants :**
```sql
SELECT immo_app.check_user_credits(user_id, tenant_id, credits_needed);
-- Retourne true/false
```

**Utiliser des crédits :**
```sql
SELECT immo_app.use_credits(
  user_id,
  tenant_id,
  credits,
  lease_id,
  'Lease generation'
);
-- Retourne transaction_id ou erreur si insuffisant
```

**Ajouter des crédits :**
```sql
SELECT immo_app.add_credits(
  user_id,
  tenant_id,
  credits,
  purchase_id,
  'purchase',
  'Credit purchase'
);
-- Retourne transaction_id
```

### 3. Webhooks

**Trigger sur génération de bail :**
```sql
CREATE TRIGGER trigger_lease_webhook_on_update
  AFTER UPDATE ON immo_app.generated_leases
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION immo_app.trigger_lease_webhook();
```

**Notification PostgreSQL :**
```sql
PERFORM pg_notify('lease_generated', json_build_object(
  'lease_id', NEW.id,
  'tenant_id', NEW.tenant_id
)::text);
```

---

## 📈 Indexes

**Total :** 70+ indexes optimisés

**Types :**
- B-tree pour égalité/range
- GIN pour JSONB
- Partial indexes (WHERE conditions)
- Composite indexes

**Exemples :**
```sql
-- Performance
CREATE INDEX idx_generated_leases_tenant
  ON immo_app.generated_leases(tenant_id)
  WHERE deleted_at IS NULL;

-- JSONB
CREATE INDEX idx_properties_features
  ON immo_app.properties
  USING gin(features);

-- Composite
CREATE INDEX idx_generated_leases_dates
  ON immo_app.generated_leases(start_date, end_date);
```

---

## 🔍 Requêtes utiles

### Solde de crédits utilisateur
```sql
SELECT immo_app.get_user_credit_balance(
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000'
);
```

### Baux générés ce mois
```sql
SELECT *
FROM immo_app.generated_leases
WHERE tenant_id = '...'
  AND created_at >= date_trunc('month', CURRENT_DATE)
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

### Templates disponibles par pays
```sql
SELECT t.*
FROM immo_app.lease_templates t
JOIN immo_app.countries c ON c.id = t.country_id
WHERE c.code = 'FR'
  AND t.is_active = true
  AND t.deleted_at IS NULL
ORDER BY t.lease_type, t.display_order;
```

### Historique des transactions
```sql
SELECT
  ct.*,
  cp.credits_purchased AS purchase_amount,
  gl.lease_number
FROM immo_app.credit_transactions ct
LEFT JOIN immo_app.credit_purchases cp ON cp.id = ct.purchase_id
LEFT JOIN immo_app.generated_leases gl ON gl.id = ct.lease_id
WHERE ct.user_id = '...'
  AND ct.tenant_id = '...'
ORDER BY ct.created_at DESC;
```

### Webhooks actifs par événement
```sql
SELECT *
FROM immo_app.webhooks
WHERE event_type = 'lease_generated'
  AND is_active = true
  AND deleted_at IS NULL;
```

---

## 📝 Notes de développement

### Soft Delete Pattern
```sql
deleted_at TIMESTAMPTZ
deleted_by UUID REFERENCES auth.users(id)
```

### Audit Trail
```sql
created_at, created_by
updated_at, updated_by
```

### JSONB Usage
- **Templates** : Champs dynamiques (required, optional, conditional)
- **Form Data** : Données du formulaire complètes
- **Features** : Caractéristiques des biens
- **Webhooks** : Credentials, headers, payload
- **Email** : Attachments

### Constraints
```sql
CHECK (entity_type IN ('individual', 'company'))
CHECK (party_type IN ('lessor', 'lessee'))
CHECK (status IN ('draft', 'generating', 'completed', 'failed', 'archived'))
CHECK (monthly_rent >= 0)
```

---

## 🚀 Migration

**Exécution :**
```bash
# Via Supabase CLI
supabase db reset

# Ou directement dans SQL Editor
\i supabase/migrations/003_schema_immo_app.sql
```

**Vérification :**
```sql
-- Lister les tables
SELECT tablename
FROM pg_tables
WHERE schemaname = 'immo_app';

-- Vérifier les policies
SELECT *
FROM pg_policies
WHERE schemaname = 'immo_app';

-- Vérifier les fonctions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'immo_app';

-- Vérifier les pays
SELECT code, name, currency_code
FROM immo_app.countries
WHERE is_active = true;
```

---

**Date de création :** 2025-11-17
**Version :** 1.0
**Statut :** ✅ Production-ready
