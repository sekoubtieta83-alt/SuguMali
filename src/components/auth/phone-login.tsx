'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult 
} from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone, ShieldCheck, ArrowRight, MessageSquareCode, Globe } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { countryCodes } from '@/lib/country-codes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PhoneLogin() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedDialCode, setSelectedCountryCode] = useState('+223');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const recaptchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth || !recaptchaRef.current) return;
    
    const initRecaptcha = () => {
      try {
        // Nettoyage sécurisé de l'instance précédente
        if ((window as any).recaptchaVerifier) {
          try {
            (window as any).recaptchaVerifier.clear();
          } catch (e) {
            console.warn('Recaptcha clear error ignored during re-init:', e);
          }
          (window as any).recaptchaVerifier = null;
        }

        // Initialisation de la nouvelle instance
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaRef.current!, {
          size: 'invisible',
          callback: () => {
            console.log('Recaptcha resolved');
          },
          'expired-callback': () => {
            console.log('Recaptcha expired');
          }
        });
      } catch (error) {
        console.error("Error initializing recaptcha:", error);
      }
    };

    initRecaptcha();

    return () => {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {
          // Ignorer l'erreur au démontage pour éviter le crash
        }
        (window as any).recaptchaVerifier = null;
      }
    };
  }, [auth]);

  const onSendOTP = async () => {
    if (!auth || !phoneNumber) return;
    setIsLoading(true);

    try {
      const verifier = (window as any).recaptchaVerifier;
      if (!verifier) {
        throw new Error("Le vérificateur de sécurité n'est pas prêt. Rafraîchissez la page.");
      }

      // On nettoie le numéro des espaces et on ajoute l'indicatif choisi
      const cleanNumber = phoneNumber.replace(/\s/g, '');
      const formattedNumber = cleanNumber.startsWith('+') ? cleanNumber : `${selectedDialCode}${cleanNumber}`;
      
      const confirmation = await signInWithPhoneNumber(auth, formattedNumber, verifier);
      setConfirmationResult(confirmation);
      setStep('otp');
      toast({ title: 'Code envoyé !', description: `Un SMS a été envoyé au ${formattedNumber}` });
    } catch (error: any) {
      console.error("SMS Error:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Erreur', 
        description: error.message || "Impossible d'envoyer le code. Vérifiez le numéro ou réessayez plus tard." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOTP = async () => {
    if (!confirmationResult || !otp) return;
    setIsLoading(true);

    try {
      await confirmationResult.confirm(otp);
      toast({ title: 'Connexion réussie', description: 'Bienvenue sur SuguMali !' });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("OTP Error:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Code incorrect', 
        description: "Le code saisi n'est pas valide ou a expiré." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div id="recaptcha-container" ref={recaptchaRef}></div>
      
      <div className="text-center space-y-2 mb-4">
        <h2 className="text-xl font-black">{step === 'phone' ? 'Votre Numéro' : 'Vérification'}</h2>
        <p className="text-sm text-muted-foreground px-4">
          {step === 'phone' 
            ? "Choisissez votre pays et entrez votre numéro." 
            : `Entrez le code de sécurité reçu par SMS.`}
        </p>
      </div>

      {step === 'phone' ? (
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Indicatif & Numéro</Label>
            
            <div className="flex gap-2">
              <div className="w-[110px] shrink-0">
                <Select value={selectedDialCode} onValueChange={setSelectedCountryCode}>
                  <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-none focus:ring-accent/50 font-bold">
                    <SelectValue placeholder="Pays" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl max-h-[300px]">
                    {countryCodes.map((country) => (
                      <SelectItem key={`${country.code}-${country.dial_code}`} value={country.dial_code}>
                        <span className="mr-2">{country.flag}</span>
                        <span>{country.dial_code}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative flex-1">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                <Input 
                  placeholder="79 05 28 86" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-14 rounded-2xl bg-muted/50 border-none pl-12 focus-visible:ring-accent/50 text-lg font-bold"
                  type="tel"
                />
              </div>
            </div>
          </div>

          <Button 
            className="w-full h-14 rounded-2xl font-black text-lg bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/20 transition-all active:scale-[0.98]" 
            onClick={onSendOTP}
            disabled={isLoading || !phoneNumber}
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><ArrowRight className="mr-2 h-5 w-5" /> Continuer</>}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Code reçu par SMS</Label>
            <div className="relative">
              <MessageSquareCode className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
              <Input 
                placeholder="123456" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="h-14 rounded-2xl bg-muted/50 border-none pl-12 text-center text-xl font-black tracking-[0.5em] focus-visible:ring-accent/50" 
              />
            </div>
          </div>
          <Button 
            className="w-full h-14 rounded-2xl font-black text-lg bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/20 transition-all active:scale-[0.98]" 
            onClick={onVerifyOTP}
            disabled={isLoading || otp.length < 6}
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><ShieldCheck className="mr-2 h-5 w-5" /> Vérifier & Se connecter</>}
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-xs font-bold text-muted-foreground hover:text-accent"
            onClick={() => setStep('phone')}
            disabled={isLoading}
          >
            Changer de numéro
          </Button>
        </div>
      )}
    </div>
  );
}