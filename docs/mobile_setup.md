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

### ⚠️ SI VOUS UTILISEZ LE TERMINAL ICI (Firebase Studio / Linux)
Tapez cette commande exacte (le symbole `~` remplace votre dossier utilisateur Linux) :
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### 💻 SI VOUS ÊTES SUR VOTRE ORDINATEUR (Windows PowerShell)
Si vous développez sur votre PC Windows local, utilisez cette commande :
```powershell
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

### 🍎 SI VOUS ÊTES SUR MAC OU LINUX LOCAL
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Où les coller ?**
1. Allez dans **Paramètres du projet** > **Général**.
2. Dans **Vos applications**, sélectionnez l'app Android.
3. Cliquez sur **Ajouter une empreinte** et collez le SHA-1 et le SHA-256.

## 3. Dépendances (pubspec.yaml)
```yaml
dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^3.1.1
  firebase_auth: ^5.1.1
  cloud_firestore: ^5.0.2
  firebase_messaging: ^15.0.3
  google_sign_in: ^6.2.1
```

## 4. Dépannage "File not found"
Si vous avez l'erreur "File not found", c'est que le fichier `debug.keystore` n'a pas encore été créé par Flutter sur votre machine. 
**Solution :** Lancez une fois votre application Flutter en mode debug sur un émulateur ou un téléphone branché à votre PC, et Flutter créera le fichier automatiquement. Ensuite, relancez la commande `keytool`.