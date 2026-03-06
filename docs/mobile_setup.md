# Guide de Configuration Mobile SuguMali (Flutter/Android)

Ce guide vous accompagne dans la connexion de votre backend Firebase existant (`studio-5667457400-e2c8f`) à une application mobile.

## 1. Prérequis Firebase (Fichiers Gradle sur votre PC)

### 📂 Racine du projet : `android/build.gradle`
C'est le fichier qui gère tout votre projet. Dans la section `plugins`, assurez-vous d'avoir cette ligne :
```kotlin
plugins {
    // ... autres plugins
    id("com.google.gms.google-services") version "4.4.4" apply false
}
```

### 📱 Dossier application : `android/app/build.gradle`
C'est le fichier qui gère uniquement votre application SuguMali.
1.  **Tout en haut**, dans le bloc `plugins`, ajoutez :
    ```kotlin
    plugins {
        // ... autres plugins existants
        id("com.google.gms.google-services")
    }
    ```
2.  **Dans la section `dependencies`**, ajoutez la plateforme Firebase :
    ```kotlin
    dependencies {
        // Importez la BoM Firebase
        implementation(platform("com.google.firebase:firebase-bom:33.1.2"))
        // ...
    }
    ```

---

## 2. Générer les empreintes SHA (DÉPEND DE VOTRE TERMINAL)

### ⚠️ DANS LE TERMINAL DE CET IDE (Firebase Studio)
Si vous tapez la commande dans la fenêtre en bas de cet écran, c'est un environnement **LINUX**. Utilisez cette commande exacte :
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### 💻 SUR VOTRE ORDINATEUR WINDOWS (PowerShell)
Si vous travaillez sur votre propre PC (VS Code, Android Studio) :
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
6.  Collez votre code **SHA-1** (obtenu à l'étape 2).
7.  Cliquez sur **Enregistrer**.

## 4. Télécharger le fichier de configuration
1. Dans la même page Firebase, cliquez sur le bouton bleu **google-services.json**.
2. **Action sur votre PC :** Placez ce fichier téléchargé dans votre projet mobile, exactement dans le dossier `android/app/`.