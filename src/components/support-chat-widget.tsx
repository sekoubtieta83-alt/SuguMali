'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, X, Send, Loader2, Sparkles, ExternalLink, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MamiAssistant, { type MamiMessage } from '@/lib/mami';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const mamiImage = PlaceHolderImages.find(img => img.id === 'mami')?.imageUrl;
  
  const [messages, setMessages] = useState<MamiMessage[]>([
    { role: 'model', content: "Bonjour ! Je suis Mami, votre assistante SuguMali. Comment puis-je vous aider aujourd'hui ?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const mami = useMemo(() => new MamiAssistant(), []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: MamiMessage = { role: 'user', content: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await mami.chat(currentMessages);
      setMessages(prev => [...prev, { role: 'model', content: response.raw }]);
    } catch (error: any) {
      console.error('Erreur Mami Widget:', error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: "Désolée, je rencontre une petite difficulté technique. Mami revient vite !" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const MessageBubble = ({ message }: { message: MamiMessage }) => {
    const productsData = mami.parseProducts(message.content);
    const text = mami.cleanText(message.content);

    return (
      <div className={cn("flex flex-col gap-2 mb-4", message.role === 'user' ? "items-end" : "items-start")}>
        <div className="flex items-end gap-2">
          {message.role === 'model' && (
            <Avatar className="h-6 w-6 border border-border">
              <AvatarImage src={mamiImage} alt="Mami" />
              <AvatarFallback>M</AvatarFallback>
            </Avatar>
          )}
          <div className={cn(
            "max-w-[85%] p-3 rounded-2xl text-sm shadow-sm leading-relaxed",
            message.role === 'user' 
              ? "bg-accent text-white rounded-tr-none" 
              : "bg-card text-foreground rounded-tl-none border border-border/50"
          )}>
            {text}
          </div>
        </div>
        {productsData?.items && (
          <div className="grid grid-cols-1 gap-2 w-full max-w-[85%] ml-8">
            {productsData.items.map((p, idx) => (
              <div key={idx} className="bg-white dark:bg-zinc-900 border border-border/50 rounded-xl p-3 shadow-sm flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                <div className="text-2xl h-12 w-12 bg-muted rounded-lg flex items-center justify-center shrink-0">
                  {p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs truncate">{p.name}</h4>
                  <p className="text-accent font-black text-sm">{p.price}</p>
                  <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-md font-bold">{p.tag}</span>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full shrink-0">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <Card className="w-[90vw] sm:w-[380px] h-[550px] shadow-2xl rounded-3xl overflow-hidden border-none flex flex-col animate-in slide-in-from-bottom-5">
          <CardHeader className="bg-accent text-white p-4">
            <div className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-white/20">
                  <AvatarImage src={mamiImage} alt="Mami" className="object-cover" />
                  <AvatarFallback className="bg-white/20 text-white">M</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg font-black leading-none">Assistante Mami</CardTitle>
                  <p className="text-[10px] opacity-80 font-medium">Spécialiste SuguMali</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsOpen(false)} 
                  className="text-white hover:bg-white/10 rounded-xl font-bold text-xs h-8"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Quitter
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)} 
                  className="text-white hover:bg-white/10 rounded-full h-8 w-8"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 flex flex-col bg-muted/30 overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-1">
                {messages.map((m, i) => (
                  <MessageBubble key={i} message={m} />
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs italic ml-1 mb-4">
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
                  placeholder="Posez votre question à Mami..."
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
          className="h-14 w-14 rounded-full bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/30 flex items-center justify-center p-0 group transition-all hover:scale-110 active:scale-95 overflow-hidden"
        >
          {mamiImage ? (
             <img src={mamiImage} alt="Mami" className="w-full h-full object-cover" />
          ) : (
            <MessageCircle className="h-7 w-7" />
          )}
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
        </Button>
      )}
    </div>
  );
}