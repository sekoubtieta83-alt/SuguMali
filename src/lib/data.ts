export interface Post {
  id: string;
  vendeurId: string;
  createdAt?: any;
  updatedAt?: any;
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
  whatsappNumber?: string;
  status: 'pending' | 'approved' | 'rejected' | 'sold';
  views: number;
  likes: number;
  comments: number;
  
  // Champs de priorité et statut
  isPromoted: boolean; 
  isSold: boolean;
  sponsored?: boolean;

  // Champs de compatibilité
  product?: any; 
  content?: string;
  location?: string;
  category?: string;
  condition?: string;
}
