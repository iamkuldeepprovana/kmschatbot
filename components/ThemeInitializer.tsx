'use client';

import React, { useEffect } from 'react';

export function ThemeInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check for user preference in localStorage
    const storedTheme = localStorage.getItem('chatbot-theme');
    
    // Apply theme based on stored preference
    if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('chatbot-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('chatbot-theme', 'light');
    }
  }, []);

  return <>{children}</>;
}
