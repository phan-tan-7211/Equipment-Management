import { useI18n } from '@/i18n';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFormatTimestamp } from '@/hooks/useFormatTimestamp';
import {
  isQuickBooksInvoiceStatus,
  type QuickBooksInvoiceStatus,
} from '@/features/work-orders/types/workOrder';

interface QuickBooksInvoiceStatusBadgeProps {
  status?: QuickBooksInvoiceStatus | string | null;
  invoiceNumber?: string | null;
  balanceCents?: number | null;
  paidAt?: string | null;
  className?: string;
}

const statusClasses: Record<QuickBooksInvoiceStatus, string> = {
  draft: 'bg-muted text-muted-foreground border-border',
  sent: 'bg-info/10 text-info border-info/30',
  viewed: 'bg-info/10 text-info border-info/30',
  paid: 'bg-success/10 text-success border-success/30',
  partially_paid: 'bg-warning/10 text-warning border-warning/30',
  overdue: 'bg-destructive/10 text-destructive border-destructive/30',
  voided: 'bg-muted text-muted-foreground border-border',
};

function formatStatusLabel(status: QuickBooksInvoiceStatus, t: (key: string) => string): string {
  switch (status) {
    case 'draft':
      return t('workOrderExportUi.invoiceDraft');
    case 'sent':
      return t('workOrderExportUi.awaitingPayment');
    case 'viewed':
      return t('workOrderExportUi.viewed');
    case 'paid':
      return t('workOrderExportUi.paid');
    case 'partially_paid':
      return t('workOrderExportUi.partiallyPaid');
    case 'overdue':
      return t('workOrderExportUi.invoiceOverdue');
    case 'voided':
      return t('workOrderExportUi.invoiceVoided');
    default:
      return status;
  }
}

const QuickBooksInvoiceStatusBadge: React.FC<QuickBooksInvoiceStatusBadgeProps> = ({
  status,
  invoiceNumber,
  balanceCents,
  paidAt,
  className,
}) => {
  const { t } = useI18n();
  const { formatDate } = useFormatTimestamp();

  if (!isQuickBooksInvoiceStatus(status)) return null;

  const parts = [formatStatusLabel(status, t)];
  if (status === 'paid' && paidAt) {
    parts.push(formatDate(paidAt));
  } else if (status !== 'paid' && typeof balanceCents === 'number' && balanceCents > 0) {
    parts.push(`$${(balanceCents / 100).toFixed(2)}`);
  }
  if (invoiceNumber) {
    parts.push(`#${invoiceNumber}`);
  }

  return (
    <Badge variant="outline" className={cn('text-xs whitespace-nowrap', statusClasses[status], className)}>
      {parts.join(' - ')}
    </Badge>
  );
};

export default QuickBooksInvoiceStatusBadge;
