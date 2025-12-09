import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', flag: '🇸🇮' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
];

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'compact';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  className = '',
  showLabel = true,
  variant = 'default'
}) => {
  const { i18n, t } = useTranslation(['common']);
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[3]; // Default to English

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    // Store the language preference in localStorage
    localStorage.setItem('i18nextLng', languageCode);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <label className="text-sm font-medium text-gray-700">
          {t('common:language', 'Language')}:
        </label>
      )}
      <Select 
        value={i18n.language} 
        onValueChange={handleLanguageChange}
      >
        <SelectTrigger className={variant === 'compact' ? 'w-[140px]' : 'w-[200px]'}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentLanguage.flag}</span>
            <SelectValue>
              {variant === 'compact' ? currentLanguage.code.toUpperCase() : currentLanguage.nativeName}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {languages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center gap-3 w-full">
                <span className="text-lg">{language.flag}</span>
                <div className="flex-1">
                  <div className="font-medium">{language.nativeName}</div>
                  {variant !== 'compact' && (
                    <div className="text-xs text-gray-500">{language.name}</div>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// Export a more compact version for use in headers/toolbars
export const CompactLanguageSelector: React.FC<Omit<LanguageSelectorProps, 'variant'>> = (props) => {
  return <LanguageSelector {...props} variant="compact" showLabel={false} />;
};