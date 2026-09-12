import { useI18n } from '@/i18n/I18nProvider';
import React from 'react';
import { BarChart3 } from 'lucide-react';

const roadmapItems = [
  {
    icon: BarChart3,
    titleKey: 'title',
    descriptionKey: 'description',
  },
];

const RoadmapSection = () => {
  const { t } = useI18n();
  return (
    <section id="roadmap" className="py-12 bg-background border-y border-border">
      <div className="container px-4 mx-auto">
        <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
          {t('landingSections.roadmap.heading')}
        </h2>
        <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto">
          {roadmapItems.map(({ icon: Icon, titleKey, descriptionKey }) => (
            <div
              key={titleKey}
              className="flex items-start gap-3 rounded-lg border border-border bg-card/50 px-4 py-3 min-w-50 max-w-md"
            >
              <Icon className="h-6 w-6 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="font-medium text-foreground">{t(`landingSections.roadmap.${titleKey}`)}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{t(`landingSections.roadmap.${descriptionKey}`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RoadmapSection;
