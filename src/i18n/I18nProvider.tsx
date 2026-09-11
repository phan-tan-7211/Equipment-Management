import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './locales/en';
import vi from './locales/vi';
import ko from './locales/ko';
import { coreResources } from './coreResources';
import { dashboardWidgetResources } from './dashboardWidgetResources';
import { equipmentResources } from './equipmentResources';
import { equipmentFormResources } from './equipmentFormResources';
import { equipmentBulkResources } from './equipmentBulkResources';
import { equipmentAuxResources } from './equipmentAuxResources';
import { equipmentImportResources } from './equipmentImportResources';

export type Language = 'vi' | 'en' | 'ko';

const STORAGE_KEY = 'znteqr-language';

const resources = {
  vi: { ...vi, ...coreResources.vi, ...dashboardWidgetResources.vi, ...equipmentResources.vi, ...equipmentFormResources.vi, ...equipmentBulkResources.vi, ...equipmentAuxResources.vi, ...equipmentImportResources.vi },
  en: { ...en, ...coreResources.en, ...dashboardWidgetResources.en, ...equipmentResources.en, ...equipmentFormResources.en, ...equipmentBulkResources.en, ...equipmentAuxResources.en, ...equipmentImportResources.en },
  ko: { ...ko, ...coreResources.ko, ...dashboardWidgetResources.ko, ...equipmentResources.ko, ...equipmentFormResources.ko, ...equipmentBulkResources.ko, ...equipmentAuxResources.ko, ...equipmentImportResources.ko },
} as const;

type TranslationParams = Record<string, string | number>;

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: TranslationParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'vi' || saved === 'en' || saved === 'ko') return saved;
  const browserLanguage = window.navigator.language.toLowerCase();
  if (browserLanguage.startsWith('vi')) return 'vi';
  if (browserLanguage.startsWith('ko')) return 'ko';
  return 'en';
}

function getNestedValue(source: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[segment];
  }, source);
}

function interpolate(value: string, params?: TranslationParams): string {
  if (!params) return value;
  return value.replace(/{{\s*([^}\s]+)\s*}}/g, (_match, token: string) => {
    const replacement = params[token];
    return replacement === undefined ? `{{${token}}}` : String(replacement);
  });
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(resolveInitialLanguage);
  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback((key: string, params?: TranslationParams) => {
    const localized = getNestedValue(resources[language], key);
    const fallback = getNestedValue(resources.en, key);
    const value = typeof localized === 'string' ? localized : typeof fallback === 'string' ? fallback : key;
    return interpolate(value, params);
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
