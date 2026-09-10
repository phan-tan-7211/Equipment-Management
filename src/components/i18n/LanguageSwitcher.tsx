import React from 'react';
import { useI18n, type Language } from '@/i18n';

const languageOptions: Language[] = ['vi', 'en', 'ko'];

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useI18n();

  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="hidden sm:inline">{t('common.language')}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
        aria-label={t('common.language')}
        className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
      >
        {languageOptions.map((code) => (
          <option key={code} value={code}>
            {t(`languages.${code}`)}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSwitcher;
