# Jaango - Plateforme de Prêts Communautaires

Plateforme de gestion de prêts communautaires au Sénégal.

## 🚀 Déploiement sur Vercel

### Prérequis

1. Un compte [Vercel](https://vercel.com)
2. Une base de données PostgreSQL ( Neon, Supabase, ou Vercel Postgres)

### Étapes de déploiement

#### 1. Créer une base de données PostgreSQL

**Option A: Neon (Recommandé - Gratuit)**
1. Aller sur [neon.tech](https://neon.tech)
2. Créer un compte et un nouveau projet
3. Copier l'URL de connexion

**Option B: Vercel Postgres**
1. Dans Vercel, aller dans Storage
2. Créer une base Postgres
3. Copier les variables d'environnement

**Option C: Supabase**
1. Aller sur [supabase.com](https://supabase.com)
2. Créer un projet
3. Copier l'URL de connexion depuis Settings > Database

#### 2. Déployer sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod
```

#### 3. Configurer les variables d'environnement

Dans Vercel Dashboard > Settings > Environment Variables, ajouter:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/jaango?pgbouncer=true&connect_timeout=15
DIRECT_DATABASE_URL=postgresql://user:password@host:5432/jaango

# JWT Secret (générez une clé secrète forte)
JWT_SECRET=votre-cle-secrete-jwt-tres-longue

# PayTech
PAYTECH_API_KEY=votre-cle-api-paytech
PAYTECH_API_SECRET=votre-secret-api-paytech
PAYTECH_ENV=prod

# URLs (remplacez par votre domaine Vercel)
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app
PAYTECH_SUCCESS_URL=https://votre-app.vercel.app/payment/success
PAYTECH_ERROR_URL=https://votre-app.vercel.app/payment/error
PAYTECH_CALLBACK_URL=https://votre-app.vercel.app/api/payment/webhook

# Push Notifications (générez avec: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=votre-cle-public-vapid
VAPID_PRIVATE_KEY=votre-cle-privee-vapid
VAPID_SUBJECT=mailto:contact@jaango.sn
```

#### 4. Initialiser la base de données

Après le déploiement, exécuter la migration:

```bash
# En local avec les variables de production
npx prisma db push
```

Ou utiliser Vercel CLI:
```bash
vercel env pull .env.production
npx prisma db push
```

#### 5. Créer un compte admin

Utiliser l'API ou le script:
```bash
npx tsx scripts/create-admin.ts
```

## 🔐 Compte Admin par défaut

| Champ | Valeur |
|-------|--------|
| Téléphone | `776211339` |
| Mot de passe | `Admin123!` |

⚠️ **Important**: Changez le mot de passe après la première connexion!

## 📱 Fonctionnalités

- ✅ Prêts Silver (500K-1M FCFA) et Gold (1M-3M FCFA)
- ✅ Paiements PayTech (Orange Money, Wave, Free Money)
- ✅ Notifications push navigateur
- ✅ Dashboard administrateur
- ✅ Rapports et export CSV
- ✅ Gestion des utilisateurs
- ✅ Responsive mobile

## 🛠 Technologies

- Next.js 16
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- Prisma ORM
- PostgreSQL
- PayTech API
