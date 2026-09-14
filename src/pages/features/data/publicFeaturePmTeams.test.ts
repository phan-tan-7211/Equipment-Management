import { describe, expect, it } from 'vitest';
import { publicFeaturePmTeamsResources } from '@/i18n/publicFeaturePmTeamsResources';
import { getFeatureSeoByPath } from '@/lib/featureSeoContent';
import { translateFeaturePage } from './featurePageTranslations';
import * as pm from './pmTemplatesData';
import * as teams from './teamCollaborationData';

const pages = [
  ['pmTemplates', '/features/pm-templates', pm],
  ['teamCollaboration', '/features/team-collaboration', teams],
] as const;

describe('PM and team feature translations', () => {
  it.each(pages)('%s includes its main copy and additional section in VI/KO', (key, path, page) => {
    const originalSeo = getFeatureSeoByPath(path)!;
    for (const language of ['vi', 'ko'] as const) {
      const t = (translationKey: string) => {
        const value = translationKey.split('.').reduce<unknown>((current, segment) =>
          current && typeof current === 'object' ? (current as Record<string, unknown>)[segment] : undefined,
        publicFeaturePmTeamsResources[language]);
        if (typeof value !== 'string' || !value) throw new Error(`Missing ${language} translation: ${translationKey}`);
        return value;
      };
      const translated = translateFeaturePage(t, key,
        page.content, page.benefits, page.steps, page.showcases, originalSeo);
      expect(translated.seo.path).toBe(path);
      expect(translated.seo.faq?.[0].question).not.toBe(originalSeo.faq?.[0].question);
      expect(translated.benefits[0].title).not.toBe(page.benefits[0].title);
      expect(translated.showcases.map((item) => item.kind)).toEqual(page.showcases.map((item) => item.kind));
      expect(t(`publicFeatures.${key}.extra.title`)).toBeTruthy();
      if (key === 'pmTemplates') {
        pm.builtInTemplates.forEach((_, index) => {
          expect(t(`publicFeatures.${key}.extra.templates.${index}.0`)).toBeTruthy();
          expect(t(`publicFeatures.${key}.extra.templates.${index}.1`)).toBeTruthy();
        });
        const placeholders = t(`publicFeatures.${key}.extra.description`).match(/{{\w+}}/g);
        expect([...placeholders!].sort()).toEqual([
          '{{firstName}}', '{{firstItems}}', '{{firstSections}}',
          '{{secondName}}', '{{secondItems}}', '{{secondSections}}',
        ].sort());
      } else {
        for (let index = 0; index < 3; index++) {
          expect(t(`publicFeatures.${key}.extra.orgRoles.${index}.0`)).toBeTruthy();
          expect(t(`publicFeatures.${key}.extra.orgRoles.${index}.1`)).toBeTruthy();
        }
        for (let index = 0; index < 4; index++) {
          expect(t(`publicFeatures.${key}.extra.teamRoles.${index}.0`)).toBeTruthy();
          expect(t(`publicFeatures.${key}.extra.teamRoles.${index}.1`)).toBeTruthy();
        }
      }
    }
  });
});
