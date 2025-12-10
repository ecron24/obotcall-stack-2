-- ============================================
-- MIGRATION 010: Mise à jour types d'intervention détaillés
-- Date: 2025-12-10
-- Description: Remplace les types d'intervention génériques par des types détaillés
--              pour les 5 métiers (Plombier/Chauffagiste, Pisciniste, Dératisation, Garagiste, Électricien)
-- ============================================

-- =============================================
-- SUPPRESSION DES ANCIENS TYPES D'INTERVENTION
-- =============================================

-- 🏊 Pisciniste - Supprimer les anciens types
DELETE FROM public.intervention_types
WHERE business_type_id = '00000000-0000-0000-0001-000000000001';

-- 🔧 Plombier/Chauffagiste - Supprimer les anciens types (Plomberie)
DELETE FROM public.intervention_types
WHERE business_type_id = '00000000-0000-0000-0001-000000000002';

-- 🐀 Dératisation - Supprimer les anciens types
DELETE FROM public.intervention_types
WHERE business_type_id = '00000000-0000-0000-0001-000000000003';

-- 🚗 Garagiste - Supprimer les anciens types
DELETE FROM public.intervention_types
WHERE business_type_id = '00000000-0000-0000-0001-000000000004';

-- ⚡ Électricien - Supprimer les anciens types
DELETE FROM public.intervention_types
WHERE business_type_id = '00000000-0000-0000-0001-000000000005';

-- 🌡️ Chauffagiste - Supprimer les anciens types (sera fusionné avec Plomberie)
DELETE FROM public.intervention_types
WHERE business_type_id = '00000000-0000-0000-0001-000000000006';

-- =============================================
-- 1️⃣ PLOMBIER/CHAUFFAGISTE - 36 types détaillés
-- =============================================

INSERT INTO public.intervention_types (business_type_id, code, name, description, default_duration, emoji, color, display_order, is_active)
VALUES
  -- ========================================
  -- Catégorie PLOMBERIE: Dépannage & fuites
  -- ========================================
  ('00000000-0000-0000-0001-000000000002', 'depannage_plomberie', 'Dépannage plomberie', 'Dépannage urgence plomberie', 120, '🚨', '#e84118', 1, true),
  ('00000000-0000-0000-0001-000000000002', 'recherche_fuite', 'Recherche de fuite', 'Détection fuite avec équipement', 90, '🔍', '#fbc531', 2, true),
  ('00000000-0000-0000-0001-000000000002', 'reparation_fuite', 'Réparation fuite', 'Réparation fuite canalisations/raccords', 120, '💧', '#e84118', 3, true),
  ('00000000-0000-0000-0001-000000000002', 'debouchage_evacuations', 'Débouchage évier / lavabo / WC', 'Débouchage canalisations', 90, '🚿', '#4cd137', 4, true),

  -- ========================================
  -- Catégorie PLOMBERIE: Installation sanitaire
  -- ========================================
  ('00000000-0000-0000-0001-000000000002', 'installation_wc', 'Installation WC', 'Pose WC suspendu ou au sol', 180, '🚽', '#0097e6', 5, true),
  ('00000000-0000-0000-0001-000000000002', 'installation_lavabo', 'Installation lavabo / vasque', 'Pose lavabo ou vasque', 120, '🚰', '#00d2d3', 6, true),
  ('00000000-0000-0000-0001-000000000002', 'installation_douche_baignoire', 'Installation douche / baignoire', 'Pose douche ou baignoire complète', 240, '🛁', '#3498db', 7, true),
  ('00000000-0000-0000-0001-000000000002', 'installation_robinetterie', 'Installation robinetterie', 'Pose mitigeur/thermostatique', 90, '🔧', '#16a085', 8, true),
  ('00000000-0000-0000-0001-000000000002', 'creation_modif_reseau_eau', 'Création / modification réseau eau', 'Création ou modification réseau', 240, '⚙️', '#34495e', 9, true),

  -- ========================================
  -- Catégorie PLOMBERIE: Ballon / chauffe-eau
  -- ========================================
  ('00000000-0000-0000-0001-000000000002', 'installation_chauffe_eau_plomberie', 'Installation chauffe-eau', 'Installation chauffe-eau électrique/gaz', 180, '🌡️', '#e74c3c', 10, true),
  ('00000000-0000-0000-0001-000000000002', 'depannage_chauffe_eau_plomberie', 'Dépannage chauffe-eau', 'Réparation chauffe-eau', 120, '🔧', '#e84118', 11, true),
  ('00000000-0000-0000-0001-000000000002', 'entretien_chauffe_eau_plomberie', 'Entretien chauffe-eau (anti-tartre)', 'Détartrage et entretien', 90, '🧼', '#44bd32', 12, true),

  -- ========================================
  -- Catégorie PLOMBERIE: Canalisation & évacuation
  -- ========================================
  ('00000000-0000-0000-0001-000000000002', 'reparation_canalisation', 'Réparation canalisation eau', 'Réparation canalisation eau potable', 150, '🔧', '#e84118', 13, true),
  ('00000000-0000-0000-0001-000000000002', 'reparation_evacuation', 'Réparation évacuation eaux usées', 'Réparation évacuation EU/EV', 150, '💦', '#7f8fa6', 14, true),
  ('00000000-0000-0000-0001-000000000002', 'remplacement_siphon', 'Remplacement siphon / bonde', 'Changement siphon ou bonde', 45, '🔩', '#95a5a6', 15, true),
  ('00000000-0000-0000-0001-000000000002', 'colonne_montante', 'Pose / remplacement colonne montante', 'Installation ou changement colonne', 360, '⬆️', '#2c3e50', 16, true),

  -- ========================================
  -- Catégorie PLOMBERIE: Salle de bain / rénovation
  -- ========================================
  ('00000000-0000-0000-0001-000000000002', 'renovation_salle_bain', 'Rénovation salle de bain', 'Rénovation complète salle de bain', 720, '🛠️', '#8c7ae6', 17, true),
  ('00000000-0000-0000-0001-000000000002', 'accessibilite_pmr', 'Adaptation équipements PMR', 'Adaptation accessibilité PMR', 240, '♿', '#27ae60', 18, true),

  -- ========================================
  -- Catégorie CHAUFFAGE: Chaudière
  -- ========================================
  ('00000000-0000-0000-0001-000000000002', 'install_chaudiere', 'Installation chaudière', 'Installation d''une nouvelle chaudière', 360, '🔧', '#e74c3c', 19, true),
  ('00000000-0000-0000-0001-000000000002', 'entretien_chaudiere', 'Entretien chaudière', 'Entretien annuel de la chaudière', 120, '🔥', '#44bd32', 20, true),
  ('00000000-0000-0000-0001-000000000002', 'depannage_chaudiere', 'Dépannage chaudière', 'Réparation panne chaudière', 150, '🚨', '#e84118', 21, true),
  ('00000000-0000-0000-0001-000000000002', 'remplacement_chaudiere', 'Remplacement chaudière', 'Remplacement chaudière complète', 480, '♻️', '#f39c12', 22, true),

  -- ========================================
  -- Catégorie CHAUFFAGE: Radiateurs / Plancher chauffant
  -- ========================================
  ('00000000-0000-0000-0001-000000000002', 'install_radiateurs', 'Installation radiateurs', 'Installation de nouveaux radiateurs', 180, '♨️', '#e67e22', 23, true),
  ('00000000-0000-0000-0001-000000000002', 'depannage_radiateurs', 'Dépannage radiateurs', 'Réparation radiateurs défectueux', 90, '🔧', '#e84118', 24, true),
  ('00000000-0000-0000-0001-000000000002', 'install_plancher_chauffant', 'Installation plancher chauffant', 'Mise en place plancher chauffant', 720, '🏗️', '#3498db', 25, true),
  ('00000000-0000-0000-0001-000000000002', 'depannage_plancher_chauffant', 'Dépannage plancher chauffant', 'Réparation plancher chauffant', 240, '🔍', '#e84118', 26, true),

  -- ========================================
  -- Catégorie CHAUFFAGE: Pompe à chaleur
  -- ========================================
  ('00000000-0000-0000-0001-000000000002', 'install_pac', 'Installation pompe à chaleur', 'Installation PAC complète', 600, '🌡️', '#16a085', 27, true),
  ('00000000-0000-0000-0001-000000000002', 'entretien_pac', 'Entretien pompe à chaleur', 'Entretien annuel PAC', 150, '⚙️', '#44bd32', 28, true),
  ('00000000-0000-0000-0001-000000000002', 'depannage_pac', 'Dépannage pompe à chaleur', 'Réparation panne PAC', 180, '🚨', '#e84118', 29, true),

  -- ========================================
  -- Catégorie CHAUFFAGE: Eau chaude sanitaire
  -- ========================================
  ('00000000-0000-0000-0001-000000000002', 'install_ecs', 'Installation système ECS', 'Installation système eau chaude', 240, '💧', '#00d2d3', 30, true),
  ('00000000-0000-0000-0001-000000000002', 'depannage_ecs', 'Dépannage système ECS', 'Réparation système eau chaude', 120, '🔧', '#e84118', 31, true),
  ('00000000-0000-0000-0001-000000000002', 'detartrage', 'Détartrage', 'Détartrage chauffe-eau/chaudière', 90, '🧼', '#fbc531', 32, true),

  -- ========================================
  -- Catégorie CHAUFFAGE: Régulation & optimisation
  -- ========================================
  ('00000000-0000-0000-0001-000000000002', 'install_regulation', 'Installation régulation connectée', 'Mise en place thermostat connecté', 120, '📱', '#8c7ae6', 33, true),
  ('00000000-0000-0000-0001-000000000002', 'optimisation_conso', 'Optimisation consommation', 'Réglages pour réduire la consommation', 90, '📊', '#27ae60', 34, true),

  -- ========================================
  -- Catégorie CHAUFFAGE: Circuit & fuites
  -- ========================================
  ('00000000-0000-0000-0001-000000000002', 'purge_circuit', 'Purge circuit chauffage', 'Purge et désembouage circuit', 120, '💨', '#0097e6', 35, true),
  ('00000000-0000-0000-0001-000000000002', 'reparation_fuite_chauffage', 'Réparation fuite chauffage', 'Réparation fuite sur circuit', 90, '💧', '#e84118', 36, true);

-- =============================================
-- 2️⃣ PISCINISTE - 19 types détaillés
-- =============================================

INSERT INTO public.intervention_types (business_type_id, code, name, description, default_duration, emoji, color, display_order, is_active)
VALUES
  -- Catégorie: Installation & mise en service
  ('00000000-0000-0000-0001-000000000001', 'installation_piscine', 'Installation piscine', 'Installation piscine kit ou maçonnée', 960, '🏗️', '#00a8ff', 1, true),
  ('00000000-0000-0000-0001-000000000001', 'mise_en_service', 'Mise en service piscine', 'Mise en service complète', 240, '🌊', '#4cd137', 2, true),
  ('00000000-0000-0000-0001-000000000001', 'installation_filtration', 'Installation pompe / filtration', 'Installation système de filtration', 180, '⚙️', '#0097e6', 3, true),
  ('00000000-0000-0000-0001-000000000001', 'installation_chauffage_piscine', 'Installation chauffage piscine', 'Installation PAC/solaire/réchauffeur', 240, '🌡️', '#e74c3c', 4, true),

  -- Catégorie: Entretien & maintenance
  ('00000000-0000-0000-0001-000000000001', 'entretien_piscine', 'Entretien régulier piscine', 'Entretien contrat maintenance', 120, '🏊', '#44bd32', 5, true),
  ('00000000-0000-0000-0001-000000000001', 'nettoyage_bassin', 'Nettoyage complet bassin', 'Nettoyage approfondi piscine', 180, '🧹', '#27ae60', 6, true),
  ('00000000-0000-0000-0001-000000000001', 'traitement_eau', 'Traitement de l''eau', 'Analyse et équilibrage pH/chlore/sel', 60, '💧', '#00d2d3', 7, true),
  ('00000000-0000-0000-0001-000000000001', 'hivernage', 'Hivernage piscine', 'Hivernage actif ou passif', 180, '❄️', '#487eb0', 8, true),
  ('00000000-0000-0000-0001-000000000001', 'remise_en_route', 'Remise en route printemps', 'Remise en service après hiver', 240, '🌸', '#4cd137', 9, true),

  -- Catégorie: Dépannage & réparations
  ('00000000-0000-0000-0001-000000000001', 'depannage_filtration', 'Dépannage pompe de filtration', 'Réparation pompe ou filtration', 150, '🔧', '#e84118', 10, true),
  ('00000000-0000-0000-0001-000000000001', 'reparation_fuite_hydraulique', 'Réparation fuites réseau hydraulique', 'Détection et réparation fuites', 180, '💦', '#e84118', 11, true),
  ('00000000-0000-0000-0001-000000000001', 'changement_liner', 'Changement liner / membrane armée', 'Remplacement revêtement piscine', 480, '🎨', '#8c7ae6', 12, true),
  ('00000000-0000-0000-0001-000000000001', 'reparation_local_tech', 'Réparation local technique', 'Intervention sur local technique', 120, '🔧', '#34495e', 13, true),

  -- Catégorie: Équipements & accessoires
  ('00000000-0000-0000-0001-000000000001', 'installation_robot', 'Installation robot de nettoyage', 'Installation robot automatique', 90, '🤖', '#9b59b6', 14, true),
  ('00000000-0000-0000-0001-000000000001', 'installation_electrolyseur', 'Installation système au sel', 'Installation électrolyseur au sel', 180, '⚡', '#fbc531', 15, true),
  ('00000000-0000-0000-0001-000000000001', 'installation_couverture', 'Installation couverture / volet roulant', 'Installation système de couverture', 240, '🛡️', '#16a085', 16, true),
  ('00000000-0000-0000-0001-000000000001', 'installation_eclairage_piscine', 'Installation éclairage piscine', 'Installation éclairage LED piscine', 120, '💡', '#f39c12', 17, true),

  -- Catégorie: Améliorations & rénovation
  ('00000000-0000-0000-0001-000000000001', 'renovation_bassin', 'Rénovation bassin', 'Rénovation revêtement/escaliers', 720, '♻️', '#e67e22', 18, true),
  ('00000000-0000-0000-0001-000000000001', 'securite_piscine', 'Installation systèmes de sécurité', 'Alarme/barrière/couverture sécurité', 180, '🚨', '#c0392b', 19, true);

-- =============================================
-- 3️⃣ DÉRATISATION - 16 types détaillés
-- =============================================

INSERT INTO public.intervention_types (business_type_id, code, name, description, default_duration, emoji, color, display_order, is_active)
VALUES
  -- Catégorie: Rongeurs
  ('00000000-0000-0000-0001-000000000003', 'deratisation', 'Intervention dératisation', 'Traitement rats et souris', 120, '🐀', '#e84118', 1, true),
  ('00000000-0000-0000-0001-000000000003', 'dispositifs_rongeurs', 'Pose dispositifs anti-rongeurs', 'Installation appâts et pièges', 90, '🪤', '#e67e22', 2, true),
  ('00000000-0000-0000-0001-000000000003', 'traitement_acces_rongeurs', 'Traitement accès rongeurs', 'Détection et traitement points d''entrée', 120, '🔍', '#fbc531', 3, true),

  -- Catégorie: Insectes rampants
  ('00000000-0000-0000-0001-000000000003', 'traitement_cafards', 'Traitement cafards / blattes', 'Désinsectisation cafards', 120, '🪳', '#8c7ae6', 4, true),
  ('00000000-0000-0000-0001-000000000003', 'traitement_fourmis', 'Traitement fourmis', 'Traitement colonies de fourmis', 90, '🐜', '#27ae60', 5, true),
  ('00000000-0000-0000-0001-000000000003', 'traitement_punaises_lit', 'Traitement punaises de lit', 'Désinsectisation punaises', 180, '🛏️', '#c0392b', 6, true),
  ('00000000-0000-0000-0001-000000000003', 'traitement_puces', 'Traitement puces', 'Traitement anti-puces', 90, '🦟', '#e67e22', 7, true),
  ('00000000-0000-0000-0001-000000000003', 'traitement_araignees', 'Traitement araignées', 'Traitement anti-araignées', 60, '🕷️', '#7f8fa6', 8, true),

  -- Catégorie: Insectes volants
  ('00000000-0000-0000-0001-000000000003', 'destruction_frelons', 'Destruction nid de frelons', 'Enlèvement nid frelons asiatiques/européens', 120, '🐝', '#e84118', 9, true),
  ('00000000-0000-0000-0001-000000000003', 'destruction_guepes', 'Destruction nid de guêpes', 'Enlèvement nid de guêpes', 90, '🐝', '#fbc531', 10, true),
  ('00000000-0000-0000-0001-000000000003', 'traitement_moustiques', 'Traitement moustiques', 'Traitement anti-moustiques', 60, '🦟', '#3498db', 11, true),
  ('00000000-0000-0000-0001-000000000003', 'traitement_mouches', 'Traitement mouches', 'Traitement anti-mouches', 60, '🪰', '#95a5a6', 12, true),

  -- Catégorie: Bois & xylophages
  ('00000000-0000-0000-0001-000000000003', 'traitement_termites', 'Traitement termites', 'Traitement anti-termites bois', 240, '🪵', '#9b59b6', 13, true),
  ('00000000-0000-0000-0001-000000000003', 'traitement_xylophages', 'Traitement capricornes / vrillettes', 'Traitement insectes xylophages', 180, '🪲', '#8c7ae6', 14, true),

  -- Catégorie: Autres nuisibles
  ('00000000-0000-0000-0001-000000000003', 'eloignement_pigeons', 'Éloignement pigeons / volatiles', 'Mise en place système anti-pigeons', 120, '🕊️', '#34495e', 15, true),
  ('00000000-0000-0000-0001-000000000003', 'desinfection_assainissement', 'Désinfection / assainissement', 'Désinfection et assainissement local', 90, '🧼', '#00d2d3', 16, true);

-- =============================================
-- 4️⃣ GARAGISTE - 23 types détaillés
-- =============================================

INSERT INTO public.intervention_types (business_type_id, code, name, description, default_duration, emoji, color, display_order, is_active)
VALUES
  -- Catégorie: Entretien & révision
  ('00000000-0000-0000-0001-000000000004', 'revision_constructeur', 'Révision / entretien constructeur', 'Révision selon plan constructeur', 180, '📋', '#44bd32', 1, true),
  ('00000000-0000-0000-0001-000000000004', 'vidange_filtres', 'Vidange + filtres', 'Vidange huile moteur + filtres', 60, '🛢️', '#34495e', 2, true),
  ('00000000-0000-0000-0001-000000000004', 'remplacement_filtres', 'Remplacement filtres', 'Remplacement filtres air/habitacle/carburant', 45, '🔧', '#7f8fa6', 3, true),

  -- Catégorie: Freinage
  ('00000000-0000-0000-0001-000000000004', 'freinage_remplacement', 'Remplacement plaquettes / disques', 'Changement plaquettes et/ou disques', 120, '🛑', '#c0392b', 4, true),
  ('00000000-0000-0000-0001-000000000004', 'purge_liquide_frein', 'Purge liquide de frein', 'Purge et remplacement liquide frein', 60, '💧', '#e67e22', 5, true),

  -- Catégorie: Pneumatiques
  ('00000000-0000-0000-0001-000000000004', 'montage_equilibrage_pneus', 'Montage / équilibrage pneus', 'Montage et équilibrage pneus', 60, '🛞', '#2c3e50', 6, true),
  ('00000000-0000-0000-0001-000000000004', 'reparation_crevaison', 'Réparation / crevaison', 'Réparation crevaison pneu', 30, '🔧', '#e84118', 7, true),
  ('00000000-0000-0000-0001-000000000004', 'geometrie_parallellisme', 'Géométrie / parallélisme', 'Réglage géométrie des roues', 90, '📐', '#3498db', 8, true),

  -- Catégorie: Transmission & suspension
  ('00000000-0000-0000-0001-000000000004', 'remplacement_amortisseurs', 'Remplacement amortisseurs', 'Changement amortisseurs', 180, '⬇️', '#9b59b6', 9, true),
  ('00000000-0000-0000-0001-000000000004', 'rotules_triangles', 'Rotules / triangles / biellettes', 'Remplacement train avant', 240, '🔩', '#34495e', 10, true),
  ('00000000-0000-0000-0001-000000000004', 'remplacement_cardans', 'Remplacement cardans', 'Changement cardans de transmission', 150, '⚙️', '#7f8fa6', 11, true),

  -- Catégorie: Moteur & diagnostic
  ('00000000-0000-0000-0001-000000000004', 'diagnostic_electronique', 'Diagnostic électronique', 'Diagnostic valise électronique', 60, '🔍', '#fbc531', 12, true),
  ('00000000-0000-0000-0001-000000000004', 'distribution', 'Courroie de distribution / chaîne', 'Remplacement distribution moteur', 360, '⚙️', '#e84118', 13, true),
  ('00000000-0000-0000-0001-000000000004', 'batterie', 'Batterie (test / remplacement)', 'Test et changement batterie', 30, '🔋', '#27ae60', 14, true),
  ('00000000-0000-0000-0001-000000000004', 'bougies', 'Bougies / préchauffage', 'Remplacement bougies allumage/préchauffage', 60, '⚡', '#f39c12', 15, true),

  -- Catégorie: Échappement & pollution
  ('00000000-0000-0000-0001-000000000004', 'echappement', 'Ligne d''échappement', 'Réparation/remplacement échappement', 120, '💨', '#7f8fa6', 16, true),
  ('00000000-0000-0000-0001-000000000004', 'fap_egr', 'FAP / vanne EGR', 'Diagnostic/entretien FAP et EGR', 180, '🌫️', '#95a5a6', 17, true),

  -- Catégorie: Climatisation
  ('00000000-0000-0000-0001-000000000004', 'recharge_clim', 'Recharge climatisation', 'Recharge gaz climatisation', 60, '❄️', '#00d2d3', 18, true),
  ('00000000-0000-0000-0001-000000000004', 'depannage_clim', 'Dépannage climatisation', 'Réparation système climatisation', 120, '🔧', '#00a8ff', 19, true),

  -- Catégorie: Éclairage & électricité
  ('00000000-0000-0000-0001-000000000004', 'eclairage', 'Éclairage / ampoules', 'Remplacement ampoules et feux', 30, '💡', '#fbc531', 20, true),
  ('00000000-0000-0000-0001-000000000004', 'electricite_accessoires', 'Réparation accessoires électriques', 'Réparation vitres/essuie-glaces électriques', 90, '🔌', '#8c7ae6', 21, true),

  -- Catégorie: Carrosserie & vitrage
  ('00000000-0000-0000-0001-000000000004', 'carrosserie', 'Réparation carrosserie', 'Réparation éléments de carrosserie', 240, '🎨', '#16a085', 22, true),
  ('00000000-0000-0000-0001-000000000004', 'parebrise', 'Remplacement pare-brise', 'Changement pare-brise', 120, '🪟', '#0097e6', 23, true);

-- =============================================
-- 5️⃣ ÉLECTRICIEN - 23 types détaillés
-- =============================================

INSERT INTO public.intervention_types (business_type_id, code, name, description, default_duration, emoji, color, display_order, is_active)
VALUES
  -- Catégorie: Installation & mise en conformité
  ('00000000-0000-0000-0001-000000000005', 'installation_electrique', 'Création d''installation électrique', 'Installation électrique complète neuve', 480, '⚡', '#0097e6', 1, true),
  ('00000000-0000-0000-0001-000000000005', 'renovation_electrique', 'Rénovation électrique', 'Rénovation installation existante', 360, '🔧', '#e67e22', 2, true),
  ('00000000-0000-0000-0001-000000000005', 'mise_aux_normes', 'Mise en conformité / mise aux normes', 'Mise aux normes NFC 15-100', 240, '✅', '#9b59b6', 3, true),
  ('00000000-0000-0000-0001-000000000005', 'mise_a_la_terre', 'Mise à la terre / contrôle sécurité', 'Installation terre et contrôles', 120, '🌍', '#27ae60', 4, true),

  -- Catégorie: Dépannage & diagnostic
  ('00000000-0000-0000-0001-000000000005', 'depannage_electrique', 'Dépannage panne électrique', 'Intervention urgente panne électrique', 90, '🚨', '#e84118', 5, true),
  ('00000000-0000-0000-0001-000000000005', 'recherche_defaut', 'Recherche de défaut / court-circuit', 'Diagnostic et localisation défaut', 120, '🔍', '#fbc531', 6, true),
  ('00000000-0000-0000-0001-000000000005', 'remplacement_disjoncteur', 'Remplacement disjoncteur / fusible', 'Changement disjoncteur ou fusible', 45, '🔧', '#34495e', 7, true),

  -- Catégorie: Tableau électrique
  ('00000000-0000-0000-0001-000000000005', 'installation_tableau', 'Installation tableau électrique', 'Pose nouveau tableau électrique', 240, '📊', '#2c3e50', 8, true),
  ('00000000-0000-0000-0001-000000000005', 'remplacement_tableau', 'Remplacement tableau électrique', 'Remplacement tableau complet', 300, '🔄', '#e67e22', 9, true),
  ('00000000-0000-0000-0001-000000000005', 'ajout_differentiel', 'Ajout d''interrupteurs différentiels', 'Ajout protection différentielle', 90, '🛡️', '#3498db', 10, true),

  -- Catégorie: Éclairage
  ('00000000-0000-0000-0001-000000000005', 'eclairage_interieur', 'Installation éclairage intérieur', 'Pose luminaires intérieurs', 120, '💡', '#f39c12', 11, true),
  ('00000000-0000-0000-0001-000000000005', 'eclairage_exterieur', 'Installation éclairage extérieur', 'Pose luminaires extérieurs', 150, '🔦', '#fbc531', 12, true),
  ('00000000-0000-0000-0001-000000000005', 'remplacement_luminaires', 'Remplacement luminaires / LED', 'Changement luminaires et LED', 60, '✨', '#f1c40f', 13, true),

  -- Catégorie: Prises & appareillages
  ('00000000-0000-0000-0001-000000000005', 'installation_prises', 'Installation prises / interrupteurs', 'Pose prises et interrupteurs', 90, '🔌', '#16a085', 14, true),
  ('00000000-0000-0000-0001-000000000005', 'reparation_prises', 'Réparation prises / interrupteurs', 'Réparation appareillages défectueux', 60, '🔧', '#e84118', 15, true),
  ('00000000-0000-0000-0001-000000000005', 'ajout_circuit_specialise', 'Ajout de circuits spécialisés', 'Circuit pour four/plaque/lave-linge', 120, '⚡', '#9b59b6', 16, true),

  -- Catégorie: Chauffage & chauffe-eau électriques
  ('00000000-0000-0000-0001-000000000005', 'installation_radiateurs_elec', 'Installation radiateurs électriques', 'Pose radiateurs électriques', 180, '♨️', '#e74c3c', 17, true),
  ('00000000-0000-0000-0001-000000000005', 'depannage_radiateurs_elec', 'Dépannage radiateurs électriques', 'Réparation radiateurs électriques', 90, '🔧', '#e84118', 18, true),
  ('00000000-0000-0000-0001-000000000005', 'installation_chauffe_eau', 'Installation chauffe-eau électrique', 'Pose chauffe-eau électrique', 180, '🌡️', '#00d2d3', 19, true),
  ('00000000-0000-0000-0001-000000000005', 'depannage_chauffe_eau', 'Dépannage chauffe-eau électrique', 'Réparation chauffe-eau électrique', 120, '🚨', '#e84118', 20, true),

  -- Catégorie: Domotique & réseaux
  ('00000000-0000-0000-0001-000000000005', 'installation_domotique', 'Installation domotique / pilotage connecté', 'Mise en place système domotique', 240, '🏠', '#8c7ae6', 21, true),
  ('00000000-0000-0000-0001-000000000005', 'installation_reseau_rj45', 'Installation réseau RJ45 / VDI', 'Câblage réseau informatique', 180, '🌐', '#0097e6', 22, true),
  ('00000000-0000-0000-0001-000000000005', 'videosurveillance_alarme', 'Vidéosurveillance / alarme', 'Installation système sécurité', 240, '📹', '#34495e', 23, true);

-- =============================================
-- VÉRIFICATION FINALE
-- =============================================

DO $$
DECLARE
  v_plombier_chauffagiste INTEGER;
  v_pisciniste INTEGER;
  v_deratisation INTEGER;
  v_garagiste INTEGER;
  v_electricien INTEGER;
  v_total INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_plombier_chauffagiste FROM public.intervention_types WHERE business_type_id = '00000000-0000-0000-0001-000000000002';
  SELECT COUNT(*) INTO v_pisciniste FROM public.intervention_types WHERE business_type_id = '00000000-0000-0000-0001-000000000001';
  SELECT COUNT(*) INTO v_deratisation FROM public.intervention_types WHERE business_type_id = '00000000-0000-0000-0001-000000000003';
  SELECT COUNT(*) INTO v_garagiste FROM public.intervention_types WHERE business_type_id = '00000000-0000-0000-0001-000000000004';
  SELECT COUNT(*) INTO v_electricien FROM public.intervention_types WHERE business_type_id = '00000000-0000-0000-0001-000000000005';
  SELECT COUNT(*) INTO v_total FROM public.intervention_types;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION 010 COMPLETED SUCCESSFULLY';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ 🔧🌡️  Plombier/Chauffagiste: % types d''intervention détaillés', v_plombier_chauffagiste;
  RAISE NOTICE '✅ 🏊 Pisciniste: % types d''intervention détaillés', v_pisciniste;
  RAISE NOTICE '✅ 🐀 Dératisation: % types d''intervention détaillés', v_deratisation;
  RAISE NOTICE '✅ 🚗 Garagiste (auto/moto): % types d''intervention détaillés', v_garagiste;
  RAISE NOTICE '✅ ⚡ Électricien: % types d''intervention détaillés', v_electricien;
  RAISE NOTICE '============================================';
  RAISE NOTICE '📊 Total: % types d''intervention pour 5 métiers', v_total;
  RAISE NOTICE '📝 Plomberie et Chauffage fusionnés en un seul métier';
  RAISE NOTICE '📝 Types organisés par catégorie métier';
  RAISE NOTICE '📝 Durées par défaut ajustées selon complexité';
  RAISE NOTICE '📝 Emojis et couleurs pour meilleure UX';
  RAISE NOTICE '============================================';
END $$;
