import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeatureSection } from '@/components/landing/features/FeatureSection';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '@/i18n';

export interface BuiltInTemplate {
  name: string;
  items: number;
  sections: number;
  description: string;
  icon: LucideIcon;
}

interface PmBuiltInTemplatesSectionProps {
  templates: BuiltInTemplate[];
}

export const PmBuiltInTemplatesSection = ({ templates }: PmBuiltInTemplatesSectionProps) => {
  const { t } = useI18n();
  const key = (part: string) => t(`publicFeatures.pmTemplates.extra.${part}`);
  const [first, second] = templates;
  const description = first && second
    ? t('publicFeatures.pmTemplates.extra.description', {
      firstName: key('templates.0.0'), firstItems: first.items, firstSections: first.sections,
      secondName: key('templates.1.0'), secondItems: second.items, secondSections: second.sections,
    })
    : key('descriptionShort');

  return <FeatureSection title={key('title')} description={description}>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {templates.map((template, index) => (
        <Card key={template.name} className="border-border bg-card hover:bg-card/80 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <template.icon className="h-6 w-6 text-primary" />
              <CardTitle className="text-lg">{key(`templates.${index}.0`)}</CardTitle>
            </div>
            <CardDescription>{key(`templates.${index}.1`)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">{template.items}</span>
                <span className="text-muted-foreground">{key('items')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">{template.sections}</span>
                <span className="text-muted-foreground">{key('sections')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </FeatureSection>;
};
