import { useI18n } from '@/i18n/I18nProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Wrench,
  Server,
  Hammer,
  Building,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { BulldozerIcon } from './BulldozerIcon';
import LandingReveal from './LandingReveal';

interface UseCase {
  icon: ComponentType<{ className?: string }>;
  titleKey: string;
  descriptionKey: string;
  winKey: string;
  /** Overrides the default primary-tint well + ICON_COLORS tone. */
  iconWellClassName?: string;
}

const useCases: UseCase[] = [
  {
    icon: Wrench,
    titleKey: 'case1Title',
    descriptionKey: 'case1Description',
    winKey: 'case1Win',
  },
  {
    icon: Server,
    titleKey: 'case2Title',
    descriptionKey: 'case2Description',
    winKey: 'case2Win',
  },
  {
    icon: Hammer,
    titleKey: 'case3Title',
    descriptionKey: 'case3Description',
    winKey: 'case3Win',
  },
  {
    icon: Building,
    titleKey: 'case4Title',
    descriptionKey: 'case4Description',
    winKey: 'case4Win',
  },
  {
    icon: BulldozerIcon,
    titleKey: 'case5Title',
    descriptionKey: 'case5Description',
    winKey: 'case5Win',
    // text-secondary (~#1f1f23) vanishes on the dark card; construction yellow does not.
    iconWellClassName: 'bg-warning/20 text-warning',
  },
];

const ICON_COLORS = ['text-primary', 'text-info', 'text-success', 'text-warning'];

const AboutSection = ({ id }: { id?: string }) => {
  const { t } = useI18n();
  return (
    <section id={id} className="scroll-mt-20 py-16 bg-muted/20">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {t('landingDetails.about.heading')}
          </h2>
          <p className="mx-auto max-w-3xl text-left text-xl text-muted-foreground sm:text-center">
            {t('landingDetails.about.intro')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
              <LandingReveal key={useCase.titleKey} delayMs={index * 60} className="h-full">
                <Card
                  className="relative flex h-full flex-col overflow-hidden border-border bg-card/50 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:bg-card hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <div
                    className="h-1 w-full bg-linear-to-r from-primary/20 via-primary/10 to-transparent"
                    aria-hidden
                  />
                  <CardHeader className="pb-2 shrink-0">
                    <div className="mb-3 flex">
                      <span
                        className={cn(
                          'rounded-2xl p-3',
                          useCase.iconWellClassName
                            ?? `bg-primary/10 ${ICON_COLORS[index % ICON_COLORS.length]}`,
                        )}
                        aria-hidden
                      >
                        <useCase.icon className="h-10 w-10 sm:h-11 sm:w-11" />
                      </span>
                    </div>
                    <CardTitle className="text-xl">{t(`landingDetails.about.${useCase.titleKey}`)}</CardTitle>
                    <div className="mt-3 border-t border-border/50 pt-3">
                      <Badge
                        aria-label={t('landingDetails.about.winLabel')}
                        variant="outline"
                        className="w-fit border-primary/40 bg-primary/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.22em] text-primary/90"
                      >
                        {t('landingDetails.about.winLabel')}
                      </Badge>
                      <p className="mt-2 text-sm font-medium text-foreground">{t(`landingDetails.about.${useCase.winKey}`)}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col grow pb-6 pt-0">
                    <CardDescription className="text-sm leading-relaxed">
                      {t(`landingDetails.about.${useCase.descriptionKey}`)}
                    </CardDescription>
                  </CardContent>
                </Card>
              </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
