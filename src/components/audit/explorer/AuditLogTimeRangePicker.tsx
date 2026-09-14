/**
 * AuditLogTimeRangePicker — segmented control for the audit explorer's time
 * range. Emits ISO-precision timestamps so the histogram and list queries
 * agree on the same boundary even at sub-day granularity (issue #641).
 */

import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { enUS, ko as koLocale, vi as viLocale } from 'date-fns/locale';
import { useI18n } from '@/i18n/I18nProvider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AuditLogTimePreset } from '@/types/audit';
import {
  dateInputToExclusiveEndIso,
  dateInputToLocalStartIso,
} from '@/utils/localDateInputIso';

const PRESET_BUTTONS: Array<{
  value: Exclude<AuditLogTimePreset, 'custom'>;
  labelKey: string;
  ariaKey: string;
}> = [
  { value: 'last_15m', labelKey: 'short15m', ariaKey: 'minutes15' },
  { value: 'last_1h', labelKey: 'short1h', ariaKey: 'hour1' },
  { value: 'last_24h', labelKey: 'short24h', ariaKey: 'hours24' },
  { value: 'last_7d', labelKey: 'short7d', ariaKey: 'days7' },
  { value: 'last_30d', labelKey: 'short30d', ariaKey: 'days30' },
  { value: 'all', labelKey: 'all', ariaKey: 'allTime' },
];

export interface AuditLogTimeRangePickerProps {
  preset: AuditLogTimePreset;
  /** ISO timestamp; only meaningful when preset === 'custom'. */
  isoFrom?: string;
  /** ISO timestamp; only meaningful when preset === 'custom'. */
  isoTo?: string;
  onChange: (preset: AuditLogTimePreset, isoFrom?: string, isoTo?: string) => void;
}

function isoToDateInput(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return formatDate(d, 'yyyy-MM-dd');
}

/** Maps an exclusive `dateTo` ISO bound back to the inclusive end calendar day for `<input type="date">`. */
function exclusiveUpperIsoToDateInput(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  if (iso.includes('T')) {
    return formatDate(new Date(d.getTime() - 1), 'yyyy-MM-dd');
  }
  return formatDate(d, 'yyyy-MM-dd');
}

export function AuditLogTimeRangePicker({
  preset,
  isoFrom,
  isoTo,
  onChange,
}: AuditLogTimeRangePickerProps) {
  const { t, language } = useI18n();
  const locale = language === 'vi' ? viLocale : language === 'ko' ? koLocale : enUS;
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(() => isoToDateInput(isoFrom));
  const [draftTo, setDraftTo] = useState(() => exclusiveUpperIsoToDateInput(isoTo));

  useEffect(() => {
    setDraftFrom(isoToDateInput(isoFrom));
    setDraftTo(exclusiveUpperIsoToDateInput(isoTo));
  }, [isoFrom, isoTo, popoverOpen]);

  const customLabel =
    preset === 'custom' && isoFrom && isoTo
      ? `${formatDate(new Date(isoFrom), 'MMM d', { locale })} – ${formatDate(
          new Date(new Date(isoTo).getTime() - 1),
          'MMM d', { locale }
        )}`
      : t('auditLogControls.custom');

  return (
    <div className="flex items-center gap-1.5">
      <ToggleGroup
        type="single"
        size="sm"
        value={preset === 'custom' ? '' : preset}
        onValueChange={(v) => {
          if (!v) return;
          onChange(v as AuditLogTimePreset);
        }}
        aria-label={t('auditLogControls.preset')}
      >
        {PRESET_BUTTONS.map((btn) => (
          <ToggleGroupItem
            key={btn.value}
            value={btn.value}
            className="h-7 px-2 text-xs"
            aria-label={t(`auditLogControls.${btn.ariaKey}`)}
          >
            {t(`auditLogControls.${btn.labelKey}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={preset === 'custom' ? 'default' : 'outline'}
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs"
            aria-label={t('auditLogControls.customDateRange')}
          >
            <Calendar className="h-3 w-3" />
            {customLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-3">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('auditLogControls.customRange')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">{t('auditLogControls.from')}</span>
                <Input
                  type="date"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className="h-8 text-xs"
                  aria-label={t('auditLogControls.customStart')}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground">{t('auditLogControls.to')}</span>
                <Input
                  type="date"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="h-8 text-xs"
                  aria-label={t('auditLogControls.customEnd')}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setPopoverOpen(false)}
              >
                {t('auditLogControls.cancel')}
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={!draftFrom || !draftTo}
                onClick={() => {
                  const fromIso = dateInputToLocalStartIso(draftFrom);
                  const toIso = dateInputToExclusiveEndIso(draftTo);
                  if (!fromIso || !toIso) return;
                  onChange('custom', fromIso, toIso);
                  setPopoverOpen(false);
                }}
              >
                {t('auditLogControls.apply')}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
