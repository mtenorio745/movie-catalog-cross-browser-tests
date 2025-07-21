import React, { createContext, useContext, useRef, ReactNode } from 'react';

interface ScrollContextType {
  saveScrollPosition: () => void;
  restoreScrollPosition: () => void;
  resetScroll: () => void;
}

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

export const useScroll = () => {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error('useScroll must be used within a ScrollProvider');
  }
  return context;
};

export const ScrollProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const savedScrollPosition = useRef<number>(0);

  const saveScrollPosition = () => {
    savedScrollPosition.current = window.scrollY;
  };

  const restoreScrollPosition = () => {
    setTimeout(() => {
      window.scrollTo(0, savedScrollPosition.current);
    }, 100);
  };

  const resetScroll = () => {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  };

  return (
    <ScrollContext.Provider value={{
      saveScrollPosition,
      restoreScrollPosition,
      resetScroll,
    }}>
      {children}
    </ScrollContext.Provider>
  );
};