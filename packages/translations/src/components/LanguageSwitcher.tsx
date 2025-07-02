'use client';

import React from 'react';
import { useLanguageSwitcher } from '../i18n/hooks';
import { supportedLanguages } from '../i18n/config';

interface LanguageSwitcherProps {
  className?: string;
  showNativeName?: boolean;
  showFlag?: boolean;
}

export function LanguageSwitcher({ 
  className = '', 
  showNativeName = true,
  showFlag = false 
}: LanguageSwitcherProps) {
  const { currentLanguage, changeLanguage } = useLanguageSwitcher();

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    changeLanguage(event.target.value);
  };

  return (
    <div className={`language-switcher ${className}`}>
      <select
        value={currentLanguage}
        onChange={handleLanguageChange}
        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        aria-label="Select language"
      >
        {supportedLanguages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {showFlag && getLanguageFlag(lang.code)} {showNativeName ? lang.nativeName : lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}

// Language to flag emoji mapping for hockey-playing countries
function getLanguageFlag(langCode: string): string {
  const flagMap: Record<string, string> = {
    'en': '🇬🇧',
    'sv': '🇸🇪',
    'no': '🇳🇴',
    'fi': '🇫🇮',
    'da': '🇩🇰',
    'de': '🇩🇪',
    'nl': '🇳🇱',
    'fr': '🇫🇷',
    'it': '🇮🇹',
    'es': '🇪🇸',
    'cs': '🇨🇿',
    'sk': '🇸🇰',
    'pl': '🇵🇱',
    'ru': '🇷🇺',
    'et': '🇪🇪',
    'lv': '🇱🇻',
    'lt': '🇱🇹',
    'hu': '🇭🇺',
    'sl': '🇸🇮',
  };
  return flagMap[langCode] || '🏳️';
}

// Dropdown version with better UX
export function LanguageSwitcherDropdown({ className = '' }: LanguageSwitcherProps) {
  const { currentLanguage, changeLanguage } = useLanguageSwitcher();
  const [isOpen, setIsOpen] = React.useState(false);
  
  const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-lg">{getLanguageFlag(currentLanguage)}</span>
        <span>{currentLang?.nativeName || 'English'}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>
          <div
            className="absolute right-0 z-20 w-56 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5"
            role="listbox"
          >
            <div className="py-1">
              {supportedLanguages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    changeLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                    currentLanguage === lang.code ? 'bg-gray-50 font-medium' : ''
                  }`}
                  role="option"
                  aria-selected={currentLanguage === lang.code}
                >
                  <span className="mr-3 text-lg">{getLanguageFlag(lang.code)}</span>
                  <div>
                    <div className="font-medium">{lang.nativeName}</div>
                    <div className="text-xs text-gray-500">{lang.name}</div>
                  </div>
                  {currentLanguage === lang.code && (
                    <svg
                      className="w-4 h-4 ml-auto text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}