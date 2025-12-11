# 📋 Migrations 011-015 : Système de Facturation Complet

## 🎯 Objectif
Transformer le système de facturation pour supporter :
- ✅ Lignes de facture relationnelles (au lieu de JSONB)
- ✅ Numérotation automatique des factures
- ✅ Workflow Proforma → Définitive
- ✅ Gestion de stock produits

---

## 📦 Liste des Migrations

### 011_invoice_items.sql
**Création de la table invoice_items**

**Ce qui est créé :**
- Table `inter_app.invoice_items` avec colonnes calculées automatiquement :
  - `subtotal_ht` = quantity × unit_price_ht
  - `tva_amount` = subtotal_ht × tva_rate / 100
  - `total_ttc` = subtotal_ht × (1 + tva_rate / 100)

- Trigger `trigger_update_invoice_totals` :
  - Se déclenche après INSERT/UPDATE/DELETE sur invoice_items
  - Recalcule automatiquement les totaux de la facture parent

**Impact :**
- ✅ Calculs automatiques, plus d'erreurs de calcul
- ✅ Structure relationnelle plus propre que JSONB
- ✅ Requêtes SQL plus performantes

---

### 012_invoice_number_sequences.sql
**Numérotation automatique des factures**

**Ce qui est créé :**
- Table `inter_app.invoice_number_sequences` (tenant_id, year, last_number)
- Function `generate_invoice_number(tenant_id)` → Format: INV-2024-0001
- Trigger `set_invoice_number_on_insert` → Auto-génération si non fourni

**Comportement :**
- Numérotation par tenant et par année
- Protection contre les race conditions (LOCK)
- Reset automatique chaque année

**Exemples :**
```
INV-2024-0001
INV-2024-0002
INV-2025-0001 (nouvelle année)
```

---

### 013_invoice_type_proforma_final.sql
**Workflow Proforma → Définitive**

**Colonnes ajoutées à `inter_app.invoices` :**
- `invoice_type` : 'proforma' | 'final'
- `proforma_validated_at` : Date de validation
- `proforma_validated_by` : User qui a validé
- `converted_to_final_at` : Date de conversion
- `converted_to_final_by` : User qui a converti
- `sent_at` : Date d'envoi
- `sent_by` : User qui a envoyé
- `sent_to_emails` : Array des emails destinataires
- `document_url` : URL du PDF (Google Drive, S3, etc.)
- `document_uploaded_at` : Date d'upload

**Functions SQL créées :**
1. `validate_proforma_invoice(invoice_id, user_id)`
   - Valide une proforma
   - Change status → 'sent'

2. `convert_proforma_to_final(invoice_id, user_id)`
   - Convertit proforma → final
   - Génère nouveau numéro de facture
   - Enregistre qui/quand

3. `mark_invoice_sent(invoice_id, user_id, emails[])`
   - Marque facture comme envoyée
   - Change status si draft

**Workflow complet :**
```
1. Créer facture proforma (status: draft)
2. validate_proforma_invoice() → status: sent
3. convert_proforma_to_final() → invoice_type: final, nouveau numéro
4. mark_invoice_sent() → sent_at rempli
```

---

### 014_stock_movements.sql
**Gestion du stock produits**

**Ce qui est créé :**
- ENUM `inter_app.movement_type` :
  - purchase (achat)
  - sale (vente)
  - return (retour)
  - adjustment (ajustement inventaire)
  - loss (perte/casse)
  - transfer (transfert)
  - intervention (utilisé dans intervention)

- Table `inter_app.stock_movements` :
  - `quantity` : positive = entrée, négative = sortie
  - `unit_cost` : prix unitaire du mouvement
  - `reason` : raison du mouvement
  - `intervention_id` : lien vers intervention si applicable

- Trigger `trigger_update_product_stock` (optionnel) :
  - Met à jour `products.stock_quantity` automatiquement

**Functions SQL créées :**
1. `get_product_stock(product_id, tenant_id)`
   - Calcule stock actuel

2. `record_product_usage_in_intervention(tenant_id, intervention_id, product_id, quantity, unit_cost, user_id)`
   - Enregistre utilisation produit
   - Crée mouvement négatif (sortie)

**Exemple d'utilisation :**
```sql
-- Enregistrer un achat
INSERT INTO stock_movements (tenant_id, product_id, movement_type, quantity, unit_cost)
VALUES ('xxx', 'yyy', 'purchase', 100, 15.50);

-- Utiliser dans intervention
SELECT record_product_usage_in_intervention('tenant', 'interv', 'product', 5, 15.50, 'user');

-- Voir stock actuel
SELECT get_product_stock('product_id', 'tenant_id');
```

---

### 015_cleanup_and_consistency.sql
**Nettoyage et cohérence**

**Ce qui est fait :**

1. **Migration JSONB → Relationnel**
   - Function `migrate_line_items_to_table()`
   - Migre les line_items existants vers invoice_items

2. **Harmonisation colonnes**
   - Copie `sent_date` → `sent_at`
   - Copie `sent_to_email` → `sent_to_emails[]`

3. **Ajout colonnes stock à products**
   - `stock_quantity` : quantité en stock
   - `track_stock` : activer/désactiver suivi
   - `low_stock_threshold` : seuil alerte

4. **Activation trigger stock**
   - Active `trigger_update_product_stock`

5. **Indexes de performance**
   - Recherche clients (fulltext)
   - Filtrage factures par type/status
   - Filtrage interventions par status/date

6. **Function de vérification**
   - `check_invoice_consistency(invoice_id)`
   - Vérifie cohérence totaux invoice vs items

---

## 🚀 Ordre d'Exécution

```bash
# Les migrations sont exécutées dans l'ordre numérique
011 → 012 → 013 → 014 → 015

# Avec Supabase CLI:
supabase db push

# Ou manuellement:
psql < 011_invoice_items.sql
psql < 012_invoice_number_sequences.sql
psql < 013_invoice_type_proforma_final.sql
psql < 014_stock_movements.sql
psql < 015_cleanup_and_consistency.sql
```

---

## ⚠️ Actions Post-Migration

### 1. Migrer les données existantes
```sql
-- Migrer les line_items JSONB → invoice_items
SELECT inter_app.migrate_line_items_to_table();
```

### 2. Vérifier la cohérence
```sql
-- Pour chaque facture
SELECT * FROM inter_app.check_invoice_consistency('invoice_id');
```

### 3. Activer le suivi de stock pour les produits
```sql
-- Activer pour les produits qui ont besoin de suivi
UPDATE public.products
SET track_stock = true,
    low_stock_threshold = 10
WHERE category = 'Consommables';
```

### 4. Initialiser les stocks actuels
```sql
-- Créer des mouvements d'ajustement pour initialiser le stock
INSERT INTO inter_app.stock_movements (tenant_id, product_id, movement_type, quantity, reason, created_by)
SELECT
  tenant_id,
  id as product_id,
  'adjustment',
  100, -- quantité initiale
  'Initialisation du stock',
  'admin_user_id'
FROM public.products
WHERE track_stock = true;
```

---

## 📊 Vérifications de Santé

```sql
-- 1. Vérifier que toutes les factures ont des numéros
SELECT COUNT(*) as factures_sans_numero
FROM inter_app.invoices
WHERE invoice_number IS NULL OR invoice_number = '';

-- 2. Vérifier cohérence des totaux
SELECT
  i.id,
  i.total_ttc as invoice_total,
  COALESCE(SUM(ii.total_ttc), 0) as items_total,
  i.total_ttc - COALESCE(SUM(ii.total_ttc), 0) as diff
FROM inter_app.invoices i
LEFT JOIN inter_app.invoice_items ii ON ii.invoice_id = i.id AND ii.deleted_at IS NULL
WHERE i.deleted_at IS NULL
GROUP BY i.id
HAVING ABS(i.total_ttc - COALESCE(SUM(ii.total_ttc), 0)) > 0.01;

-- 3. Vérifier stocks négatifs (alertes)
SELECT
  p.name,
  p.stock_quantity,
  p.low_stock_threshold
FROM public.products p
WHERE p.track_stock = true
  AND p.stock_quantity < 0;

-- 4. Statistiques factures par type
SELECT
  invoice_type,
  status,
  COUNT(*) as count,
  SUM(total_ttc) as total_revenue
FROM inter_app.invoices
WHERE deleted_at IS NULL
GROUP BY invoice_type, status
ORDER BY invoice_type, status;
```

---

## 🔧 Rollback (si nécessaire)

```sql
-- ⚠️ ATTENTION: Perte de données si exécuté

-- Rollback 015
DROP FUNCTION IF EXISTS inter_app.migrate_line_items_to_table();
DROP FUNCTION IF EXISTS inter_app.check_invoice_consistency(UUID);
ALTER TABLE public.products DROP COLUMN IF EXISTS stock_quantity;
ALTER TABLE public.products DROP COLUMN IF EXISTS track_stock;
ALTER TABLE public.products DROP COLUMN IF EXISTS low_stock_threshold;

-- Rollback 014
DROP TABLE IF EXISTS inter_app.stock_movements CASCADE;
DROP TYPE IF EXISTS inter_app.movement_type CASCADE;
DROP FUNCTION IF EXISTS inter_app.get_product_stock(UUID, UUID);
DROP FUNCTION IF EXISTS inter_app.record_product_usage_in_intervention(UUID, UUID, UUID, NUMERIC, NUMERIC, UUID);

-- Rollback 013
ALTER TABLE inter_app.invoices DROP COLUMN IF EXISTS invoice_type;
ALTER TABLE inter_app.invoices DROP COLUMN IF EXISTS proforma_validated_at;
ALTER TABLE inter_app.invoices DROP COLUMN IF EXISTS proforma_validated_by;
-- ... (continuer pour toutes les colonnes)
DROP FUNCTION IF EXISTS inter_app.convert_proforma_to_final(UUID, UUID);
DROP FUNCTION IF EXISTS inter_app.validate_proforma_invoice(UUID, UUID);
DROP FUNCTION IF EXISTS inter_app.mark_invoice_sent(UUID, UUID, TEXT[]);

-- Rollback 012
DROP TABLE IF EXISTS inter_app.invoice_number_sequences CASCADE;
DROP FUNCTION IF EXISTS inter_app.generate_invoice_number(UUID);

-- Rollback 011
DROP TABLE IF EXISTS inter_app.invoice_items CASCADE;
DROP FUNCTION IF EXISTS inter_app.update_invoice_totals_from_items();
```

---

## 📚 Documentation Complémentaire

**Pour les développeurs :**
- Les triggers recalculent automatiquement les totaux
- Les RLS policies sont activées sur toutes les tables
- Tous les mouvements sont audit-logged

**Pour les utilisateurs :**
- Les numéros de facture sont générés automatiquement
- Le workflow proforma → final est tracé
- Le stock est calculé en temps réel

**Performance :**
- Indexes créés sur toutes les FK
- Indexes de recherche fulltext
- Colonnes calculées (GENERATED) pour performance

---

## ✅ Checklist Migration

- [ ] Backup BDD avant migration
- [ ] Exécuter migrations 011-015
- [ ] Exécuter `migrate_line_items_to_table()`
- [ ] Vérifier cohérence avec `check_invoice_consistency()`
- [ ] Activer `track_stock` sur produits nécessaires
- [ ] Initialiser stocks avec mouvements d'ajustement
- [ ] Tester création facture proforma
- [ ] Tester conversion proforma → final
- [ ] Tester mouvements de stock
- [ ] Vérifier logs d'erreurs
- [ ] Rebuild inter-api Docker
- [ ] Tests utilisateurs finaux
