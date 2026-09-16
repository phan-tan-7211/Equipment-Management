import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/i18n';
import { getFinalHardcodedAuditCopy } from '@/i18n/finalHardcodedAuditCopy';
import { cn } from '@/lib/utils';

type ToolbarSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  className?: string;
};

export function ToolbarSearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = 'max-w-[260px]',
}: ToolbarSearchInputProps) {
  const { language } = useI18n();
  const copy = getFinalHardcodedAuditCopy(language);

  return (
    <div className={cn('relative min-w-0 flex-1', className)}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 min-h-0 w-full pl-8 pr-8 text-sm bg-transparent"
        aria-label={ariaLabel}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={copy.clearSearch}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
