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

export const posts: Post[] = [];

export const getPostUser = (userId: string) => users.find(u => u.id === userId);