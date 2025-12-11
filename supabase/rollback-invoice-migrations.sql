-- ============================================
-- SCRIPT DE ROLLBACK DES MIGRATIONS FACTURATION
-- ============================================
-- Ce script supprime proprement toutes les migrations 016-020
-- pour permettre de les réappliquer depuis zéro
--
-- ATTENTION: Cela SUPPRIMERA toutes les données des factures/stock !
-- N'exécutez ce script QUE si vous êtes sûr de vouloir tout recommencer.
-- ============================================

-- Confirmation de sécurité
DO $$
BEGIN
  RAISE NOTICE '⚠️  ATTENTION: Ce script va SUPPRIMER toutes les tables/données de facturation et stock !';
  RAISE NOTICE '⚠️  Pour annuler, arrêtez l''exécution maintenant.';
  RAISE NOTICE '⚠️  Pour confirmer, continuez l''exécution.';
  -- pg_sleep(5); -- Décommenter pour ajouter un délai de 5 secondes
END $$;

-- ============================================
-- 1. Supprimer les triggers
-- ============================================
DROP TRIGGER IF EXISTS trigger_update_invoice_totals ON inter_app.invoice_items;
DROP TRIGGER IF EXISTS update_invoice_items_updated_at ON inter_app.invoice_items;
DROP TRIGGER IF EXISTS trigger_update_product_stock ON inter_app.stock_movements;

-- ============================================
-- 2. Supprimer les politiques RLS
-- ============================================
-- Invoice items
DROP POLICY IF EXISTS "Users can view invoice items for their tenant" ON inter_app.invoice_items;
DROP POLICY IF EXISTS "Users can insert invoice items for their tenant" ON inter_app.invoice_items;
DROP POLICY IF EXISTS "Users can update invoice items for their tenant" ON inter_app.invoice_items;
DROP POLICY IF EXISTS "Users can delete invoice items for their tenant" ON inter_app.invoice_items;

-- Stock movements
DROP POLICY IF EXISTS "Users can view stock movements for their tenant" ON inter_app.stock_movements;
DROP POLICY IF EXISTS "Users can insert stock movements for their tenant" ON inter_app.stock_movements;
DROP POLICY IF EXISTS "Users can update stock movements for their tenant" ON inter_app.stock_movements;
DROP POLICY IF EXISTS "Users can delete stock movements for their tenant" ON inter_app.stock_movements;

-- ============================================
-- 3. Supprimer les tables (CASCADE pour foreign keys)
-- ============================================
DROP TABLE IF EXISTS inter_app.invoice_items CASCADE;
DROP TABLE IF EXISTS inter_app.invoice_number_sequences CASCADE;
DROP TABLE IF EXISTS inter_app.stock_movements CASCADE;

-- ============================================
-- 4. Supprimer les colonnes ajoutées aux tables existantes
-- ============================================
-- Colonnes ajoutées à invoices
DO $$
BEGIN
  -- invoice_type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'inter_app'
      AND table_name = 'invoices'
      AND column_name = 'invoice_type'
  ) THEN
    ALTER TABLE inter_app.invoices DROP COLUMN invoice_type;
    RAISE NOTICE 'Colonne invoices.invoice_type supprimée';
  END IF;

  -- proforma_validated_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'inter_app'
      AND table_name = 'invoices'
      AND column_name = 'proforma_validated_at'
  ) THEN
    ALTER TABLE inter_app.invoices DROP COLUMN proforma_validated_at;
    RAISE NOTICE 'Colonne invoices.proforma_validated_at supprimée';
  END IF;

  -- proforma_validated_by
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'inter_app'
      AND table_name = 'invoices'
      AND column_name = 'proforma_validated_by'
  ) THEN
    ALTER TABLE inter_app.invoices DROP COLUMN proforma_validated_by;
    RAISE NOTICE 'Colonne invoices.proforma_validated_by supprimée';
  END IF;

  -- converted_to_final_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'inter_app'
      AND table_name = 'invoices'
      AND column_name = 'converted_to_final_at'
  ) THEN
    ALTER TABLE inter_app.invoices DROP COLUMN converted_to_final_at;
    RAISE NOTICE 'Colonne invoices.converted_to_final_at supprimée';
  END IF;

  -- converted_to_final_by
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'inter_app'
      AND table_name = 'invoices'
      AND column_name = 'converted_to_final_by'
  ) THEN
    ALTER TABLE inter_app.invoices DROP COLUMN converted_to_final_by;
    RAISE NOTICE 'Colonne invoices.converted_to_final_by supprimée';
  END IF;

  -- sent_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'inter_app'
      AND table_name = 'invoices'
      AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE inter_app.invoices DROP COLUMN sent_at;
    RAISE NOTICE 'Colonne invoices.sent_at supprimée';
  END IF;

  -- sent_by
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'inter_app'
      AND table_name = 'invoices'
      AND column_name = 'sent_by'
  ) THEN
    ALTER TABLE inter_app.invoices DROP COLUMN sent_by;
    RAISE NOTICE 'Colonne invoices.sent_by supprimée';
  END IF;
END $$;

-- Colonnes ajoutées à products
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'stock_quantity'
  ) THEN
    ALTER TABLE public.products DROP COLUMN stock_quantity;
    RAISE NOTICE 'Colonne products.stock_quantity supprimée';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'track_stock'
  ) THEN
    ALTER TABLE public.products DROP COLUMN track_stock;
    RAISE NOTICE 'Colonne products.track_stock supprimée';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'low_stock_threshold'
  ) THEN
    ALTER TABLE public.products DROP COLUMN low_stock_threshold;
    RAISE NOTICE 'Colonne products.low_stock_threshold supprimée';
  END IF;
END $$;

-- ============================================
-- 5. Supprimer les fonctions
-- ============================================
DROP FUNCTION IF EXISTS inter_app.generate_invoice_number(UUID);
DROP FUNCTION IF EXISTS inter_app.validate_proforma(UUID, UUID);
DROP FUNCTION IF EXISTS inter_app.convert_proforma_to_final(UUID, UUID);
DROP FUNCTION IF EXISTS inter_app.send_invoice(UUID, UUID, TEXT[]);
DROP FUNCTION IF EXISTS inter_app.get_product_stock(UUID, UUID);
DROP FUNCTION IF EXISTS inter_app.record_product_usage_in_intervention(UUID, UUID, UUID, NUMERIC, NUMERIC, UUID);
DROP FUNCTION IF EXISTS inter_app.update_invoice_totals_from_items();
DROP FUNCTION IF EXISTS inter_app.update_product_stock();
DROP FUNCTION IF EXISTS inter_app.migrate_line_items_to_table();
DROP FUNCTION IF EXISTS inter_app.check_invoice_consistency(UUID);

-- ============================================
-- 6. Supprimer les types ENUM
-- ============================================
DROP TYPE IF EXISTS inter_app.movement_type CASCADE;

-- ============================================
-- 7. Supprimer les index (si pas déjà supprimés avec les tables)
-- ============================================
DROP INDEX IF EXISTS inter_app.idx_invoice_items_invoice_id;
DROP INDEX IF EXISTS inter_app.idx_invoice_items_product_id;
DROP INDEX IF EXISTS inter_app.idx_invoice_items_display_order;
DROP INDEX IF EXISTS inter_app.idx_invoice_number_sequences_tenant_year;
DROP INDEX IF EXISTS inter_app.idx_invoices_type_status;
DROP INDEX IF EXISTS inter_app.idx_stock_movements_tenant_id;
DROP INDEX IF EXISTS inter_app.idx_stock_movements_product_id;
DROP INDEX IF EXISTS inter_app.idx_stock_movements_intervention_id;
DROP INDEX IF EXISTS inter_app.idx_stock_movements_type;
DROP INDEX IF EXISTS inter_app.idx_stock_movements_created_at;
DROP INDEX IF EXISTS inter_app.idx_clients_search;
DROP INDEX IF EXISTS inter_app.idx_interventions_status_date;
DROP INDEX IF EXISTS public.idx_products_stock_quantity;
DROP INDEX IF EXISTS public.idx_products_low_stock;

-- ============================================
-- FIN DU ROLLBACK
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Rollback terminé. Vous pouvez maintenant réappliquer les migrations 016-020.';
END $$;
