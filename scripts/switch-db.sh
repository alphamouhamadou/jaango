#!/bin/bash

# Script pour basculer entre SQLite (dev) et PostgreSQL (prod)

if [ "$1" = "dev" ]; then
    echo "🔄 Configuration pour développement local (SQLite)..."
    cp prisma/schema.sqlite.prisma prisma/schema.prisma
    echo "✅ Schéma SQLite activé"
    echo "💡 N'oubliez pas de mettre à jour votre .env avec:"
    echo "   DATABASE_URL=file:./db/custom.db"
elif [ "$1" = "prod" ]; then
    echo "🔄 Configuration pour production (PostgreSQL)..."
    # Le schéma PostgreSQL est déjà le schéma par défaut
    echo "✅ Schéma PostgreSQL activé"
    echo "💡 Configurez vos variables d'environnement:"
    echo "   DATABASE_URL=postgresql://..."
    echo "   DIRECT_DATABASE_URL=postgresql://..."
else
    echo "Usage: ./scripts/switch-db.sh [dev|prod]"
    echo "  dev  - Utiliser SQLite pour le développement local"
    echo "  prod - Utiliser PostgreSQL pour la production"
fi
