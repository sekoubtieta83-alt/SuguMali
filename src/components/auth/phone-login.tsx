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
import { Loader2, Phone, ShieldCheck, ArrowRight, MessageSquareCode, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { countryCodes } from '@/lib/country-codes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function PhoneLogin() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedDialCode, setSelectedCountryCode] = useState('+223');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [regionError, setRegionError] = useState<string | null>(null);
  
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (!auth || !recaptchaRef.current) return;
    
    // Initialisation sécurisée du ReCAPTCHA
    const initRecaptcha = () => {
      try {
        if (verifierRef.current) {
          verifierRef.current.clear();
        }

        verifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current!, {
          size: 'invisible',
          'callback': () => {
            console.log('ReCAPTCHA validé');
          }
        });
      } catch (error) {
        console.error("Erreur lors de l'initialisation du ReCAPTCHA:", error);
      }
    };

    initRecaptcha();

    return () => {
      if (verifierRef.current) {
        try {
          verifierRef.current.clear();
        } catch (e) {}
        verifierRef.current = null;
      }
    };
  }, [auth]);

  const onSendOTP = async () => {
    if (!auth || !phoneNumber || isLoading) return;
    setIsLoading(true);
    setRegionError(null);

    try {
      if (!verifierRef.current) {
        throw new Error("Le vérificateur de sécurité n'est pas prêt. Veuillez rafraîchir la page.");
      }

      const cleanNumber = phoneNumber.replace(/\s/g, '');
      const formattedNumber = cleanNumber.startsWith('+') ? cleanNumber : `${selectedDialCode}${cleanNumber}`;
      
      const confirmation = await signInWithPhoneNumber(auth, formattedNumber, verifierRef.current);
      setConfirmationResult(confirmation);
      setStep('otp');
      toast({ 
        title: 'Code envoyé !', 
        description: `Un SMS a été envoyé au ${formattedNumber}` 
      });
    } catch (error: any) {
      console.error("Erreur d'envoi SMS Firebase:", error);
      
      if (error.code === 'auth/operation-not-allowed') {
        setRegionError("L'envoi de SMS vers cette région n'est pas activé dans votre console Firebase.");
        toast({ 
          variant: 'destructive', 
          title: "Région non autorisée", 
          description: "Veuillez activer le pays dans la console Firebase (SMS Region Policy)."
        });
      } else {
        toast({ 
          variant: 'destructive', 
          title: "Échec de l'envoi", 
          description: error.message || "Veuillez vérifier le numéro et réessayer."
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOTP = async () => {
    if (!confirmationResult || !otp || isLoading) return;
    setIsLoading(true);

    try {
      await confirmationResult.confirm(otp);
      toast({ title: 'Connexion réussie', description: 'Bienvenue sur SuguMali !' });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Erreur vérification OTP:", error);
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
        <p className="text-sm text-muted-foreground">
          {step === 'phone' 
            ? "Entrez votre numéro pour vous connecter." 
            : `Entrez le code reçu par SMS.`}
        </p>
      </div>

      {regionError && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive rounded-2xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold">Action requise (Admin)</AlertTitle>
          <AlertDescription className="text-xs mt-1">
            Activez le <strong>Mali (+223)</strong> et le <strong>Ghana (+233)</strong> dans : 
            <br/><code className="bg-black/10 px-1 rounded">Console Firebase &gt; Auth &gt; Settings &gt; SMS Region Policy</code>
          </AlertDescription>
        </Alert>
      )}

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
            onClick={() => { setStep('phone'); setRegionError(null); }}
            disabled={isLoading}
          >
            Changer de numéro
          </Button>
        </div>
      )}
    </div>
  );
}