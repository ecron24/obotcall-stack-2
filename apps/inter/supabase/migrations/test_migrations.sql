-- ============================================
-- TEST SCRIPT pour migrations 002, 003, 004
-- Usage: Exécuter ce script APRÈS les migrations
-- ============================================

-- Test 1: Vérifier tables créées
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TEST 1: Vérification tables';
  RAISE NOTICE '============================================';

  -- public schema
  SELECT COUNT(*) INTO v_count FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'business_types';
  RAISE NOTICE 'business_types: %', CASE WHEN v_count = 1 THEN '✅' ELSE '❌' END;

  SELECT COUNT(*) INTO v_count FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'intervention_types';
  RAISE NOTICE 'intervention_types: %', CASE WHEN v_count = 1 THEN '✅' ELSE '❌' END;

  SELECT COUNT(*) INTO v_count FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'product_categories';
  RAISE NOTICE 'product_categories: %', CASE WHEN v_count = 1 THEN '✅' ELSE '❌' END;

  SELECT COUNT(*) INTO v_count FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'products';
  RAISE NOTICE 'products: %', CASE WHEN v_count = 1 THEN '✅' ELSE '❌' END;

  -- inter_app schema
  SELECT COUNT(*) INTO v_count FROM information_schema.tables
  WHERE table_schema = 'inter_app' AND table_name = 'intervention_items';
  RAISE NOTICE 'intervention_items: %', CASE WHEN v_count = 1 THEN '✅' ELSE '❌' END;

  SELECT COUNT(*) INTO v_count FROM information_schema.tables
  WHERE table_schema = 'inter_app' AND table_name = 'pricing_configs';
  RAISE NOTICE 'pricing_configs: %', CASE WHEN v_count = 1 THEN '✅' ELSE '❌' END;
END $$;

-- Test 2: Vérifier colonnes ajoutées
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TEST 2: Vérification colonnes ajoutées';
  RAISE NOTICE '============================================';

  SELECT COUNT(*) INTO v_count FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'business_type_id';
  RAISE NOTICE 'tenants.business_type_id: %', CASE WHEN v_count = 1 THEN '✅' ELSE '❌' END;

  SELECT COUNT(*) INTO v_count FROM information_schema.columns
  WHERE table_schema = 'inter_app' AND table_name = 'interventions' AND column_name = 'reference';
  RAISE NOTICE 'interventions.reference: %', CASE WHEN v_count = 1 THEN '✅' ELSE '❌' END;

  SELECT COUNT(*) INTO v_count FROM information_schema.columns
  WHERE table_schema = 'inter_app' AND table_name = 'interventions' AND column_name = 'client_present';
  RAISE NOTICE 'interventions.client_present: %', CASE WHEN v_count = 1 THEN '✅' ELSE '❌' END;

  SELECT COUNT(*) INTO v_count FROM information_schema.columns
  WHERE table_schema = 'inter_app' AND table_name = 'interventions' AND column_name = 'client_signed_at';
  RAISE NOTICE 'interventions.client_signed_at: %', CASE WHEN v_count = 1 THEN '✅' ELSE '❌' END;

  SELECT COUNT(*) INTO v_count FROM information_schema.columns
  WHERE table_schema = 'inter_app' AND table_name = 'interventions' AND column_name = 'started_at';
  RAISE NOTICE 'interventions.started_at: %', CASE WHEN v_count = 1 THEN '✅' ELSE '❌' END;
END $$;

-- Test 3: Vérifier données seeds
DO $$
DECLARE
  v_business_types INTEGER;
  v_intervention_types INTEGER;
  v_categories INTEGER;
  v_products INTEGER;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TEST 3: Vérification données seeds';
  RAISE NOTICE '============================================';

  SELECT COUNT(*) INTO v_business_types FROM public.business_types;
  RAISE NOTICE 'Business types: % (attendu: 6)', v_business_types;

  SELECT COUNT(*) INTO v_intervention_types FROM public.intervention_types;
  RAISE NOTICE 'Intervention types: % (attendu: 47)', v_intervention_types;

  SELECT COUNT(*) INTO v_categories FROM public.product_categories;
  RAISE NOTICE 'Product categories: % (attendu: 32)', v_categories;

  SELECT COUNT(*) INTO v_products FROM public.products WHERE is_active = true;
  RAISE NOTICE 'Products actifs: % (attendu: 40+)', v_products;

  IF v_business_types = 6 AND v_intervention_types = 47 THEN
    RAISE NOTICE '✅ Seeds OK';
  ELSE
    RAISE NOTICE '❌ Seeds incomplets';
  END IF;
END $$;

-- Test 4: Vérifier vues
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TEST 4: Vérification vues';
  RAISE NOTICE '============================================';

  SELECT COUNT(*) INTO v_count FROM information_schema.views
  WHERE table_schema = 'inter_app' AND table_name = 'interventions_compat';
  RAISE NOTICE 'interventions_compat: %', CASE WHEN v_count = 1 THEN '✅' ELSE '❌' END;
END $$;

-- Test 5: Vérifier fonctions
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TEST 5: Vérification fonctions';
  RAISE NOTICE '============================================';

  SELECT COUNT(*) INTO v_count FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'inter_app' AND p.proname = 'generate_intervention_reference';
  RAISE NOTICE 'generate_intervention_reference: %', CASE WHEN v_count = 1 THEN '✅' ELSE '❌' END;

  SELECT COUNT(*) INTO v_count FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'inter_app' AND p.proname = 'migrate_parts_to_items';
  RAISE NOTICE 'migrate_parts_to_items: %', CASE WHEN v_count = 1 THEN '✅' ELSE '❌' END;

  SELECT COUNT(*) INTO v_count FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'inter_app' AND p.proname = 'calculate_intervention_totals';
  RAISE NOTICE 'calculate_intervention_totals: %', CASE WHEN v_count = 1 THEN '✅' ELSE '❌' END;

  SELECT COUNT(*) INTO v_count FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'inter_app' AND p.proname = 'recalculate_intervention_on_items_change';
  RAISE NOTICE 'recalculate_intervention_on_items_change: %', CASE WHEN v_count = 1 THEN '✅' ELSE '❌' END;
END $$;

-- Test 6: Vérifier triggers
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TEST 6: Vérification triggers';
  RAISE NOTICE '============================================';

  SELECT COUNT(*) INTO v_count FROM pg_trigger
  WHERE tgname = 'trigger_recalc_after_item_insert';
  RAISE NOTICE 'trigger_recalc_after_item_insert: %', CASE WHEN v_count = 1 THEN '✅' ELSE '❌' END;

  SELECT COUNT(*) INTO v_count FROM pg_trigger
  WHERE tgname = 'trigger_recalc_after_item_update';
  RAISE NOTICE 'trigger_recalc_after_item_update: %', CASE WHEN v_count = 1 THEN '✅' ELSE '❌' END;

  SELECT COUNT(*) INTO v_count FROM pg_trigger
  WHERE tgname = 'trigger_recalc_after_item_delete';
  RAISE NOTICE 'trigger_recalc_after_item_delete: %', CASE WHEN v_count = 1 THEN '✅' ELSE '❌' END;
END $$;

-- Test 7: Afficher les business types
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Business types disponibles:';
  RAISE NOTICE '============================================';
END $$;

SELECT emoji || ' ' || name || ' (' || code || ')' as business_type
FROM public.business_types
ORDER BY name;

-- Test 8: Compter interventions types par métier
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Types d''interventions par métier:';
  RAISE NOTICE '============================================';
END $$;

SELECT
  bt.emoji || ' ' || bt.name as metier,
  COUNT(it.id) as nb_types
FROM public.business_types bt
LEFT JOIN public.intervention_types it ON it.business_type_id = bt.id
GROUP BY bt.id, bt.name, bt.emoji
ORDER BY bt.name;

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TESTS TERMINÉS';
  RAISE NOTICE '============================================';
END $$;
