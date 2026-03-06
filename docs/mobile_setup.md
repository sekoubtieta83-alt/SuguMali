# Guide de Configuration Mobile SuguMali (Flutter)

Ce guide vous accompagne dans la connexion de votre backend Firebase existant (`studio-5667457400-e2c8f`) à une application mobile Flutter.

## 1. Prérequis Firebase
1.  Allez dans la [Console Firebase](https://console.firebase.google.com/).
2.  Ajoutez une application **Android** :
    -   Package name : `com.sugumali.app`
3.  Ajoutez une application **iOS** :
    -   Bundle ID : `com.sugumali.app`

## 2. Générer les empreintes SHA (ATTENTION AU TERMINAL)

### 💻 SUR VOTRE ORDINATEUR WINDOWS (Recommandé)
Ouvrez un terminal sur **votre propre PC** (pas dans le navigateur) :

**Option A : Windows PowerShell (Bleu)**
```powershell
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

**Option B : Invite de commande (CMD - Noir)**
```cmd
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

---

### ⚠️ DANS LE TERMINAL DE CET IDE (Firebase Studio)
Si vous tapez la commande directement dans la fenêtre en bas de cet écran, c'est un environnement **LINUX**. Utilisez cette commande exacte :
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

---

## 3. Étape par étape : Où coller le code SHA-1 ?

Une fois que vous avez copié le code (ex: `AB:23:45...`), suivez ces étapes :

1.  Connectez-vous à la [Console Firebase](https://console.firebase.google.com/).
2.  Cliquez sur l'icône **Roue dentée (⚙️)** en haut à gauche, à côté de "Aperçu du projet".
3.  Choisissez **Paramètres du projet**.
4.  Restez sur l'onglet **Général**.
5.  Faites défiler vers le bas jusqu'à la section **Vos applications**.
6.  Sélectionnez votre application **Android** (`com.sugumali.app`).
7.  Cherchez le bouton **Ajouter une empreinte numérique**.
8.  Collez votre code **SHA-1** et cliquez sur **Enregistrer**.
9.  *Astuce :* Si vous avez aussi le **SHA-256**, ajoutez-le de la même manière pour plus de sécurité.

## 4. Télécharger le fichier de configuration
1. Juste au-dessus de l'endroit où vous avez collé le SHA, cliquez sur le bouton bleu **google-services.json**.
2. Placez ce fichier dans votre projet Flutter, dans le dossier `android/app/`.

## 5. Dépannage "File not found"
Si vous avez l'erreur "File not found" lors de la génération du SHA, lancez d'abord votre application Flutter en mode debug sur un émulateur. Flutter créera alors automatiquement le fichier `debug.keystore` manquant.
