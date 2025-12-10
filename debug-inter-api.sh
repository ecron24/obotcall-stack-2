#!/bin/bash

echo "======================================"
echo "🔍 DIAGNOSTIC INTER-API"
echo "======================================"
echo ""

echo "1️⃣ Vérification du .env à la racine..."
if [ -f ".env" ]; then
    echo "✅ .env existe"
    if grep -q "DATABASE_URL" .env; then
        echo "✅ DATABASE_URL est présent dans .env"
        echo "   Valeur: $(grep DATABASE_URL .env | cut -d'=' -f1)=***hidden***"
    else
        echo "❌ DATABASE_URL est ABSENT du .env"
        echo "   👉 Ajoutez cette ligne dans .env:"
        echo "   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.gpewkappvozjuxnzfekp.supabase.co:5432/postgres"
    fi
else
    echo "❌ .env n'existe pas à la racine"
fi
echo ""

echo "2️⃣ Vérification de node_modules/pg dans inter-api..."
if [ -d "apps/inter/inter-api/node_modules/pg" ]; then
    echo "✅ Module pg installé"
else
    echo "❌ Module pg NON installé"
    echo "   👉 Exécutez: cd apps/inter/inter-api && npm install"
fi
echo ""

echo "3️⃣ Vérification du conteneur inter-api..."
if docker ps | grep -q "inter-api"; then
    echo "✅ Conteneur inter-api est en cours d'exécution"

    echo ""
    echo "4️⃣ Vérification de DATABASE_URL dans le conteneur..."
    DB_URL_IN_CONTAINER=$(docker compose exec -T inter-api printenv DATABASE_URL 2>/dev/null)
    if [ -n "$DB_URL_IN_CONTAINER" ]; then
        echo "✅ DATABASE_URL est chargé dans le conteneur"
        echo "   Valeur: postgresql://***hidden***"
    else
        echo "❌ DATABASE_URL est ABSENT du conteneur"
        echo "   👉 Le .env n'est pas chargé correctement"
        echo "   👉 Vérifiez docker-compose.yml que inter-api charge bien le .env"
    fi

    echo ""
    echo "5️⃣ Derniers logs du conteneur..."
    echo "---"
    docker compose logs inter-api --tail=20
else
    echo "❌ Conteneur inter-api n'est PAS en cours d'exécution"
    echo "   👉 Démarrez avec: docker compose up -d inter-api"
fi
echo ""

echo "======================================"
echo "📋 ACTIONS RECOMMANDÉES"
echo "======================================"
echo ""
echo "Si DATABASE_URL est absent du .env:"
echo "  1. nano .env"
echo "  2. Ajoutez: DATABASE_URL=postgresql://postgres:[PASSWORD]@db.gpewkappvozjuxnzfekp.supabase.co:5432/postgres"
echo "  3. Remplacez [PASSWORD] par votre vrai mot de passe Supabase"
echo ""
echo "Si pg n'est pas installé:"
echo "  cd apps/inter/inter-api && npm install && cd ../../.."
echo ""
echo "Ensuite, rebuild et restart:"
echo "  docker compose build inter-api"
echo "  docker compose restart inter-api"
echo "  docker compose logs inter-api --tail=30 -f"
echo ""
