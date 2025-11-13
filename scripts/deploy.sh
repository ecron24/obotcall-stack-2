#!/bin/bash

# ===================================
# 🚀 Script de déploiement Obotcall Stack 2
# ===================================

set -e

echo "🚀 Déploiement de Obotcall Stack 2..."

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier si .env existe
if [ ! -f .env ]; then
    echo -e "${RED}❌ Fichier .env manquant!${NC}"
    echo "Copiez .env.example vers .env et configurez vos variables."
    exit 1
fi

# Git pull
echo -e "${YELLOW}📥 Récupération des derniers changements...${NC}"
git pull origin main

# Arrêter les services existants
echo -e "${YELLOW}🛑 Arrêt des services existants...${NC}"
docker-compose down

# Rebuild des images
echo -e "${YELLOW}🔨 Rebuild des images Docker...${NC}"
docker-compose build --no-cache

# Démarrer les services
echo -e "${YELLOW}▶️  Démarrage des services...${NC}"
docker-compose up -d

# Attendre que les services soient prêts
echo -e "${YELLOW}⏳ Attente du démarrage des services...${NC}"
sleep 10

# Vérifier le statut
echo -e "${YELLOW}🔍 Vérification du statut...${NC}"
docker-compose ps

# Health check
echo -e "${YELLOW}🏥 Health check...${NC}"
apps=("obotcall-app:3000" "inter-app:3001")
for app in "${apps[@]}"; do
    IFS=':' read -r name port <<< "$app"
    if curl -f -s -o /dev/null http://localhost:$port; then
        echo -e "${GREEN}✅ $name est opérationnel${NC}"
    else
        echo -e "${RED}❌ $name n'est pas accessible${NC}"
    fi
done

echo ""
echo -e "${GREEN}✅ Déploiement terminé!${NC}"
echo ""
echo "📊 Logs en temps réel:"
echo "  docker-compose logs -f"
echo ""
echo "🌐 URLs:"
echo "  - https://app.obotcall.tech"
echo "  - https://inter-app.app.obotcall.tech"
echo "  - https://immo-app.app.obotcall.tech"
echo "  - https://agent-app.app.obotcall.tech"
echo "  - https://assist-app.app.obotcall.tech"
