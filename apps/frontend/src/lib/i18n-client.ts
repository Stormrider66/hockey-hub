import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

const isProduction = process.env.NODE_ENV === 'production';
const baseUrl = typeof window !== 'undefined' 
  ? window.location.origin 
  : 'http://localhost:3010';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: !isProduction,
    ns: ['common'],
    defaultNS: 'common',
    
    interpolation: {
      escapeValue: false,
    },

    backend: {
      loadPath: `${baseUrl}/locales/{{lng}}/{{ns}}.json`,
      requestOptions: {
        cache: 'no-store',
      },
    },

    react: {
      useSuspense: false,
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },

    load: 'languageOnly',
    
    saveMissing: false,
    
    missingKeyHandler: false,
  });

export default i18n;