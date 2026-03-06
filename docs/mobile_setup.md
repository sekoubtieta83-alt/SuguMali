# Guide de Configuration Mobile SuguMali (Flutter)

Ce guide vous accompagne dans la connexion de votre backend Firebase existant (`studio-5667457400-e2c8f`) à une application mobile Flutter.

## 1. Prérequis Firebase
1.  Allez dans la [Console Firebase](https://console.firebase.google.com/).
2.  Ajoutez une application **Android** :
    -   Package name : `com.sugumali.app`
    -   **Important :** Vous devez ajouter vos empreintes numériques SHA-1 et SHA-256.
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

## 3. Où coller le code SHA-1 ?
1. Dans la Console Firebase, allez dans **Paramètres du projet** > **Général**.
2. Dans la section **Vos applications**, sélectionnez l'app Android.
3. Cliquez sur **Ajouter une empreinte** et collez le SHA-1 généré.

## 4. Dépannage "File not found"
Si vous avez l'erreur "File not found", lancez d'abord votre application Flutter en mode debug sur un émulateur. Flutter créera alors automatiquement le fichier `debug.keystore` manquant.