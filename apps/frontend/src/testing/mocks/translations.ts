export const useTranslation = () => ({
  t: (key: string, opts?: any) => (opts?.defaultValue ?? key),
  i18n: { language: 'en', changeLanguage: () => {} },
});
// Provide proper i18next plugin shape
export const initReactI18next = {
  type: '3rdParty',
  init: () => {},
} as any;
export default { useTranslation, initReactI18next } as any;

