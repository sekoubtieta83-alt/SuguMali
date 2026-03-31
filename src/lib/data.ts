import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '@/firebase'; // Chemin vers votre fichier de configuration Firebase

// Définition de la structure d'une annonce
export interface Post {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image?: string; 
}

// Référence à votre collection Firestore (assurez-vous qu'elle s'appelle bien 'annonces' ou modifiez ici)
const postsCollection = collection(db, 'annonces'); 

// 1. Charger TOUTES les annonces
export async function getAllPosts(): Promise<Post[]> {
  try {
    const snapshot = await getDocs(postsCollection);
    // On mappe les documents pour inclure l'ID généré par Firestore
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
  } catch (error) {
    console.error("Erreur lors de la récupération des annonces :", error);
    return []; // Retourne un tableau vide pour ne pas faire crasher l'application
  }
}

// 2. Charger une annonce spécifique (pour votre page de détail)
export async function getPostById(postId: string): Promise<Post | null> {
  try {
    const docRef = doc(db, 'annonces', postId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Post;
    }
    return null; // Si l'annonce n'existe pas
  } catch (error) {
    console.error("Erreur lors de la récupération de l'annonce :", error);
    return null;
  }
}

// 3. Filtrer par catégorie (idéal pour la navigation)
export async function getPostsByCategory(category: string): Promise<Post[]> {
  try {
    const q = query(postsCollection, where("category", "==", category));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
  } catch (error) {
    console.error(`Erreur lors du filtrage pour la catégorie ${category} :`, error);
    return [];
  }
}