# Guide de Configuration Mobile SuguMali (Flutter/Android)

Ce guide vous accompagne dans la connexion de votre backend Firebase existant (`studio-5667457400-e2c8f`) à une application mobile.

## 1. Prérequis Firebase
1.  Allez dans la [Console Firebase](https://console.firebase.google.com/).
2.  Ajoutez une application **Android** :
    -   Package name : `com.sugumali.app`
3.  Dans votre fichier `android/build.gradle.kts` (racine), assurez-vous d'avoir :
    ```kotlin
    id("com.google.gms.google-services") version "4.4.4" apply false
    ```

## 2. Générer les empreintes SHA (DÉPEND DE VOTRE TERMINAL)

### ⚠️ DANS LE TERMINAL DE CET IDE (Firebase Studio)
Si vous tapez la commande dans la fenêtre en bas de cet écran, c'est un environnement **LINUX**. Utilisez cette commande exacte :
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### 💻 SUR VOTRE ORDINATEUR WINDOWS (PowerShell)
Si vous travaillez sur votre propre PC :
```powershell
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

---

## 3. Étape par étape : Où coller le code SHA-1 ?

1.  Connectez-vous à la [Console Firebase](https://console.firebase.google.com/).
2.  Cliquez sur l'icône **Roue dentée (⚙️)** > **Paramètres du projet**.
3.  Allez dans l'onglet **Général**.
4.  Faites défiler jusqu'à **Vos applications** et sélectionnez l'icône Android.
5.  Cliquez sur **Ajouter une empreinte numérique**.
6.  Collez votre code **SHA-1** (celui qui commence par des paires de chiffres/lettres séparées par des deux-points).
7.  Cliquez sur **Enregistrer**.

## 4. Télécharger le fichier de configuration
1. Cliquez sur le bouton bleu **google-services.json**.
2. Placez ce fichier dans votre projet mobile, dans le dossier `android/app/`.
