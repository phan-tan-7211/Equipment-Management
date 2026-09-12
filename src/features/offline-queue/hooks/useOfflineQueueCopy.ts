import { useCallback } from 'react';
import { useI18n } from '@/i18n';
import { offlineQueueResources } from '@/i18n/offlineQueueResources';

type OfflineKey = keyof typeof offlineQueueResources.en.offlineQueue;

/** Keep the queue's messages available while resource registration is integrated. */
export function useOfflineQueueCopy() {
  const { language, t } = useI18n();
  return useCallback((key: `offlineQueue.${OfflineKey}`, params?: Record<string, string | number>): string => {
    const translated = t(key, params);
    if (translated !== key) return translated;
    const name = key.slice('offlineQueue.'.length) as OfflineKey;
    const template = offlineQueueResources[language].offlineQueue[name];
    return template.replace(/{{\s*([^}\s]+)\s*}}/g, (match, token: string) =>
      params?.[token] === undefined ? match : String(params[token]));
  }, [language, t]);
}
