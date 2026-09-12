import { useI18n } from '@/i18n/I18nProvider';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from '@/components/ui/external-link';
import { Shield, Smartphone, Building2, Receipt } from 'lucide-react';
import LandingReveal from './LandingReveal';

const trustBadges = [
  { icon: Shield, labelKey: 'private' },
  { icon: Smartphone, labelKey: 'offline' },
  { icon: Building2, labelKey: 'google' },
  { icon: Receipt, labelKey: 'quickbooks' },
];

const customerResults = [
  {
    value: '100%',
    labelKey: 'adoption',
    descriptionKey: 'adoptionDescription',
  },
  {
    value: '50%',
    labelKey: 'close',
    descriptionKey: 'closeDescription',
  },
];

const SocialProofSection = () => {
  const { t } = useI18n();
  return (
    <section id="customers" className="scroll-mt-20 py-24 bg-background">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t('landingDetails.social.heading')}
          </h2>
          <p className="mx-auto max-w-2xl text-left text-xl text-muted-foreground sm:text-center">
            {t('landingDetails.social.intro')}
          </p>
        </div>

        {/* Trusted-by strip — quick scan before the main testimonial */}
        <LandingReveal>
          <div className="mb-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 rounded-xl border border-border/50 bg-muted/30 px-4 py-6">
            <span className="text-sm font-medium text-muted-foreground">{t('landingDetails.social.trustedAt')}</span>
            <div className="flex items-center gap-3">
              <img
                src="/images/brand/logos/3A-Equipment-Logo-Medium.png"
                alt=""
                className="h-10 w-auto object-contain opacity-90"
                aria-hidden
              />
              <span className="text-sm font-semibold text-foreground">3-A Equipment</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">{t('landingDetails.social.repairType')}</span>
            </div>
          </div>
        </LandingReveal>

        <div className="flex justify-center mb-16">
          {/* Primary Client Highlight - Centered */}
          <Card className="max-w-3xl border-primary/20 bg-primary/5">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="shrink-0">
                  <img
                    src="/images/brand/logos/3A-Equipment-Logo-Medium.png"
                    alt={t('landingDetails.social.repairShop') + ' 3-A Equipment'}
                    className="h-20 w-20 object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    <ExternalLink
                      href="https://3aequip.com"
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      3-A Equipment
                    </ExternalLink>
                  </h3>
                  <Badge variant="secondary" className="mb-4">{t('landingDetails.social.repairShop')}</Badge>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('landingDetails.social.quote')}
                  </p>
                  <p className="text-sm font-medium text-foreground mt-3">
                    {t('landingDetails.social.attribution')}
                  </p>
                </div>
              </div>

              <ul
                aria-label={t('landingDetails.social.customerResults')}
                className="grid grid-cols-1 gap-4 border-t border-border pt-6 sm:grid-cols-2"
              >
                {customerResults.map((result, index) => (
                  <li key={result.labelKey} className="list-none">
                    <LandingReveal delayMs={index * 80}>
                      <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-left shadow-sm shadow-primary/10">
                        <p className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                          {result.value}
                        </p>
                        <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-foreground/90">
                          {t(`landingDetails.social.${result.labelKey}`)}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {t(`landingDetails.social.${result.descriptionKey}`)}
                        </p>
                      </div>
                    </LandingReveal>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Qualitative trust badges - verifiable feature claims */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {trustBadges.map(({ icon: Icon, labelKey }, index) => (
            <LandingReveal key={labelKey} delayMs={index * 60}>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 px-4 py-3">
                <Icon className="h-6 w-6 text-primary shrink-0" aria-hidden />
                <span className="text-sm font-medium text-foreground">{t(`landingDetails.social.${labelKey}`)}</span>
              </div>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;