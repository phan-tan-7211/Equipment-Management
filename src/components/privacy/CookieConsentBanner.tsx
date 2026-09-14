import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { useI18n } from '@/i18n';
import { getCookieConsentCopy } from '@/i18n/cookieConsentResources';

export function CookieConsentBanner() {
  const { needsConsent, accept, reject } = useCookieConsent();
  const { language } = useI18n();
  const copy = getCookieConsentCopy(language);

  if (!needsConsent) return null;

  return (
    <section
      aria-label={copy.aria}
      className="fixed inset-x-0 bottom-0 z-(--z-cookie-banner) border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/90"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{copy.title}</p>
          <p>
            {copy.message}{' '}
            <Link
              to="/privacy-policy#cookies"
              className="text-primary underline underline-offset-2"
            >
              {copy.privacyLink}
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={reject} className="min-h-11">
            {copy.reject}
          </Button>
          <Button type="button" onClick={accept} className="min-h-11">
            {copy.accept}
          </Button>
        </div>
      </div>
    </section>
  );
}
