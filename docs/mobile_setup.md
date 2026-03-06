# Guide de Configuration Mobile SuguMali (Flutter)

Ce guide vous accompagne dans la connexion de votre backend Firebase existant (`studio-5667457400-e2c8f`) à une application mobile Flutter.

## 1. Prérequis Firebase
1.  Allez dans la [Console Firebase](https://console.firebase.google.com/).
2.  Ajoutez une application **Android** :
    -   Package name : `com.sugumali.app`
    -   **Important :** Vous devez ajouter vos empreintes numériques SHA-1 et SHA-256.
3.  Ajoutez une application **iOS** :
    -   Bundle ID : `com.sugumali.app`

## 2. Générer les empreintes SHA (Android)

**Attention :** Si vous utilisez le terminal de **Firebase Studio** (qui est un environnement Linux/Bash), utilisez la commande Linux ci-dessous. La commande Windows ne fonctionnera pas dans ce terminal.

### Pour le Terminal Firebase Studio (Linux / Bash)
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### Pour votre ordinateur personnel (Windows PowerShell)
```bash
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

### Pour votre ordinateur personnel (macOS / Linux)
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Où les coller ?**
1. Allez dans **Paramètres du projet** > **Général**.
2. Dans **Vos applications**, sélectionnez l'app Android.
3. Cliquez sur **Ajouter une empreinte** et collez le SHA-1 et le SHA-256.

## 3. Dépendances (pubspec.yaml)
Ajoutez ces lignes pour activer l'authentification, la base de données et les notifications :

```yaml
dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^3.1.1
  firebase_auth: ^5.1.1
  cloud_firestore: ^5.0.2
  firebase_messaging: ^15.0.3
  google_sign_in: ^6.2.1
  cached_network_image: ^3.3.1
```

## 4. Code d'Initialisation (main.dart)
```dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'firebase_options.dart'; 

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const SuguMaliMobile());
}
```

## 5. Conseils pour le déploiement au Mali
- **Optimisation Data :** Utilisez `cached_network_image` pour économiser le forfait data.
- **SMS Auth :** Firebase Auth gère très bien la connexion par numéro de téléphone (très utilisé au Mali).
- **Localisation :** Utilisez `geolocator` pour aider les vendeurs à Bamako ou Sikasso.
