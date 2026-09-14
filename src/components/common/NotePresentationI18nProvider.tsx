import React from 'react';
import { NotePresentationI18nContext } from '@/components/common/notePresentationI18n';

export function NotePresentationI18nProvider({ t, children }: { t: (key: string, params?: Record<string, string | number>) => string; children: React.ReactNode }) {
  return <NotePresentationI18nContext.Provider value={t}>{children}</NotePresentationI18nContext.Provider>;
}
