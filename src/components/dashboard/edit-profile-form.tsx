'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { CropIcon, Loader2, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { UserProfile } from '@/app/dashboard/profile/page';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';


const profileSchema = z.object({
  displayName: z.string().min(3, { message: 'Le nom doit contenir au moins 3 caractères.' }),
  bio: z.string().max(160, { message: 'La biographie ne peut pas dépasser 160 caractères.' }).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileFormProps {
  userProfile: UserProfile;
  onFinished: () => void;
}

// Helper function to create a cropped image
async function getCroppedImg(image: HTMLImageElement, crop: PixelCrop): Promise<string> {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
    );
    
    return new Promise((resolve) => {
        resolve(canvas.toDataURL('image/jpeg', 0.9));
    });
}


export function EditProfileForm({ userProfile, onFinished }: EditProfileFormProps) {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Cropping states
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Final photo URL state
  const [photoURL, setPhotoURL] = useState(userProfile.photoURL);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: userProfile.displayName || '',
      bio: userProfile.bio || '',
    },
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Fichier non valide',
          description: 'Veuillez sélectionner un fichier image.',
        });
        return;
      }
      
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setSourceImage(reader.result?.toString() || null);
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1, // Aspect ratio 1:1
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  };
  
  const handleCropImage = async () => {
    if (completedCrop && imgRef.current) {
        try {
            const croppedImageUrl = await getCroppedImg(imgRef.current, completedCrop);
            setPhotoURL(croppedImageUrl);
            setIsCropping(false);
            setSourceImage(null);
        } catch (e) {
            console.error('Failed to crop image', e);
            toast({
              variant: 'destructive',
              title: 'Erreur de rognage',
              description: "Impossible de rogner l'image.",
            });
        }
    }
  };


  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !auth || !firestore) return;
    setIsLoading(true);

    try {
      // 1. Update Firebase Auth Profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: data.displayName,
          photoURL: photoURL,
        });
      }


      // 2. Update Firestore Document
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
        displayName: data.displayName,
        photoURL: photoURL,
        bio: data.bio,
      }, { merge: true });

      toast({
        title: 'Profil mis à jour !',
        description: 'Vos informations ont été enregistrées avec succès.',
      });
      onFinished();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le profil.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
              <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
              />
              <Avatar className="h-24 w-24 cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <AvatarImage src={photoURL} alt={form.getValues('displayName')} className="object-cover"/>
                  <AvatarFallback>{form.getValues('displayName')?.charAt(0) ?? 'U'}</AvatarFallback>
              </Avatar>
              <Button type="button" variant="ghost" onClick={() => avatarInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Changer d'avatar
              </Button>
          </div>
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom et prénom</FormLabel>
                <FormControl>
                  <Input placeholder="Jean Dupont" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Biographie</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Parlez un peu de vous..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enregistrer les modifications'}
          </Button>
        </form>
      </Form>
      
      {/* Cropping Dialog */}
       <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent className="p-2 sm:p-6 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Rogner votre photo</DialogTitle>
          </DialogHeader>
          {sourceImage && (
            <div className="flex justify-center items-center my-4">
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                onComplete={c => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={sourceImage}
                  onLoad={onImageLoad}
                  style={{ maxHeight: '60vh' }}
                  className="max-w-full"
                />
              </ReactCrop>
            </div>
          )}
          <DialogFooter className="flex-row justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCropping(false)}>Annuler</Button>
            <Button onClick={handleCropImage}>
              <CropIcon className="mr-2 h-4 w-4" />
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
