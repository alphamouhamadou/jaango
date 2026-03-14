# Guide de Déploiement - Jaango

## 🚀 Déploiement Rapide sur Vercel

### Option 1: Via GitHub (Recommandé)

1. **Pousser le code sur GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Jaango"
   git remote add origin https://github.com/votre-username/jaango.git
   git push -u origin main
   ```

2. **Importer sur Vercel**
   - Aller sur [vercel.com](https://vercel.com)
   - Cliquer "Add New" > "Project"
   - Importer votre repo GitHub
   - Cliquer "Deploy"

3. **Ajouter une base de données**
   - Dans Vercel Dashboard, aller dans "Storage"
   - Créer "Postgres"
   - Les variables d'environnement sont automatiquement ajoutées

4. **Configurer les variables d'environnement** (voir section ci-dessous)

5. **Redéployer** après avoir ajouté les variables

---

### Option 2: Via CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod
```

---

## 📋 Variables d'Environnement Requises

### Database (Automatique avec Vercel Postgres)
```
DATABASE_URL=postgresql://...
DIRECT_DATABASE_URL=postgresql://...
POSTGRES_URL=postgresql://...
POSTGRES_PRISMA_URL=postgresql://...
POSTGRES_URL_NON_POOLING=postgresql://...
```

### Authentification
```
JWT_SECRET=votre-cle-secrete-tres-longue-et-complexe
```

### PayTech
```
PAYTECH_API_KEY=850d23d63d85c40a26500cc156b026ef40ae5cdbfddfc1708f82e0b3e6d52b29
PAYTECH_API_SECRET=67821f9977def18312b3c54eab5c5cbaa9a090d2ad6801cd26f59233c0d9861f
PAYTECH_ENV=prod
```

### URLs (Remplacer par votre domaine Vercel)
```
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app
PAYTECH_SUCCESS_URL=https://votre-app.vercel.app/payment/success
PAYTECH_ERROR_URL=https://votre-app.vercel.app/payment/error
PAYTECH_CALLBACK_URL=https://votre-app.vercel.app/api/payment/webhook
```

### Push Notifications
```
VAPID_PUBLIC_KEY=BCW8gbUXmaDrH9oZY5CUax433gJtZr60XwZsZRmuQ3fF0kzwDzLqrrZVwag0I9YSvR4qyOwv1iTXFqHCbEydw08
VAPID_PRIVATE_KEY=CXFMVGJe3iw4pOXLMj2Bshu5U7itz0eImdzPgi7gLxA
VAPID_SUBJECT=mailto:contact@jaango.sn
```

---

## 🔧 Configuration de la Base de Données

### Après le déploiement, initialiser les tables:

```bash
# En local, avec les variables de production
vercel env pull .env.production
npx prisma db push
```

---

## 👤 Créer un Compte Admin

Après le déploiement, utiliser l'API pour créer un admin:

```bash
curl -X POST https://votre-app.vercel.app/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{"telephone":"776211339","password":"Admin123!"}'
```

Ou visiter `/api/admin/create-admin` dans le navigateur.

---

## 🔐 Identifiants Admin

| Champ | Valeur |
|-------|--------|
| Téléphone | `776211339` |
| Mot de passe | `Admin123!` |

⚠️ **Changez le mot de passe après la première connexion!**

---

## 🌐 Alternatives à Vercel

### Railway
```bash
npm i -g railway
railway login
railway init
railway run npm run build
railway up
```

### Render
1. Connecter votre repo GitHub à Render
2. Créer un Web Service
3. Configurer les variables d'environnement

---

## ❓ Problèmes Courants

### Build Error: Prisma Client
```bash
npx prisma generate
```

### Database Connection Error
Vérifier que `DATABASE_URL` et `DIRECT_DATABASE_URL` sont corrects.

### 500 Error sur les APIs
Vérifier les logs dans Vercel Dashboard > Deployments > Function Logs
