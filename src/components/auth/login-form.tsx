'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Loader2, Mail, Lock } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Veuillez entrer une adresse e-mail valide.' }),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    if (!auth) return;
    setIsLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({ title: 'Connexion réussie', description: 'Heureux de vous revoir !' });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Auth Error:", error);
      let message = "Identifiants incorrects.";
      if (error.code === 'auth/user-not-found') message = "Aucun compte trouvé.";
      if (error.code === 'auth/wrong-password') message = "Mot de passe incorrect.";
      toast({ variant: 'destructive', title: 'Erreur', description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-MAIL</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                  <Input 
                    placeholder="eliteb269@gmail.com" 
                    {...field} 
                    type="email"
                    className="h-14 rounded-2xl bg-[#E8F0FE]/50 border-none pl-12 font-medium focus-visible:ring-accent/20" 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">MOT DE PASSE</FormLabel>
                <Link href="/forgot-password" title="Mot de passe oublié ?" className="text-[9px] font-black text-accent hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                  <Input 
                    placeholder="••••••••••••" 
                    {...field} 
                    type="password"
                    className="h-14 rounded-2xl bg-[#E8F0FE]/50 border-none pl-12 font-medium focus-visible:ring-accent/20" 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full bg-[#FF8C00] hover:bg-[#E67E00] text-white font-black h-14 rounded-2xl text-lg shadow-xl shadow-accent/20 transition-all active:scale-[0.98] mt-2" 
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Se connecter'}
        </Button>
      </form>
    </Form>
  );
}
