'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/firebase';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Logo } from '../logo';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Loader2, AlertCircle, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Veuillez entrer une adresse e-mail valide.' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmited] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    if (!auth) return;
    setIsLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, data.email);
      setIsSubmited(true);
      toast({
        title: 'E-mail envoyé',
        description: 'Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.',
      });
    } catch (error: any) {
      console.error("Forgot Password Error:", error);
      let message = "Une erreur est survenue.";
      if (error.code === 'auth/user-not-found') message = "Aucun compte trouvé avec cet e-mail.";
      toast({ variant: 'destructive', title: 'Erreur', description: message });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md shadow-2xl rounded-[2.5rem] border-none bg-card/80 backdrop-blur-sm overflow-hidden text-center">
        <div className="h-2 bg-[#FF8C00]" />
        <CardHeader className="space-y-4 pt-10 px-8">
          <div className="flex justify-center">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black">Lien envoyé !</CardTitle>
          <CardDescription className="text-base font-medium">
            Nous avons envoyé un lien de réinitialisation à l'adresse <span className="text-foreground font-bold">{form.getValues('email')}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-12 space-y-6">
          <p className="text-sm text-muted-foreground italic">
            Pensez à vérifier vos courriers indésirables (spams) si vous ne voyez rien.
          </p>
          <Button asChild className="w-full bg-[#FF8C00] hover:bg-[#E67E00] text-white font-black h-14 rounded-2xl text-lg shadow-xl shadow-[#FF8C00]/20 transition-all active:scale-[0.98]">
            <Link href="/login">Retour à la connexion</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-2xl rounded-[2.5rem] border-none bg-card/80 backdrop-blur-sm overflow-hidden">
      <div className="h-2 bg-[#FF8C00]" />
      <CardHeader className="space-y-2 text-center pt-10">
        <div className="flex justify-center items-center gap-3 mb-2">
          <Logo className="h-12 w-12" />
          <CardTitle className="text-3xl font-black tracking-tighter text-foreground">Sugu<span className="text-[#FF8C00]">Mali</span></CardTitle>
        </div>
        <CardDescription className="text-base font-medium opacity-70">
          Mot de passe oublié ?
        </CardDescription>
      </CardHeader>
      
      <CardContent className="grid gap-6 px-8 pb-12">
        <p className="text-sm text-center text-muted-foreground px-2">
          Entrez votre e-mail et nous vous enverrons un lien pour créer un nouveau mot de passe.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">E-mail</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                      <Input 
                        placeholder="votre@email.com" 
                        {...field} 
                        type="email"
                        className="h-14 rounded-2xl bg-muted/50 border-none pl-12 focus-visible:ring-[#FF8C00]/50" 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full bg-[#FF8C00] hover:bg-[#E67E00] text-white font-black h-14 rounded-2xl text-lg mt-2 shadow-xl shadow-[#FF8C00]/20 transition-all active:scale-[0.98]" 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Envoyer le lien'}
            </Button>
          </form>
        </Form>

        <div className="text-center pt-2">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-black text-[#FF8C00] hover:underline underline-offset-4">
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
