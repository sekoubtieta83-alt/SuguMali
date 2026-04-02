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
import { Loader2, Phone, ShieldCheck, ArrowRight, MessageSquareCode } from 'lucide-react';
import { Label } from '@/components/ui/label';

export function PhoneLogin() {
  const [phoneNumber, setPhoneNumber] = useState('');
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
    
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaRef.current, {
      size: 'invisible',
      callback: () => {
        console.log('Recaptcha resolved');
      }
    });

    return () => {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
      }
    };
  }, [auth]);

  const onSendOTP = async () => {
    if (!auth || !phoneNumber) return;
    setIsLoading(true);

    try {
      const verifier = (window as any).recaptchaVerifier;
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+223${phoneNumber}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedNumber, verifier);
      setConfirmationResult(confirmation);
      setStep('otp');
      toast({ title: 'Code envoyé !', description: 'Vérifiez vos messages SMS.' });
    } catch (error: any) {
      console.error("SMS Error:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Erreur', 
        description: "Impossible d'envoyer le code. Vérifiez le numéro." 
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
      toast({ title: 'Connexion réussie', description: 'Heureux de vous revoir !' });
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
            ? "Entrez votre numéro pour recevoir un code de sécurité par SMS." 
            : `Entrez le code envoyé au ${phoneNumber}`}
        </p>
      </div>

      {step === 'phone' ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Numéro de téléphone</Label>
            <div className="relative">
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
          <Button 
            className="w-full h-14 rounded-2xl font-black text-lg bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/20 transition-all active:scale-[0.98]" 
            onClick={onSendOTP}
            disabled={isLoading || !phoneNumber}
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><ArrowRight className="mr-2 h-5 w-5" /> Recevoir le code</>}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Code de validation (6 chiffres)</Label>
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
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><ShieldCheck className="mr-2 h-5 w-5" /> Valider & Entrer</>}
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-xs font-bold text-muted-foreground"
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
