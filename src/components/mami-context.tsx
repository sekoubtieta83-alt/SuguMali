'use client';

import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface MamiContextType {
  openMami: (question?: string) => void;
  pendingQuestion: string | null;
  clearPendingQuestion: () => void;
}

const MamiContext = createContext<MamiContextType>({
  openMami: () => {},
  pendingQuestion: null,
  clearPendingQuestion: () => {},
});

export function MamiProvider({ children }: { children: ReactNode }) {
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);

  const openMami = (question?: string) => {
    setPendingQuestion(question ?? null);
  };

  const clearPendingQuestion = () => setPendingQuestion(null);

  return React.createElement(
    MamiContext.Provider,
    { value: { openMami, pendingQuestion, clearPendingQuestion } },
    children
  );
}

export const useMami = () => useContext(MamiContext);
