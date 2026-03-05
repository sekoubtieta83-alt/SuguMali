# Guide de Déploiement Vercel & GitHub

Votre `.gitignore` a été réinitialisé pour inclure TOUT le projet (Next.js + Firebase).

## 🚀 Étape 1 : Nettoyer l'index Git
Pour être sûr que tous vos fichiers (src, app, etc.) sont bien visibles et que les anciennes archives lourdes sont supprimées :
```bash
git rm -r --cached .
git add .
```

## 🚀 Étape 2 : Envoyer sur GitHub
```bash
git commit -m "Fix: Restauration de la structure complète pour Vercel"
git push origin main
```

## 🚀 Étape 3 : Sur Vercel
1. Allez sur votre dashboard Vercel.
2. Assurez-vous que le **Root Directory** est bien la racine du projet (et non le dossier `functions`).
3. Vercel devrait maintenant détecter automatiquement Next.js.
