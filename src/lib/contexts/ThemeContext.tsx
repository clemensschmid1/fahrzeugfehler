'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Force apply theme - direct DOM manipulation
function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  
  const html = document.documentElement;
  const body = document.body;
  
  // Remove dark class first
  html.classList.remove('dark');
  
  // Force a reflow
  void html.offsetHeight;
  
  // Add dark class if needed
  if (theme === 'dark') {
    html.classList.add('dark');
  }
  
  // Force another reflow after class change
  void html.offsetHeight;
  
  // Force update CSS variables (these override CSS)
  html.style.setProperty('--background', theme === 'dark' ? '#0a0a0a' : '#ffffff');
  html.style.setProperty('--foreground', theme === 'dark' ? '#ededed' : '#171717');
  
  // Force body background directly
  if (body) {
    body.style.backgroundColor = theme === 'dark' ? '#0a0a0a' : '#ffffff';
    body.style.color = theme === 'dark' ? '#ededed' : '#171717';
  }
  
  // Save to localStorage
  try {
    localStorage.setItem('fault-base-theme', theme);
  } catch {}
  
  // Final force reflow
  void html.offsetHeight;
  
  // Dispatch event to force any listeners to update
  window.dispatchEvent(new Event('themechange'));
  
  // Force a repaint by triggering resize
  window.dispatchEvent(new Event('resize'));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    let initialTheme: Theme = 'light';
    try {
      const saved = localStorage.getItem('fault-base-theme');
      if (saved === 'dark' || saved === 'light') {
        initialTheme = saved;
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        initialTheme = 'dark';
      }
    } catch {}
    
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      // Apply IMMEDIATELY before state update
      applyTheme(newTheme);
      return newTheme;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
