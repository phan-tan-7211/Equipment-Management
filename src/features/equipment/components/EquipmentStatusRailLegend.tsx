import React from 'react';
import { cn } from '@/lib/utils';
import { EQUIPMENT_STATUS_RAIL_LEGEND } from '@/lib/status-colors';
import { useI18n } from '@/i18n';

const STATUS_KEYS: Record<string, string> = {
  active: 'equipmentList.active',
  maintenance: 'equipmentList.maintenance',
  inactive: 'equipmentList.inactive',
  out_of_service: 'equipmentList.outOfService',
};

export function EquipmentStatusRailLegend() {
  const { t } = useI18n();
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {t('equipmentList.cardRailColor')}
      </p>
      <ul
        className="flex flex-wrap gap-x-3 gap-y-1.5"
        aria-label={t('equipmentList.statusRailLegend')}
      >
        {EQUIPMENT_STATUS_RAIL_LEGEND.map((item) => (
          <li key={item.status} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={cn(
                'inline-block h-3.5 w-1 shrink-0 rounded-sm',
                item.railClass || 'rounded-full bg-muted-foreground/35',
              )}
              aria-hidden
            />
            <span>{t(STATUS_KEYS[item.status] ?? item.status)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
