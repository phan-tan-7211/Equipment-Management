import { describe, expect, it } from 'vitest';
import { publicFeatureFleetBooksResources } from '@/i18n/publicFeatureFleetBooksResources';
import { getFeatureSeoByPath } from '@/lib/featureSeoContent';
import { translateFeaturePage } from './featurePageTranslations';
import * as fleet from './fleetVisualizationData';
import * as quickBooks from './quickBooksData';

const cases = [
  ['fleetVisualization', '/features/fleet-visualization', fleet],
  ['quickBooks', '/features/quickbooks', quickBooks],
] as const;

describe('fleet map and QuickBooks feature translations', () => {
  it.each(cases)('%s preserves URLs, media and order across locales', (key, path, page) => {
    const source = getFeatureSeoByPath(path)!;
    for (const language of ['vi', 'ko'] as const) {
      const t = (translationKey: string) => {
        const translated = translationKey.split('.').reduce<unknown>((value, segment) =>
          value && typeof value === 'object' ? (value as Record<string, unknown>)[segment] : undefined,
        publicFeatureFleetBooksResources[language]);
        if (typeof translated !== 'string' || !translated) throw new Error(`Missing ${language} translation: ${translationKey}`);
        return translated;
      };
      const result = translateFeaturePage(
        t, key, page.content, page.benefits, page.steps, page.showcases, source,
      );
      expect(result.seo.path).toBe(path);
      expect(result.seo.faq?.[0].question).not.toBe(source.faq?.[0].question);
      expect(result.benefits[0].title).not.toBe(page.benefits[0].title);
      expect(result.steps.map((step) => step.number)).toEqual(page.steps.map((step) => step.number));
      expect(result.showcases.map((item) => item.kind)).toEqual(page.showcases.map((item) => item.kind));
      expect(result.showcases[0].title).not.toBe(page.showcases[0].title);
      if (result.showcases[0].kind === 'image' && page.showcases[0].kind === 'image') {
        expect(result.showcases[0].imageUrl).toBe(page.showcases[0].imageUrl);
      }
      if (result.showcases[0].kind === 'demo-video' && page.showcases[0].kind === 'demo-video') {
        expect(result.showcases[0].baseName).toBe(page.showcases[0].baseName);
      }
    }
  });
});
