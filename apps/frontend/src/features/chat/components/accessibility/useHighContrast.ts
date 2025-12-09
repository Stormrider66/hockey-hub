import { useState, useEffect } from 'react';

export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    // Check localStorage preference
    const savedPreference = localStorage.getItem('chat-high-contrast');
    if (savedPreference !== null) {
      setIsHighContrast(savedPreference === 'true');
    }

    // Listen for changes
    const handleChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('chat-high-contrast') === null) {
        setIsHighContrast(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleHighContrast = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    localStorage.setItem('chat-high-contrast', String(newValue));
    
    // Apply high contrast styles
    if (newValue) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };

  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  return { isHighContrast, toggleHighContrast };
};