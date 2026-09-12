import { useI18n } from '@/i18n';
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, MoreHorizontal } from 'lucide-react';

interface WorkOrderDetailsMobileHeaderProps {
  workOrder: {
    title: string;
  };
  showExports?: boolean;
  /** Opens unified overflow/actions sheet */
  onOpenActionSheet: () => void;
}

export const WorkOrderDetailsMobileHeader: React.FC<WorkOrderDetailsMobileHeaderProps> = ({
  workOrder,
  showExports = false,
  onOpenActionSheet,
}) => {
  const { t } = useI18n();
  return (
    <div className="sticky top-0 z-10 bg-background border-b lg:hidden">
      <div className="px-3 pt-2 pb-3 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            asChild
            className="-ml-2 min-h-11 gap-1.5 px-2 text-muted-foreground hover:text-foreground touch-manipulation"
          >
            <Link to="/dashboard/work-orders">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <span className="text-sm font-medium">{t('workOrderDetail.workOrders')}</span>
            </Link>
          </Button>

          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              variant={showExports ? 'outline' : 'ghost'}
              onClick={() => void onOpenActionSheet()}
              className="min-h-11 min-w-11 touch-manipulation"
              aria-label={showExports ? t('workOrderDetail.export') : t('workOrderDetail.openActions')}
              title={showExports ? t('workOrderDetail.export') : t('workOrderDetail.openActions')}
            >
              {showExports ? (
                <Download className="h-5 w-5" aria-hidden />
              ) : (
                <MoreHorizontal className="h-6 w-6" aria-hidden />
              )}
            </Button>
          </div>
        </div>

        <h1
          className="text-xl font-bold leading-tight line-clamp-3"
          data-route-heading="true"
          tabIndex={-1}
        >
          {workOrder.title}
        </h1>
      </div>
    </div>
  );
};
