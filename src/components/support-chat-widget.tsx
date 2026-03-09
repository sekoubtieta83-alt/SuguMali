
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useFirebaseApp } from '@/firebase';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type Message = {
  role: 'user' | 'model';
  content: string;
};

export function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Bonjour ! Je suis Mami. Comment puis-je vous aider à vendre ou acheter aujourd'hui ?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const app = useFirebaseApp();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !app) return;

    const userMessage: Message = { role: 'user', content: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);

    try {
      const functions = getFunctions(app);
      const mamiChat = httpsCallable(functions, 'mamiChat');
      
      const result = await mamiChat({ messages: currentMessages });
      const data = result.data as { response: string };
      
      if (data && data.response) {
        setMessages(prev => [...prev, { role: 'model', content: data.response }]);
      } else {
        throw new Error("Réponse vide du serveur");
      }
    } catch (error: any) {
      console.error('Erreur Mami Widget:', error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: "Désolée, je rencontre une petite difficulté technique. Veuillez réessayer dans quelques instants." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <Card className="w-[90vw] sm:w-[380px] h-[500px] shadow-2xl rounded-3xl overflow-hidden border-none flex flex-col animate-in slide-in-from-bottom-5">
          <CardHeader className="bg-accent text-white p-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-black">Assistante Mami</CardTitle>
                <p className="text-[10px] opacity-80 font-medium">Spécialiste SuguMali</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 flex flex-col bg-muted/30">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={cn("flex flex-col", m.role === 'user' ? "items-end" : "items-start")}>
                    <div className={cn(
                      "max-w-[85%] p-3 rounded-2xl text-sm shadow-sm",
                      m.role === 'user' 
                        ? "bg-accent text-white rounded-tr-none" 
                        : "bg-card text-foreground rounded-tl-none border border-border/50"
                    )}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs italic ml-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Mami réfléchit...
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
            
            <div className="p-4 bg-background border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Posez votre question..."
                  className="flex-1 bg-muted border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-accent/50 outline-none"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isLoading}
                />
                <Button 
                  size="icon" 
                  onClick={handleSendMessage} 
                  disabled={isLoading || !input.trim()}
                  className="rounded-xl bg-accent text-white hover:bg-accent/90 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button 
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/30 flex items-center justify-center p-0 group transition-all hover:scale-110 active:scale-95"
        >
          <div className="relative">
            <MessageCircle className="h-7 w-7" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
          </div>
        </Button>
      )}
    </div>
  );
}
