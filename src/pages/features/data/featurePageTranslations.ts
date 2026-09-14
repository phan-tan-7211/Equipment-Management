import type { Benefit, FeaturePageContent, ShowcaseItem, Step } from './featurePageTypes';
import type { FeatureSeoEntry } from '@/lib/featureSeoContent';

const CONTENT_FIELDS = [
  'benefitsTitle', 'benefitsDescription', 'stepsTitle', 'stepsDescription',
  'showcaseTitle', 'showcaseDescription', 'ctaTitle', 'ctaDescription', 'ctaPrimaryText',
] as const;

export type FeaturePageCopy = {
  content: string[];
  benefits: string[][];
  steps: string[][];
  showcases: string[][];
  seo: string[];
};

export function extractFeaturePageCopy(
  content: FeaturePageContent,
  benefits: Benefit[],
  steps: Step[],
  showcases: ShowcaseItem[],
  seo: FeatureSeoEntry,
): FeaturePageCopy {
  return {
    content: CONTENT_FIELDS.map((field) => content[field] ?? ''),
    benefits: benefits.map((item) => [item.title, item.subtitle, item.description, ...item.benefits]),
    steps: steps.map((item) => [item.title, item.description]),
    showcases: showcases.map((item) => [
      item.kind === 'demo-video' ? item.alt : item.kind === 'image' ? item.imageAlt : '',
      item.title,
      item.description,
      ...(item.kind === 'image-grid' ? item.images.map((image) => image.imageAlt) : []),
    ]),
    seo: [
      seo.pageTitle, seo.description, seo.breadcrumbLabel, seo.heroTitle,
      seo.heroDescription, ...(seo.faq ?? []).flatMap(({ question, answer }) => [question, answer]),
      seo.howTo?.name ?? '', seo.howTo?.description ?? '',
    ],
  };
}

export function translateFeaturePage(
  t: (key: string) => string,
  key: string,
  content: FeaturePageContent,
  benefits: Benefit[],
  steps: Step[],
  showcases: ShowcaseItem[],
  seo: FeatureSeoEntry,
) {
  const tr = (path: string) => t(`publicFeatures.${key}.${path}`);
  const translatedContent = { ...content };
  CONTENT_FIELDS.forEach((field, index) => {
    if (content[field]) translatedContent[field] = tr(`content.${index}`);
  });
  const translatedBenefits = benefits.map((item, index) => ({
    ...item,
    title: tr(`benefits.${index}.0`),
    subtitle: tr(`benefits.${index}.1`),
    description: tr(`benefits.${index}.2`),
    benefits: item.benefits.map((_, benefitIndex) => tr(`benefits.${index}.${benefitIndex + 3}`)),
  }));
  const translatedSteps = steps.map((item, index) => ({
    ...item, title: tr(`steps.${index}.0`), description: tr(`steps.${index}.1`),
  }));
  const translatedShowcases: ShowcaseItem[] = showcases.map((item, index) => {
    const translated = { ...item, title: tr(`showcases.${index}.1`), description: tr(`showcases.${index}.2`) };
    if (item.kind === 'demo-video') return { ...translated, alt: tr(`showcases.${index}.0`) };
    if (item.kind === 'image') return { ...translated, imageAlt: tr(`showcases.${index}.0`) };
    return {
      ...translated,
      images: item.images.map((image, imageIndex) => ({
        ...image, imageAlt: tr(`showcases.${index}.${imageIndex + 3}`),
      })),
    };
  });
  const translatedSeo: FeatureSeoEntry = {
    ...seo,
    pageTitle: tr('seo.0'),
    description: tr('seo.1'),
    breadcrumbLabel: tr('seo.2'),
    heroTitle: tr('seo.3'),
    heroDescription: tr('seo.4'),
    faq: seo.faq?.map((item, index) => ({
      ...item, question: tr(`seo.${5 + index * 2}`), answer: tr(`seo.${6 + index * 2}`),
    })),
    howTo: seo.howTo ? {
      name: tr(`seo.${5 + (seo.faq?.length ?? 0) * 2}`),
      description: tr(`seo.${6 + (seo.faq?.length ?? 0) * 2}`),
    } : undefined,
  };
  return {
    content: translatedContent,
    benefits: translatedBenefits,
    steps: translatedSteps,
    showcases: translatedShowcases,
    seo: translatedSeo,
  };
}
