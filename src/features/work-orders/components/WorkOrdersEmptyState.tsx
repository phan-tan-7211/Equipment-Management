import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Plus } from 'lucide-react';
import type { QuickFilterPreset } from '@/features/work-orders/hooks/useWorkOrderFilters';
import { useI18n } from '@/i18n';
interface Props { hasActiveFilters:boolean; activePresets:Set<QuickFilterPreset>; onCreateClick:()=>void; }
export const WorkOrdersEmptyState: React.FC<Props> = ({hasActiveFilters,activePresets,onCreateClick}) => { const { t }=useI18n(); const isMyWorkActive=activePresets.has('my-work'); return <Card><CardContent className="text-center py-12"><Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4"/><h3 className="text-lg font-semibold mb-2">{t('workOrders.list.noWorkOrdersFound')}</h3><p className="text-muted-foreground mb-4">{hasActiveFilters ? isMyWorkActive ? t('workOrders.list.noWorkAssigned') : t('workOrders.list.noFilterMatches') : t('workOrders.list.createFirst')}</p>{!hasActiveFilters&&<Button onClick={onCreateClick}><Plus className="h-4 w-4 mr-2"/>{t('workOrders.list.createWorkOrder')}</Button>}</CardContent></Card>; };
