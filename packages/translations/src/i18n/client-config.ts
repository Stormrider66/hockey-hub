import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';
import { defaultNS, fallbackLng, namespaces, supportedLanguages } from './config';

// Client-safe configuration without server-side references
export const clientI18nConfig = {
  fallbackLng,
  defaultNS,
  ns: namespaces,
  supportedLngs: supportedLanguages.map(lang => lang.code),
  
  // Allow keys to be phrases having `:`, `.`
  nsSeparator: '::',
  keySeparator: '.',
  
  // Interpolation settings
  interpolation: {
    escapeValue: false, // React already does escaping
    formatSeparator: ',',
    format: (value: any, format?: string, lng?: string) => {
      if (format === 'uppercase') return value.toUpperCase();
      if (format === 'lowercase') return value.toLowerCase();
      if (format === 'capitalize') return value.charAt(0).toUpperCase() + value.slice(1);
      if (value instanceof Date) {
        return new Intl.DateTimeFormat(lng).format(value);
      }
      return value;
    }
  },
  
  // React specific settings
  react: {
    useSuspense: false, // Disable suspense mode for SSR compatibility
    bindI18n: 'languageChanged loaded',
    bindI18nStore: 'added removed',
    transEmptyNodeValue: '', // What to return for empty Trans
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
  },
  
  // Backend settings for loading translations
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
    addPath: '/locales/add/{{lng}}/{{ns}}',
    allowMultiLoading: false,
    parse: (data: string) => JSON.parse(data),
    crossDomain: false,
    withCredentials: false,
    overrideMimeType: false,
    requestOptions: {
      mode: 'cors' as RequestMode,
      credentials: 'same-origin' as RequestCredentials,
      cache: 'default' as RequestCache
    }
  },
  
  // Language detector settings
  detection: {
    // Order and from where user language should be detected
    order: ['cookie', 'localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
    
    // Keys or params to lookup language from
    lookupCookie: 'i18next',
    lookupLocalStorage: 'i18nextLng',
    lookupFromPathIndex: 0,
    lookupFromSubdomainIndex: 0,
    
    // Cache user language on
    caches: ['localStorage', 'cookie'],
    excludeCacheFor: ['cimode'], // Languages to not persist (cookie, localStorage)
    
    // Optional expire and domain for set cookie
    cookieMinutes: 60 * 24 * 30, // 30 days
    
    // Optional set cookie options
    cookieOptions: { path: '/', sameSite: 'strict' as const }
  },
  
  // Debug settings (disable in production)
  debug: process.env.NODE_ENV === 'development',
  
  // Resources will be loaded dynamically
  resources: {},
  
  // Load translations for current language only
  load: 'currentOnly' as const,
  
  // Preload languages
  preload: ['en', 'sv'], // Preload English and Swedish
  
  // Missing key handler
  saveMissing: process.env.NODE_ENV === 'development',
  saveMissingTo: 'current' as const,
  missingKeyHandler: (lngs: readonly string[], ns: string, key: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing translation: [${lngs.join(', ')}] ${ns}::${key}`);
    }
  },
  
  // Plural settings
  pluralSeparator: '_',
  contextSeparator: '_',
  
  // Post processing
  postProcess: [],
  
  // Return objects
  returnNull: true,
  returnEmptyString: true,
  returnObjects: false,
  
  // App specific
  appendNamespaceToMissingKey: true,
  appendNamespaceToCIMode: false,
};

// Initialize client-side i18n instance
let i18nInstance: typeof i18n | null = null;

export function getI18n() {
  if (!i18nInstance) {
    i18nInstance = i18n.createInstance();
    i18nInstance
      .use(HttpApi)
      .use(LanguageDetector)
      .use(initReactI18next)
      .init(clientI18nConfig);
  }
  return i18nInstance;
}

export default getI18n();