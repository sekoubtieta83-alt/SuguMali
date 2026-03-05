
export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isVerified: boolean;
  joined: string;
};

export type Post = {
  id: string;
  userId: string;
  content: string;
  media: { url: string; type: 'image' | 'video' }[];
  createdAt: string;
  likes: number;
  comments: number;
  isProduct: boolean;
  isPromoted?: boolean;
  location?: string;
  whatsappNumber?: string;
  category?: string;
  condition?: 'Neuf' | 'Comme neuf' | 'Occasion';
  status?: 'pending' | 'approved' | 'rejected' | 'shadowed';
  moderationReason?: string;
  manualReviewRequested?: boolean;
  views?: number;
  product?: {
    name: string;
    price: string;
    url: string;
  };
};

export const users: User[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', avatar: 'https://picsum.photos/seed/avatar1/100/100', isVerified: true, joined: '2023-01-15' },
  { id: '2', name: 'Bob Williams', email: 'bob@example.com', avatar: 'https://picsum.photos/seed/avatar2/100/100', isVerified: false, joined: '2023-02-20' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', avatar: 'https://picsum.photos/seed/avatar3/100/100', isVerified: true, joined: '2023-03-10' },
  { id: '4', name: 'Diana Prince', email: 'diana@example.com', avatar: 'https://picsum.photos/seed/avatar4/100/100', isVerified: false, joined: '2023-04-05' },
  { id: '5', name: 'Ethan Hunt', email: 'ethan@example.com', avatar: 'https://picsum.photos/seed/avatar5/100/100', isVerified: false, joined: '2023-05-21' },
];

export const posts: Post[] = [
  {
    id: 'p1',
    userId: '1',
    content: 'Loving the views on my morning hike! 🏔️ #nature #adventure',
    media: [{ url: 'https://picsum.photos/seed/post1/600/400', type: 'image' }],
    createdAt: '3 hours ago',
    likes: 124,
    comments: 12,
    isProduct: false,
    location: "Sikasso",
    status: 'approved',
    views: 156,
  },
  {
    id: 'p2',
    userId: '2',
    content: 'Check out these new wireless headphones I got! The sound is amazing.',
    media: [{ url: 'https://picsum.photos/seed/product2/600/400', type: 'image' }],
    createdAt: '1 day ago',
    likes: 88,
    comments: 23,
    isProduct: true,
    isPromoted: true,
    location: "Bamako, ACI 2000",
    whatsappNumber: "+22376000001",
    category: 'Accessoires électroniques',
    condition: 'Comme neuf',
    status: 'approved',
    views: 1240,
    product: {
      name: 'Aura Headphones',
      price: '95000 FCFA',
      url: '/annonces/p2',
    },
  },
  {
    id: 'p3',
    userId: '3',
    content: 'Just dropped a new video on my channel! Link in bio. 🎬',
    media: [{ url: 'https://picsum.photos/seed/post_vid1/600/400', type: 'video' }],
    createdAt: '2 days ago',
    likes: 302,
    comments: 45,
    isProduct: false,
    location: "Kayes",
    status: 'approved',
    views: 890,
  },
  {
    id: 'p4',
    userId: '4',
    content: 'This new smartwatch is a game-changer for my workouts.',
    media: [{ url: 'https://picsum.photos/seed/product1/600/400', type: 'image' }],
    createdAt: '4 days ago',
    likes: 210,
    comments: 31,
    isProduct: true,
    location: "Mopti",
    whatsappNumber: "+22376000002",
    category: 'Téléphones & Tablettes',
    condition: 'Neuf',
    status: 'approved',
    views: 567,
    product: {
      name: 'Chrono Watch 2.0',
      price: '125000 FCFA',
      url: '/annonces/p4',
    },
  },
    {
    id: 'p5',
    userId: '1',
    content: 'Beautiful city lights from my apartment.',
    media: [{ url: 'https://picsum.photos/seed/post2/600/400', type: 'image' }],
    createdAt: '5 days ago',
    likes: 56,
    comments: 8,
    isProduct: false,
    location: "Gao",
    status: 'approved',
    views: 234,
  },
    {
    id: 'p6',
    userId: '3',
    content: 'My workspace setup. Clean and simple.',
    media: [{ url: 'https://picsum.photos/seed/post6/600/400', type: 'image' }],
    createdAt: '6 days ago',
    likes: 150,
    comments: 18,
    isProduct: false,
    location: "Tombouctou",
    category: 'Ordinateurs & Portables',
    status: 'approved',
    views: 412,
  },
];

export const getPostUser = (userId: string) => users.find(u => u.id === userId);
