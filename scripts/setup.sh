#!/bin/bash

# ===================================
# ⚙️  Script d'installation Obotcall Stack 2
# ===================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}⚙️  Installation de Obotcall Stack 2${NC}"
echo ""

# Vérifier Docker
echo -e "${YELLOW}🐳 Vérification de Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé!${NC}"
    echo "Installez Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✅ Docker installé${NC}"

# Vérifier Docker Compose
echo -e "${YELLOW}🐳 Vérification de Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose n'est pas installé!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose installé${NC}"

# Créer .env depuis .env.example
echo -e "${YELLOW}📝 Configuration de l'environnement...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Fichier .env créé depuis .env.example${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANT: Éditez .env avec vos valeurs!${NC}"
    echo ""
    read -p "Voulez-vous éditer .env maintenant? (o/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        ${EDITOR:-nano} .env
    fi
else
    echo -e "${GREEN}✅ Fichier .env existe déjà${NC}"
fi

# Créer les dossiers nécessaires
echo -e "${YELLOW}📁 Création des dossiers...${NC}"
mkdir -p logs
mkdir -p backups
echo -e "${GREEN}✅ Dossiers créés${NC}"

# Installation des dépendances Node.js pour chaque app
echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
for app in apps/*/; do
    if [ -f "$app/package.json" ]; then
        echo "  - Installation pour $(basename $app)..."
        (cd "$app" && npm install)
    fi
done
echo -e "${GREEN}✅ Dépendances installées${NC}"

# Configuration Nginx (si sur VPS)
echo ""
echo -e "${YELLOW}🌐 Configuration Nginx${NC}"
read -p "Êtes-vous sur un VPS avec Nginx? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo "Copiez les fichiers de nginx/ vers /etc/nginx/"
    echo "Commandes:"
    echo "  sudo cp nginx/nginx.conf /etc/nginx/"
    echo "  sudo cp nginx/conf.d/*.conf /etc/nginx/conf.d/"
    echo "  sudo nginx -t"
    echo "  sudo systemctl reload nginx"
fi

# SSL Certificates
echo ""
echo -e "${YELLOW}🔒 Certificats SSL${NC}"
read -p "Voulez-vous obtenir les certificats SSL (Let's Encrypt)? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo "Installation de certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx

    echo "Obtention des certificats..."
    sudo certbot --nginx -d app.obotcall.tech
    sudo certbot --nginx -d inter-app.app.obotcall.tech
    sudo certbot --nginx -d immo-app.app.obotcall.tech
    sudo certbot --nginx -d agent-app.app.obotcall.tech
    sudo certbot --nginx -d assist-app.app.obotcall.tech
fi

echo ""
echo -e "${GREEN}✅ Installation terminée!${NC}"
echo ""
echo "🚀 Prochaines étapes:"
echo "  1. Vérifiez et éditez le fichier .env"
echo "  2. Exécutez les migrations Supabase"
echo "  3. Démarrez les services: docker-compose up -d"
echo "  4. Vérifiez les logs: docker-compose logs -f"
echo ""
echo "📚 Documentation: docs/README.md"
