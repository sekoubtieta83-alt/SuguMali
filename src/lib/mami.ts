'use client';

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

export interface MamiResponse {
  success: boolean;
  response: string;
  error?: string;
}

class MamiAssistant {
  private mode: 'acheter' | 'vendre' = 'acheter';

  setMode(mode: 'acheter' | 'vendre') {
    this.mode = mode;
  }

  async chat(messages: MamiMessage[]): Promise<{ text: string; raw: string; products: { items: MamiProduct[] } | null }> {
    // ✅ Nettoyage : Gemini impose que le premier message soit 'user'
    let cleanMessages = [...messages];
    while (cleanMessages.length > 0 && cleanMessages[0].role === 'model') {
      cleanMessages.shift();
    }

    // Si après nettoyage il ne reste rien, on ne fait pas d'appel
    if (cleanMessages.length === 0) {
      return { text: "Bonjour ! Comment puis-je vous aider ?", raw: "", products: null };
    }

    const app = getApp();
    const functions = getFunctions(app, 'us-central1');
    const mamiChat = httpsCallable<{ messages: MamiMessage[]; mode: string }, MamiResponse>(
      functions, 
      'mamiChat'
    );

    try {
      const result = await mamiChat({ 
        messages: cleanMessages, 
        mode: this.mode 
      });

      const raw = result.data.response;
      
      return {
        text: this.cleanText(raw),
        raw: raw,
        products: this.parseProducts(raw),
      };
    } catch (error) {
      console.error('Mami Assistant Error:', error);
      throw error;
    }
  }

  parseProducts(text: string): { items: MamiProduct[] } | null {
    if (!text) return null;
    const match = text.match(/\[PRODUCTS:\s*(\{.*?\})\]/s);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        console.error('Failed to parse products JSON from Mami:', e);
        return null;
      }
    }
    return null;
  }

  cleanText(text: string): string {
    if (!text) return "";
    return text.replace(/\[PRODUCTS:.*?\]/s, '').trim();
  }
}

export default MamiAssistant;
