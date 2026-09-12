import { useI18n } from '@/i18n/I18nProvider';
import { History, ScanLine, Receipt, UserCheck, KeyRound } from 'lucide-react';
import LandingReveal from './LandingReveal';

const bullets = [
  {
    icon: History,
    titleKey: 'historyTitle',
    textKey: 'historyText',
  },
  {
    icon: ScanLine,
    titleKey: 'requestTitle',
    textKey: 'requestText',
  },
  {
    icon: Receipt,
    titleKey: 'invoiceTitle',
    textKey: 'invoiceText',
  },
  {
    icon: UserCheck,
    titleKey: 'auditTitle',
    textKey: 'auditText',
  },
  {
    icon: KeyRound,
    titleKey: 'googleTitle',
    textKey: 'googleText',
  },
];

export default function WhyDifferentSection() {
  const { t } = useI18n();
  return (
    <section
      aria-labelledby="why-different-title"
      className="bg-background py-12 sm:py-14"
    >
      <div className="container px-4 mx-auto max-w-5xl">
        <h2
          id="why-different-title"
          className="text-2xl sm:text-3xl font-semibold text-foreground mb-6 text-center"
        >
          {t('landingSections.why.heading')}
        </h2>
        <ul className="mx-auto max-w-4xl space-y-4">
          {bullets.map(({ icon: Icon, titleKey, textKey }, index) => (
            <li key={titleKey} className="list-none">
              <LandingReveal delayMs={index * 60}>
                <div className="flex min-w-0 items-start gap-4 rounded-2xl border border-border/70 bg-background/60 px-4 py-4 text-left shadow-sm shadow-primary/5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-sm shadow-primary/10">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground sm:text-lg">
                      {t(`landingSections.why.${titleKey}`)}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground wrap-break-word sm:text-base">
                      {t(`landingSections.why.${textKey}`)}
                    </p>
                  </div>
                </div>
              </LandingReveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
