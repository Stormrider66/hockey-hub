export const useTranslation = () => ({
  t: (key: string, opts?: any) => (opts?.defaultValue ?? key),
  i18n: { language: 'en', changeLanguage: () => {} },
});

// Provide a minimal plugin-like object that i18next.use() accepts
export const initReactI18next = {
  type: '3rdParty',
  init: () => {},
} as any;

export default { useTranslation, initReactI18next } as any;



