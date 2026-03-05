export type Category = {
  name: string;
  subcategories: string[];
};

export const categories: Category[] = [
  {
    name: 'Véhicules',
    subcategories: ['Voitures', 'Motos & Scooters', 'Pièces & Accessoires Auto/Moto'],
  },
  {
    name: 'Immobilier',
    subcategories: [
      'Appartements (Vente)',
      'Appartements (Location)',
      'Maisons (Vente)',
      'Maisons (Location)',
      'Terrains & Parcelles',
      'Bureaux & Commerces',
    ],
  },
  {
    name: 'Électronique',
    subcategories: [
      'Téléphones & Tablettes',
      'Ordinateurs & Portables',
      'Télévisions',
      'Consoles & Jeux vidéo',
      'Appareils photo & Caméras',
      'Accessoires électroniques',
    ],
  },
  {
    name: 'Électroménager',
    subcategories: [
      'Réfrigérateurs & Congélateurs',
      'Cuisinières & Fours',
      'Machines à laver',
      'Climatiseurs & Ventilateurs',
      'Petit électroménager',
    ],
  },
  {
    name: 'Pour la Maison & Jardin',
    subcategories: ['Meubles & Décoration', 'Arts de la table', 'Linge de maison', 'Jardinage & Outils de bricolage'],
  },
  {
    name: 'Mode & Beauté',
    subcategories: [
      'Vêtements (Femme)',
      'Vêtements (Homme)',
      'Chaussures',
      'Sacs & Accessoires',
      'Bijoux & Montres',
      'Produits de beauté & Parfums',
    ],
  },
  {
    name: 'Bébés & Enfants',
    subcategories: ['Vêtements pour enfants', 'Jouets & Jeux', 'Poussettes & Équipement'],
  },
  {
    name: 'Loisirs & Divertissement',
    subcategories: ['Livres, Films & Musique', 'Instruments de musique', 'Articles de sport', 'Vélos'],
  },
  {
    name: 'Emplois & Services',
    subcategories: ["Offres d'emploi", "CV & Demandes d'emploi", 'Services (cours, réparations, etc.)'],
  },
  {
    name: 'Autres',
    subcategories: ['Animaux', 'Agriculture & Alimentation', 'Équipements professionnels', 'Collections & Arts', 'Autre'],
  },
];

export const allSubcategories = categories.flatMap(c => c.subcategories);
