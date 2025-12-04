-- ============================================
-- MIGRATION 003: Liaison Business Types SAFE
-- Date: 2025-12-04
-- Description: Ajoute business_type_id à tenants et colonnes manquantes
-- SAFE: Utilise ALTER TABLE ADD COLUMN IF NOT EXISTS
-- ============================================

-- =============================================
-- 1. Ajouter business_type_id à public.tenants
-- =============================================

-- Ajouter la colonne business_type_id (sera NULL pour agent_app et immo_app)
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS business_type_id UUID REFERENCES public.business_types(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_tenants_business_type ON public.tenants(business_type_id);

COMMENT ON COLUMN public.tenants.business_type_id IS 'Type de métier du tenant (pisciniste, plombier, etc.) - NULL pour agent_app et immo_app';

-- =============================================
-- 2. Ajouter colonnes manquantes à inter_app.interventions
-- =============================================

-- La table inter_app.interventions a déjà beaucoup de colonnes (47)
-- On ajoute SEULEMENT les colonnes nécessaires pour le multi-métiers

-- Colonne reference (si pas intervention_number)
-- Note: inter_app.interventions a déjà "intervention_number"
-- On va créer une vue pour mapper intervention_number → reference

-- Colonnes pour calculs totaux (si pas déjà présentes)
-- Note: inter_app.interventions a déjà labor_cost, parts_cost, travel_cost, total_cost

-- On ajoute les colonnes de signature client
ALTER TABLE inter_app.interventions
ADD COLUMN IF NOT EXISTS client_present BOOLEAN,
ADD COLUMN IF NOT EXISTS client_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- Colonnes pour référence unique (optionnel si on veut remplacer intervention_number)
ALTER TABLE inter_app.interventions
ADD COLUMN IF NOT EXISTS reference TEXT;

-- Index sur reference si créée
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'inter_app'
    AND table_name = 'interventions'
    AND column_name = 'reference'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_interventions_reference
    ON inter_app.interventions(reference);
  END IF;
END $$;

COMMENT ON COLUMN inter_app.interventions.client_present IS 'Le client était-il présent lors de l''intervention';
COMMENT ON COLUMN inter_app.interventions.client_signed_at IS 'Date/heure de signature du client';
COMMENT ON COLUMN inter_app.interventions.started_at IS 'Date/heure de démarrage réel de l''intervention';
COMMENT ON COLUMN inter_app.interventions.reference IS 'Référence unique (ex: INT-202512-0001) - Alternative à intervention_number';

-- =============================================
-- 3. Vue de compatibilité intervention_number → reference
-- =============================================

-- Vue pour mapper l'ancienne structure vers la nouvelle
CREATE OR REPLACE VIEW inter_app.interventions_compat AS
SELECT
  i.*,
  -- Mapper intervention_number vers reference si reference est NULL
  COALESCE(i.reference, i.intervention_number) as reference_computed,
  -- Mapper service_type vers intervention_types (text)
  i.service_type as intervention_type_text,
  -- Calculer totaux compatibles
  i.labor_cost + i.parts_cost + i.travel_cost as total_cost_computed
FROM inter_app.interventions i;

COMMENT ON VIEW inter_app.interventions_compat IS 'Vue de compatibilité entre ancienne et nouvelle structure';

-- =============================================
-- 4. Fonction pour générer référence intervention
-- =============================================

CREATE OR REPLACE FUNCTION inter_app.generate_intervention_reference(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_month TEXT;
  v_sequence INTEGER;
  v_reference TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  v_month := TO_CHAR(NOW(), 'MM');

  -- Compter les interventions du mois
  SELECT COUNT(*) + 1
  INTO v_sequence
  FROM inter_app.interventions
  WHERE tenant_id = p_tenant_id
    AND (
      reference LIKE 'INT-' || v_year || v_month || '-%'
      OR intervention_number LIKE 'INT-' || v_year || v_month || '-%'
    );

  -- Formatter : INT-YYYYMM-NNNN
  v_reference := 'INT-' || v_year || v_month || '-' || LPAD(v_sequence::TEXT, 4, '0');

  RETURN v_reference;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION inter_app.generate_intervention_reference IS 'Génère une référence unique INT-YYYYMM-NNNN';

-- =============================================
-- 5. Trigger optionnel pour auto-générer reference
-- =============================================

-- Trigger pour auto-générer reference si NULL
CREATE OR REPLACE FUNCTION inter_app.set_intervention_reference()
RETURNS TRIGGER AS $$
BEGIN
  -- Si reference est NULL et intervention_number existe, utiliser intervention_number
  IF NEW.reference IS NULL AND NEW.intervention_number IS NOT NULL THEN
    NEW.reference := NEW.intervention_number;
  -- Sinon, générer une nouvelle référence
  ELSIF NEW.reference IS NULL THEN
    NEW.reference := inter_app.generate_intervention_reference(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger (désactivé par défaut pour ne pas casser l'existant)
-- Décommenter si vous voulez activer la génération automatique
-- CREATE TRIGGER trigger_set_intervention_reference
-- BEFORE INSERT ON inter_app.interventions
-- FOR EACH ROW
-- EXECUTE FUNCTION inter_app.set_intervention_reference();

COMMENT ON FUNCTION inter_app.set_intervention_reference IS 'Trigger pour auto-générer reference si NULL';

-- =============================================
-- 6. Fonction pour migrer parts_used JSONB → intervention_items
-- =============================================

CREATE OR REPLACE FUNCTION inter_app.migrate_parts_to_items(p_intervention_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_part JSONB;
  v_product_name TEXT;
  v_quantity NUMERIC;
  v_unit_price NUMERIC;
BEGIN
  -- Récupérer parts_used de l'intervention
  FOR v_part IN
    SELECT jsonb_array_elements(parts_used)
    FROM inter_app.interventions
    WHERE id = p_intervention_id
  LOOP
    -- Extraire les données du JSONB
    v_product_name := v_part->>'name';
    v_quantity := (v_part->>'quantity')::NUMERIC;
    v_unit_price := (v_part->>'unit_price')::NUMERIC;

    -- Insérer dans intervention_items
    INSERT INTO inter_app.intervention_items (
      intervention_id,
      description,
      quantity,
      unit,
      unit_price_ht,
      tax_rate
    ) VALUES (
      p_intervention_id,
      v_product_name,
      v_quantity,
      COALESCE(v_part->>'unit', 'unité'),
      v_unit_price,
      COALESCE((v_part->>'tax_rate')::NUMERIC, 20.00)
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION inter_app.migrate_parts_to_items IS 'Migre parts_used (JSONB) vers intervention_items';

-- =============================================
-- 7. Fonction pour recalculer totaux intervention
-- =============================================

CREATE OR REPLACE FUNCTION inter_app.calculate_intervention_totals(p_intervention_id UUID)
RETURNS VOID AS $$
DECLARE
  v_items_total NUMERIC := 0;
  v_labor_cost NUMERIC := 0;
  v_travel_cost NUMERIC := 0;
  v_total NUMERIC := 0;
BEGIN
  -- Calculer total des items
  SELECT COALESCE(SUM(total_ttc), 0)
  INTO v_items_total
  FROM inter_app.intervention_items
  WHERE intervention_id = p_intervention_id;

  -- Récupérer labor_cost et travel_cost
  SELECT
    COALESCE(labor_cost, 0),
    COALESCE(travel_cost, 0)
  INTO v_labor_cost, v_travel_cost
  FROM inter_app.interventions
  WHERE id = p_intervention_id;

  -- Total
  v_total := v_items_total + v_labor_cost + v_travel_cost;

  -- Mettre à jour l'intervention
  UPDATE inter_app.interventions
  SET
    parts_cost = v_items_total,
    total_cost = v_total,
    updated_at = NOW()
  WHERE id = p_intervention_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION inter_app.calculate_intervention_totals IS 'Recalcule les totaux d''une intervention';

-- =============================================
-- 8. Trigger pour recalculer totaux après modif items
-- =============================================

CREATE OR REPLACE FUNCTION inter_app.recalculate_intervention_on_items_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer les totaux de l'intervention
  PERFORM inter_app.calculate_intervention_totals(
    COALESCE(NEW.intervention_id, OLD.intervention_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers sur intervention_items
DROP TRIGGER IF EXISTS trigger_recalc_after_item_insert ON inter_app.intervention_items;
CREATE TRIGGER trigger_recalc_after_item_insert
AFTER INSERT ON inter_app.intervention_items
FOR EACH ROW
EXECUTE FUNCTION inter_app.recalculate_intervention_on_items_change();

DROP TRIGGER IF EXISTS trigger_recalc_after_item_update ON inter_app.intervention_items;
CREATE TRIGGER trigger_recalc_after_item_update
AFTER UPDATE ON inter_app.intervention_items
FOR EACH ROW
EXECUTE FUNCTION inter_app.recalculate_intervention_on_items_change();

DROP TRIGGER IF EXISTS trigger_recalc_after_item_delete ON inter_app.intervention_items;
CREATE TRIGGER trigger_recalc_after_item_delete
AFTER DELETE ON inter_app.intervention_items
FOR EACH ROW
EXECUTE FUNCTION inter_app.recalculate_intervention_on_items_change();

-- =============================================
-- FIN MIGRATION 003
-- =============================================

-- Afficher un résumé
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION 003 COMPLETED SUCCESSFULLY';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ business_type_id ajouté à public.tenants';
  RAISE NOTICE '✅ Colonnes signature client ajoutées à inter_app.interventions';
  RAISE NOTICE '✅ Vue de compatibilité créée';
  RAISE NOTICE '✅ Fonctions de migration créées';
  RAISE NOTICE '✅ Triggers de recalcul créés';
  RAISE NOTICE '============================================';
END $$;
