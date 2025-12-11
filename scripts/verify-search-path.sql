-- ============================================
-- VÉRIFICATION: search_path des fonctions SECURITY DEFINER
-- ============================================
-- Cette requête vérifie si les fonctions ont un search_path configuré

SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  CASE
    WHEN p.proconfig IS NOT NULL AND
         array_to_string(p.proconfig, ' ') LIKE '%search_path%'
    THEN '✅ Sécurisé'
    ELSE '⚠️  Vulnérable'
  END AS security_status,
  CASE
    WHEN p.proconfig IS NOT NULL
    THEN array_to_string(p.proconfig, ', ')
    ELSE 'Aucune configuration'
  END AS config_settings
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'inter_app'
  AND p.prosecdef = true  -- SECURITY DEFINER uniquement
ORDER BY
  CASE
    WHEN p.proconfig IS NOT NULL AND
         array_to_string(p.proconfig, ' ') LIKE '%search_path%'
    THEN 1
    ELSE 0
  END,
  p.proname;

-- ============================================
-- RÉSULTAT ATTENDU APRÈS MIGRATION:
-- ============================================
-- Toutes les fonctions devraient afficher:
-- ✅ Sécurisé | search_path=inter_app, public, pg_catalog
