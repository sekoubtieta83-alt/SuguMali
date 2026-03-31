import { collection } from 'firebase/firestore';
import { db } from '@/firebase/index';

// Définition complète de la structure d'une annonce pour SuguMali
export interface Post {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image?: string;      // Champ direct venant de Firestore
  location?: string;
  isSold?: boolean;
  isPromoted?: boolean;
  content?: string;
  isProduct?: boolean;
  // Pour la gestion des galeries photos/vidéos
  media?: { 
    type: 'image' | 'video'; 
    url: string; 
  }[];
  // Pour la compatibilité avec les anciens objets produits
  product?: {
    name: string;
    price: string;
  };
}

// Référence à votre collection Firestore
export const postsCollection = collection(db, 'annonces');