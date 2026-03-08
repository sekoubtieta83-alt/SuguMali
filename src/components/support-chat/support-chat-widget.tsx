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
import { useToast } from '@/hooks/use-toast';

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
};

const MAMI_AVATAR_URL = "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=1000";

export function SupportChatWidget() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'model',
      content: "Bonjour ! Je suis Mami, votre assistante SuguMali. Comment puis-je vous aider aujourd'hui ?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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

    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedInput,
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const chatHistory = [...messages, newUserMessage].map(({ role, content }) => ({ role, content }));
        const responseContent = await supportChat({ messages: chatHistory });

        const newModelMessage: Message = {
            id: `model-${Date.now()}`,
            role: 'model',
            content: responseContent,
        };
        setMessages(prev => [...prev, newModelMessage]);
    } catch (error) {
        console.error("AI chat error:", error);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: "Mami n'est pas disponible pour le moment.",
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-accent text-white hover:scale-110 transition-transform border-none"
          size="icon"
        >
          {isOpen ? <X className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-[85vw] max-w-sm h-[60vh] flex flex-col p-0 mr-4 mb-2 rounded-2xl shadow-2xl border-none overflow-hidden">
        <header className="p-4 bg-accent text-white flex items-center gap-3">
           <Avatar className="h-10 w-10 border-2 border-white/20">
            <AvatarImage src={MAMI_AVATAR_URL} alt="Mami" className="object-cover" />
            <AvatarFallback className="bg-white text-accent">M</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold">Mami</h3>
            <p className="text-[10px] opacity-80 uppercase tracking-tighter">Conseillère SuguMali</p>
          </div>
        </header>

        <ScrollArea className="flex-1 bg-background" ref={scrollAreaRef}>
            <div className="p-4 space-y-4">
                {messages.map(message => (
                    <div key={message.id} className={cn("flex items-end gap-2", { "justify-end": message.role === 'user' })}>
                         {message.role === 'model' && (
                            <Avatar className="h-6 w-6 border border-accent/20">
                                <AvatarImage src={MAMI_AVATAR_URL} alt="Mami" className="object-cover" />
                                <AvatarFallback className="text-[8px] bg-accent text-white">M</AvatarFallback>
                            </Avatar>
                         )}
                         <div className={cn(
                             "p-3 rounded-2xl max-w-[80%] text-sm",
                             message.role === 'user' 
                                ? "bg-accent text-white rounded-br-none"
                                : "bg-muted text-foreground rounded-bl-none"
                         )}>
                             <p className="leading-relaxed">{message.content}</p>
                         </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex items-end gap-2">
                        <Avatar className="h-6 w-6 border border-accent/20">
                            <AvatarImage src={MAMI_AVATAR_URL} alt="Mami" className="object-cover" />
                            <AvatarFallback className="text-[8px] bg-accent text-white">M</AvatarFallback>
                        </Avatar>
                        <div className="p-3 rounded-2xl bg-muted text-muted-foreground rounded-bl-none">
                            <Loader2 className="h-4 w-4 animate-spin text-accent"/>
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
        
        <footer className="p-4 border-t bg-card">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Posez votre question..."
                    className="flex-1 rounded-xl focus-visible:ring-accent"
                    disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-accent rounded-xl shrink-0">
                    <Send className="h-4 w-4"/>
                </Button>
            </form>
        </footer>
      </PopoverContent>
    </Popover>
  );
}
