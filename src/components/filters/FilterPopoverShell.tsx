import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export type FilterPopoverShellHelpers = {
  close: () => void;
};

export type FilterPopoverShellProps = {
  ariaSubject: string;
  activeFilterCount: number;
  children: (helpers: FilterPopoverShellHelpers) => React.ReactNode;
  contentClassName?: string;
  headerLabel?: string;
  triggerLabel?: string;
  triggerAriaLabel?: string;
};

export function FilterPopoverShell({
  ariaSubject,
  activeFilterCount,
  children,
  contentClassName = 'w-72 p-4',
  headerLabel = 'Filters',
  triggerLabel = 'Filter',
  triggerAriaLabel,
}: FilterPopoverShellProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const resolvedAriaLabel =
    triggerAriaLabel ??
    `Filter ${ariaSubject}${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-sm font-normal"
          aria-label={resolvedAriaLabel}
        >
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {triggerLabel}
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-0.5 h-4 min-w-4 rounded-full px-1 py-0 text-[10px] font-semibold leading-none"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={contentClassName} align="start">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {headerLabel}
          </p>
          {children({ close })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
