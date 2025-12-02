import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { Language } from '../types';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
];

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  variant?: 'default' | 'compact' | 'minimal';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
  variant = 'default'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find(l => l.code === currentLanguage) || LANGUAGES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelectLanguage = (lang: Language) => {
    onLanguageChange(lang);
    setIsOpen(false);
  };

  if (variant === 'compact') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-xs font-medium bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors border border-gray-100 uppercase"
        >
          <Globe className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-gray-700">{currentLanguage}</span>
          <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[200px]">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`w-full text-left px-4 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                  currentLanguage === lang.code ? 'bg-green-50' : ''
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-800">{lang.name}</span>
                  <span className="text-xs text-gray-500">{lang.nativeName}</span>
                </div>
                {currentLanguage === lang.code && (
                  <Check className="w-4 h-4 text-green-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-[10px] font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors border border-gray-100 uppercase"
        >
          <Globe className="w-3 h-3" />
          <span>{currentLanguage}</span>
          <ChevronDown className={`w-2.5 h-2.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[200px]">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`w-full text-left px-4 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                  currentLanguage === lang.code ? 'bg-green-50' : ''
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-800">{lang.name}</span>
                  <span className="text-xs text-gray-500">{lang.nativeName}</span>
                </div>
                {currentLanguage === lang.code && (
                  <Check className="w-4 h-4 text-green-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold border bg-white text-gray-700 border-gray-200 hover:bg-gray-50 transition-all uppercase text-sm shadow-sm"
      >
        <Globe className="w-4 h-4 text-gray-500" />
        <span>{currentLanguage}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[200px]">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelectLanguage(lang.code)}
              className={`w-full text-left px-4 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                currentLanguage === lang.code ? 'bg-green-50' : ''
              }`}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-800">{lang.name}</span>
                <span className="text-xs text-gray-500">{lang.nativeName}</span>
              </div>
              {currentLanguage === lang.code && (
                <Check className="w-4 h-4 text-green-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

