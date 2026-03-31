export interface Post {
  id: string;
  vendeurId: string;
  createdAt?: Date;
  updatedAt?: Date;
  titre: string;
  description: string;
  categorie: string;
  etat: string;
  prix: string | number;
  localisation: string;
  image?: string | null;
  media?: Array<{ type: 'image' | 'video'; url: string }>;
  vendeurVerified: boolean;
  whatsapp?: string;
  status: 'pending' | 'approved' | 'rejected' | 'sold';
  views: number;
  likes: number;
  comments: number;
  
  // ✅ AJOUTE CES DEUX LIGNES (OBLIGATOIRE POUR LE DASHBOARD)
  isPromoted: boolean; 
  isSold: boolean;

  // AJOUTE CES LIGNES POUR COMPATIBILITÉ (ANCIENS COMPOSANTS)
  product?: any; 
  content?: string;
  location?: string;
  category?: string;
  condition?: string;
}