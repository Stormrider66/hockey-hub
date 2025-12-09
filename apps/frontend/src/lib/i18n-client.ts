import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

const isProduction = process.env.NODE_ENV === 'production';
const baseUrl = typeof window !== 'undefined' 
  ? window.location.origin 
  : 'http://localhost:3010';

// Define supported languages
const supportedLanguages = [
  'en', 'sv', 'no', 'fi', 'da', 'de', 'nl', 'fr', 'it', 'es',
  'cs', 'sk', 'pl', 'ru', 'et', 'lv', 'lt', 'hu', 'sl'
];

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'en', // Force English as default
    fallbackLng: 'en',
    debug: !isProduction,
    ns: [
      'common',
      'player',
      'coach',
      'parent',
      'medical',
      'equipment',
      'physicalTrainer',
      'clubAdmin',
      'admin',
      'calendar',
      'chat',
      'notifications',
      'auth',
      'errors',
      'validation',
      'sports'
    ],
    defaultNS: 'common',
    fallbackNS: 'common',
    
    interpolation: {
      escapeValue: false,
    },
    
    // Use standard namespace separator
    nsSeparator: ':',
    keySeparator: '.',

    backend: {
      loadPath: `${baseUrl}/locales/{{lng}}/{{ns}}.json`,
      requestOptions: {
        cache: 'no-store', // Use no-store instead of no-cache
      },
    },

    react: {
      useSuspense: false,
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      // Only detect from supported languages
      checkWhitelist: true,
    },

    load: 'languageOnly',
    
    // Explicitly define supported languages
    supportedLngs: supportedLanguages,
    
    // Only preload the detected language and common namespace
    preload: false,
    
    // Load namespaces on demand
    partialBundledLanguages: true,
    
    saveMissing: false,
    
    missingKeyHandler: false,
    
    // Performance optimizations
    initImmediate: false, // Don't block on initialization
  });

export default i18n;