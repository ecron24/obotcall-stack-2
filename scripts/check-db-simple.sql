-- ============================================
-- DIAGNOSTIC SIMPLIFIÉ - TOUT EN UN RÉSULTAT
-- ============================================

-- Vérifier toutes les tables/colonnes/fonctions en une seule requête
SELECT
  'TABLE' as type,
  table_name as name,
  NULL as detail
FROM information_schema.tables
WHERE table_schema = 'inter_app'
  AND table_name IN ('invoice_items', 'invoice_number_sequences', 'stock_movements')

UNION ALL

SELECT
  'COLUMN_INVOICES' as type,
  column_name as name,
  data_type as detail
FROM information_schema.columns
WHERE table_schema = 'inter_app'
  AND table_name = 'invoices'
  AND column_name IN ('invoice_type', 'proforma_validated_at', 'converted_to_final_at', 'sent_at')

UNION ALL

SELECT
  'COLUMN_PRODUCTS' as type,
  column_name as name,
  data_type as detail
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
  AND column_name IN ('stock_quantity', 'track_stock', 'low_stock_threshold')

UNION ALL

SELECT
  'FUNCTION' as type,
  routine_name as name,
  NULL as detail
FROM information_schema.routines
WHERE routine_schema = 'inter_app'
  AND routine_name IN (
    'generate_invoice_number',
    'validate_proforma',
    'convert_proforma_to_final',
    'update_invoice_totals_from_items',
    'update_product_stock',
    'get_product_stock',
    'record_product_usage_in_intervention'
  )

UNION ALL

SELECT
  'TRIGGER' as type,
  trigger_name as name,
  event_object_table as detail
FROM information_schema.triggers
WHERE trigger_schema = 'inter_app'
  AND trigger_name IN ('trigger_update_invoice_totals', 'trigger_update_product_stock')

ORDER BY type, name;
