# SuguMali E-commerce Platform

Bienvenue sur SuguMali, la marketplace numéro 1 au Mali ! Ce projet est construit avec Next.js 15, React 19, Tailwind CSS et Firebase.

## 📁 Structure du Projet

### Front-end (Racine /src)
Le front-end est géré par Next.js (App Router) :
- **`src/app/`** : Routes et pages de l'application.
- **`src/components/`** : Composants UI (ShadCN) et modules spécifiques.
- **`src/firebase/`** : Configuration client et authentification.
- **`src/ai/`** : Logique d'intelligence artificielle avec Genkit (Mami).
- **`src/lib/`** : Utilitaires, types de données et constantes (catégories, codes pays).
- **`public/`** : Assets statiques et Service Workers pour les notifications.

### Back-end (Firebase)
Le back-end est propulsé par les services Firebase :
- **Firestore** : Base de données NoSQL (Règles dans `firestore.rules`).
- **Storage** : Stockage des images et vidéos (Règles dans `storage.rules`).
- **Functions** : Code serveur (dossier `/functions`).
- **Auth** : Gestion des utilisateurs (Email & Google).

## 🚀 Déploiement

### Front-end
Déployé automatiquement sur **Vercel** via la branche `main`.

### Back-end
Déployé via la CLI Firebase :
```bash
firebase deploy
```

## 🛠️ Développement Local

1. Installez les dépendances : `npm install`
2. Lancez le serveur de développement : `npm run dev`
3. Ouvrez [http://localhost:9002](http://localhost:9002)
