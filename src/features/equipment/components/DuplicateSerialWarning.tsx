import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import type { DuplicateEquipmentMatch } from '@/features/equipment/services/EquipmentService';
import { useI18n } from '@/i18n';

interface DuplicateSerialWarningProps {
  match: DuplicateEquipmentMatch;
  /** When true, renders the compact inline variant shown under the serial field. */
  inline?: boolean;
  /** Optional click handler (e.g. close the form dialog) when the link is followed. */
  onNavigate?: () => void;
}

/**
 * Non-blocking "possible duplicate" notice. Shows at-a-glance details of the
 * existing equipment record sharing this serial number plus a link to it, so
 * the operator can decide whether they are about to re-create it.
 */
export const DuplicateSerialWarning: React.FC<DuplicateSerialWarningProps> = ({
  match,
  inline = false,
  onNavigate,
}) => {
  const { t } = useI18n();
  const makeModel = [match.manufacturer, match.model].filter(Boolean).join(' ');
  const statusLabel = t(`equipmentDetails.${match.status}`);

  return (
    <div
      className="rounded-md border border-warning/40 bg-warning/10 p-3 text-warning dark:border-warning/50 dark:bg-warning/20"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium">
            {inline
              ? t('equipmentAudit.duplicateInline')
              : t('equipmentAudit.duplicateExisting')}
          </p>
          <div className="text-xs text-foreground/80 space-y-0.5">
            <p className="font-medium text-foreground">{match.name}</p>
            {makeModel && <p>{makeModel}</p>}
            <p>
              {t('equipmentAudit.serial')}: <span className="font-mono">{match.serial_number}</span>
            </p>
            <p>
              {t('equipmentAudit.team')}: {match.team_name ?? t('equipmentAudit.unassigned')} · {t('equipmentAudit.status')}: {statusLabel}
            </p>
          </div>
          <Link
            to={`/dashboard/equipment/${match.id}`}
            onClick={onNavigate}
            className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2 hover:opacity-80"
          >
            {t('equipmentAudit.viewExisting')}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
