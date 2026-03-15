import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

export interface MamiMessage {
  role: 'user' | 'model';
  content: string;
}

export interface MamiProduct {
  id?: string;
  emoji: string;
  name: string;
  price: string;
  tag: string;
  deal: boolean;
  sponsored?: boolean;
}

export interface SponsoredAnnonce {
  id: string;
  titre: string;
  prix: string;
  categorie: string;
  localisation: string;
}

class MamiAssistant {
  private mode: 'acheter' | 'vendre' = 'acheter';

  setMode(mode: 'acheter' | 'vendre') {
    this.mode = mode;
  }

  async chat(
    messages: MamiMessage[],
    options?: {
      sponsoredAnnonces?: SponsoredAnnonce[];
      allAnnonces?: SponsoredAnnonce[];
    }
  ): Promise<{ text: string; raw: string }> {
    let cleanMessages = [...messages];
    while (cleanMessages.length > 0 && cleanMessages[0].role === 'model') {
      cleanMessages.shift();
    }

    const functions = getFunctions(getApp(), 'europe-west1');
    const mamiChat = httpsCallable(functions, 'mamiChat');

    const payload: any = {
      messages: cleanMessages,
      mode: this.mode,
    };

    if (options?.sponsoredAnnonces?.length) {
      payload.sponsoredAnnonces = options.sponsoredAnnonces;
    }
    if (options?.allAnnonces?.length) {
      payload.allAnnonces = options.allAnnonces;
    }

    const result: any = await mamiChat(payload);
    const raw = result.data?.text || result.data?.response || '';

    if (!raw) {
      return { text: "Désolée, je n'ai pas pu répondre. Réessayez !", raw: '' };
    }

    return { text: this.cleanText(raw), raw };
  }

  parseProducts(text: string): { items: MamiProduct[] } | null {
    if (!text) return null;
    const match = text.match(/\[PRODUCTS:\s*(\{[\s\S]*\})\]/);
    if (match) {
      try { return JSON.parse(match[1]); } catch { return null; }
    }
    return null;
  }

  cleanText(text: string): string {
    if (!text) return '';
    return text.replace(/\[PRODUCTS:[\s\S]*?\]/g, '').trim();
  }
}

export default MamiAssistant;