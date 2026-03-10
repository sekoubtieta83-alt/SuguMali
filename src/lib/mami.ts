
'use client';

import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

export type MamiMessage = {
  role: 'user' | 'model';
  content: string;
};

export type MamiProduct = {
  emoji: string;
  name: string;
  price: string;
  tag: string;
  deal: boolean;
};

class MamiAssistant {
  private mode: 'acheter' | 'vendre' = 'acheter';

  setMode(mode: 'acheter' | 'vendre') {
    this.mode = mode;
  }

  getMode() {
    return this.mode;
  }

  parseProducts(text: string): { items: MamiProduct[] } | null {
    const match = text.match(/\[PRODUCTS:\s*(\{.*?\})\]/s);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        console.error('Failed to parse products JSON:', e);
        return null;
      }
    }
    return null;
  }

  cleanText(text: string): string {
    return text.replace(/\[PRODUCTS:.*?\]/s, '').trim();
  }

  async chat(messages: MamiMessage[]) {
    try {
      const app = getApp();
      // On spécifie explicitement la région pour correspondre au backend
      const functions = getFunctions(app, 'us-central1');
      const mamiChat = httpsCallable(functions, 'mamiChat');
      
      const result = await mamiChat({ 
        messages, 
        mode: this.mode 
      });
      
      const data = result.data as { response: string; success: boolean };
      const rawText = data.response;

      return {
        text: this.cleanText(rawText),
        products: this.parseProducts(rawText),
        raw: rawText
      };
    } catch (error) {
      console.error('Mami chat error:', error);
      throw error;
    }
  }
}

export default MamiAssistant;
