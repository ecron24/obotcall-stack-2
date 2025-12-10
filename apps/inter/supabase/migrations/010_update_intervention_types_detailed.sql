-- ============================================
-- MIGRATION 010: Mise à jour types d'intervention détaillés
-- Date: 2025-12-10
-- Description: Remplace les types d'intervention génériques par des types détaillés
--              pour Chauffagiste, Garagiste et Électricien
-- ============================================

-- =============================================
-- SUPPRESSION DES ANCIENS TYPES D'INTERVENTION
-- =============================================

-- 🌡️ Chauffagiste - Supprimer les 6 anciens types
DELETE FROM public.intervention_types
WHERE business_type_id = '00000000-0000-0000-0001-000000000006';

-- 🚗 Garagiste - Supprimer les 9 anciens types
DELETE FROM public.intervention_types
WHERE business_type_id = '00000000-0000-0000-0001-000000000004';

-- ⚡ Électricien - Supprimer les 8 anciens types
DELETE FROM public.intervention_types
WHERE business_type_id = '00000000-0000-0000-0001-000000000005';

-- =============================================
-- 1️⃣ CHAUFFAGISTE - 18 types détaillés
-- =============================================

INSERT INTO public.intervention_types (business_type_id, code, name, description, default_duration, emoji, color, display_order, is_active)
VALUES
  -- Catégorie: Chaudière
  ('00000000-0000-0000-0001-000000000006', 'install_chaudiere', 'Installation chaudière', 'Installation d''une nouvelle chaudière', 360, '🔧', '#e74c3c', 1, true),
  ('00000000-0000-0000-0001-000000000006', 'entretien_chaudiere', 'Entretien chaudière', 'Entretien annuel de la chaudière', 120, '🔥', '#44bd32', 2, true),
  ('00000000-0000-0000-0001-000000000006', 'depannage_chaudiere', 'Dépannage chaudière', 'Réparation panne chaudière', 150, '🚨', '#e84118', 3, true),
  ('00000000-0000-0000-0001-000000000006', 'remplacement_chaudiere', 'Remplacement chaudière', 'Remplacement chaudière complète', 480, '♻️', '#f39c12', 4, true),

  -- Catégorie: Radiateurs / Plancher chauffant
  ('00000000-0000-0000-0001-000000000006', 'install_radiateurs', 'Installation radiateurs', 'Installation de nouveaux radiateurs', 180, '♨️', '#e67e22', 5, true),
  ('00000000-0000-0000-0001-000000000006', 'depannage_radiateurs', 'Dépannage radiateurs', 'Réparation radiateurs défectueux', 90, '🔧', '#e84118', 6, true),
  ('00000000-0000-0000-0001-000000000006', 'install_plancher_chauffant', 'Installation plancher chauffant', 'Mise en place plancher chauffant', 720, '🏗️', '#3498db', 7, true),
  ('00000000-0000-0000-0001-000000000006', 'depannage_plancher_chauffant', 'Dépannage plancher chauffant', 'Réparation plancher chauffant', 240, '🔍', '#e84118', 8, true),

  -- Catégorie: Pompe à chaleur
  ('00000000-0000-0000-0001-000000000006', 'install_pac', 'Installation pompe à chaleur', 'Installation PAC complète', 600, '🌡️', '#16a085', 9, true),
  ('00000000-0000-0000-0001-000000000006', 'entretien_pac', 'Entretien pompe à chaleur', 'Entretien annuel PAC', 150, '⚙️', '#44bd32', 10, true),
  ('00000000-0000-0000-0001-000000000006', 'depannage_pac', 'Dépannage pompe à chaleur', 'Réparation panne PAC', 180, '🚨', '#e84118', 11, true),

  -- Catégorie: Eau chaude sanitaire
  ('00000000-0000-0000-0001-000000000006', 'install_ecs', 'Installation système ECS', 'Installation système eau chaude', 240, '💧', '#00d2d3', 12, true),
  ('00000000-0000-0000-0001-000000000006', 'depannage_ecs', 'Dépannage système ECS', 'Réparation système eau chaude', 120, '🔧', '#e84118', 13, true),
  ('00000000-0000-0000-0001-000000000006', 'detartrage', 'Détartrage', 'Détartrage chauffe-eau/chaudière', 90, '🧼', '#fbc531', 14, true),

  -- Catégorie: Régulation & optimisation
  ('00000000-0000-0000-0001-000000000006', 'install_regulation', 'Installation régulation connectée', 'Mise en place thermostat connecté', 120, '📱', '#8c7ae6', 15, true),
  ('00000000-0000-0000-0001-000000000006', 'optimisation_conso', 'Optimisation consommation', 'Réglages pour réduire la consommation', 90, '📊', '#27ae60', 16, true),

  -- Catégorie: Plomberie chauffage
  ('00000000-0000-0000-0001-000000000006', 'purge_circuit', 'Purge circuit chauffage', 'Purge et désembouage circuit', 120, '💨', '#0097e6', 17, true),
  ('00000000-0000-0000-0001-000000000006', 'reparation_fuite', 'Réparation fuite chauffage', 'Réparation fuite sur circuit', 90, '💧', '#e84118', 18, true);

-- =============================================
-- 2️⃣ GARAGISTE - 23 types détaillés
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
-- 3️⃣ ÉLECTRICIEN - 23 types détaillés
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
-- FIN MIGRATION 010
-- =============================================

DO $$
DECLARE
  v_chauffagiste INTEGER;
  v_garagiste INTEGER;
  v_electricien INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_chauffagiste FROM public.intervention_types WHERE business_type_id = '00000000-0000-0000-0001-000000000006';
  SELECT COUNT(*) INTO v_garagiste FROM public.intervention_types WHERE business_type_id = '00000000-0000-0000-0001-000000000004';
  SELECT COUNT(*) INTO v_electricien FROM public.intervention_types WHERE business_type_id = '00000000-0000-0000-0001-000000000005';

  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION 010 COMPLETED SUCCESSFULLY';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ 🌡️  Chauffagiste: % types d''intervention détaillés', v_chauffagiste;
  RAISE NOTICE '✅ 🚗 Garagiste: % types d''intervention détaillés', v_garagiste;
  RAISE NOTICE '✅ ⚡ Électricien: % types d''intervention détaillés', v_electricien;
  RAISE NOTICE '============================================';
  RAISE NOTICE '📝 Types d''intervention organisés par catégorie';
  RAISE NOTICE '📝 Durées par défaut ajustées selon complexité';
  RAISE NOTICE '📝 Emojis et couleurs pour meilleure UX';
  RAISE NOTICE '============================================';
END $$;
