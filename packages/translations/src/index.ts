// i18n configuration and initialization
export { default as i18n } from './i18n/config';
export * from './i18n/config';
export * from './i18n/hooks';
export { I18nProvider } from './i18n/provider';

// Components
export { LanguageSwitcher, LanguageSwitcherDropdown } from './components/LanguageSwitcher';

// Type exports
export type { SupportedLanguage, Namespace } from './i18n/config';