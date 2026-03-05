# Guide d'Exportation SuguMali - PARTIE 1

Cette étape permet d'envoyer la structure de base et la configuration du projet sur GitHub sans dépasser les limites de taille.

## 🚀 Étape 1 : Nettoyer l'index Git
Avant d'envoyer, nous devons forcer Git à ignorer les fichiers volumineux (`project.zip`) qui bloquaient l'envoi précédemment.

Copiez cette commande dans votre terminal :
```bash
git rm -r --cached .
```

## 🚀 Étape 2 : Ajouter et Envoyer la Partie 1
Maintenant, nous ajoutons uniquement les fichiers autorisés par le nouveau `.gitignore`.

```bash
git add .
git commit -m "Export Partie 1 : Infrastructure et Configuration"
git push -f origin main
```

---
**Une fois cette étape réussie, dites-le moi pour que je prépare la Partie 2 (Composants et Pages) !**
