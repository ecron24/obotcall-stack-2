-- Migration 007: Correction warning search_path mutable sur fonctions
-- Ajout SET search_path = '' pour sécuriser contre search path injection

-- ============================================
-- 1. FONCTION PUBLIC: update_updated_at_column
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

COMMENT ON FUNCTION public.update_updated_at_column IS
'Trigger function to update updated_at column - Secure search_path';

-- ============================================
-- 2. FONCTION INTER_APP: generate_intervention_reference
-- ============================================

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
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
    AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW());

  -- Format: INT-YYYY-MM-NNNN
  v_reference := 'INT-' || v_year || '-' || v_month || '-' || LPAD(v_sequence::TEXT, 4, '0');

  RETURN v_reference;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

COMMENT ON FUNCTION inter_app.generate_intervention_reference IS
'Generate unique intervention reference - Secure search_path';

-- ============================================
-- 3. FONCTION INTER_APP: set_intervention_reference
-- ============================================

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
$$ LANGUAGE plpgsql
SET search_path = '';

COMMENT ON FUNCTION inter_app.set_intervention_reference IS
'Trigger to set intervention reference - Secure search_path';

-- ============================================
-- 4. FONCTION INTER_APP: migrate_parts_to_items
-- ============================================

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
    v_quantity := COALESCE((v_part->>'quantity')::NUMERIC, 1);
    v_unit_price := COALESCE((v_part->>'price')::NUMERIC, 0);

    -- Insérer dans intervention_items
    INSERT INTO inter_app.intervention_items (
      intervention_id,
      product_id,
      description,
      quantity,
      unit_price_ht,
      tax_rate
    ) VALUES (
      p_intervention_id,
      NULL,
      v_product_name,
      v_quantity,
      v_unit_price,
      20.0
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

COMMENT ON FUNCTION inter_app.migrate_parts_to_items IS
'Migrate parts_used JSONB to intervention_items table - Secure search_path';

-- ============================================
-- 5. FONCTION INTER_APP: calculate_intervention_totals
-- ============================================

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

  -- Calculer le total global
  v_total := v_items_total + v_labor_cost + v_travel_cost;

  -- Mettre à jour l'intervention
  UPDATE inter_app.interventions
  SET
    total_amount = v_total,
    updated_at = NOW()
  WHERE id = p_intervention_id;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

COMMENT ON FUNCTION inter_app.calculate_intervention_totals IS
'Calculate and update intervention totals from items - Secure search_path';

-- ============================================
-- 6. FONCTION INTER_APP: recalculate_intervention_on_items_change
-- ============================================

CREATE OR REPLACE FUNCTION inter_app.recalculate_intervention_on_items_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer les totaux de l'intervention
  PERFORM inter_app.calculate_intervention_totals(
    COALESCE(NEW.intervention_id, OLD.intervention_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql
SET search_path = '';

COMMENT ON FUNCTION inter_app.recalculate_intervention_on_items_change IS
'Trigger to recalculate intervention totals on items change - Secure search_path';
