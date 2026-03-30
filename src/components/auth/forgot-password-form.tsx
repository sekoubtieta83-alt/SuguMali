'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

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
import { Loader2, Mail, ArrowLeft, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';

const emailSchema = z.object({
  email: z.string().email({ message: 'Veuillez entrer une adresse e-mail valide.' }),
});

const otpSchema = z.object({
  otp: z.string().length(6, { message: 'Le code doit contenir 6 chiffres.' }),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' }),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OTPFormValues = z.infer<typeof otpSchema>;

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const otpForm = useForm<OTPFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '', password: '' },
  });

  const onRequestOTP = async (data: EmailFormValues) => {
    setIsLoading(true);
    try {
      const functions = getFunctions(getApp(), 'europe-west1');
      const requestOTP = httpsCallable(functions, 'requestPasswordResetOTP');
      await requestOTP({ email: data.email });
      
      setEmail(data.email);
      setStep('otp');
      toast({
        title: 'Code envoyé !',
        description: 'Vérifiez votre boîte de réception (ou spams) pour le code OTP.',
      });
    } catch (error: any) {
      console.error(error);
      toast({ 
        variant: 'destructive', 
        title: 'Erreur', 
        description: error.message || "Impossible d'envoyer le code." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async (data: OTPFormValues) => {
    setIsLoading(true);
    try {
      const functions = getFunctions(getApp(), 'europe-west1');
      const resetPassword = httpsCallable(functions, 'verifyOTPAndResetPassword');
      await resetPassword({ 
        email, 
        otp: data.otp, 
        newPassword: data.password 
      });
      
      setStep('success');
      toast({
        title: 'Succès !',
        description: 'Votre mot de passe a été réinitialisé avec succès.',
      });
    } catch (error: any) {
      console.error(error);
      toast({ 
        variant: 'destructive', 
        title: 'Erreur', 
        description: error.message || "Code incorrect ou expiré." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <Card className="w-full max-w-md shadow-2xl rounded-[2.5rem] border-none bg-card/80 backdrop-blur-sm overflow-hidden text-center">
        <div className="h-2 bg-[#FF8C00]" />
        <CardHeader className="space-y-4 pt-10 px-8">
          <div className="flex justify-center">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black">Mot de passe modifié !</CardTitle>
          <CardDescription className="text-base font-medium">
            Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-12">
          <Button asChild className="w-full bg-[#FF8C00] hover:bg-[#E67E00] text-white font-black h-14 rounded-2xl text-lg shadow-xl shadow-[#FF8C00]/20 transition-all active:scale-[0.98]">
            <Link href="/login">Se connecter</Link>
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
          {step === 'email' ? 'Récupération de compte' : 'Validation par code OTP'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="grid gap-6 px-8 pb-12">
        {step === 'email' ? (
          <>
            <p className="text-sm text-center text-muted-foreground px-2 leading-relaxed">
              Entrez votre e-mail pour recevoir un code de vérification à 6 chiffres.
            </p>
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onRequestOTP)} className="grid gap-5">
                <FormField
                  control={emailForm.control}
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
                  {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Recevoir le code'}
                </Button>
              </form>
            </Form>
          </>
        ) : (
          <>
            <div className="bg-accent/5 p-4 rounded-2xl border border-accent/10 text-center">
                <p className="text-xs font-medium text-muted-foreground">Code envoyé à :</p>
                <p className="text-sm font-black text-accent">{email}</p>
            </div>
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(onResetPassword)} className="grid gap-5">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Code OTP (6 chiffres)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                          <Input 
                            placeholder="123456" 
                            {...field} 
                            maxLength={6}
                            className="h-14 rounded-2xl bg-muted/50 border-none pl-12 text-center text-xl font-black tracking-[0.5em] focus-visible:ring-[#FF8C00]/50" 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={otpForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Nouveau mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                          <Input 
                            placeholder="••••••••" 
                            {...field} 
                            type="password"
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
                  {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Changer le mot de passe'}
                </Button>
                <Button 
                    variant="ghost" 
                    type="button" 
                    className="text-xs font-bold text-muted-foreground hover:text-accent"
                    onClick={() => setStep('email')}
                    disabled={isLoading}
                >
                    Changer d'adresse e-mail
                </Button>
              </form>
            </Form>
          </>
        )}

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