import { useI18n } from '@/i18n';
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { VerificationStatus } from '@/features/inventory/types/inventory';

const STATUS_CONFIG: Record<
  VerificationStatus,
  { dotClassName: string }
> = {
  verified: {
    dotClassName: 'bg-success',
  },
  unverified: {
    dotClassName: 'bg-muted-foreground',
  },
  deprecated: {
    dotClassName: 'bg-warning',
  },
};

type AlternateGroupStatusDotProps = {
  status: VerificationStatus;
  className?: string;
};

export function AlternateGroupStatusDot({
  status,
  className,
}: AlternateGroupStatusDotProps) {
  const { t } = useI18n();
  const config = STATUS_CONFIG[status];
  const label = t(`alternateGroups.${status}`);
  const description = t(`alternateGroups.${status}Description`);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={label}
          className={cn(
            'mt-2 inline-block size-2.5 shrink-0 rounded-full',
            config.dotClassName,
            className,
          )}
          onPointerDown={(event) => event.stopPropagation()}
        />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
