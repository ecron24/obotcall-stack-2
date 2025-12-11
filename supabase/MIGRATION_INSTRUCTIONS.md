# 📋 Instructions d'Application de la Migration

## Fichier à Appliquer
`supabase/combined-migrations-adapted.sql`

## Ce que cette Migration Va Créer

### ✅ Tables
- `inter_app.invoice_items` - Lignes de facture avec calculs automatiques
- `inter_app.invoice_number_sequences` - Séquences pour numérotation auto (INV-YYYY-NNNN)
- `inter_app.stock_movements` - Mouvements de stock avec tracking

### ✅ Colonnes Ajoutées

**Table `inter_app.invoices`:**
- `invoice_type` - Type: 'proforma' ou 'final'
- `proforma_validated_at` - Date validation proforma
- `proforma_validated_by` - User qui a validé
- `converted_to_final_at` - Date conversion en finale
- `converted_to_final_by` - User qui a converti
- `sent_at` - Date envoi au client
- `sent_by` - User qui a envoyé

**Table `public.products`:**
- `stock_quantity` - Quantité en stock (NUMERIC)
- `track_stock` - Activer suivi stock (BOOLEAN)
- `low_stock_threshold` - Seuil alerte stock bas (NUMERIC)

### ✅ Fonctions SQL
- `generate_invoice_number(p_tenant_id)` - Génère numéro facture auto
- `validate_proforma(p_invoice_id, p_user_id)` - Valide proforma
- `convert_proforma_to_final(p_invoice_id, p_user_id)` - Convertit en finale
- `send_invoice(p_invoice_id, p_user_id, p_recipients)` - Marque comme envoyée
- `get_product_stock(p_product_id, p_tenant_id)` - Obtient stock actuel
- `record_product_usage_in_intervention(...)` - Enregistre usage produit
- `update_invoice_totals_from_items()` - Trigger: Recalcule totaux facture
- `update_product_stock()` - Trigger: Met à jour stock produit

### ✅ Triggers
- `trigger_update_invoice_totals` - Recalcule automatiquement totaux facture quand items changent
- `trigger_update_product_stock` - Met à jour automatiquement stock quand mouvements créés
- `update_invoice_items_updated_at` - Met à jour timestamp updated_at

### ✅ Politiques RLS
- Politiques complètes pour invoice_items (SELECT, INSERT, UPDATE, DELETE)
- Politiques complètes pour stock_movements (SELECT, INSERT, UPDATE, DELETE)
- Basées sur tenant_id via user_tenant_roles

### ✅ Index de Performance
- `idx_invoice_items_invoice_id` - Recherche items par facture
- `idx_invoice_items_product_id` - Recherche items par produit
- `idx_invoice_items_display_order` - Tri items par ordre
- `idx_invoice_number_sequences_tenant_year` - Séquences par tenant/année
- `idx_invoices_type_status` - Filtrage factures par type/statut
- `idx_stock_movements_*` - Index pour requêtes stock
- `idx_products_low_stock` - Alerte stock bas

---

## 🚀 PROCÉDURE D'APPLICATION

### Étape 1: Ouvrir Supabase SQL Editor
1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Aller dans **SQL Editor** (menu latéral)

### Étape 2: Copier le Contenu
1. Ouvrir `supabase/combined-migrations-adapted.sql`
2. **Copier TOUT le contenu** (Ctrl+A, Ctrl+C)

### Étape 3: Créer Nouvelle Query
1. Cliquer sur **"New query"** dans SQL Editor
2. **Coller** le contenu complet (Ctrl+V)

### Étape 4: Exécuter la Migration
1. Cliquer sur **"Run"** (ou Ctrl+Enter)
2. ⏳ Attendre l'exécution (peut prendre 30-60 secondes)

### Étape 5: Vérifier les Résultats
Vous devriez voir des messages comme:
```
NOTICE: Table inter_app.invoice_items créée
NOTICE: Constraint invoice_items_invoice_id_fkey créée
NOTICE: Colonne invoices.invoice_type ajoutée
NOTICE: Fonction generate_invoice_number créée
...
```

Si des objets existent déjà, vous verrez:
```
NOTICE: Table inter_app.invoice_items existe déjà, skip
NOTICE: Constraint invoice_items_invoice_id_fkey existe, skip
```

**C'est NORMAL et SANS DANGER** - la migration est idempotente.

### Étape 6: Vérifier l'État Final
Copier/coller ce query de vérification:

```sql
-- Vérifier tables créées
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'inter_app'
  AND table_name IN ('invoice_items', 'invoice_number_sequences', 'stock_movements')
ORDER BY table_name;

-- Vérifier colonnes ajoutées à invoices
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'inter_app'
  AND table_name = 'invoices'
  AND column_name IN ('invoice_type', 'proforma_validated_at', 'sent_at')
ORDER BY column_name;

-- Vérifier colonnes ajoutées à products
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
  AND column_name IN ('stock_quantity', 'track_stock', 'low_stock_threshold')
ORDER BY column_name;

-- Vérifier fonctions créées
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'inter_app'
  AND routine_name IN ('generate_invoice_number', 'validate_proforma', 'convert_proforma_to_final')
ORDER BY routine_name;
```

**Résultats attendus:**
- 3 tables (invoice_items, invoice_number_sequences, stock_movements)
- 7 colonnes dans invoices (invoice_type, proforma_validated_at, etc.)
- 3 colonnes dans products (stock_quantity, track_stock, low_stock_threshold)
- 8 fonctions créées

---

## 🔒 Sécurité PostgreSQL

### Protection search_path (✅ IMPLÉMENTÉE)

Toutes les fonctions avec `SECURITY DEFINER` ont été sécurisées avec un `search_path` fixe :

```sql
CREATE OR REPLACE FUNCTION inter_app.ma_fonction(...)
...
SECURITY DEFINER
SET search_path = inter_app, public, pg_catalog  -- ✅ Protection active
AS $$
```

**Pourquoi c'est important ?**

Sans `search_path` fixe, une fonction `SECURITY DEFINER` est vulnérable aux **attaques par injection de schéma**. Un utilisateur malveillant pourrait :

1. Créer une table/fonction malveillante dans un schéma prioritaire (ex: `public.products`)
2. Quand la fonction appelle `SELECT * FROM products`, PostgreSQL utiliserait la table malveillante
3. L'attaquant pourrait voler ou modifier des données avec les privilèges élevés de la fonction

**Solution appliquée :**
- 8 fonctions protégées avec `SET search_path`
- Conforme au Supabase Database Linter (lint 0011)
- Aucun warning de sécurité restant

**Commit:** `b40cf71` - 🔒 Security: Ajout search_path à toutes les fonctions SECURITY DEFINER

---

## ⚠️ En Cas d'Erreur

### ~~Erreur: "INSERT trigger's WHEN condition cannot reference OLD values"~~ ✅ CORRIGÉE
**Statut:** Cette erreur a été corrigée dans la version actuelle du fichier.

**Contexte:** Dans un trigger INSERT, OLD n'existe pas (seulement NEW). La clause WHEN problématique a été supprimée.

**Action:** Utilisez la dernière version de `combined-migrations-adapted.sql` (commit 508ffde ou plus récent).

### Erreur: "constraint already exists"
**Solution:** La migration est idempotente, cette contrainte existe déjà. Continuez.

### Erreur: "column already exists"
**Solution:** La migration est idempotente, cette colonne existe déjà. Continuez.

### Erreur: "function does not exist: update_updated_at_column"
**Problème:** La fonction trigger de base n'existe pas.

**Solution:** Créer d'abord cette fonction:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Puis réexécuter la migration complète.

### Erreur: "table does not exist: user_tenant_roles"
**Problème:** Table RLS non présente.

**Solution:** Vérifier que les migrations précédentes (001-015) ont été appliquées.

---

## 🧹 Rollback (Si Nécessaire)

Si vous devez tout supprimer pour recommencer:

1. Exécuter `supabase/rollback-invoice-migrations.sql`
2. ⚠️ **ATTENTION:** Cela supprime TOUTES les données de facturation/stock!
3. Réexécuter `combined-migrations-adapted.sql`

---

## ✅ Validation Post-Migration

### Test 1: Créer Facture Proforma
```sql
INSERT INTO inter_app.invoices (
  tenant_id,
  client_id,
  invoice_type,
  status,
  issue_date
) VALUES (
  'YOUR_TENANT_ID',
  'YOUR_CLIENT_ID',
  'proforma',
  'draft',
  NOW()
)
RETURNING id, invoice_number, invoice_type;
```

Devrait retourner un numéro auto: `INV-2025-0001`

### Test 2: Créer Invoice Item
```sql
INSERT INTO inter_app.invoice_items (
  invoice_id,
  description,
  quantity,
  unit_price_ht,
  tva_rate
) VALUES (
  'INVOICE_ID_FROM_TEST_1',
  'Test produit',
  2.00,
  100.00,
  20.00
)
RETURNING id, subtotal_ht, tva_amount, total_ttc;
```

Devrait calculer automatiquement:
- `subtotal_ht` = 200.00 (2 × 100)
- `tva_amount` = 40.00 (200 × 20%)
- `total_ttc` = 240.00

### Test 3: Vérifier Trigger Totaux Facture
```sql
SELECT id, subtotal_ht, total_tax, total_ttc
FROM inter_app.invoices
WHERE id = 'INVOICE_ID_FROM_TEST_1';
```

Devrait montrer que la facture a été automatiquement mise à jour avec les totaux.

### Test 4: Créer Mouvement Stock
```sql
INSERT INTO inter_app.stock_movements (
  tenant_id,
  product_id,
  movement_type,
  quantity,
  unit_cost,
  notes
) VALUES (
  'YOUR_TENANT_ID',
  'YOUR_PRODUCT_ID',
  'purchase',
  10.00,
  50.00,
  'Test stock purchase'
)
RETURNING id, quantity;
```

### Test 5: Vérifier Stock Mis à Jour
```sql
SELECT id, name, stock_quantity
FROM public.products
WHERE id = 'YOUR_PRODUCT_ID';
```

Le `stock_quantity` devrait avoir augmenté de 10.

---

## 📊 Prochaines Étapes

Une fois la migration appliquée avec succès:

1. ✅ Tester l'interface web: https://inter.app.obotcall.tech/dashboard/factures
2. ✅ Créer une facture proforma
3. ✅ Valider la proforma
4. ✅ Convertir en facture finale
5. ✅ Vérifier la numérotation automatique
6. ✅ Tester la page stock: https://inter.app.obotcall.tech/dashboard/stock
7. ✅ Créer un mouvement de stock
8. ✅ Vérifier que le stock produit est mis à jour

---

## 🆘 Support

Si problème, vérifier:
1. Les migrations 001-015 sont appliquées
2. Le schéma `inter_app` existe
3. Les tables `invoices`, `clients`, `products` existent
4. La fonction `update_updated_at_column()` existe
5. L'extension `uuid-ossp` est activée

