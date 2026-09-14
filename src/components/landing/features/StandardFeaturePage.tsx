import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { PageSEO } from '@/components/seo/PageSEO';
import { FeaturePageLayout } from '@/components/landing/features/FeaturePageLayout';
import { FeatureHero } from '@/components/landing/features/FeatureHero';
import { FeatureSection } from '@/components/landing/features/FeatureSection';
import { BenefitCard } from '@/components/landing/features/BenefitCard';
import { StepList } from '@/components/landing/features/StepList';
import { FeatureShowcaseList } from '@/components/landing/features/FeatureShowcaseList';
import { FeatureCTA } from '@/components/landing/features/FeatureCTA';
import { CapabilitiesGrid } from '@/components/landing/features/CapabilitiesGrid';
import { getFeatureSeoByPath } from '@/lib/featureSeoContent';
import { useI18n } from '@/i18n';
import { translateFeaturePage } from '@/pages/features/data/featurePageTranslations';
import type {
  Benefit,
  Capability,
  FeaturePageContent,
  ShowcaseItem,
  Step,
} from '@/pages/features/data/featurePageTypes';

const DEFAULT_PRIMARY_CTA = 'Create Free Account';

export interface StandardFeaturePageProps {
  seoPath: string;
  content: FeaturePageContent;
  benefits: Benefit[];
  steps: Step[];
  showcases: ShowcaseItem[];
  heroIcon: LucideIcon;
  capabilities?: Capability[];
  afterBenefits?: ReactNode;
  afterSteps?: ReactNode;
  translationKey?: string;
}

export const StandardFeaturePage = ({
  seoPath,
  content,
  benefits,
  steps,
  showcases,
  heroIcon,
  capabilities,
  afterBenefits,
  afterSteps,
  translationKey,
}: StandardFeaturePageProps) => {
  const { t } = useI18n();
  const seo = getFeatureSeoByPath(seoPath);
  if (!seo) {
    throw new Error(`Missing feature SEO config for path: ${seoPath}`);
  }

  const localized = translationKey
    ? translateFeaturePage(t, translationKey, content, benefits, steps, showcases, seo)
    : { content, benefits, steps, showcases, seo };
  const primaryCta = localized.content.ctaPrimaryText ?? DEFAULT_PRIMARY_CTA;

  return (
    <>
      <PageSEO title={localized.seo.pageTitle} description={localized.seo.description} path={seo.path} />
      <FeaturePageLayout howToSteps={localized.steps} seoOverride={translationKey ? localized.seo : undefined}>
        <FeatureHero
          icon={heroIcon}
          title={localized.seo.heroTitle}
          description={localized.seo.heroDescription}
          ctaText={primaryCta}
        />

        <FeatureSection
          title={localized.content.benefitsTitle}
          description={localized.content.benefitsDescription}
          className="bg-muted/30"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 max-w-6xl mx-auto">
            {localized.benefits.map((benefit) => (
              <BenefitCard key={benefit.title} {...benefit} />
            ))}
          </div>
        </FeatureSection>

        {afterBenefits}

        {capabilities && capabilities.length > 0 && (
          <FeatureSection
            title={localized.content.capabilitiesTitle!}
            description={localized.content.capabilitiesDescription!}
          >
            <CapabilitiesGrid capabilities={capabilities} />
          </FeatureSection>
        )}

        <FeatureSection
          title={localized.content.stepsTitle}
          description={localized.content.stepsDescription}
          className={localized.content.stepsClassName}
        >
          <StepList steps={localized.steps} />
        </FeatureSection>

        {afterSteps}

        <FeatureSection
          title={localized.content.showcaseTitle}
          description={localized.content.showcaseDescription}
          className={localized.content.showcaseClassName}
        >
          <FeatureShowcaseList items={localized.showcases} />
        </FeatureSection>

        <FeatureCTA
          title={localized.content.ctaTitle}
          description={localized.content.ctaDescription}
          primaryCtaText={primaryCta}
          className={localized.content.ctaClassName}
        />
      </FeaturePageLayout>
    </>
  );
};
