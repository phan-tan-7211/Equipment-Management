import { createContext, useCallback, useContext } from 'react';

type Translate = (key: string, params?: Record<string, string | number>) => string;

export const NotePresentationI18nContext = createContext<Translate | null>(null);

/** A caller may opt in to localized controls without changing other note consumers. */
export function useNotePresentationText() {
  const translate = useContext(NotePresentationI18nContext);
  return useCallback((key: string, defaultText: string, params?: Record<string, string | number>) =>
    translate ? translate(`workOrderTimelineNote.${key}`, params) : defaultText, [translate]);
}
