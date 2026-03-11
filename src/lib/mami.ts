import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

export interface MamiMessage {
  role: 'user' | 'model';
  content: string;
}

export interface MamiProduct {
  emoji: string;
  name: string;
  price: string;
  tag: string;
  deal: boolean;
}

interface MamiResponse {
  success: boolean;
  text?: string;
  response?: string;
}

class MamiAssistant {
  private mode: 'acheter' | 'vendre' = 'acheter';

  setMode(mode: 'acheter' | 'vendre') {
    this.mode = mode;
  }

  async chat(messages: MamiMessage[]): Promise<{ text: string; raw: string }> {
    // Filtrer : supprimer les messages 'model' au début pour respecter le protocole Gemini
    let cleanMessages = [...messages];
    while (cleanMessages.length > 0 && cleanMessages[0].role === 'model') {
      cleanMessages.shift();
    }

    const functions = getFunctions(getApp(), 'us-central1');
    const mamiChat = httpsCallable<{ messages: MamiMessage[]; mode: string }, MamiResponse>(functions, 'mamiChat');

    try {
      const result = await mamiChat({ messages: cleanMessages, mode: this.mode });
      
      // Support des deux formats de réponse possibles (text ou response)
      const raw = result.data.response || result.data.text || '';
      
      if (!raw) {
        return { 
          text: "Désolée, je n'ai pas pu obtenir de réponse de Mami. Veuillez réessayer.", 
          raw: '' 
        };
      }

      return { 
        text: this.cleanText(raw), 
        raw 
      };
    } catch (error) {
      console.error('Erreur lors de l\'appel à Mami:', error);
      return { 
        text: "Mami rencontre une petite difficulté technique. Elle revient vite !", 
        raw: '' 
      };
    }
  }

  parseProducts(text: string): { items: MamiProduct[] } | null {
    if (!text) return null;
    const match = text.match(/\[PRODUCTS:\s*(\{[\s\S]*?\})\]/);
    if (match) {
      try { 
        return JSON.parse(match[1]); 
      } catch (e) { 
        console.error('Erreur de parsing des produits Mami:', e);
        return null; 
      }
    }
    return null;
  }

  cleanText(text: string): string {
    if (!text) return '';
    return text.replace(/\[PRODUCTS:[\s\S]*?\]/g, '').trim();
  }
}

export default MamiAssistant;
