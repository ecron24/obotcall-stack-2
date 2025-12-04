-- ============================================
-- ROLLBACK SCRIPT pour migrations 002, 003, 004
-- ⚠️ ATTENTION: Ce script supprime toutes les données
-- Usage: Exécuter SEULEMENT si vous voulez annuler les migrations
-- ============================================

BEGIN;

RAISE NOTICE '============================================';
RAISE NOTICE '⚠️  ROLLBACK EN COURS';
RAISE NOTICE '============================================';

-- =============================================
-- 1. Supprimer les triggers
-- =============================================

DROP TRIGGER IF EXISTS trigger_recalc_after_item_insert ON inter_app.intervention_items;
DROP TRIGGER IF EXISTS trigger_recalc_after_item_update ON inter_app.intervention_items;
DROP TRIGGER IF EXISTS trigger_recalc_after_item_delete ON inter_app.intervention_items;
DROP TRIGGER IF EXISTS trigger_set_intervention_reference ON inter_app.interventions;

RAISE NOTICE '✅ Triggers supprimés';

-- =============================================
-- 2. Supprimer les fonctions
-- =============================================

DROP FUNCTION IF EXISTS inter_app.recalculate_intervention_on_items_change();
DROP FUNCTION IF EXISTS inter_app.set_intervention_reference();
DROP FUNCTION IF EXISTS inter_app.calculate_intervention_totals(UUID);
DROP FUNCTION IF EXISTS inter_app.migrate_parts_to_items(UUID);
DROP FUNCTION IF EXISTS inter_app.generate_intervention_reference(UUID);

RAISE NOTICE '✅ Fonctions supprimées';

-- =============================================
-- 3. Supprimer les vues
-- =============================================

DROP VIEW IF EXISTS inter_app.interventions_compat;

RAISE NOTICE '✅ Vues supprimées';

-- =============================================
-- 4. Supprimer les données seeds (si vous voulez)
-- =============================================

-- ⚠️ Décommentez SEULEMENT si vous voulez supprimer les données
-- DELETE FROM public.products;
-- DELETE FROM public.product_categories;
-- DELETE FROM public.intervention_types;
-- DELETE FROM public.business_types;

RAISE NOTICE '⚠️  Données seeds conservées (décommentez pour supprimer)';

-- =============================================
-- 5. Supprimer les colonnes ajoutées à interventions
-- =============================================

ALTER TABLE inter_app.interventions DROP COLUMN IF EXISTS reference;
ALTER TABLE inter_app.interventions DROP COLUMN IF EXISTS started_at;
ALTER TABLE inter_app.interventions DROP COLUMN IF EXISTS client_signed_at;
ALTER TABLE inter_app.interventions DROP COLUMN IF EXISTS client_present;

RAISE NOTICE '✅ Colonnes interventions supprimées';

-- =============================================
-- 6. Supprimer business_type_id de tenants
-- =============================================

ALTER TABLE public.tenants DROP COLUMN IF EXISTS business_type_id;

RAISE NOTICE '✅ Colonne business_type_id supprimée de tenants';

-- =============================================
-- 7. Supprimer les tables inter_app
-- =============================================

DROP TABLE IF EXISTS inter_app.company_settings CASCADE;
DROP TABLE IF EXISTS inter_app.pricing_configs CASCADE;
DROP TABLE IF EXISTS inter_app.intervention_type_assignments CASCADE;
DROP TABLE IF EXISTS inter_app.intervention_items CASCADE;

RAISE NOTICE '✅ Tables inter_app supprimées';

-- =============================================
-- 8. Supprimer les tables public (avec CASCADE)
-- =============================================

DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.product_categories CASCADE;
DROP TABLE IF EXISTS public.intervention_types CASCADE;
DROP TABLE IF EXISTS public.business_types CASCADE;

RAISE NOTICE '✅ Tables public supprimées';

-- =============================================
-- FIN ROLLBACK
-- =============================================

RAISE NOTICE '============================================';
RAISE NOTICE '✅ ROLLBACK TERMINÉ';
RAISE NOTICE '============================================';
RAISE NOTICE 'Les tables suivantes ont été supprimées:';
RAISE NOTICE '- public.business_types';
RAISE NOTICE '- public.intervention_types';
RAISE NOTICE '- public.product_categories';
RAISE NOTICE '- public.products';
RAISE NOTICE '- inter_app.intervention_items';
RAISE NOTICE '- inter_app.intervention_type_assignments';
RAISE NOTICE '- inter_app.pricing_configs';
RAISE NOTICE '- inter_app.company_settings';
RAISE NOTICE '============================================';

-- Valider la transaction
COMMIT;

-- Alternative: Annuler la transaction si quelque chose ne va pas
-- ROLLBACK;
