-- ============================================
-- SEED: Business Types & Intervention Types
-- Date: 2025-12-04
-- Description: Données initiales pour les 6 métiers supportés
-- ============================================

-- =============================================
-- SEED: business_types
-- =============================================

INSERT INTO business_types (code, name, description, emoji, color, terminology, default_labor_rate, default_travel_fee, default_tax_rate) VALUES

-- 1. Pisciniste
('pool_maintenance', 'Pisciniste', 'Maintenance, réparation et installation de piscines et spas', '🏊', '#0EA5E9', '{
  "intervention": "Intervention",
  "client": "Client",
  "technician": "Pisciniste",
  "quote": "Devis",
  "invoice": "Facture",
  "product": "Produit",
  "service": "Prestation"
}'::jsonb, 45.00, 50.00, 20.00),

-- 2. Plomberie
('plumbing', 'Plomberie', 'Dépannage, installation et rénovation plomberie', '🔧', '#1E40AF', '{
  "intervention": "Dépannage",
  "client": "Client",
  "technician": "Plombier",
  "quote": "Devis",
  "invoice": "Facture",
  "product": "Fourniture",
  "service": "Prestation"
}'::jsonb, 50.00, 40.00, 20.00),

-- 3. Dératisation / Désinsectisation
('pest_control', 'Dératisation', 'Dératisation, désinsectisation et prévention nuisibles', '🐀', '#10B981', '{
  "intervention": "Traitement",
  "client": "Site",
  "technician": "Technicien",
  "quote": "Devis",
  "invoice": "Facture",
  "product": "Produit",
  "service": "Traitement"
}'::jsonb, 55.00, 35.00, 20.00),

-- 4. Garagiste / Mécanique auto
('auto_repair', 'Garagiste', 'Entretien et réparation de véhicules', '🚗', '#EF4444', '{
  "intervention": "Réparation",
  "client": "Propriétaire",
  "technician": "Mécanicien",
  "quote": "Devis",
  "invoice": "Facture",
  "product": "Pièce",
  "service": "Prestation"
}'::jsonb, 60.00, 0.00, 20.00),

-- 5. Électricien
('electrical', 'Électricien', 'Installation électrique, dépannage et mise aux normes', '⚡', '#F59E0B', '{
  "intervention": "Intervention",
  "client": "Client",
  "technician": "Électricien",
  "quote": "Devis",
  "invoice": "Facture",
  "product": "Matériel",
  "service": "Prestation"
}'::jsonb, 55.00, 45.00, 20.00),

-- 6. Chauffagiste / Climatisation
('hvac', 'Chauffagiste', 'Chauffage, climatisation et ventilation', '🌡️', '#F97316', '{
  "intervention": "Intervention",
  "client": "Client",
  "technician": "Technicien",
  "quote": "Devis",
  "invoice": "Facture",
  "product": "Équipement",
  "service": "Prestation"
}'::jsonb, 58.00, 42.00, 20.00);

-- =============================================
-- SEED: intervention_types - PISCINISTE
-- =============================================

INSERT INTO intervention_types (business_type_id, code, name, description, emoji, color, requires_quote, default_duration, default_priority, display_order, is_active) VALUES

-- Pisciniste
((SELECT id FROM business_types WHERE code = 'pool_maintenance'), 'maintenance', 'Entretien', 'Entretien régulier de piscine', '🔧', 'blue', false, 120, 'medium', 1, true),
((SELECT id FROM business_types WHERE code = 'pool_maintenance'), 'repair', 'Réparation', 'Réparation d''équipements', '🛠️', 'orange', true, 180, 'high', 2, true),
((SELECT id FROM business_types WHERE code = 'pool_maintenance'), 'installation', 'Installation', 'Installation d''équipements neufs', '⚙️', 'purple', true, 240, 'medium', 3, true),
((SELECT id FROM business_types WHERE code = 'pool_maintenance'), 'emergency', 'Urgence', 'Intervention d''urgence', '🚨', 'red', false, 90, 'urgent', 4, true),
((SELECT id FROM business_types WHERE code = 'pool_maintenance'), 'diagnostic', 'Diagnostic', 'Diagnostic technique', '🔍', 'green', false, 60, 'medium', 5, true),
((SELECT id FROM business_types WHERE code = 'pool_maintenance'), 'cleaning', 'Nettoyage', 'Nettoyage complet', '🧹', 'cyan', false, 150, 'low', 6, true),
((SELECT id FROM business_types WHERE code = 'pool_maintenance'), 'winterization', 'Hivernage', 'Mise en hivernage', '❄️', 'indigo', false, 120, 'medium', 7, true),
((SELECT id FROM business_types WHERE code = 'pool_maintenance'), 'startup', 'Remise en service', 'Remise en route après hivernage', '🌊', 'teal', false, 120, 'medium', 8, true),
((SELECT id FROM business_types WHERE code = 'pool_maintenance'), 'other', 'Autre', 'Autre type d''intervention', '📋', 'gray', false, 60, 'low', 9, true);

-- =============================================
-- SEED: intervention_types - PLOMBERIE
-- =============================================

INSERT INTO intervention_types (business_type_id, code, name, description, emoji, color, requires_quote, default_duration, default_priority, display_order, is_active) VALUES

((SELECT id FROM business_types WHERE code = 'plumbing'), 'emergency', 'Dépannage urgence', 'Fuite, canalisation bouchée, etc.', '🚰', 'red', false, 90, 'urgent', 1, true),
((SELECT id FROM business_types WHERE code = 'plumbing'), 'maintenance', 'Entretien', 'Entretien préventif', '🔧', 'blue', false, 120, 'medium', 2, true),
((SELECT id FROM business_types WHERE code = 'plumbing'), 'installation', 'Installation', 'Pose d''équipements sanitaires', '⚙️', 'purple', true, 240, 'medium', 3, true),
((SELECT id FROM business_types WHERE code = 'plumbing'), 'renovation', 'Rénovation', 'Rénovation salle de bain, cuisine', '🛠️', 'orange', true, 480, 'medium', 4, true),
((SELECT id FROM business_types WHERE code = 'plumbing'), 'diagnostic', 'Diagnostic', 'Recherche de fuite, diagnostic', '🔍', 'green', false, 60, 'high', 5, true),
((SELECT id FROM business_types WHERE code = 'plumbing'), 'replacement', 'Remplacement', 'Remplacement d''équipements', '🚿', 'cyan', true, 180, 'medium', 6, true);

-- =============================================
-- SEED: intervention_types - DÉRATISATION
-- =============================================

INSERT INTO intervention_types (business_type_id, code, name, description, emoji, color, requires_quote, default_duration, default_priority, display_order, is_active) VALUES

((SELECT id FROM business_types WHERE code = 'pest_control'), 'rodent_control', 'Dératisation', 'Traitement contre rongeurs', '🐀', 'gray', false, 120, 'high', 1, true),
((SELECT id FROM business_types WHERE code = 'pest_control'), 'insect_control', 'Désinsectisation', 'Traitement contre insectes', '🦟', 'green', false, 90, 'high', 2, true),
((SELECT id FROM business_types WHERE code = 'pest_control'), 'inspection', 'Diagnostic', 'Inspection et diagnostic', '🔍', 'blue', false, 60, 'medium', 3, true),
((SELECT id FROM business_types WHERE code = 'pest_control'), 'prevention', 'Prévention', 'Mise en place mesures préventives', '🛡️', 'teal', true, 120, 'medium', 4, true),
((SELECT id FROM business_types WHERE code = 'pest_control'), 'monitoring', 'Suivi', 'Suivi et contrôle récurrent', '📊', 'cyan', false, 45, 'low', 5, true),
((SELECT id FROM business_types WHERE code = 'pest_control'), 'sanitation', 'Nettoyage sanitaire', 'Désinfection et nettoyage', '🧹', 'purple', false, 150, 'medium', 6, true);

-- =============================================
-- SEED: intervention_types - GARAGISTE
-- =============================================

INSERT INTO intervention_types (business_type_id, code, name, description, emoji, color, requires_quote, default_duration, default_priority, display_order, is_active) VALUES

((SELECT id FROM business_types WHERE code = 'auto_repair'), 'maintenance', 'Entretien', 'Révision, vidange, filtres', '🔧', 'blue', false, 90, 'medium', 1, true),
((SELECT id FROM business_types WHERE code = 'auto_repair'), 'repair', 'Réparation', 'Réparation mécanique, électrique', '🛠️', 'orange', true, 240, 'high', 2, true),
((SELECT id FROM business_types WHERE code = 'auto_repair'), 'diagnostic', 'Diagnostic', 'Diagnostic électronique', '🔍', 'green', false, 60, 'high', 3, true),
((SELECT id FROM business_types WHERE code = 'auto_repair'), 'parts_replacement', 'Remplacement pièces', 'Freins, batterie, pneus, etc.', '⚙️', 'purple', true, 120, 'medium', 4, true),
((SELECT id FROM business_types WHERE code = 'auto_repair'), 'inspection', 'Contrôle technique', 'Préparation contrôle technique', '🛡️', 'teal', false, 90, 'medium', 5, true),
((SELECT id FROM business_types WHERE code = 'auto_repair'), 'bodywork', 'Carrosserie', 'Réparation carrosserie, peinture', '🎨', 'red', true, 480, 'low', 6, true);

-- =============================================
-- SEED: intervention_types - ÉLECTRICIEN
-- =============================================

INSERT INTO intervention_types (business_type_id, code, name, description, emoji, color, requires_quote, default_duration, default_priority, display_order, is_active) VALUES

((SELECT id FROM business_types WHERE code = 'electrical'), 'installation', 'Installation', 'Installation électrique complète', '🔌', 'purple', true, 480, 'medium', 1, true),
((SELECT id FROM business_types WHERE code = 'electrical'), 'emergency', 'Dépannage', 'Panne électrique, court-circuit', '⚡', 'red', false, 90, 'urgent', 2, true),
((SELECT id FROM business_types WHERE code = 'electrical'), 'compliance', 'Mise aux normes', 'Mise en conformité NF C 15-100', '⚙️', 'orange', true, 360, 'high', 3, true),
((SELECT id FROM business_types WHERE code = 'electrical'), 'renovation', 'Rénovation', 'Rénovation installation électrique', '🛠️', 'blue', true, 360, 'medium', 4, true),
((SELECT id FROM business_types WHERE code = 'electrical'), 'diagnostic', 'Diagnostic', 'Diagnostic électrique obligatoire', '🔍', 'green', false, 120, 'medium', 5, true),
((SELECT id FROM business_types WHERE code = 'electrical'), 'home_automation', 'Domotique', 'Installation système domotique', '🏠', 'cyan', true, 240, 'low', 6, true);

-- =============================================
-- SEED: intervention_types - CHAUFFAGISTE
-- =============================================

INSERT INTO intervention_types (business_type_id, code, name, description, emoji, color, requires_quote, default_duration, default_priority, display_order, is_active) VALUES

((SELECT id FROM business_types WHERE code = 'hvac'), 'boiler_maintenance', 'Entretien chaudière', 'Entretien annuel obligatoire', '🔥', 'orange', false, 90, 'medium', 1, true),
((SELECT id FROM business_types WHERE code = 'hvac'), 'ac_maintenance', 'Entretien climatisation', 'Entretien système climatisation', '❄️', 'cyan', false, 90, 'medium', 2, true),
((SELECT id FROM business_types WHERE code = 'hvac'), 'installation', 'Installation', 'Installation chauffage/clim', '⚙️', 'purple', true, 480, 'medium', 3, true),
((SELECT id FROM business_types WHERE code = 'hvac'), 'emergency', 'Dépannage', 'Panne chauffage/climatisation', '🚨', 'red', false, 120, 'urgent', 4, true),
((SELECT id FROM business_types WHERE code = 'hvac'), 'chimney_sweeping', 'Ramonage', 'Ramonage conduit cheminée', '🧹', 'gray', false, 60, 'medium', 5, true),
((SELECT id FROM business_types WHERE code = 'hvac'), 'energy_audit', 'Diagnostic énergétique', 'Audit performance énergétique', '📊', 'green', true, 180, 'low', 6, true);

-- =============================================
-- SEED: product_categories (exemples par métier)
-- =============================================

-- Catégories Pisciniste
INSERT INTO product_categories (business_type_id, parent_id, name, description, icon, display_order) VALUES
((SELECT id FROM business_types WHERE code = 'pool_maintenance'), NULL, 'Produits chimiques', 'Chlore, pH, algicides', '🧪', 1),
((SELECT id FROM business_types WHERE code = 'pool_maintenance'), NULL, 'Équipements', 'Pompes, filtres, robots', '⚙️', 2),
((SELECT id FROM business_types WHERE code = 'pool_maintenance'), NULL, 'Accessoires', 'Épuisettes, brosses, thermomètres', '🛠️', 3);

-- Catégories Plomberie
INSERT INTO product_categories (business_type_id, parent_id, name, description, icon, display_order) VALUES
((SELECT id FROM business_types WHERE code = 'plumbing'), NULL, 'Robinetterie', 'Robinets, mitigeurs', '🚰', 1),
((SELECT id FROM business_types WHERE code = 'plumbing'), NULL, 'Tuyauterie', 'Tuyaux, raccords, PER', '🔧', 2),
((SELECT id FROM business_types WHERE code = 'plumbing'), NULL, 'Sanitaires', 'Lavabos, WC, baignoires', '🚽', 3),
((SELECT id FROM business_types WHERE code = 'plumbing'), NULL, 'Chauffe-eau', 'Cumulus, chauffe-eau instantané', '🔥', 4);

-- Catégories Dératisation
INSERT INTO product_categories (business_type_id, parent_id, name, description, icon, display_order) VALUES
((SELECT id FROM business_types WHERE code = 'pest_control'), NULL, 'Rodenticides', 'Produits anti-rongeurs', '🐀', 1),
((SELECT id FROM business_types WHERE code = 'pest_control'), NULL, 'Insecticides', 'Produits anti-insectes', '🦟', 2),
((SELECT id FROM business_types WHERE code = 'pest_control'), NULL, 'Pièges', 'Pièges et appâts', '🪤', 3),
((SELECT id FROM business_types WHERE code = 'pest_control'), NULL, 'Équipements', 'Pulvérisateurs, protections', '🛡️', 4);

-- Catégories Garagiste
INSERT INTO product_categories (business_type_id, parent_id, name, description, icon, display_order) VALUES
((SELECT id FROM business_types WHERE code = 'auto_repair'), NULL, 'Huiles et filtres', 'Huile moteur, filtres', '🛢️', 1),
((SELECT id FROM business_types WHERE code = 'auto_repair'), NULL, 'Freinage', 'Plaquettes, disques, liquide', '🛑', 2),
((SELECT id FROM business_types WHERE code = 'auto_repair'), NULL, 'Pneumatiques', 'Pneus, valves', '🛞', 3),
((SELECT id FROM business_types WHERE code = 'auto_repair'), NULL, 'Batteries', 'Batteries auto', '🔋', 4),
((SELECT id FROM business_types WHERE code = 'auto_repair'), NULL, 'Pièces mécaniques', 'Courroies, bougies, etc.', '⚙️', 5);

-- Catégories Électricien
INSERT INTO product_categories (business_type_id, parent_id, name, description, icon, display_order) VALUES
((SELECT id FROM business_types WHERE code = 'electrical'), NULL, 'Câblage', 'Câbles, fils électriques', '🔌', 1),
((SELECT id FROM business_types WHERE code = 'electrical'), NULL, 'Tableaux', 'Tableaux électriques, disjoncteurs', '⚡', 2),
((SELECT id FROM business_types WHERE code = 'electrical'), NULL, 'Appareillage', 'Prises, interrupteurs', '🔘', 3),
((SELECT id FROM business_types WHERE code = 'electrical'), NULL, 'Luminaires', 'Éclairage LED, appliques', '💡', 4),
((SELECT id FROM business_types WHERE code = 'electrical'), NULL, 'Domotique', 'Systèmes connectés', '🏠', 5);

-- Catégories Chauffagiste
INSERT INTO product_categories (business_type_id, parent_id, name, description, icon, display_order) VALUES
((SELECT id FROM business_types WHERE code = 'hvac'), NULL, 'Chaudières', 'Chaudières gaz, fioul, électriques', '🔥', 1),
((SELECT id FROM business_types WHERE code = 'hvac'), NULL, 'Climatisation', 'Climatiseurs, PAC', '❄️', 2),
((SELECT id FROM business_types WHERE code = 'hvac'), NULL, 'Radiateurs', 'Radiateurs eau, électriques', '🌡️', 3),
((SELECT id FROM business_types WHERE code = 'hvac'), NULL, 'Thermostats', 'Thermostats programmables', '🎛️', 4),
((SELECT id FROM business_types WHERE code = 'hvac'), NULL, 'Accessoires', 'Vannes, circulateurs, tuyaux', '⚙️', 5);

-- =============================================
-- SEED: products (quelques exemples par métier)
-- =============================================

-- Produits Pisciniste
INSERT INTO products (business_type_id, category_id, code, name, description, type, unit, unit_price_ht, tax_rate, has_stock, is_active) VALUES
((SELECT id FROM business_types WHERE code = 'pool_maintenance'), (SELECT id FROM product_categories WHERE name = 'Produits chimiques' AND business_type_id = (SELECT id FROM business_types WHERE code = 'pool_maintenance')), 'CHLORE-5KG', 'Chlore choc 5kg', 'Traitement choc chlore granulés', 'product', 'unité', 35.00, 20.00, true, true),
((SELECT id FROM business_types WHERE code = 'pool_maintenance'), (SELECT id FROM product_categories WHERE name = 'Produits chimiques' AND business_type_id = (SELECT id FROM business_types WHERE code = 'pool_maintenance')), 'PH-MOINS', 'pH moins 5kg', 'Correcteur pH moins', 'product', 'unité', 22.00, 20.00, true, true),
((SELECT id FROM business_types WHERE code = 'pool_maintenance'), (SELECT id FROM product_categories WHERE name = 'Équipements' AND business_type_id = (SELECT id FROM business_types WHERE code = 'pool_maintenance')), 'POMPE-1CV', 'Pompe filtration 1CV', 'Pompe de filtration 1 cheval', 'product', 'unité', 280.00, 20.00, true, true),
((SELECT id FROM business_types WHERE code = 'pool_maintenance'), NULL, 'MO-ENTRETIEN', 'Main d''œuvre entretien', 'Heure de main d''œuvre', 'labor', 'heure', 45.00, 20.00, false, true);

-- Produits Plomberie
INSERT INTO products (business_type_id, category_id, code, name, description, type, unit, unit_price_ht, tax_rate, has_stock, is_active) VALUES
((SELECT id FROM business_types WHERE code = 'plumbing'), (SELECT id FROM product_categories WHERE name = 'Robinetterie' AND business_type_id = (SELECT id FROM business_types WHERE code = 'plumbing')), 'MITI-EVIER', 'Mitigeur évier', 'Mitigeur chromé pour évier', 'product', 'unité', 65.00, 20.00, true, true),
((SELECT id FROM business_types WHERE code = 'plumbing'), (SELECT id FROM product_categories WHERE name = 'Tuyauterie' AND business_type_id = (SELECT id FROM business_types WHERE code = 'plumbing')), 'PER-12MM', 'Tube PER 12mm', 'Tube PER 12mm au mètre', 'product', 'mètre', 1.50, 20.00, true, true),
((SELECT id FROM business_types WHERE code = 'plumbing'), NULL, 'MO-DEPANNAGE', 'Main d''œuvre dépannage', 'Heure de dépannage', 'labor', 'heure', 50.00, 20.00, false, true),
((SELECT id FROM business_types WHERE code = 'plumbing'), NULL, 'DEPL-URGENCE', 'Déplacement urgence', 'Frais déplacement urgence', 'service', 'forfait', 70.00, 20.00, false, true);

-- Produits Dératisation
INSERT INTO products (business_type_id, category_id, code, name, description, type, unit, unit_price_ht, tax_rate, has_stock, is_active) VALUES
((SELECT id FROM business_types WHERE code = 'pest_control'), (SELECT id FROM product_categories WHERE name = 'Rodenticides' AND business_type_id = (SELECT id FROM business_types WHERE code = 'pest_control')), 'RAT-BLOC', 'Blocs rodenticides', 'Blocs appâts anti-rongeurs', 'product', 'kg', 18.00, 20.00, true, true),
((SELECT id FROM business_types WHERE code = 'pest_control'), (SELECT id FROM product_categories WHERE name = 'Insecticides' AND business_type_id = (SELECT id FROM business_types WHERE code = 'pest_control')), 'INSECT-GEL', 'Gel insecticide', 'Gel anti-cafards et fourmis', 'product', 'tube', 25.00, 20.00, true, true),
((SELECT id FROM business_types WHERE code = 'pest_control'), NULL, 'TRAIT-RAT-50M2', 'Traitement dératisation 50m²', 'Traitement complet dératisation', 'service', 'forfait', 120.00, 20.00, false, true);

-- Produits Garagiste
INSERT INTO products (business_type_id, category_id, code, name, description, type, unit, unit_price_ht, tax_rate, has_stock, is_active) VALUES
((SELECT id FROM business_types WHERE code = 'auto_repair'), (SELECT id FROM product_categories WHERE name = 'Huiles et filtres' AND business_type_id = (SELECT id FROM business_types WHERE code = 'auto_repair')), 'HUILE-5W30', 'Huile 5W30 1L', 'Huile moteur synthétique', 'product', 'litre', 12.00, 20.00, true, true),
((SELECT id FROM business_types WHERE code = 'auto_repair'), (SELECT id FROM product_categories WHERE name = 'Huiles et filtres' AND business_type_id = (SELECT id FROM business_types WHERE code = 'auto_repair')), 'FILTRE-HUILE', 'Filtre à huile', 'Filtre à huile universel', 'product', 'unité', 8.50, 20.00, true, true),
((SELECT id FROM business_types WHERE code = 'auto_repair'), NULL, 'MO-MECA', 'Main d''œuvre mécanique', 'Heure de travail mécanique', 'labor', 'heure', 60.00, 20.00, false, true);

-- Produits Électricien
INSERT INTO products (business_type_id, category_id, code, name, description, type, unit, unit_price_ht, tax_rate, has_stock, is_active) VALUES
((SELECT id FROM business_types WHERE code = 'electrical'), (SELECT id FROM product_categories WHERE name = 'Câblage' AND business_type_id = (SELECT id FROM business_types WHERE code = 'electrical')), 'CABLE-2.5', 'Câble 2.5mm²', 'Câble électrique 2.5mm² au mètre', 'product', 'mètre', 1.80, 20.00, true, true),
((SELECT id FROM business_types WHERE code = 'electrical'), (SELECT id FROM product_categories WHERE name = 'Tableaux' AND business_type_id = (SELECT id FROM business_types WHERE code = 'electrical')), 'DISJ-20A', 'Disjoncteur 20A', 'Disjoncteur modulaire 20A', 'product', 'unité', 15.00, 20.00, true, true),
((SELECT id FROM business_types WHERE code = 'electrical'), NULL, 'MO-ELEC', 'Main d''œuvre électricité', 'Heure de travail électricité', 'labor', 'heure', 55.00, 20.00, false, true);

-- Produits Chauffagiste
INSERT INTO products (business_type_id, category_id, code, name, description, type, unit, unit_price_ht, tax_rate, has_stock, is_active) VALUES
((SELECT id FROM business_types WHERE code = 'hvac'), (SELECT id FROM product_categories WHERE name = 'Chaudières' AND business_type_id = (SELECT id FROM business_types WHERE code = 'hvac')), 'CHAUD-GAZ-24KW', 'Chaudière gaz 24kW', 'Chaudière murale gaz condensation', 'product', 'unité', 1200.00, 20.00, true, true),
((SELECT id FROM business_types WHERE code = 'hvac'), (SELECT id FROM product_categories WHERE name = 'Thermostats' AND business_type_id = (SELECT id FROM business_types WHERE code = 'hvac')), 'THERMO-PROG', 'Thermostat programmable', 'Thermostat digital programmable', 'product', 'unité', 85.00, 20.00, true, true),
((SELECT id FROM business_types WHERE code = 'hvac'), NULL, 'ENTRET-CHAUD', 'Entretien chaudière', 'Entretien annuel chaudière', 'service', 'forfait', 95.00, 20.00, false, true),
((SELECT id FROM business_types WHERE code = 'hvac'), NULL, 'MO-CHAUF', 'Main d''œuvre chauffage', 'Heure de travail chauffage', 'labor', 'heure', 58.00, 20.00, false, true);

-- =============================================
-- FIN DES SEEDS
-- =============================================

-- Afficher un résumé des données insérées
DO $$
DECLARE
  v_business_types INTEGER;
  v_intervention_types INTEGER;
  v_product_categories INTEGER;
  v_products INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_business_types FROM business_types;
  SELECT COUNT(*) INTO v_intervention_types FROM intervention_types;
  SELECT COUNT(*) INTO v_product_categories FROM product_categories;
  SELECT COUNT(*) INTO v_products FROM products;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'SEED COMPLETED SUCCESSFULLY';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Business types inserted: %', v_business_types;
  RAISE NOTICE 'Intervention types inserted: %', v_intervention_types;
  RAISE NOTICE 'Product categories inserted: %', v_product_categories;
  RAISE NOTICE 'Products inserted: %', v_products;
  RAISE NOTICE '============================================';
END $$;
