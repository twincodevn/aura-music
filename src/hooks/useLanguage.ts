import { useState, useCallback } from 'react';
import type { Language } from '../lib/i18n';
import { translations } from '../lib/i18n';

const LS_KEY = 'aura_language';

export function useLanguage() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem(LS_KEY) as Language;
    if (saved && (saved === 'en' || saved === 'vi')) return saved;
    return 'en';
  });

  const toggleLanguage = useCallback(() => {
    setLang(prev => {
      const next = prev === 'en' ? 'vi' : 'en';
      localStorage.setItem(LS_KEY, next);
      return next;
    });
  }, []);

  const t = translations[lang];

  return { lang, toggleLanguage, t };
}
