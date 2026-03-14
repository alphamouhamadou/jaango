#!/bin/bash

# Script de déploiement Jaango sur Vercel

echo "🚀 Déploiement de Jaango sur Vercel"
echo "===================================="

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "📦 Installation de Vercel CLI..."
    npm install -g vercel
fi

# Connexion à Vercel
echo ""
echo "🔐 Connexion à Vercel..."
vercel login

# Déploiement
echo ""
echo "📦 Déploiement en cours..."
vercel --prod

echo ""
echo "✅ Déploiement terminé!"
echo ""
echo "⚠️  N'oubliez pas de configurer les variables d'environnement dans Vercel Dashboard:"
echo "   - DATABASE_URL"
echo "   - DIRECT_DATABASE_URL"
echo "   - JWT_SECRET"
echo "   - PAYTECH_API_KEY"
echo "   - PAYTECH_API_SECRET"
echo "   - PAYTECH_ENV"
echo "   - NEXT_PUBLIC_APP_URL"
echo "   - PAYTECH_SUCCESS_URL"
echo "   - PAYTECH_ERROR_URL"
echo "   - PAYTECH_CALLBACK_URL"
echo "   - VAPID_PUBLIC_KEY"
echo "   - VAPID_PRIVATE_KEY"
echo "   - VAPID_SUBJECT"
