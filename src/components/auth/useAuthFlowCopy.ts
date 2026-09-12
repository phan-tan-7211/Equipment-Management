import { useCallback } from 'react';
import { useI18n } from '@/i18n';
import { authFlowResources } from '@/i18n/authFlowResources';

type AuthFlowKey = keyof typeof authFlowResources.en.authFlow;

/** Falls back to this module's copy until the provider registers the bundle. */
export function useAuthFlowCopy() {
  const { language, t } = useI18n();
  return useCallback((key: `authFlow.${AuthFlowKey}`, params?: Record<string, string | number>) => {
    const translated = t(key, params);
    if (translated !== key) return translated;
    const name = key.slice('authFlow.'.length) as AuthFlowKey;
    return authFlowResources[language].authFlow[name].replace(/{{\s*([^}\s]+)\s*}}/g, (match, token: string) =>
      params?.[token] === undefined ? match : String(params[token]));
  }, [language, t]);
}
