import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

const ThemeToggle: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();
  const isLight = resolvedTheme === 'light';
  const label = t(isLight ? 'common.switchToDarkMode' : 'common.switchToLightMode');

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-9 w-9 text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
      aria-label={label}
      title={label}
    >
      {isLight ? <Moon className="h-4 w-4" aria-hidden /> : <Sun className="h-4 w-4" aria-hidden />}
    </Button>
  );
};

export default ThemeToggle;
