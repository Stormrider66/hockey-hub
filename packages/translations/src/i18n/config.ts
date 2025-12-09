import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

export const defaultNS = 'common';
export const fallbackLng = 'en';

export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
] as const;

export type SupportedLanguage = typeof supportedLanguages[number]['code'];

export const namespaces = [
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
  'sports', // Hockey-specific terminology
] as const;

export type Namespace = typeof namespaces[number];

export const languageDetectorOptions = {
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
  cookieDomain: 'myDomain',
  
  // Optional htmlTag with lang attribute, the default is:
  htmlTag: typeof document !== 'undefined' ? document.documentElement : null,
  
  // Optional set cookie options
  cookieOptions: { path: '/', sameSite: 'strict' as const }
};

export const i18nConfig: any = {
  fallbackLng,
  defaultNS,
  ns: namespaces,
  supportedLngs: supportedLanguages.map(lang => lang.code),
  
  // Allow keys to be phrases having `:`, `.`
  nsSeparator: ':',
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
    loadPath: typeof window !== 'undefined' 
      ? `${window.location.origin}/locales/{{lng}}/{{ns}}.json`
      : '/locales/{{lng}}/{{ns}}.json',
    addPath: '/locales/add/{{lng}}/{{ns}}',
    allowMultiLoading: false,
    parse: (data: string) => JSON.parse(data),
    crossDomain: false,
    withCredentials: false,
    overrideMimeType: false,
    requestOptions: {
      mode: 'cors',
      credentials: 'same-origin',
      cache: 'no-store'
    }
  },
  
  // Language detector settings
  detection: languageDetectorOptions as any,
  
  // Debug settings (disable in production)
  debug: process.env.NODE_ENV === 'development',
  
  // Resources will be loaded dynamically
  resources: {},
  
  // Load translations for current language only
  load: 'languageOnly' as const,
  
  // Preload languages
  preload: ['en', 'sv', 'no', 'fi', 'de', 'fr', 'da', 'nl', 'it', 'es', 'cs', 'sk', 'pl', 'ru', 'et', 'lv', 'lt', 'hu', 'sl'], // All 19 languages preloaded
  
  // Missing key handler
  saveMissing: process.env.NODE_ENV === 'development',
  saveMissingTo: 'current' as const,
  missingKeyHandler: (lngs: readonly string[], ns: string, key: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing translation: [${lngs.join(', ')}] ${ns}:${key}`);
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

// Initialize i18n instance
if (!i18n.isInitialized) {
  i18n
    .use(HttpApi)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init(i18nConfig as any);
}

export default i18n;