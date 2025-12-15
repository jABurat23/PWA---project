// client/src/hooks/useTheme.js
import { useState, useEffect } from 'react';

const THEMES = {
  light: {
    name: 'Light',
    colors: {
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827',
      primary: '#3b82f6'
    }
  },
  dark: {
    name: 'Dark',
    colors: {
      background: '#111827',
      surface: '#1f2937',
      text: '#f9fafb',
      primary: '#3b82f6'
    }
  },
  blue: {
    name: 'Ocean Blue',
    colors: {
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      primary: '#0ea5e9'
    }
  },
  purple: {
    name: 'Purple Dream',
    colors: {
      background: '#1e1b4b',
      surface: '#312e81',
      text: '#e0e7ff',
      primary: '#8b5cf6'
    }
  },
  green: {
    name: 'Forest Green',
    colors: {
      background: '#14532d',
      surface: '#166534',
      text: '#dcfce7',
      primary: '#22c55e'
    }
  },
  sunset: {
    name: 'Sunset Orange',
    colors: {
      background: '#431407',
      surface: '#7c2d12',
      text: '#fed7aa',
      primary: '#f97316'
    }
  }
};

export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    const selectedTheme = THEMES[theme] || THEMES.light;
    
    // Apply dark class for dark-based themes
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    
    // Apply custom colors
    Object.entries(selectedTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  const changeTheme = (newTheme) => {
    if (THEMES[newTheme]) {
      setTheme(newTheme);
    }
  };

  return { 
    theme, 
    changeTheme,
    themes: THEMES,
    currentTheme: THEMES[theme]
  };
};