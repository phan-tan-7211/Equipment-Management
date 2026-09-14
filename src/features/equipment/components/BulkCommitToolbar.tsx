import React from 'react';
import { Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

export interface BulkCommitToolbarProps {
  dirtyCount: number;
  selectedCount: number;
  isPending: boolean;
  onDiscard: () => void;
  onCommit: () => void;
}

/**
 * Sticky footer for the bulk-edit grid (#627). Shows the live count of dirty
 * rows + the current selection size, and exposes the discard / commit
 * actions. Both buttons disable while the commit mutation is in flight.
 */
export const BulkCommitToolbar: React.FC<BulkCommitToolbarProps> = ({
  dirtyCount,
  selectedCount,
  isPending,
  onDiscard,
  onCommit,
}) => {
  const { t } = useI18n();
  const dirtyLabel =
    dirtyCount === 0
      ? t('equipmentResidual.bulkNoChanges')
      : t(dirtyCount === 1 ? 'equipmentResidual.bulkModifiedOne' : 'equipmentResidual.bulkModifiedMany', { count: dirtyCount });

  return (
    <div
      className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t bg-card px-4 py-3"
      role="region"
      aria-label={t('equipmentResidual.bulkToolbar')}
    >
      <div className="flex items-center gap-3 text-sm">
        <span
          className={dirtyCount === 0 ? 'text-muted-foreground' : 'font-medium text-foreground'}
          aria-live="polite"
          aria-atomic="true"
        >
          {dirtyLabel}
        </span>
        {selectedCount > 0 && (
          <Badge variant="secondary" className="font-normal">
            {t('equipmentResidual.bulkSelected', { count: selectedCount })}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onDiscard}
          disabled={dirtyCount === 0 || isPending}
        >
          {t('equipmentResidual.bulkDiscard')}
        </Button>
        <Button
          type="button"
          onClick={onCommit}
          disabled={dirtyCount === 0 || isPending}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
          {t('equipmentResidual.bulkSave')}
        </Button>
      </div>
    </div>
  );
};
