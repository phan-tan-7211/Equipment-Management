import { useI18n } from '@/i18n';
import React, { useState } from 'react';
import { Check, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

type GroupSortOption = 'name-asc' | 'name-desc' | 'updated-desc' | 'updated-asc';

const SORT_OPTIONS: { value: GroupSortOption; labelKey: string }[] = [
  { value: 'name-asc', labelKey: 'sortNameAsc' },
  { value: 'name-desc', labelKey: 'sortNameDesc' },
  { value: 'updated-desc', labelKey: 'sortRecent' },
  { value: 'updated-asc', labelKey: 'sortOldest' },
];

interface AlternateGroupsSortPopoverProps {
  sortBy: GroupSortOption;
  onSortChange: (sort: GroupSortOption) => void;
}

const AlternateGroupsSortPopover: React.FC<AlternateGroupsSortPopoverProps> = ({
  sortBy,
  onSortChange,
}) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const currentLabel = t(`alternateGroups.${SORT_OPTIONS.find((o) => o.value === sortBy)?.labelKey ?? 'sortNameAsc'}`);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-sm font-normal"
          aria-label={t('alternateGroups.sortAria')}
        >
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="max-w-[140px] truncate">{currentLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              {SORT_OPTIONS.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onSortChange(option.value);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between gap-2"
                >
                  <span>{t(`alternateGroups.${option.labelKey}`)}</span>
                  <Check
                    className={cn(
                      'h-3.5 w-3.5 shrink-0',
                      sortBy === option.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default AlternateGroupsSortPopover;
