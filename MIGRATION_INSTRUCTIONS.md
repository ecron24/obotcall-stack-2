# 🚚 Instructions de Migration vers le VPS

Ce document explique comment transférer la structure complète de `obotcall-stack-2` sur votre VPS.

## 📦 Fichiers créés

J'ai généré la structure complète de `obotcall-stack-2` avec tous les fichiers nécessaires :

```
obotcall-stack-2-structure/
├── README.md                      # Documentation principale
├── DEPLOYMENT_GUIDE.md            # Guide de déploiement complet
├── docker-compose.yml             # Orchestration de toutes les apps
├── .env.example                   # Template des variables d'environnement
├── .gitignore                     # Fichiers à ignorer par Git
│
├── docs/
│   └── ARCHITECTURE_SUPABASE_MULTI_APPS.md  # Architecture détaillée
│
├── nginx/
│   ├── nginx.conf                 # Configuration Nginx principale
│   └── conf.d/
│       ├── obotcall-app.conf      # Config app.obotcall.tech
│       ├── inter-app.conf         # Config inter-app.app.obotcall.tech
│       ├── immo-app.conf          # Config immo-app.app.obotcall.tech
│       ├── agent-app.conf         # Config agent-app.app.obotcall.tech
│       └── assist-app.conf        # Config assist-app.app.obotcall.tech
│
└── scripts/
    ├── setup.sh                   # Installation initiale
    ├── deploy.sh                  # Déploiement automatique
    └── backup.sh                  # Backup automatique
```

---

## 🔄 Méthode 1 : Via Git (Recommandé)

### Sur votre machine locale

```bash
# 1. Aller dans le repo inter-app
cd /chemin/vers/inter-app

# 2. Les fichiers sont dans obotcall-stack-2-structure/
# Vous devez les copier dans le repo ecron24/obotcall-stack-2

# 3. Cloner le repo obotcall-stack-2 dans un autre dossier
cd ..
git clone https://github.com/ecron24/obotcall-stack-2.git
cd obotcall-stack-2

# 4. Copier tous les fichiers générés
cp -r ../inter-app/obotcall-stack-2-structure/* .

# 5. Vérifier la structure
ls -la

# 6. Ajouter au Git
git add .
git commit -m "🏗️ Add: Complete obotcall-stack-2 structure with configs"
git push origin main
```

### Sur votre VPS

```bash
# 1. Aller dans le dossier obotcall-stack-2
cd ~/obotcall/obotcall-stack-2

# 2. Pull les changements
git pull origin main

# 3. Vérifier que tout est là
ls -la
```

---

## 🔄 Méthode 2 : Copie directe (Alternative)

### Depuis votre machine locale vers le VPS

```bash
# 1. Depuis votre machine locale, compresser les fichiers
cd /chemin/vers/inter-app
tar -czf obotcall-structure.tar.gz obotcall-stack-2-structure/

# 2. Transférer vers le VPS
scp obotcall-structure.tar.gz ronan@srv770425:~/obotcall/

# 3. Sur le VPS, décompresser
ssh ronan@srv770425
cd ~/obotcall
tar -xzf obotcall-structure.tar.gz

# 4. Copier dans obotcall-stack-2
cd obotcall-stack-2
cp -r ../obotcall-stack-2-structure/* .

# 5. Nettoyer
rm -rf ../obotcall-structure.tar.gz ../obotcall-stack-2-structure
```

---

## 📋 Checklist post-migration

Une fois les fichiers sur le VPS, vérifiez :

### 1. Structure des dossiers

```bash
cd ~/obotcall/obotcall-stack-2
tree -L 2 -I 'node_modules'
```

Vous devriez avoir :

```
obotcall-stack-2/
├── apps/
│   └── inter-app/          ✅
├── nginx/
│   ├── nginx.conf          ✅
│   └── conf.d/             ✅
├── scripts/                ✅
├── docs/                   ✅
├── docker-compose.yml      ✅
├── .env.example            ✅
├── .gitignore              ✅
├── README.md               ✅
└── DEPLOYMENT_GUIDE.md     ✅
```

### 2. Permissions des scripts

```bash
chmod +x scripts/*.sh
```

### 3. Configuration Git

```bash
# Vérifier le remote
git remote -v

# Si pas encore configuré
git remote add origin https://github.com/ecron24/obotcall-stack-2.git
```

### 4. Créer le fichier .env

```bash
cp .env.example .env
nano .env
```

Remplir avec vos vraies valeurs Supabase.

---

## 🚀 Prochaines étapes

Une fois la migration terminée :

1. **Lire le guide de déploiement** : `DEPLOYMENT_GUIDE.md`

2. **Configuration Supabase** :
   - Créer un projet Supabase
   - Exécuter les migrations SQL
   - Récupérer les clés API

3. **Configuration DNS** :
   - Configurer les enregistrements A pour tous les sous-domaines

4. **Installation** :
   ```bash
   ./scripts/setup.sh
   ```

5. **Déploiement** :
   ```bash
   ./scripts/deploy.sh
   ```

---

## 📁 Que faire de inter-app.git ?

Maintenant que `inter-app` est dans `apps/inter-app/`, vous devez décider :

### Option A : Garder le repo séparé (développement)

Garder `ecron24/inter-app` pour le développement, et copier dans `obotcall-stack-2` pour la production.

### Option B : Supprimer le .git dans apps/inter-app/ (recommandé)

```bash
cd ~/obotcall/obotcall-stack-2/apps/inter-app
rm -rf .git

# inter-app fait maintenant partie du monorepo obotcall-stack-2
```

**Je recommande Option B** pour simplifier la gestion.

---

## ❓ Questions fréquentes

### Q: Les dossiers packages/, supabase/ sont vides ?

**R:** Oui, normal ! Ils seront remplis au fur et à mesure :
- `packages/` : si vous créez des packages partagés
- `supabase/` : quand on créera les migrations SQL

### Q: obotcall-app n'existe pas encore ?

**R:** Exact ! On va le créer ensemble dans la prochaine étape, une fois que :
1. La structure est en place sur le VPS
2. Vous avez validé l'architecture
3. Vous me donnez les spécifications

### Q: Je dois tout faire maintenant ?

**R:** Non ! Étapes :
1. **Maintenant** : Transférer les fichiers sur le VPS
2. **Ensuite** : Lire et valider le document d'architecture
3. **Puis** : Me donner les specs des apps (immo, agent, assist)
4. **Enfin** : Créer les apps et déployer

---

## 🆘 Besoin d'aide ?

Si vous avez un problème pendant la migration :

1. Vérifiez les permissions : `ls -la`
2. Vérifiez Git : `git status`
3. Vérifiez les logs si Docker tourne : `docker-compose logs`

---

**Bonne migration ! 🚀**

Une fois que c'est fait, revenez vers moi et on continue avec :
- La création de `obotcall-app`
- Les migrations Supabase
- Le déploiement complet
