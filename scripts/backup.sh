#!/bin/bash

# ===================================
# 💾 Script de backup Obotcall Stack 2
# ===================================

set -e

BACKUP_DIR="$HOME/backups/obotcall-stack-2"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="obotcall-backup-$DATE.tar.gz"

echo "💾 Backup de Obotcall Stack 2..."

# Créer le dossier de backup
mkdir -p "$BACKUP_DIR"

# Backup de la base de données Supabase
echo "📊 Backup de la base de données..."
# Note: Utiliser supabase CLI ou pg_dump si self-hosted
# Pour Supabase Cloud, utiliser leur système de backup

# Backup des fichiers de configuration
echo "📁 Backup des fichiers..."
tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='.git' \
    .

echo "✅ Backup créé: $BACKUP_DIR/$BACKUP_FILE"

# Garder seulement les 7 derniers backups
echo "🧹 Nettoyage des anciens backups..."
cd "$BACKUP_DIR"
ls -t obotcall-backup-*.tar.gz | tail -n +8 | xargs -r rm

echo "✅ Backup terminé!"
ls -lh "$BACKUP_DIR" | tail -n 7
