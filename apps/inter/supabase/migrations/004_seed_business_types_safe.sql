-- ============================================
-- MIGRATION 004: Seeds 6 métiers SAFE
-- Date: 2025-12-04
-- Description: Insère les données pour 6 types de métiers
-- SAFE: Utilise ON CONFLICT DO NOTHING
-- ============================================

-- =============================================
-- 1. BUSINESS TYPES (6 métiers)
-- =============================================

INSERT INTO public.business_types (id, code, name, emoji, color, terminology, default_labor_rate, default_travel_fee, is_active)
VALUES
  -- 🏊 Pisciniste
  (
    '00000000-0000-0000-0001-000000000001',
    'pool_maintenance',
    'Pisciniste',
    '🏊',
    '#00a8ff',
    '{
      "intervention": "Intervention",
      "client": "Client",
      "technician": "Technicien",
      "quote": "Devis",
      "invoice": "Facture",
      "equipment": "Équipement",
      "product": "Produit",
      "service": "Prestation"
    }'::jsonb,
    45.00,
    30.00,
    true
  ),
  -- 🔧 Plomberie
  (
    '00000000-0000-0000-0001-000000000002',
    'plumbing',
    'Plomberie',
    '🔧',
    '#0097e6',
    '{
      "intervention": "Intervention",
      "client": "Client",
      "technician": "Plombier",
      "quote": "Devis",
      "invoice": "Facture",
      "equipment": "Installation",
      "product": "Pièce",
      "service": "Prestation"
    }'::jsonb,
    50.00,
    35.00,
    true
  ),
  -- 🐀 Dératisation
  (
    '00000000-0000-0000-0001-000000000003',
    'pest_control',
    'Dératisation',
    '🐀',
    '#8c7ae6',
    '{
      "intervention": "Intervention",
      "client": "Client",
      "technician": "Technicien",
      "quote": "Devis",
      "invoice": "Facture",
      "equipment": "Équipement",
      "product": "Produit biocide",
      "service": "Traitement"
    }'::jsonb,
    55.00,
    40.00,
    true
  ),
  -- 🚗 Garagiste
  (
    '00000000-0000-0000-0001-000000000004',
    'auto_repair',
    'Garagiste',
    '🚗',
    '#e84118',
    '{
      "intervention": "Intervention",
      "client": "Client",
      "technician": "Mécanicien",
      "quote": "Devis",
      "invoice": "Facture",
      "equipment": "Véhicule",
      "product": "Pièce auto",
      "service": "Réparation"
    }'::jsonb,
    60.00,
    0.00,
    true
  ),
  -- ⚡ Électricien
  (
    '00000000-0000-0000-0001-000000000005',
    'electrical',
    'Électricien',
    '⚡',
    '#fbc531',
    '{
      "intervention": "Intervention",
      "client": "Client",
      "technician": "Électricien",
      "quote": "Devis",
      "invoice": "Facture",
      "equipment": "Installation électrique",
      "product": "Matériel électrique",
      "service": "Prestation"
    }'::jsonb,
    55.00,
    35.00,
    true
  ),
  -- 🌡️ Chauffagiste
  (
    '00000000-0000-0000-0001-000000000006',
    'hvac',
    'Chauffagiste',
    '🌡️',
    '#e74c3c',
    '{
      "intervention": "Intervention",
      "client": "Client",
      "technician": "Technicien",
      "quote": "Devis",
      "invoice": "Facture",
      "equipment": "Installation",
      "product": "Matériel",
      "service": "Prestation"
    }'::jsonb,
    60.00,
    40.00,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 2. INTERVENTION TYPES par métier
-- =============================================

-- 🏊 PISCINISTE (9 types)
INSERT INTO public.intervention_types (id, business_type_id, code, name, description, default_duration, color, emoji, display_order, is_active)
VALUES
  ('10000000-0000-0000-0001-000000000001', '00000000-0000-0000-0001-000000000001', 'pool_maintenance', 'Entretien piscine', 'Entretien courant de la piscine', 120, '#00a8ff', '🏊', 1, true),
  ('10000000-0000-0000-0001-000000000002', '00000000-0000-0000-0001-000000000001', 'pool_opening', 'Mise en service', 'Ouverture/mise en service de piscine', 240, '#4cd137', '🌊', 2, true),
  ('10000000-0000-0000-0001-000000000003', '00000000-0000-0000-0001-000000000001', 'pool_closing', 'Hivernage', 'Hivernage de piscine', 180, '#487eb0', '❄️', 3, true),
  ('10000000-0000-0000-0001-000000000004', '00000000-0000-0000-0001-000000000001', 'pool_repair', 'Réparation', 'Réparation de piscine ou équipement', 180, '#e84118', '🔧', 4, true),
  ('10000000-0000-0000-0001-000000000005', '00000000-0000-0000-0001-000000000001', 'pool_installation', 'Installation équipement', 'Installation d''équipement de piscine', 240, '#8c7ae6', '⚙️', 5, true),
  ('10000000-0000-0000-0001-000000000006', '00000000-0000-0000-0001-000000000001', 'pool_diagnostic', 'Diagnostic', 'Diagnostic de panne ou problème', 90, '#fbc531', '🔍', 6, true),
  ('10000000-0000-0000-0001-000000000007', '00000000-0000-0000-0001-000000000001', 'pool_water_analysis', 'Analyse eau', 'Analyse et traitement de l''eau', 60, '#00d2d3', '💧', 7, true),
  ('10000000-0000-0000-0001-000000000008', '00000000-0000-0000-0001-000000000001', 'pool_cleaning', 'Nettoyage', 'Nettoyage complet de piscine', 180, '#44bd32', '🧹', 8, true),
  ('10000000-0000-0000-0001-000000000009', '00000000-0000-0000-0001-000000000001', 'pool_other', 'Autre', 'Autre type d''intervention', 120, '#7f8fa6', '📋', 9, true)
ON CONFLICT (id) DO NOTHING;

-- 🔧 PLOMBERIE (8 types)
INSERT INTO public.intervention_types (id, business_type_id, code, name, description, default_duration, color, emoji, display_order, is_active)
VALUES
  ('10000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000002', 'plumb_leak_repair', 'Réparation fuite', 'Réparation de fuite d''eau', 120, '#e84118', '💧', 1, true),
  ('10000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000002', 'plumb_unclogging', 'Débouchage', 'Débouchage canalisations', 90, '#4cd137', '🚿', 2, true),
  ('10000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000002', 'plumb_installation', 'Installation', 'Installation sanitaire', 180, '#0097e6', '🔧', 3, true),
  ('10000000-0000-0000-0002-000000000004', '00000000-0000-0000-0001-000000000002', 'plumb_water_heater', 'Chauffe-eau', 'Intervention sur chauffe-eau', 120, '#e74c3c', '🌡️', 4, true),
  ('10000000-0000-0000-0002-000000000005', '00000000-0000-0000-0001-000000000002', 'plumb_boiler', 'Chaudière', 'Intervention sur chaudière', 150, '#f39c12', '🔥', 5, true),
  ('10000000-0000-0000-0002-000000000006', '00000000-0000-0000-0001-000000000002', 'plumb_diagnostic', 'Diagnostic', 'Diagnostic de panne', 60, '#fbc531', '🔍', 6, true),
  ('10000000-0000-0000-0002-000000000007', '00000000-0000-0000-0001-000000000002', 'plumb_maintenance', 'Entretien', 'Entretien préventif', 90, '#44bd32', '⚙️', 7, true),
  ('10000000-0000-0000-0002-000000000008', '00000000-0000-0000-0001-000000000002', 'plumb_other', 'Autre', 'Autre type d''intervention', 120, '#7f8fa6', '📋', 8, true)
ON CONFLICT (id) DO NOTHING;

-- 🐀 DÉRATISATION (7 types)
INSERT INTO public.intervention_types (id, business_type_id, code, name, description, default_duration, color, emoji, display_order, is_active)
VALUES
  ('10000000-0000-0000-0003-000000000001', '00000000-0000-0000-0001-000000000003', 'pest_rat_treatment', 'Traitement rats', 'Dératisation - traitement rats', 120, '#e84118', '🐀', 1, true),
  ('10000000-0000-0000-0003-000000000002', '00000000-0000-0000-0001-000000000003', 'pest_mice_treatment', 'Traitement souris', 'Dératisation - traitement souris', 90, '#e67e22', '🐭', 2, true),
  ('10000000-0000-0000-0003-000000000003', '00000000-0000-0000-0001-000000000003', 'pest_insect_treatment', 'Traitement insectes', 'Désinsectisation', 120, '#27ae60', '🐛', 3, true),
  ('10000000-0000-0000-0003-000000000004', '00000000-0000-0000-0001-000000000003', 'pest_prevention', 'Prévention', 'Intervention préventive', 90, '#3498db', '🛡️', 4, true),
  ('10000000-0000-0000-0003-000000000005', '00000000-0000-0000-0001-000000000003', 'pest_diagnostic', 'Diagnostic', 'Diagnostic infestation', 60, '#fbc531', '🔍', 5, true),
  ('10000000-0000-0000-0003-000000000006', '00000000-0000-0000-0001-000000000003', 'pest_followup', 'Suivi', 'Visite de suivi', 60, '#9b59b6', '📋', 6, true),
  ('10000000-0000-0000-0003-000000000007', '00000000-0000-0000-0001-000000000003', 'pest_other', 'Autre', 'Autre type d''intervention', 90, '#7f8fa6', '📋', 7, true)
ON CONFLICT (id) DO NOTHING;

-- 🚗 GARAGISTE (9 types)
INSERT INTO public.intervention_types (id, business_type_id, code, name, description, default_duration, color, emoji, display_order, is_active)
VALUES
  ('10000000-0000-0000-0004-000000000001', '00000000-0000-0000-0001-000000000004', 'auto_maintenance', 'Entretien', 'Entretien courant du véhicule', 120, '#44bd32', '🔧', 1, true),
  ('10000000-0000-0000-0004-000000000002', '00000000-0000-0000-0001-000000000004', 'auto_repair', 'Réparation', 'Réparation mécanique', 180, '#e84118', '⚙️', 2, true),
  ('10000000-0000-0000-0004-000000000003', '00000000-0000-0000-0001-000000000004', 'auto_diagnostic', 'Diagnostic', 'Diagnostic électronique', 60, '#fbc531', '🔍', 3, true),
  ('10000000-0000-0000-0004-000000000004', '00000000-0000-0000-0001-000000000004', 'auto_tire_change', 'Pneumatiques', 'Changement de pneus', 60, '#2c3e50', '🛞', 4, true),
  ('10000000-0000-0000-0004-000000000005', '00000000-0000-0000-0001-000000000004', 'auto_oil_change', 'Vidange', 'Vidange moteur', 45, '#34495e', '🛢️', 5, true),
  ('10000000-0000-0000-0004-000000000006', '00000000-0000-0000-0001-000000000004', 'auto_brake', 'Freinage', 'Intervention sur freins', 120, '#c0392b', '🛑', 6, true),
  ('10000000-0000-0000-0004-000000000007', '00000000-0000-0000-0001-000000000004', 'auto_bodywork', 'Carrosserie', 'Réparation carrosserie', 240, '#16a085', '🎨', 7, true),
  ('10000000-0000-0000-0004-000000000008', '00000000-0000-0000-0001-000000000004', 'auto_control', 'Contrôle technique', 'Préparation contrôle technique', 90, '#0097e6', '📋', 8, true),
  ('10000000-0000-0000-0004-000000000009', '00000000-0000-0000-0001-000000000004', 'auto_other', 'Autre', 'Autre type d''intervention', 120, '#7f8fa6', '📋', 9, true)
ON CONFLICT (id) DO NOTHING;

-- ⚡ ÉLECTRICIEN (8 types)
INSERT INTO public.intervention_types (id, business_type_id, code, name, description, default_duration, color, emoji, display_order, is_active)
VALUES
  ('10000000-0000-0000-0005-000000000001', '00000000-0000-0000-0001-000000000005', 'elec_installation', 'Installation', 'Installation électrique', 180, '#0097e6', '⚡', 1, true),
  ('10000000-0000-0000-0005-000000000002', '00000000-0000-0000-0001-000000000005', 'elec_repair', 'Réparation', 'Réparation panne électrique', 120, '#e84118', '🔧', 2, true),
  ('10000000-0000-0000-0005-000000000003', '00000000-0000-0000-0001-000000000005', 'elec_diagnostic', 'Diagnostic', 'Diagnostic électrique', 60, '#fbc531', '🔍', 3, true),
  ('10000000-0000-0000-0005-000000000004', '00000000-0000-0000-0001-000000000005', 'elec_panel', 'Tableau électrique', 'Intervention sur tableau', 150, '#2c3e50', '📊', 4, true),
  ('10000000-0000-0000-0005-000000000005', '00000000-0000-0000-0001-000000000005', 'elec_lighting', 'Éclairage', 'Installation/réparation éclairage', 90, '#f39c12', '💡', 5, true),
  ('10000000-0000-0000-0005-000000000006', '00000000-0000-0000-0001-000000000005', 'elec_outlet', 'Prises/Interrupteurs', 'Installation prises et interrupteurs', 60, '#16a085', '🔌', 6, true),
  ('10000000-0000-0000-0005-000000000007', '00000000-0000-0000-0001-000000000005', 'elec_compliance', 'Mise aux normes', 'Mise en conformité électrique', 240, '#9b59b6', '✅', 7, true),
  ('10000000-0000-0000-0005-000000000008', '00000000-0000-0000-0001-000000000005', 'elec_other', 'Autre', 'Autre type d''intervention', 120, '#7f8fa6', '📋', 8, true)
ON CONFLICT (id) DO NOTHING;

-- 🌡️ CHAUFFAGISTE (6 types)
INSERT INTO public.intervention_types (id, business_type_id, code, name, description, default_duration, color, emoji, display_order, is_active)
VALUES
  ('10000000-0000-0000-0006-000000000001', '00000000-0000-0000-0001-000000000006', 'hvac_boiler_maintenance', 'Entretien chaudière', 'Entretien annuel chaudière', 120, '#44bd32', '🔥', 1, true),
  ('10000000-0000-0000-0006-000000000002', '00000000-0000-0000-0001-000000000006', 'hvac_boiler_repair', 'Réparation chaudière', 'Réparation panne chaudière', 150, '#e84118', '🔧', 2, true),
  ('10000000-0000-0000-0006-000000000003', '00000000-0000-0000-0001-000000000006', 'hvac_installation', 'Installation', 'Installation système chauffage', 300, '#0097e6', '⚙️', 3, true),
  ('10000000-0000-0000-0006-000000000004', '00000000-0000-0000-0001-000000000006', 'hvac_radiator', 'Radiateurs', 'Intervention sur radiateurs', 90, '#e67e22', '♨️', 4, true),
  ('10000000-0000-0000-0006-000000000005', '00000000-0000-0000-0001-000000000006', 'hvac_diagnostic', 'Diagnostic', 'Diagnostic de panne', 60, '#fbc531', '🔍', 5, true),
  ('10000000-0000-0000-0006-000000000006', '00000000-0000-0000-0001-000000000006', 'hvac_other', 'Autre', 'Autre type d''intervention', 120, '#7f8fa6', '📋', 6, true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3. PRODUCT CATEGORIES par métier
-- =============================================

-- 🏊 PISCINISTE
INSERT INTO public.product_categories (id, business_type_id, name, description, display_order, is_active)
VALUES
  ('20000000-0000-0000-0001-000000000001', '00000000-0000-0000-0001-000000000001', 'Produits chimiques', 'Chlore, pH, algicides, etc.', 1, true),
  ('20000000-0000-0000-0001-000000000002', '00000000-0000-0000-0001-000000000001', 'Filtration', 'Filtres, pompes, média filtrant', 2, true),
  ('20000000-0000-0000-0001-000000000003', '00000000-0000-0000-0001-000000000001', 'Nettoyage', 'Robots, épuisettes, brosses', 3, true),
  ('20000000-0000-0000-0001-000000000004', '00000000-0000-0000-0001-000000000001', 'Chauffage', 'Pompes à chaleur, réchauffeurs', 4, true),
  ('20000000-0000-0000-0001-000000000005', '00000000-0000-0000-0001-000000000001', 'Main d''oeuvre', 'Prestations de service', 5, true)
ON CONFLICT (id) DO NOTHING;

-- 🔧 PLOMBERIE
INSERT INTO public.product_categories (id, business_type_id, name, description, display_order, is_active)
VALUES
  ('20000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000002', 'Tuyauterie', 'Tubes, raccords, joints', 1, true),
  ('20000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000002', 'Sanitaire', 'WC, lavabos, douches, baignoires', 2, true),
  ('20000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000002', 'Robinetterie', 'Robinets, mitigeurs, vannes', 3, true),
  ('20000000-0000-0000-0002-000000000004', '00000000-0000-0000-0001-000000000002', 'Chauffe-eau', 'Chauffe-eau électrique, gaz, thermodynamique', 4, true),
  ('20000000-0000-0000-0002-000000000005', '00000000-0000-0000-0001-000000000002', 'Main d''oeuvre', 'Prestations de service', 5, true)
ON CONFLICT (id) DO NOTHING;

-- 🐀 DÉRATISATION
INSERT INTO public.product_categories (id, business_type_id, name, description, display_order, is_active)
VALUES
  ('20000000-0000-0000-0003-000000000001', '00000000-0000-0000-0001-000000000003', 'Rodenticides', 'Produits anti-rongeurs', 1, true),
  ('20000000-0000-0000-0003-000000000002', '00000000-0000-0000-0001-000000000003', 'Insecticides', 'Produits anti-insectes', 2, true),
  ('20000000-0000-0000-0003-000000000003', '00000000-0000-0000-0001-000000000003', 'Pièges', 'Pièges mécaniques et collants', 3, true),
  ('20000000-0000-0000-0003-000000000004', '00000000-0000-0000-0001-000000000003', 'Équipement', 'Pulvérisateurs, appâts', 4, true),
  ('20000000-0000-0000-0003-000000000005', '00000000-0000-0000-0001-000000000003', 'Main d''oeuvre', 'Prestations de service', 5, true)
ON CONFLICT (id) DO NOTHING;

-- 🚗 GARAGISTE
INSERT INTO public.product_categories (id, business_type_id, name, description, display_order, is_active)
VALUES
  ('20000000-0000-0000-0004-000000000001', '00000000-0000-0000-0001-000000000004', 'Pièces moteur', 'Filtres, bougies, courroies', 1, true),
  ('20000000-0000-0000-0004-000000000002', '00000000-0000-0000-0001-000000000004', 'Freinage', 'Plaquettes, disques, liquide', 2, true),
  ('20000000-0000-0000-0004-000000000003', '00000000-0000-0000-0001-000000000004', 'Pneumatiques', 'Pneus, jantes, valves', 3, true),
  ('20000000-0000-0000-0004-000000000004', '00000000-0000-0000-0001-000000000004', 'Huiles et fluides', 'Huile moteur, liquide refroidissement', 4, true),
  ('20000000-0000-0000-0004-000000000005', '00000000-0000-0000-0001-000000000004', 'Carrosserie', 'Peinture, pare-chocs, rétroviseurs', 5, true),
  ('20000000-0000-0000-0004-000000000006', '00000000-0000-0000-0001-000000000004', 'Main d''oeuvre', 'Prestations de service', 6, true)
ON CONFLICT (id) DO NOTHING;

-- ⚡ ÉLECTRICIEN
INSERT INTO public.product_categories (id, business_type_id, name, description, display_order, is_active)
VALUES
  ('20000000-0000-0000-0005-000000000001', '00000000-0000-0000-0001-000000000005', 'Câblage', 'Câbles, fils électriques', 1, true),
  ('20000000-0000-0000-0005-000000000002', '00000000-0000-0000-0001-000000000005', 'Tableaux', 'Tableaux électriques, disjoncteurs', 2, true),
  ('20000000-0000-0000-0005-000000000003', '00000000-0000-0000-0001-000000000005', 'Appareillage', 'Prises, interrupteurs, va-et-vient', 3, true),
  ('20000000-0000-0000-0005-000000000004', '00000000-0000-0000-0001-000000000005', 'Éclairage', 'Luminaires, ampoules LED', 4, true),
  ('20000000-0000-0000-0005-000000000005', '00000000-0000-0000-0001-000000000005', 'Protection', 'Parafoudres, différentiels', 5, true),
  ('20000000-0000-0000-0005-000000000006', '00000000-0000-0000-0001-000000000005', 'Main d''oeuvre', 'Prestations de service', 6, true)
ON CONFLICT (id) DO NOTHING;

-- 🌡️ CHAUFFAGISTE
INSERT INTO public.product_categories (id, business_type_id, name, description, display_order, is_active)
VALUES
  ('20000000-0000-0000-0006-000000000001', '00000000-0000-0000-0001-000000000006', 'Chaudières', 'Chaudières gaz, fioul, électrique', 1, true),
  ('20000000-0000-0000-0006-000000000002', '00000000-0000-0000-0001-000000000006', 'Radiateurs', 'Radiateurs eau, électriques', 2, true),
  ('20000000-0000-0000-0006-000000000003', '00000000-0000-0000-0001-000000000006', 'Régulation', 'Thermostats, vannes thermostatiques', 3, true),
  ('20000000-0000-0000-0006-000000000004', '00000000-0000-0000-0001-000000000006', 'Pièces détachées', 'Circulateurs, vases d''expansion', 4, true),
  ('20000000-0000-0000-0006-000000000005', '00000000-0000-0000-0001-000000000006', 'Main d''oeuvre', 'Prestations de service', 5, true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 4. SAMPLE PRODUCTS (2-3 par catégorie pour démo)
-- =============================================

-- 🏊 PISCINISTE - Produits
INSERT INTO public.products (id, business_type_id, category_id, code, name, description, type, unit, unit_price_ht, tax_rate, has_stock, stock_quantity, is_active)
VALUES
  -- Produits chimiques
  ('30000000-0000-0000-0001-000000000001', '00000000-0000-0000-0001-000000000001', '20000000-0000-0000-0001-000000000001', 'CHLORE-GAL-5KG', 'Chlore galet 5kg', 'Chlore lent galet 200g', 'product', 'kg', 35.00, 20.00, true, 50, true),
  ('30000000-0000-0000-0001-000000000002', '00000000-0000-0000-0001-000000000001', '20000000-0000-0000-0001-000000000001', 'PH-MOINS-5KG', 'pH moins 5kg', 'Correcteur pH- granulés', 'product', 'kg', 18.00, 20.00, true, 30, true),
  ('30000000-0000-0000-0001-000000000003', '00000000-0000-0000-0001-000000000001', '20000000-0000-0000-0001-000000000001', 'ALGICIDE-5L', 'Algicide concentré 5L', 'Anti-algues préventif et curatif', 'product', 'L', 45.00, 20.00, true, 20, true),
  -- Filtration
  ('30000000-0000-0000-0001-000000000004', '00000000-0000-0000-0001-000000000001', '20000000-0000-0000-0001-000000000002', 'FILTRE-SABLE-25KG', 'Sable filtrant 25kg', 'Sable filtrant granulométrie 0.4-0.8mm', 'product', 'sac', 15.00, 20.00, true, 100, true),
  ('30000000-0000-0000-0001-000000000005', '00000000-0000-0000-0001-000000000001', '20000000-0000-0000-0001-000000000002', 'POMPE-FILTRATION-1CV', 'Pompe filtration 1CV', 'Pompe centrifuge 1CV 15m³/h', 'product', 'unité', 320.00, 20.00, true, 5, true),
  -- Main d'oeuvre
  ('30000000-0000-0000-0001-000000000006', '00000000-0000-0000-0001-000000000001', '20000000-0000-0000-0001-000000000005', 'MO-TECH-STD', 'Main d''oeuvre technicien', 'Taux horaire technicien standard', 'labor', 'heure', 45.00, 20.00, false, 0, true),
  ('30000000-0000-0000-0001-000000000007', '00000000-0000-0000-0001-000000000001', '20000000-0000-0000-0001-000000000005', 'DEPL-STD', 'Frais de déplacement', 'Frais de déplacement standard', 'service', 'unité', 30.00, 20.00, false, 0, true)
ON CONFLICT (id) DO NOTHING;

-- 🔧 PLOMBERIE - Produits
INSERT INTO public.products (id, business_type_id, category_id, code, name, description, type, unit, unit_price_ht, tax_rate, has_stock, stock_quantity, is_active)
VALUES
  -- Tuyauterie
  ('30000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000002', '20000000-0000-0000-0002-000000000001', 'TUBE-PER-10MM', 'Tube PER Ø10mm', 'Tube PER multicouche Ø10mm', 'product', 'mètre', 2.50, 20.00, true, 200, true),
  ('30000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000002', '20000000-0000-0000-0002-000000000001', 'RACCORD-PER-10MM', 'Raccord PER Ø10mm', 'Raccord à compression PER Ø10mm', 'product', 'unité', 4.50, 20.00, true, 100, true),
  -- Sanitaire
  ('30000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000002', '20000000-0000-0000-0002-000000000002', 'WC-SUSPENDU-STD', 'WC suspendu standard', 'Pack WC suspendu avec bâti', 'product', 'unité', 280.00, 20.00, true, 3, true),
  ('30000000-0000-0000-0002-000000000004', '00000000-0000-0000-0001-000000000002', '20000000-0000-0000-0002-000000000002', 'LAVABO-60CM', 'Lavabo 60cm', 'Lavabo céramique blanc 60cm', 'product', 'unité', 95.00, 20.00, true, 5, true),
  -- Main d'oeuvre
  ('30000000-0000-0000-0002-000000000005', '00000000-0000-0000-0001-000000000002', '20000000-0000-0000-0002-000000000005', 'MO-PLOMB-STD', 'Main d''oeuvre plombier', 'Taux horaire plombier', 'labor', 'heure', 50.00, 20.00, false, 0, true),
  ('30000000-0000-0000-0002-000000000006', '00000000-0000-0000-0001-000000000002', '20000000-0000-0000-0002-000000000005', 'DEPL-STD', 'Frais de déplacement', 'Frais de déplacement', 'service', 'unité', 35.00, 20.00, false, 0, true)
ON CONFLICT (id) DO NOTHING;

-- 🐀 DÉRATISATION - Produits
INSERT INTO public.products (id, business_type_id, category_id, code, name, description, type, unit, unit_price_ht, tax_rate, has_stock, stock_quantity, is_active)
VALUES
  -- Rodenticides
  ('30000000-0000-0000-0003-000000000001', '00000000-0000-0000-0001-000000000003', '20000000-0000-0000-0003-000000000001', 'APPAT-RATS-1KG', 'Appât rats 1kg', 'Appât rodenticide anticoagulant', 'product', 'kg', 25.00, 20.00, true, 20, true),
  ('30000000-0000-0000-0003-000000000002', '00000000-0000-0000-0001-000000000003', '20000000-0000-0000-0003-000000000001', 'BLOC-SOURIS', 'Blocs souris', 'Blocs rodenticides pour souris', 'product', 'boîte', 18.00, 20.00, true, 15, true),
  -- Pièges
  ('30000000-0000-0000-0003-000000000003', '00000000-0000-0000-0001-000000000003', '20000000-0000-0000-0003-000000000003', 'PIEGE-RATS', 'Piège à rats', 'Piège mécanique réutilisable', 'product', 'unité', 12.00, 20.00, true, 30, true),
  ('30000000-0000-0000-0003-000000000004', '00000000-0000-0000-0001-000000000003', '20000000-0000-0000-0003-000000000003', 'PIEGE-COLLANT', 'Piège collant', 'Plaque collante anti-rongeurs', 'product', 'unité', 3.50, 20.00, true, 50, true),
  -- Main d'oeuvre
  ('30000000-0000-0000-0003-000000000005', '00000000-0000-0000-0001-000000000003', '20000000-0000-0000-0003-000000000005', 'MO-TECH-STD', 'Main d''oeuvre technicien', 'Taux horaire technicien', 'labor', 'heure', 55.00, 20.00, false, 0, true),
  ('30000000-0000-0000-0003-000000000006', '00000000-0000-0000-0001-000000000003', '20000000-0000-0000-0003-000000000005', 'DEPL-STD', 'Frais de déplacement', 'Frais de déplacement', 'service', 'unité', 40.00, 20.00, false, 0, true)
ON CONFLICT (id) DO NOTHING;

-- 🚗 GARAGISTE - Produits
INSERT INTO public.products (id, business_type_id, category_id, code, name, description, type, unit, unit_price_ht, tax_rate, has_stock, stock_quantity, is_active)
VALUES
  -- Pièces moteur
  ('30000000-0000-0000-0004-000000000001', '00000000-0000-0000-0001-000000000004', '20000000-0000-0000-0004-000000000001', 'FILTRE-HUILE-STD', 'Filtre à huile', 'Filtre à huile standard', 'product', 'unité', 8.50, 20.00, true, 50, true),
  ('30000000-0000-0000-0004-000000000002', '00000000-0000-0000-0001-000000000004', '20000000-0000-0000-0004-000000000001', 'COURROIE-DISTRIB', 'Courroie de distribution', 'Kit courroie distribution avec pompe', 'product', 'kit', 145.00, 20.00, true, 10, true),
  -- Freinage
  ('30000000-0000-0000-0004-000000000003', '00000000-0000-0000-0001-000000000004', '20000000-0000-0000-0004-000000000002', 'PLAQUETTES-AV', 'Plaquettes avant', 'Jeu plaquettes de frein avant', 'product', 'jeu', 35.00, 20.00, true, 20, true),
  ('30000000-0000-0000-0004-000000000004', '00000000-0000-0000-0001-000000000004', '20000000-0000-0000-0004-000000000002', 'DISQUES-AV', 'Disques de frein avant', 'Paire disques de frein avant', 'product', 'paire', 65.00, 20.00, true, 15, true),
  -- Huiles
  ('30000000-0000-0000-0004-000000000005', '00000000-0000-0000-0001-000000000004', '20000000-0000-0000-0004-000000000004', 'HUILE-5W30-5L', 'Huile moteur 5W30 5L', 'Huile synthétique 5W30', 'product', 'bidon', 42.00, 20.00, true, 30, true),
  -- Main d'oeuvre
  ('30000000-0000-0000-0004-000000000006', '00000000-0000-0000-0001-000000000004', '20000000-0000-0000-0004-000000000006', 'MO-MECA-STD', 'Main d''oeuvre mécanicien', 'Taux horaire mécanicien', 'labor', 'heure', 60.00, 20.00, false, 0, true)
ON CONFLICT (id) DO NOTHING;

-- ⚡ ÉLECTRICIEN - Produits
INSERT INTO public.products (id, business_type_id, category_id, code, name, description, type, unit, unit_price_ht, tax_rate, has_stock, stock_quantity, is_active)
VALUES
  -- Câblage
  ('30000000-0000-0000-0005-000000000001', '00000000-0000-0000-0001-000000000005', '20000000-0000-0000-0005-000000000001', 'CABLE-1.5MM2', 'Câble 1.5mm²', 'Câble rigide H07VU 1.5mm²', 'product', 'mètre', 0.85, 20.00, true, 500, true),
  ('30000000-0000-0000-0005-000000000002', '00000000-0000-0000-0001-000000000005', '20000000-0000-0000-0005-000000000001', 'CABLE-2.5MM2', 'Câble 2.5mm²', 'Câble rigide H07VU 2.5mm²', 'product', 'mètre', 1.20, 20.00, true, 300, true),
  -- Appareillage
  ('30000000-0000-0000-0005-000000000003', '00000000-0000-0000-0001-000000000005', '20000000-0000-0000-0005-000000000003', 'PRISE-16A', 'Prise 16A', 'Prise 2P+T 16A encastrée', 'product', 'unité', 3.50, 20.00, true, 100, true),
  ('30000000-0000-0000-0005-000000000004', '00000000-0000-0000-0001-000000000005', '20000000-0000-0000-0005-000000000003', 'INTER-SIMPLE', 'Interrupteur simple', 'Interrupteur va-et-vient 10A', 'product', 'unité', 2.80, 20.00, true, 80, true),
  -- Tableaux
  ('30000000-0000-0000-0005-000000000005', '00000000-0000-0000-0001-000000000005', '20000000-0000-0000-0005-000000000002', 'DISJ-20A', 'Disjoncteur 20A', 'Disjoncteur divisionnaire 20A', 'product', 'unité', 12.00, 20.00, true, 50, true),
  -- Main d'oeuvre
  ('30000000-0000-0000-0005-000000000006', '00000000-0000-0000-0001-000000000005', '20000000-0000-0000-0005-000000000006', 'MO-ELEC-STD', 'Main d''oeuvre électricien', 'Taux horaire électricien', 'labor', 'heure', 55.00, 20.00, false, 0, true),
  ('30000000-0000-0000-0005-000000000007', '00000000-0000-0000-0001-000000000005', '20000000-0000-0000-0005-000000000006', 'DEPL-STD', 'Frais de déplacement', 'Frais de déplacement', 'service', 'unité', 35.00, 20.00, false, 0, true)
ON CONFLICT (id) DO NOTHING;

-- 🌡️ CHAUFFAGISTE - Produits
INSERT INTO public.products (id, business_type_id, category_id, code, name, description, type, unit, unit_price_ht, tax_rate, has_stock, stock_quantity, is_active)
VALUES
  -- Pièces détachées
  ('30000000-0000-0000-0006-000000000001', '00000000-0000-0000-0001-000000000006', '20000000-0000-0000-0006-000000000004', 'CIRCULATEUR', 'Circulateur', 'Circulateur chauffage classe A', 'product', 'unité', 185.00, 20.00, true, 5, true),
  ('30000000-0000-0000-0006-000000000002', '00000000-0000-0000-0001-000000000006', '20000000-0000-0000-0006-000000000004', 'VASE-EXPANSION-18L', 'Vase expansion 18L', 'Vase d''expansion 18L chauffage', 'product', 'unité', 45.00, 20.00, true, 8, true),
  -- Régulation
  ('30000000-0000-0000-0006-000000000003', '00000000-0000-0000-0001-000000000006', '20000000-0000-0000-0006-000000000003', 'THERMOSTAT-PROG', 'Thermostat programmable', 'Thermostat d''ambiance programmable', 'product', 'unité', 85.00, 20.00, true, 10, true),
  ('30000000-0000-0000-0006-000000000004', '00000000-0000-0000-0001-000000000006', '20000000-0000-0000-0006-000000000003', 'VANNE-THERMO', 'Vanne thermostatique', 'Tête thermostatique de radiateur', 'product', 'unité', 22.00, 20.00, true, 20, true),
  -- Main d'oeuvre
  ('30000000-0000-0000-0006-000000000005', '00000000-0000-0000-0001-000000000006', '20000000-0000-0000-0006-000000000005', 'MO-CHAUFF-STD', 'Main d''oeuvre chauffagiste', 'Taux horaire chauffagiste', 'labor', 'heure', 60.00, 20.00, false, 0, true),
  ('30000000-0000-0000-0006-000000000006', '00000000-0000-0000-0001-000000000006', '20000000-0000-0000-0006-000000000005', 'DEPL-STD', 'Frais de déplacement', 'Frais de déplacement', 'service', 'unité', 40.00, 20.00, false, 0, true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- FIN MIGRATION 004
-- =============================================

-- Afficher un résumé
DO $$
DECLARE
  v_business_types INTEGER;
  v_intervention_types INTEGER;
  v_categories INTEGER;
  v_products INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_business_types FROM public.business_types;
  SELECT COUNT(*) INTO v_intervention_types FROM public.intervention_types;
  SELECT COUNT(*) INTO v_categories FROM public.product_categories;
  SELECT COUNT(*) INTO v_products FROM public.products;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION 004 COMPLETED SUCCESSFULLY';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ % types de métiers insérés', v_business_types;
  RAISE NOTICE '✅ % types d''interventions insérés', v_intervention_types;
  RAISE NOTICE '✅ % catégories de produits insérées', v_categories;
  RAISE NOTICE '✅ % produits exemple insérés', v_products;
  RAISE NOTICE '============================================';
  RAISE NOTICE '🏊 Pisciniste - 9 types intervention, 5 catégories';
  RAISE NOTICE '🔧 Plomberie - 8 types intervention, 5 catégories';
  RAISE NOTICE '🐀 Dératisation - 7 types intervention, 5 catégories';
  RAISE NOTICE '🚗 Garagiste - 9 types intervention, 6 catégories';
  RAISE NOTICE '⚡ Électricien - 8 types intervention, 6 catégories';
  RAISE NOTICE '🌡️ Chauffagiste - 6 types intervention, 5 catégories';
  RAISE NOTICE '============================================';
END $$;
