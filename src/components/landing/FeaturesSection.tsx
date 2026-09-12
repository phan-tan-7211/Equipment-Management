import { useI18n } from '@/i18n/I18nProvider';
import { Link } from 'react-router-dom';
import {
  QrCode,
  Building2,
  Receipt,
  ClipboardList,
  Users,
  Map,
  UserCircle,
  FileCheck,
  Warehouse,
  Search,
  Smartphone,
  Shield,
  ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import LandingReveal from './LandingReveal';

interface PillarFeature {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  link: string;
}

interface Pillar {
  id: string;
  titleKey: string;
  subtitleKey: string;
  descriptionKey: string;
  accentClass: string;
  dotClass: string;
  features: PillarFeature[];
}

const pillars: Pillar[] = [
  {
    id: 'field',
    titleKey: 'fieldTitle',
    subtitleKey: 'fieldSubtitle',
    descriptionKey: 'fieldDescription',
    accentClass: 'text-primary',
    dotClass: 'bg-primary',
    features: [
      {
        icon: QrCode,
        titleKey: 'field1Title',
        descriptionKey: 'field1Description',
        link: '/features/qr-code-integration',
      },
      {
        icon: Smartphone,
        titleKey: 'field2Title',
        descriptionKey: 'field2Description',
        link: '/features/mobile-first-design',
      },
      {
        icon: ClipboardList,
        titleKey: 'field3Title',
        descriptionKey: 'field3Description',
        link: '/features/work-order-management',
      },
      {
        icon: FileCheck,
        titleKey: 'field4Title',
        descriptionKey: 'field4Description',
        link: '/features/pm-templates',
      },
    ],
  },
  {
    id: 'backoffice',
    titleKey: 'backofficeTitle',
    subtitleKey: 'backofficeSubtitle',
    descriptionKey: 'backofficeDescription',
    accentClass: 'text-success',
    dotClass: 'bg-success',
    features: [
      {
        icon: Receipt,
        titleKey: 'backoffice1Title',
        descriptionKey: 'backoffice1Description',
        link: '/features/quickbooks',
      },
      {
        icon: UserCircle,
        titleKey: 'backoffice2Title',
        descriptionKey: 'backoffice2Description',
        link: '/features/customer-crm',
      },
      {
        icon: Warehouse,
        titleKey: 'backoffice3Title',
        descriptionKey: 'backoffice3Description',
        link: '/features/inventory',
      },
      {
        icon: Search,
        titleKey: 'backoffice4Title',
        descriptionKey: 'backoffice4Description',
        link: '/features/part-lookup-alternates',
      },
    ],
  },
  {
    id: 'control',
    titleKey: 'controlTitle',
    subtitleKey: 'controlSubtitle',
    descriptionKey: 'controlDescription',
    accentClass: 'text-info',
    dotClass: 'bg-info',
    features: [
      {
        icon: Users,
        titleKey: 'control1Title',
        descriptionKey: 'control1Description',
        link: '/features/team-collaboration',
      },
      {
        icon: Building2,
        titleKey: 'control2Title',
        descriptionKey: 'control2Description',
        link: '/features/google-workspace',
      },
      {
        icon: Map,
        titleKey: 'control3Title',
        descriptionKey: 'control3Description',
        link: '/features/fleet-visualization',
      },
      {
        icon: Shield,
        titleKey: 'control4Title',
        descriptionKey: 'control4Description',
        link: '/security',
      },
    ],
  },
];

const FeaturesSection = ({ id }: { id?: string }) => {
  const { t } = useI18n();
  return (
    <section id={id} className="scroll-mt-20 py-20 bg-background">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t('landingDetails.features.heading')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('landingDetails.features.intro')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pillars.map((pillar, pillarIndex) => (
            <LandingReveal key={pillar.id} delayMs={pillarIndex * 80}>
              <div className="flex flex-col h-full rounded-2xl border border-border bg-card/60 shadow-sm overflow-hidden">
                {/* Pillar header */}
                <div className="px-6 pt-8 pb-6 border-b border-border/60">
                  <h3 className={`text-xl font-bold mb-1 ${pillar.accentClass}`}>{t(`landingDetails.features.${pillar.titleKey}`)}</h3>
                  <p className="text-sm font-medium text-foreground mb-3">{t(`landingDetails.features.${pillar.subtitleKey}`)}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(`landingDetails.features.${pillar.descriptionKey}`)}</p>
                </div>

                {/* Feature list */}
                <ul className="flex flex-col grow px-6 py-5 space-y-4">
                  {pillar.features.map((feature) => (
                    <li key={feature.link} className="list-none">
                      <Link
                        to={feature.link}
                        className="group flex items-start gap-3 rounded-xl p-3 -mx-3 hover:bg-muted/60 transition-colors"
                      >
                        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/80`}>
                          <feature.icon className={`h-4 w-4 ${pillar.accentClass}`} aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                              {t(`landingDetails.features.${feature.titleKey}`)}
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden />
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground leading-relaxed">
                            {t(`landingDetails.features.${feature.descriptionKey}`)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
