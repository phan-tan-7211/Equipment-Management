/**
 * AuditLogDetailPanel — non-modal port of the audit-entry inspector body
 * formerly at src/components/audit/AuditEntryDetailSheet.tsx (issue #641).
 * Lives inside the explorer's right ResizablePanel and exposes Overview /
 * Changes / JSON tabs over the same data the Sheet rendered.
 */

import React from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { formatDistanceToNow } from 'date-fns';
import { enUS, ko as koLocale, vi as viLocale } from 'date-fns/locale';
import { Copy, Check, Inbox, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import EmptyState from '@/components/ui/empty-state';
import { ChangesDiff } from '@/components/audit/ChangesDiff';
import { FormattedAuditEntry, AuditAction } from '@/types/audit';
import { cn } from '@/lib/utils';
import { formatIsoZulu } from '@/utils/dateFormatter';
import { formatAuditEntryMarkdown } from './auditEntryMarkdown';

export interface AuditLogDetailPanelProps {
  entry: FormattedAuditEntry | null;
  /** When provided, renders a close affordance that clears the selection. */
  onClearSelection?: () => void;
}

function getActionBadgeVariant(action: AuditAction) {
  switch (action) {
    case 'INSERT':
      return 'default' as const;
    case 'UPDATE':
      return 'secondary' as const;
    case 'DELETE':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
}

/** Small labeled copy button with a transient "copied" state. */
function CopyContentButton({
  label,
  getContent,
  testId,
}: {
  label: string;
  getContent: () => string;
  testId?: string;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = React.useState(false);
  const copiedTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    },
    []
  );

  const handleCopy = () => {
    if (!navigator.clipboard?.writeText) return;
    navigator.clipboard
      .writeText(getContent())
      .then(() => {
        setCopied(true);
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
        copiedTimerRef.current = setTimeout(() => {
          setCopied(false);
          copiedTimerRef.current = null;
        }, 1500);
      })
      .catch(() => {
        // Silent fail when clipboard write is denied.
      });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-6 px-2 text-[11px]"
      onClick={handleCopy}
      data-testid={testId}
    >
      {copied ? (
        <Check className="h-3 w-3 mr-1 text-success" />
      ) : (
        <Copy className="h-3 w-3 mr-1" />
      )}
      {copied ? t('auditExplorer.copied') : label}
    </Button>
  );
}

function CopyableValue({ value }: { value: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!navigator.clipboard?.writeText) return;
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        // Silent fail when clipboard write is denied.
      });
  };

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded truncate max-w-55">
        {value}
      </code>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={handleCopy}
        aria-label={t('auditExplorer.copyClipboard')}
      >
        {copied ? (
          <Check className="h-3 w-3 text-success" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}

interface PropertyRowProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

function PropertyRow({ label, children, className }: PropertyRowProps) {
  return (
    <div
      className={cn('grid grid-cols-[120px_1fr] gap-2 items-start py-1.5', className)}
    >
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function AuditLogDetailPanel({ entry, onClearSelection }: AuditLogDetailPanelProps) {
  const { t, language } = useI18n();
  const locale = language === 'vi' ? viLocale : language === 'ko' ? koLocale : enUS;
  if (!entry) {
    return (
      <div
        className="h-full flex items-center justify-center p-6"
        data-testid="audit-detail-empty"
      >
        <EmptyState
          icon={Inbox}
          title={t('auditExplorer.noSelection')}
          description={t('auditExplorer.selectHint')}
          className="border-0 bg-transparent"
        />
      </div>
    );
  }

  const hasMetadata = entry.metadata && Object.keys(entry.metadata).length > 0;

  return (
    <div className="h-full flex flex-col" data-testid="audit-detail-panel">
      <div className="px-5 pt-4 pb-3 border-b shrink-0">
        <div className="flex items-start gap-2">
          <h2 className="text-sm font-semibold leading-tight truncate flex-1 min-w-0">
            {entry.entity_name ?? t('auditExplorer.entry')}
          </h2>
          {onClearSelection && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 -mt-0.5 text-muted-foreground hover:text-foreground"
              onClick={onClearSelection}
              aria-label={t('auditExplorer.clearSelection')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant="outline" className="text-xs">
            {t(`auditLogControls.${entry.entity_type}`)}
          </Badge>
          <Badge variant={getActionBadgeVariant(entry.action)} className="text-xs">
            {t(`auditLogControls.${entry.action}`)}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto tabular-nums">
            {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale })}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <CopyContentButton
            label={t('auditExplorer.copyMarkdown')}
            getContent={() => formatAuditEntryMarkdown(entry)}
            testId="audit-detail-copy-markdown"
          />
          <CopyContentButton
            label={t('auditExplorer.copyJson')}
            getContent={() => JSON.stringify(entry, null, 2)}
            testId="audit-detail-copy-json"
          />
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-5 mt-3 self-start h-8">
          <TabsTrigger value="overview" className="text-xs px-3 py-1 h-6">
            {t('auditExplorer.overview')}
          </TabsTrigger>
          <TabsTrigger value="changes" className="text-xs px-3 py-1 h-6">
            {t('auditExplorer.changes')}
          </TabsTrigger>
          <TabsTrigger value="json" className="text-xs px-3 py-1 h-6">
            JSON
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 min-h-0 mt-2">
          <ScrollArea className="h-full">
            <div className="px-5 py-3 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {t('auditExplorer.entryDetails')}
                </p>
                <div className="divide-y divide-border/50">
                  <PropertyRow label={t('auditExplorer.date')}>
                    <div className="flex flex-col gap-0.5">
                      <code className="text-sm font-mono tabular-nums">
                        {formatIsoZulu(entry.created_at)}
                      </code>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale })}
                      </span>
                    </div>
                  </PropertyRow>
                  <PropertyRow label={t('auditExplorer.entityName')}>
                    <span className="text-sm">{entry.entity_name ?? '\u2014'}</span>
                  </PropertyRow>
                  <PropertyRow label={t('auditExplorer.entityType')}>
                    <Badge variant="outline" className="text-xs">
                      {t(`auditLogControls.${entry.entity_type}`)}
                    </Badge>
                  </PropertyRow>
                  <PropertyRow label={t('auditExplorer.action')}>
                    <Badge
                      variant={getActionBadgeVariant(entry.action)}
                      className="text-xs"
                    >
                      {t(`auditLogControls.${entry.action}`)}
                    </Badge>
                  </PropertyRow>
                  <PropertyRow label={t('auditExplorer.changedBy')}>
                    <div className="flex flex-col">
                      <span className="text-sm">{entry.actor_name}</span>
                      {entry.actor_email && (
                        <span className="text-xs text-muted-foreground">
                          {entry.actor_email}
                        </span>
                      )}
                    </div>
                  </PropertyRow>
                  <PropertyRow label={t('auditExplorer.changes')}>
                    <span className="text-sm">
                      {t('auditExplorer.fieldsCount', { count: entry.changeCount })}
                    </span>
                  </PropertyRow>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {t('auditExplorer.identifiers')}
                </p>
                <div className="divide-y divide-border/50">
                  <PropertyRow label={t('auditExplorer.entryId')}>
                    <CopyableValue value={entry.id} />
                  </PropertyRow>
                  <PropertyRow label={t('auditExplorer.entityId')}>
                    <CopyableValue value={entry.entity_id} />
                  </PropertyRow>
                  {entry.actor_id && (
                    <PropertyRow label={t('auditExplorer.actorId')}>
                      <CopyableValue value={entry.actor_id} />
                    </PropertyRow>
                  )}
                  <PropertyRow label={t('auditExplorer.organizationId')}>
                    <CopyableValue value={entry.organization_id} />
                  </PropertyRow>
                </div>
              </div>

              {hasMetadata && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      {t('auditExplorer.metadata')}
                    </p>
                    <div className="divide-y divide-border/50">
                      {Object.entries(entry.metadata).map(([key, value]) => (
                        <PropertyRow key={key} label={key.replace(/_/g, ' ')}>
                          <span className="text-xs font-mono break-all">
                            {typeof value === 'object'
                              ? JSON.stringify(value, null, 2)
                              : String(value ?? '\u2014')}
                          </span>
                        </PropertyRow>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="changes" className="flex-1 min-h-0 mt-2">
          <ScrollArea className="h-full">
            <div className="px-5 py-3">
              {Object.keys(entry.changes).length > 0 ? (
                <ChangesDiff changes={entry.changes} expanded />
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  {t('auditExplorer.noFieldChanges')}
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="json" className="flex-1 min-h-0 mt-2">
          <ScrollArea className="h-full">
            <pre
              className="px-5 py-3 text-[11px] font-mono text-foreground/90 leading-snug whitespace-pre-wrap break-all"
              data-testid="audit-detail-json"
            >
              {JSON.stringify(entry, null, 2)}
            </pre>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

