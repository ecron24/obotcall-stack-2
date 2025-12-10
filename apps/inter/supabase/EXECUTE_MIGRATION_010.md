# 🚀 Guide d'exécution - Migration 010

## Problème résolu
Cette migration remplace les types d'intervention génériques par **117 types détaillés** spécifiques à chaque métier.

## ⚠️ Symptômes si la migration n'est pas exécutée
- Erreur : `Le type de métier n'est pas configuré pour ce tenant`
- Erreur : `Failed to fetch intervention types`
- Aucun type d'intervention n'apparaît lors de la création d'intervention

## 📋 Étapes d'exécution

### Option 1 : Dashboard Supabase (Recommandé)

1. **Connectez-vous** à votre dashboard Supabase : https://app.supabase.com

2. **Sélectionnez** votre projet Inter

3. **Allez** dans `SQL Editor` (dans la sidebar gauche)

4. **Cliquez** sur `New Query`

5. **Copiez-collez** le contenu complet du fichier :
   ```
   apps/inter/supabase/migrations/010_update_intervention_types_detailed.sql
   ```

6. **Exécutez** la requête en cliquant sur `Run` ou `F5`

7. **Vérifiez** les notifications PostgreSQL :
   ```
   ✅ 🔧🌡️ Plombier/Chauffagiste: 36 types d'intervention détaillés
   ✅ 🏊 Pisciniste: 19 types d'intervention détaillés
   ✅ 🐀 Dératisation: 16 types d'intervention détaillés
   ✅ 🚗 Garagiste (auto/moto): 23 types d'intervention détaillés
   ✅ ⚡ Électricien: 23 types d'intervention détaillés
   📊 Total: 117 types d'intervention pour 5 métiers
   ```

### Option 2 : Supabase CLI

Si vous utilisez Supabase CLI localement :

```bash
# Depuis le dossier apps/inter
supabase db push
```

### Option 3 : psql (Pour utilisateurs avancés)

```bash
# Connectez-vous à votre base PostgreSQL
psql postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Exécutez la migration
\i apps/inter/supabase/migrations/010_update_intervention_types_detailed.sql
```

## ✅ Vérification

Après l'exécution, vérifiez que la migration a réussi :

```sql
-- Compter les types d'intervention par métier
SELECT
  bt.name as metier,
  bt.emoji,
  COUNT(it.id) as nb_types
FROM business_types bt
LEFT JOIN intervention_types it ON it.business_type_id = bt.id
WHERE bt.is_active = true
GROUP BY bt.id, bt.name, bt.emoji
ORDER BY bt.name;
```

Résultat attendu :
```
          metier           | emoji | nb_types
---------------------------+-------+----------
 Plombier/Chauffagiste     | 🔧🌡️  |       36
 Pisciniste                | 🏊    |       19
 Dératisation              | 🐀    |       16
 Garagiste (auto/moto)     | 🚗    |       23
 Électricien               | ⚡    |       23
```

## 🔄 Que fait cette migration ?

1. **Supprime** les anciens types génériques de tous les métiers
2. **Fusionne** Plomberie et Chauffage en un seul métier "Plombier/Chauffagiste"
3. **Insère** 117 nouveaux types détaillés avec :
   - 36 types pour Plombier/Chauffagiste (18 plomberie + 18 chauffage)
   - 19 types pour Pisciniste
   - 16 types pour Dératisation
   - 23 types pour Garagiste (auto/moto)
   - 23 types pour Électricien
4. Chaque type contient :
   - Code unique (ex: `install_chaudiere`, `depannage_pac`)
   - Label en français
   - Description détaillée
   - Durée par défaut ajustée
   - Emoji pour identification visuelle
   - Couleur pour catégorisation
   - Ordre d'affichage par catégorie

## 🎯 Résultat après migration

Quand vous créez une intervention dans l'app Inter :
- **Plombier/Chauffagiste** → 36 types
  - Plomberie : Dépannage, Débouchage, Installation sanitaire, Chauffe-eau, etc.
  - Chauffage : Chaudière, PAC, Radiateurs, Plancher chauffant, etc.
- **Pisciniste** → 19 types (Installation, Entretien, Hivernage, Réparations, etc.)
- **Électricien** → 23 types (Installation, Mise aux normes, Domotique, etc.)
- **Garagiste (auto/moto)** → 23 types (Révision, Freinage, Pneus, Distribution, etc.)
- **Dératisation** → 16 types (Rongeurs, Insectes, Xylophages, etc.)

## ⚠️ Important

- Cette migration **supprime** les anciens types d'intervention
- Elle **fusionne** Plomberie et Chauffagiste en un seul métier car ces professionnels font souvent les deux activités
- Si vous avez des interventions existantes qui référencent les anciens types, elles pourraient être impactées
- Testez d'abord sur un environnement de développement si possible

## 🆘 En cas de problème

Si vous rencontrez une erreur :

1. Vérifiez que les migrations précédentes (001-009) ont été exécutées
2. Vérifiez que la table `intervention_types` existe
3. Vérifiez que la table `business_types` contient bien les métiers
4. Vérifiez que votre tenant a bien un `business_type_id` configuré
5. Contactez le support avec le message d'erreur complet
