# Guide de Configuration Mobile SuguMali (Flutter)

Ce guide vous accompagne dans la connexion de votre backend Firebase existant (`studio-5667457400-e2c8f`) à une application mobile Flutter.

## 1. Prérequis Firebase
1.  Allez dans la [Console Firebase](https://console.firebase.google.com/).
2.  Ajoutez une application **Android** :
    -   Package name : `com.sugumali.app`
    -   Téléchargez `google-services.json` et placez-le dans `android/app/`.
3.  Ajoutez une application **iOS** :
    -   Bundle ID : `com.sugumali.app`
    -   Téléchargez `GoogleService-Info.plist` et placez-le dans `ios/Runner/`.

## 2. Dépendances (pubspec.yaml)
Ajoutez ces lignes pour activer l'authentification, la base de données et les notifications :

```yaml
dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^3.1.1
  firebase_auth: ^5.1.1
  cloud_firestore: ^5.0.2
  firebase_messaging: ^15.0.3
  cached_network_image: ^3.3.1 # Recommandé pour SuguMali
```

## 3. Code d'Initialisation (main.dart)
Voici le code minimal pour démarrer et tester la connexion à Firestore :

```dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'firebase_options.dart'; // Généré par flutterfire configure

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialisation Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Configuration de la persistance (Mode Hors-ligne)
  FirebaseFirestore.instance.settings = const Settings(
    persistenceEnabled: true,
    cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
  );

  runApp(const SuguMaliMobile());
}

class SuguMaliMobile extends StatelessWidget {
  const SuguMaliMobile({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SuguMali',
      theme: ThemeData(
        primarySwatch: Colors.orange,
        useMaterial3: true,
      ),
      home: const TestFirestorePage(),
    );
  }
}

class TestFirestorePage extends StatelessWidget {
  const TestFirestorePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('SuguMali Backend Test')),
      body: Center(
        child: StreamBuilder(
          stream: FirebaseFirestore.instance.collection('annonces').snapshots(),
          builder: (context, AsyncSnapshot<QuerySnapshot> snapshot) {
            if (snapshot.hasError) return Text('Erreur: ${snapshot.error}');
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const CircularProgressIndicator();
            }
            
            return Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.cloud_done, color: Colors.green, size: 60),
                const SizedBox(height: 20),
                Text('${snapshot.data?.docs.length} annonces récupérées !'),
                const Text('Le mode hors-ligne est actif.'),
              ],
            );
          },
        ),
      ),
    );
  }
}
```

## 4. Conseils pour le déploiement au Mali
- **Optimisation Data :** Utilisez `cached_network_image` pour éviter de recharger les photos des produits, ce qui économise le forfait data de vos utilisateurs.
- **SMS Auth :** Firebase Auth gère très bien la connexion par numéro de téléphone, très populaire au Mali.
- **Localisation :** Utilisez le package `geolocator` pour aider les vendeurs à remplir automatiquement leur ville.
