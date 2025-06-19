'use client';

import { useState, useEffect } from 'react';

interface UseThemeReturn {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  mounted: boolean;
}

export function useTheme(): UseThemeReturn {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle theme initialization and sync after mount
  useEffect(() => {
    const storedTheme = localStorage.getItem('chatbot-theme');
    const prefersDark = storedTheme !== 'light'; // Default to dark unless explicitly light
    
    setIsDarkMode(prefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
    
    // If no theme is set, default to dark
    if (!storedTheme) {
      localStorage.setItem('chatbot-theme', 'dark');
    }
    
    setMounted(true);
  }, []);

  // This effect synchronizes isDarkMode with localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Listen for changes from other tabs/windows
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'chatbot-theme') {
          const newTheme = e.newValue;
          const newDarkMode = newTheme !== 'light';
          setIsDarkMode(newDarkMode);
          document.documentElement.classList.toggle('dark', newDarkMode);
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  // This effect handles changes to isDarkMode state
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDarkMode);
      localStorage.setItem('chatbot-theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode, mounted]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  return { isDarkMode, toggleDarkMode, mounted };
}
