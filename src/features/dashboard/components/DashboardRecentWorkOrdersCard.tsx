import React from "react";
import { ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, formatStatus } from "@/features/work-orders/utils/workOrderHelpers";
import { cn } from "@/lib/utils";
import { useI18n } from '@/i18n';
import { DashboardRecentListCard } from "./DashboardRecentListCard";

interface RecentWorkOrder { id: string; title: string; priority: string; assigneeName?: string | null; status: string; created_date?: string; }
interface DashboardRecentWorkOrdersCardProps { workOrders: RecentWorkOrder[]; isLoading: boolean; hasMore: boolean; }
function getStatusLeftBorder(status: string): string { switch (status) { case 'completed': return 'bg-success'; case 'in_progress': return 'bg-warning'; case 'overdue': return 'bg-destructive'; case 'open': case 'assigned': return 'bg-info'; case 'cancelled': return 'bg-muted-foreground/40'; default: return 'bg-muted-foreground/40'; } }

export const DashboardRecentWorkOrdersCard: React.FC<DashboardRecentWorkOrdersCardProps> = ({ workOrders, isLoading, hasMore }) => {
  const { t } = useI18n();
  return <DashboardRecentListCard
    sectionId="recent-work-orders-heading"
    heading={t('dashboard.widgets.recentWorkOrdersTitle')}
    description={t('dashboard.widgets.recentWorkOrdersDescription')}
    icon={ClipboardList}
    items={workOrders}
    isLoading={isLoading}
    hasMore={hasMore}
    viewAllHref="/dashboard/work-orders"
    viewAllLabel={t('dashboard.viewAllWorkOrders')}
    emptyMessage={t('dashboard.noWorkOrdersFound')}
    getItemKey={(order) => order.id}
    getItemHref={(order) => `/dashboard/work-orders/${order.id}`}
    renderStatusStripe={(order) => <div className={cn('w-0.5 self-stretch flex-shrink-0 rounded-full', getStatusLeftBorder(order.status))} />}
    renderTitle={(order) => order.title}
    renderSubtitle={(order) => t('dashboard.priorityAssignee', { priority: order.priority, assignee: order.assigneeName || t('breadcrumb.unassigned') })}
    renderBadge={(order) => <Badge variant="outline" className={cn('ml-1 flex-shrink-0 text-xs', getStatusColor(order.status))}>{formatStatus(order.status)}</Badge>}
  />;
};
