import { describe, expect, it } from 'vitest';
import { publicFeaturePagesResources } from '@/i18n/publicFeaturePagesResources';
import { getFeatureSeoByPath } from '@/lib/featureSeoContent';
import { translateFeaturePage } from './featurePageTranslations';
import * as googleWorkspace from './googleWorkspaceData';
import * as customerCrm from './customerCrmData';
import * as mobileFirstDesign from './mobileFirstDesignData';

const pages = [
  ['googleWorkspace', googleWorkspace, '/features/google-workspace'],
  ['customerCrm', customerCrm, '/features/customer-crm'],
  ['mobileFirstDesign', mobileFirstDesign, '/features/mobile-first-design'],
] as const;

function tr(lang: 'vi' | 'ko') {
  return (key: string) => {
    const result = key.split('.').reduce<unknown>((value, part) =>
      value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined,
    publicFeaturePagesResources[lang]);
    if (typeof result !== 'string') throw new Error(`Missing ${lang} translation: ${key}`);
    return result;
  };
}

describe('public feature pages', () => {
  it.each(pages)('translates %s without changing image assets, path or step order', (key, page, path) => {
    const originalSeo = getFeatureSeoByPath(path)!;
    for (const language of ['vi', 'ko'] as const) {
      const result = translateFeaturePage(
        tr(language), key, page.content, page.benefits, page.steps, page.showcases, originalSeo,
      );
      expect(result.seo.path).toBe(path);
      expect(result.seo.heroTitle).not.toBe(originalSeo.heroTitle);
      expect(result.seo.faq?.[0].question).not.toBe(originalSeo.faq?.[0].question);
      expect(result.content.ctaTitle).not.toBe(page.content.ctaTitle);
      expect(result.steps.map((item) => item.number)).toEqual(page.steps.map((item) => item.number));
      expect(result.showcases.map((item) => item.kind)).toEqual(page.showcases.map((item) => item.kind));
      expect(result.showcases[0].title).not.toBe(page.showcases[0].title);
      if (page.showcases[0].kind === 'image' && result.showcases[0].kind === 'image') {
        expect(result.showcases[0].imageUrl).toBe(page.showcases[0].imageUrl);
        expect(result.showcases[0].imageAlt).not.toBe(page.showcases[0].imageAlt);
      }
    }
  });
});
