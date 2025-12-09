'use client';

import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { getI18n } from './client-config';
import type { SupportedLanguage } from './config';

interface I18nProviderProps {
  children: React.ReactNode;
  initialLanguage?: SupportedLanguage;
}

export function I18nProvider({ children, initialLanguage }: I18nProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [i18nInstance] = useState(() => getI18n());

  useEffect(() => {
    const initI18n = async () => {
      // Set initial language if provided
      if (initialLanguage && i18nInstance.language !== initialLanguage) {
        await i18nInstance.changeLanguage(initialLanguage);
      }
      
      setIsInitialized(true);
    };

    if (!i18nInstance.isInitialized) {
      i18nInstance.on('initialized', () => {
        initI18n();
      });
    } else {
      initI18n();
    }

    return () => {
      i18nInstance.off('initialized');
    };
  }, [initialLanguage, i18nInstance]);

  // Show loading state while i18n initializes
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
}