'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Loader2, Send, X, User, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supportChat } from '@/ai/flows/support-chat-flow';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
};

/**
 * Avatar de Mami : Portrait d'une femme africaine souriante et accueillante.
 * L'URL a été mise à jour pour être plus robuste.
 */
const MAMI_AVATAR_URL = "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=1000";

export function SupportChatWidget() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'model',
      content: "Bonjour ! Je suis Mami, votre assistante pour SuguMali. Comment puis-je vous aider aujourd'hui ?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Anti-spam states
  const [lastSentContent, setLastSentContent] = useState<string>('');
  const [lastSentTime, setLastSentTime] = useState<number>(0);
  const [messageCount, setMessageCount] = useState(0);
  const [windowStart, setWindowStart] = useState(Date.now());

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const now = Date.now();

    if (trimmedInput.toLowerCase() === lastSentContent.toLowerCase() && now - lastSentTime < 30000) {
      toast({
        variant: 'destructive',
        title: 'Anti-spam activé',
        description: 'Veuillez éviter d\'envoyer le même message plusieurs fois de suite.',
      });
      return;
    }

    if (now - windowStart > 30000) {
      setWindowStart(now);
      setMessageCount(1);
    } else {
      if (messageCount >= 5) {
        toast({
          variant: 'destructive',
          title: 'Vitesse d\'envoi limitée',
          description: 'Vous envoyez des messages trop rapidement. Veuillez patienter un instant.',
        });
        return;
      }
      setMessageCount(prev => prev + 1);
    }

    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedInput,
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);
    setLastSentContent(trimmedInput);
    setLastSentTime(now);

    try {
        const chatHistory = [...messages, newUserMessage].map(({ role, content }) => ({ role, content }));
        const responseContent = await supportChat({ messages: chatHistory });

        if (!responseContent) {
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                role: 'model',
                content: "Désolé, je n'ai pas pu générer de réponse. Veuillez réessayer.",
            };
            setMessages(prev => [...prev, errorMessage]);
        } else {
            const newModelMessage: Message = {
                id: `model-${Date.now()}`,
                role: 'model',
                content: responseContent,
            };
            setMessages(prev => [...prev, newModelMessage]);
        }
    } catch (error) {
        console.error("Unexpected error in AI chat:", error);
        const errorMessage: Message = {
            id: `error-${Date.now()}`,
            role: 'model',
            content: "Désolé, une erreur est survenue. Veuillez réessayer plus tard.",
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 hover:scale-110 active:scale-95 border-none"
          size="icon"
          aria-label="Ouvrir le chat de support"
        >
          {isOpen ? <X className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-[85vw] max-w-sm h-[70vh] flex flex-col p-0 mr-4 mb-2 rounded-2xl border-border shadow-2xl">
        <header className="p-4 bg-muted/50 rounded-t-2xl border-b flex items-center gap-3">
           <Avatar className="h-12 w-12 border-2 border-accent">
            <AvatarImage src={MAMI_AVATAR_URL} alt="Mami" className="object-cover" />
            <AvatarFallback className="bg-accent text-white">
                <User />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-foreground">Mami</h3>
            <p className="text-xs text-muted-foreground">Conseillère SuguMali</p>
          </div>
        </header>

        <ScrollArea className="flex-1 bg-background" ref={scrollAreaRef}>
            <div className="p-4 space-y-4">
                {messages.map(message => (
                    <div key={message.id} className={cn("flex items-end gap-2", { "justify-end": message.role === 'user' })}>
                         {message.role === 'model' && (
                            <Avatar className="h-8 w-8 border border-accent/20">
                                <AvatarImage src={MAMI_AVATAR_URL} alt="Mami" className="object-cover" />
                                <AvatarFallback className="text-[10px] bg-accent text-white">
                                    M
                                </AvatarFallback>
                            </Avatar>
                         )}
                         <div className={cn(
                             "p-3 rounded-2xl max-w-[80%] text-sm shadow-sm",
                             message.role === 'user' 
                                ? "bg-accent text-accent-foreground rounded-br-none"
                                : "bg-muted text-foreground rounded-bl-none"
                         )}>
                             <p className="leading-relaxed">{message.content}</p>
                         </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex items-end gap-2">
                        <Avatar className="h-8 w-8 border border-accent/20">
                            <AvatarImage src={MAMI_AVATAR_URL} alt="Mami" className="object-cover" />
                            <AvatarFallback className="text-[10px] bg-accent text-white">
                                M
                            </AvatarFallback>
                        </Avatar>
                        <div className="p-3 rounded-2xl bg-muted text-muted-foreground rounded-bl-none">
                            <Loader2 className="h-4 w-4 animate-spin text-accent"/>
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
        
        <footer className="p-4 border-t bg-card rounded-b-2xl">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Tapez votre message ici..."
                    className="flex-1 bg-muted/30 border-none rounded-xl focus-visible:ring-accent"
                    disabled={isLoading}
                    autoComplete="off"
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-accent hover:bg-accent/90 rounded-xl">
                    <Send className="h-4 w-4"/>
                </Button>
            </form>
        </footer>
      </PopoverContent>
    </Popover>
  );
}
