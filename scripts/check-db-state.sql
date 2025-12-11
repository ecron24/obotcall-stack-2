-- ============================================
-- SCRIPT DE VÉRIFICATION DE L'ÉTAT DE LA BDD
-- ============================================
-- À exécuter dans Supabase SQL Editor pour voir ce qui existe déjà

-- 1. Vérifier les tables existantes dans inter_app
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'inter_app'
  AND table_name IN ('invoices', 'invoice_items', 'invoice_number_sequences', 'stock_movements')
ORDER BY table_name;

-- 2. Vérifier les colonnes de la table invoices
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'inter_app'
  AND table_name = 'invoices'
  AND column_name IN (
    'invoice_type',
    'proforma_validated_at',
    'proforma_validated_by',
    'converted_to_final_at',
    'converted_to_final_by',
    'sent_at',
    'sent_by'
  )
ORDER BY column_name;

-- 3. Vérifier les colonnes de la table products pour le stock
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
  AND column_name IN ('stock_quantity', 'track_stock', 'low_stock_threshold')
ORDER BY column_name;

-- 4. Vérifier les fonctions SQL créées
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'inter_app'
  AND routine_name IN (
    'generate_invoice_number',
    'validate_proforma',
    'convert_proforma_to_final',
    'send_invoice',
    'get_product_stock',
    'record_product_usage_in_intervention',
    'update_invoice_totals_from_items',
    'update_product_stock'
  )
ORDER BY routine_name;

-- 5. Vérifier les triggers
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'inter_app'
  AND trigger_name IN (
    'trigger_update_invoice_totals',
    'trigger_update_product_stock'
  )
ORDER BY trigger_name;

-- 6. Vérifier le type ENUM movement_type
SELECT
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'inter_app'
  AND t.typname = 'movement_type'
ORDER BY e.enumsortorder;

-- ============================================
-- RÉSUMÉ
-- ============================================
-- Si une table/colonne/fonction n'apparaît pas dans les résultats,
-- c'est qu'elle n'existe PAS encore et doit être créée.
