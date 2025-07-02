import { useTranslation as useI18nTranslation, UseTranslationOptions, UseTranslationResponse } from 'react-i18next';
import type { Namespace } from './config';

/**
 * Custom hook for translations with type safety
 * @param ns - Namespace(s) to load
 * @param options - Translation options
 */
export function useTranslation(
  ns?: Namespace | Namespace[],
  options?: UseTranslationOptions<undefined>
): UseTranslationResponse<Namespace | Namespace[], undefined> {
  return useI18nTranslation(ns, options);
}

/**
 * Hook for language switching
 */
export function useLanguageSwitcher() {
  const { i18n } = useI18nTranslation();
  
  return {
    currentLanguage: i18n.language,
    changeLanguage: (language: string) => i18n.changeLanguage(language),
    languages: i18n.languages,
  };
}

/**
 * Hook for getting formatted dates based on current locale
 */
export function useLocalizedDate() {
  const { i18n } = useI18nTranslation();
  
  return {
    formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      const dateObj = date instanceof Date ? date : new Date(date);
      return new Intl.DateTimeFormat(i18n.language, options).format(dateObj);
    },
    formatTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      const dateObj = date instanceof Date ? date : new Date(date);
      const defaultOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        ...options
      };
      return new Intl.DateTimeFormat(i18n.language, defaultOptions).format(dateObj);
    },
    formatDateTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      const dateObj = date instanceof Date ? date : new Date(date);
      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options
      };
      return new Intl.DateTimeFormat(i18n.language, defaultOptions).format(dateObj);
    },
    formatRelativeTime: (date: Date | string | number) => {
      const dateObj = date instanceof Date ? date : new Date(date);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
      
      const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' });
      
      if (diffInSeconds < 60) return rtf.format(-diffInSeconds, 'second');
      if (diffInSeconds < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
      if (diffInSeconds < 86400) return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
      if (diffInSeconds < 604800) return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
      if (diffInSeconds < 2592000) return rtf.format(-Math.floor(diffInSeconds / 604800), 'week');
      if (diffInSeconds < 31536000) return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
      return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
    }
  };
}

/**
 * Hook for getting formatted numbers based on current locale
 */
export function useLocalizedNumber() {
  const { i18n } = useI18nTranslation();
  
  return {
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(i18n.language, options).format(value);
    },
    formatCurrency: (value: number, currency: string, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency,
        ...options
      }).format(value);
    },
    formatPercent: (value: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(i18n.language, {
        style: 'percent',
        ...options
      }).format(value / 100);
    },
    formatCompact: (value: number) => {
      return new Intl.NumberFormat(i18n.language, {
        notation: 'compact',
        compactDisplay: 'short'
      }).format(value);
    }
  };
}

/**
 * Hook for pluralization rules
 */
export function usePlural() {
  const { i18n } = useI18nTranslation();
  
  return {
    getPluralRule: (count: number) => {
      const pr = new Intl.PluralRules(i18n.language);
      return pr.select(count);
    },
    formatList: (items: string[], type: 'conjunction' | 'disjunction' = 'conjunction') => {
      // ListFormat is not available in older browsers, provide fallback
      if ('ListFormat' in Intl) {
        const lf = new (Intl as any).ListFormat(i18n.language, { type });
        return lf.format(items);
      }
      // Fallback for browsers without ListFormat support
      if (items.length === 0) return '';
      if (items.length === 1) return items[0];
      const last = items[items.length - 1];
      const rest = items.slice(0, -1);
      const separator = type === 'conjunction' ? ' and ' : ' or ';
      return rest.join(', ') + separator + last;
    }
  };
}