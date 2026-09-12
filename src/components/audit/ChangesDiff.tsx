/**
 * ChangesDiff Component
 * 
 * Displays field-level changes from an audit log entry in a
 * user-friendly format with old/new value comparison.
 */

import React from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { AuditChanges, FIELD_LABELS } from '@/types/audit';
import { ArrowRight, Plus, Minus } from 'lucide-react';

interface ChangesDiffProps {
  changes: AuditChanges;
  expanded?: boolean;
  maxItems?: number;
}

/**
 * Format a value for display
 */
function formatValue(value: unknown, t: (key: string) => string): string {
  if (value === null || value === undefined) {
    return t('auditExplorer.empty');
  }
  
  if (typeof value === 'boolean') {
    return value ? t('auditExplorer.yes') : t('auditExplorer.no');
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  // Truncate long strings
  const str = String(value);
  if (str.length > 100) {
    return str.substring(0, 100) + '...';
  }
  
  return str;
}

/**
 * Get the label for a field
 */
function getFieldLabel(field: string, t: (key: string) => string): string {
  return FIELD_LABELS[field] ? t(`auditExplorer.fields.${field}`) : field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Single change row component
 */
function ChangeRow({ 
  field, 
  oldValue, 
  newValue 
}: { 
  field: string; 
  oldValue: unknown; 
  newValue: unknown;
}) {
  const { t } = useI18n();
  const isAddition = oldValue === null && newValue !== null;
  const isDeletion = oldValue !== null && newValue === null;
  const isModification = oldValue !== null && newValue !== null;
  
  return (
    <div className="flex flex-col gap-1 py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2">
        {isAddition && (
          <Plus className="h-3.5 w-3.5 text-success shrink-0" />
        )}
        {isDeletion && (
          <Minus className="h-3.5 w-3.5 text-destructive shrink-0" />
        )}
        {isModification && (
          <ArrowRight className="h-3.5 w-3.5 text-info shrink-0" />
        )}
        <span className="font-medium text-sm text-foreground">
          {getFieldLabel(field, t)}
        </span>
      </div>
      
      <div className="flex items-start gap-2 ml-5.5 text-sm">
        {isModification && (
          <>
            <span className="text-muted-foreground line-through">
              {formatValue(oldValue, t)}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-foreground">
              {formatValue(newValue, t)}
            </span>
          </>
        )}
        {isAddition && (
          <span className="text-success dark:text-success">
            {formatValue(newValue, t)}
          </span>
        )}
        {isDeletion && (
          <span className="text-destructive dark:text-destructive line-through">
            {formatValue(oldValue, t)}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * ChangesDiff displays all field changes from an audit entry
 */
export function ChangesDiff({ changes, expanded = true, maxItems = 5 }: ChangesDiffProps) {
  const { t } = useI18n();
  const entries = Object.entries(changes);
  
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        {t('auditExplorer.noChangesRecorded')}
      </p>
    );
  }
  
  const displayEntries = expanded ? entries : entries.slice(0, maxItems);
  const hiddenCount = entries.length - displayEntries.length;
  
  return (
    <div className="space-y-0">
      {displayEntries.map(([field, change]) => (
        <ChangeRow
          key={field}
          field={field}
          oldValue={change.old}
          newValue={change.new}
        />
      ))}
      
      {hiddenCount > 0 && (
        <p className="text-xs text-muted-foreground pt-2">
          {t('auditExplorer.moreChanges', { count: hiddenCount })}
        </p>
      )}
    </div>
  );
}

/**
 * Compact inline summary of changes
 */
export function ChangesSummary({ changes }: { changes: AuditChanges }) {
  const { t } = useI18n();
  const entries = Object.entries(changes);
  
  if (entries.length === 0) {
    return <span className="text-muted-foreground">{t('auditExplorer.noChanges')}</span>;
  }
  
  if (entries.length === 1) {
    const [field, change] = entries[0];
    const label = getFieldLabel(field, t);
    if (change.old === null && change.new !== null) {
      return <span>{t('auditExplorer.setTo', { label, value: formatValue(change.new, t) })}</span>;
    }
    if (change.old !== null && change.new === null) {
      return <span>{t('auditExplorer.cleared', { label })}</span>;
    }
    return <span>{label}: {formatValue(change.old, t)} -&gt; {formatValue(change.new, t)}</span>;
  }

  if (entries.length <= 3) {
    const labels = entries.map(([field]) => getFieldLabel(field, t));
    if (labels.length === 2) {
      return <span>{t('auditExplorer.twoChanged', { first: labels[0], second: labels[1] })}</span>;
    }
    return <span>{t('auditExplorer.threeChanged', { first: labels[0], second: labels[1], third: labels[2] })}</span>;
  }

  const labels = entries.slice(0, 2).map(([field]) => getFieldLabel(field, t));
  return <span>{t('auditExplorer.otherFields', { first: labels[0], second: labels[1], count: entries.length - 2 })}</span>;
}


