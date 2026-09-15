import { useMemo, useState, type JSX } from 'react';
import { ExternalLink } from '@/components/ui/external-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useI18n } from '@/i18n/I18nProvider';
import {
  EMPTY_LANDSCAPE_FILTERS,
  filterLandscapeCases,
} from '@/pages/legal/right-to-repair/filterLandscapeCases';
import {
  LANDSCAPE_CASES,
} from '@/pages/legal/right-to-repair/rightToRepairContent';
import type {
  LandscapeCase,
  LandscapeFilters,
  LandscapeLens,
  LandscapeMechanism,
  LandscapeSector,
} from '@/pages/legal/right-to-repair/types';

const LENS_OPTIONS: Array<LandscapeLens | 'all'> = ['all', 'software', 'hardware', 'physical'];
const SECTOR_OPTIONS: Array<LandscapeSector | 'all'> = [
  'all',
  'enterprise',
  'consumer',
  'agriculture-fleet',
];
const MECHANISM_OPTIONS: Array<LandscapeMechanism | 'all'> = [
  'all',
  'cloud-tether',
  'subscription-lock',
  'parts-pairing',
  'firmware-paywall',
  'diagnostic-lockout',
  'buy-vs-license',
];

const LENS_TRANSLATION_KEYS: Record<LandscapeLens, string> = {
  software: 'software',
  hardware: 'hardware',
  physical: 'physical',
};

const MECHANISM_TRANSLATION_KEYS: Record<LandscapeMechanism, string> = {
  'cloud-tether': 'cloudTether',
  'subscription-lock': 'subscriptionLock',
  'parts-pairing': 'partsPairing',
  'firmware-paywall': 'firmwarePaywall',
  'diagnostic-lockout': 'diagnosticLockout',
  'buy-vs-license': 'buyVsLicense',
};

function FilterRow<T extends string>({
  legend,
  value,
  options,
  labels,
  onChange,
}: {
  legend: string;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
}): JSX.Element {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => {
          if (next) onChange(next as T);
        }}
        className="flex flex-wrap justify-start gap-1"
        variant="outline"
        size="sm"
      >
        {options.map((option) => (
          <ToggleGroupItem key={option} value={option} className="px-3">
            {labels[option]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </fieldset>
  );
}

function caseKey(item: LandscapeCase, field: 'title' | 'practice' | 'harm' | 'source'): string {
  return `publicLegal.landscape.cases.${item.id}.${field}`;
}

function CaseCard({
  item,
  onOpen,
}: {
  item: LandscapeCase;
  onOpen: (item: LandscapeCase) => void;
}): JSX.Element {
  const { t } = useI18n();

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.vendor}</p>
        <CardTitle className="text-lg">{t(caseKey(item, 'title'))}</CardTitle>
        <CardDescription>{item.period}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex flex-1 flex-col gap-3">
        <p className="text-sm text-muted-foreground line-clamp-3">{t(caseKey(item, 'practice'))}</p>
        <div className="flex flex-wrap gap-1">
          {item.lenses.map((lens) => (
            <Badge key={lens} variant="secondary">
              {t(`publicLegal.landscape.${LENS_TRANSLATION_KEYS[lens]}`)}
            </Badge>
          ))}
          {item.mechanisms.map((mechanism) => (
            <Badge key={mechanism} variant="outline">
              {t(`publicLegal.landscape.${MECHANISM_TRANSLATION_KEYS[mechanism]}`)}
            </Badge>
          ))}
        </div>
        <Button type="button" variant="outline" className="mt-auto w-full" onClick={() => onOpen(item)}>
          {t('publicLegal.landscape.readCase')}
        </Button>
      </CardContent>
    </Card>
  );
}

export function RightToRepairLandscape(): JSX.Element {
  const { t } = useI18n();
  const [filters, setFilters] = useState<LandscapeFilters>(EMPTY_LANDSCAPE_FILTERS);
  const [openCase, setOpenCase] = useState<LandscapeCase | null>(null);

  const lensLabels: Record<LandscapeLens | 'all', string> = {
    all: t('publicLegal.landscape.allLayers'),
    software: t('publicLegal.landscape.software'),
    hardware: t('publicLegal.landscape.hardware'),
    physical: t('publicLegal.landscape.physical'),
  };
  const sectorLabels: Record<LandscapeSector | 'all', string> = {
    all: t('publicLegal.landscape.allSectors'),
    enterprise: t('publicLegal.landscape.enterprise'),
    consumer: t('publicLegal.landscape.consumer'),
    'agriculture-fleet': t('publicLegal.landscape.agricultureFleet'),
  };
  const mechanismLabels: Record<LandscapeMechanism | 'all', string> = {
    all: t('publicLegal.landscape.allMechanisms'),
    'cloud-tether': t('publicLegal.landscape.cloudTether'),
    'subscription-lock': t('publicLegal.landscape.subscriptionLock'),
    'parts-pairing': t('publicLegal.landscape.partsPairing'),
    'firmware-paywall': t('publicLegal.landscape.firmwarePaywall'),
    'diagnostic-lockout': t('publicLegal.landscape.diagnosticLockout'),
    'buy-vs-license': t('publicLegal.landscape.buyVsLicense'),
  };

  const visibleCases = useMemo(() => {
    const facetCases = filterLandscapeCases(LANDSCAPE_CASES, { ...filters, query: '' });
    const query = filters.query.trim().toLowerCase();
    if (!query) return facetCases;

    return facetCases.filter((item) =>
      [item.vendor, item.period, t(caseKey(item, 'title')), t(caseKey(item, 'practice')), t(caseKey(item, 'harm'))]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [filters, t]);

  return (
    <section aria-labelledby="industry-patterns-heading" className="space-y-8">
      <div className="max-w-3xl space-y-3">
        <h2 id="industry-patterns-heading" className="text-3xl font-bold tracking-tight">
          {t('publicLegal.landscape.title')}
        </h2>
        <p className="text-muted-foreground">{t('publicLegal.landscape.introduction')}</p>
      </div>

      <div className="space-y-6 rounded-lg border border-border/60 bg-card/40 p-4 sm:p-6">
        <FilterRow
          legend={t('publicLegal.landscape.layer')}
          value={filters.lens}
          options={LENS_OPTIONS}
          labels={lensLabels}
          onChange={(lens) => setFilters((current) => ({ ...current, lens }))}
        />
        <FilterRow
          legend={t('publicLegal.landscape.sector')}
          value={filters.sector}
          options={SECTOR_OPTIONS}
          labels={sectorLabels}
          onChange={(sector) => setFilters((current) => ({ ...current, sector }))}
        />
        <FilterRow
          legend={t('publicLegal.landscape.mechanism')}
          value={filters.mechanism}
          options={MECHANISM_OPTIONS}
          labels={mechanismLabels}
          onChange={(mechanism) => setFilters((current) => ({ ...current, mechanism }))}
        />
        <div className="space-y-2">
          <label htmlFor="right-to-repair-case-search" className="text-sm font-medium">
            {t('publicLegal.landscape.searchCases')}
          </label>
          <Input
            id="right-to-repair-case-search"
            type="search"
            value={filters.query}
            onChange={(event) =>
              setFilters((current) => ({ ...current, query: event.target.value }))
            }
            placeholder={t('publicLegal.landscape.searchPlaceholder')}
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {visibleCases.length === 1
          ? t('publicLegal.landscape.singleCase')
          : t('publicLegal.landscape.caseCount', { count: visibleCases.length })}
      </p>

      {visibleCases.length === 0 ? (
        <EmptyState
          title={t('publicLegal.landscape.noCasesTitle')}
          description={t('publicLegal.landscape.noCasesDescription')}
          action={
            <Button type="button" variant="outline" onClick={() => setFilters(EMPTY_LANDSCAPE_FILTERS)}>
              {t('publicLegal.landscape.resetFilters')}
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCases.map((item) => (
            <li key={item.id}>
              <CaseCard item={item} onOpen={setOpenCase} />
            </li>
          ))}
        </ul>
      )}

      <Sheet open={openCase !== null} onOpenChange={(open) => !open && setOpenCase(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {openCase ? (
            <>
              <SheetHeader>
                <SheetTitle>{t(caseKey(openCase, 'title'))}</SheetTitle>
                <SheetDescription>
                  {openCase.vendor} · {openCase.period}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold text-foreground">{t('publicLegal.landscape.whatHappened')}</h3>
                  <p className="mt-1 text-muted-foreground">{t(caseKey(openCase, 'practice'))}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{t('publicLegal.landscape.whoItHurt')}</h3>
                  <p className="mt-1 text-muted-foreground">{t(caseKey(openCase, 'harm'))}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {openCase.lenses.map((lens) => (
                    <Badge key={lens} variant="secondary">
                      {lensLabels[lens]}
                    </Badge>
                  ))}
                  {openCase.mechanisms.map((mechanism) => (
                    <Badge key={mechanism} variant="outline">
                      {mechanismLabels[mechanism]}
                    </Badge>
                  ))}
                </div>
                <p>
                  <ExternalLink href={openCase.sourceHref}>
                    {t(caseKey(openCase, 'source'))}
                  </ExternalLink>
                </p>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  );
}
