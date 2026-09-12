import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Clock } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { useEquipmentWorkOrders } from '@/features/equipment/hooks/useEquipment';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUnifiedPermissions } from '@/hooks/useUnifiedPermissions';
import WorkOrderForm from '@/features/work-orders/components/WorkOrderForm';
import MobileWorkOrderCard from './MobileWorkOrderCard';
import DesktopWorkOrderCard from '@/features/work-orders/components/DesktopWorkOrderCard';
import { HistoricalWorkOrderBadge } from '@/features/work-orders/components/HistoricalWorkOrderBadge';
import EquipmentPMInfo from './EquipmentPMInfo';
import { useI18n } from '@/i18n';

interface EquipmentWorkOrdersTabProps {
  equipmentId: string;
  organizationId: string;
  onCreateWorkOrder?: () => void;
  equipmentManufacturer?: string;
  equipmentModel?: string;
  equipmentSerialNumber?: string;
  /** Full equipment record; enables PM controls at the top of the tab (#1212). */
  equipment?: Tables<'equipment'>;
  assignedTeamName?: string | null;
}

const EquipmentWorkOrdersTab: React.FC<EquipmentWorkOrdersTabProps> = ({
  equipmentId,
  organizationId,
  onCreateWorkOrder,
  equipmentManufacturer,
  equipmentModel,
  equipmentSerialNumber,
  equipment,
  assignedTeamName,
}) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [showWorkOrderForm, setShowWorkOrderForm] = useState(false);
  const { data: workOrders = [], isLoading } = useEquipmentWorkOrders(organizationId, equipmentId);
  const isMobile = useIsMobile();
  const permissions = useUnifiedPermissions();
  const canEdit = equipment
    ? permissions.equipment.getPermissions(equipment.team_id || undefined).canEdit
    : false;

  const getCurrentTeamDisplay = useCallback(() => {
    if (assignedTeamName) {
      return assignedTeamName;
    }
    if (!equipment?.team_id) {
      return t('equipmentFinalize.unassigned');
    }
    return t('equipmentFinalize.unknownTeam');
  }, [assignedTeamName, equipment?.team_id, t]);

  const handleCreateWorkOrder = () => {
    if (onCreateWorkOrder) {
      onCreateWorkOrder();
    } else {
      setShowWorkOrderForm(true);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className={isMobile ? "p-4" : "pt-6"}>
              <div className={`bg-muted animate-pulse rounded ${isMobile ? 'h-20' : 'h-24'}`} />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {equipment ? (
        <EquipmentPMInfo
          equipment={equipment}
          canEdit={canEdit}
          getCurrentTeamDisplay={getCurrentTeamDisplay}
          onCreateWorkOrder={onCreateWorkOrder ?? handleCreateWorkOrder}
        />
      ) : null}

      <div className={`flex items-center justify-between ${isMobile ? 'flex-col gap-3' : ''}`}>
        <div className={isMobile ? 'text-center' : ''}>
          <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>{t('equipmentFinalize.workOrdersTitle')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('equipmentFinalize.workOrderCount', { count: workOrders.length })}
          </p>
        </div>
        <Button onClick={handleCreateWorkOrder} size={isMobile ? 'sm' : 'default'} className={isMobile ? 'w-full' : ''}>
          <Plus className="h-4 w-4 mr-2" />
          {isMobile ? t('equipmentFinalize.create') : t('equipmentFinalize.createWorkOrder')}
        </Button>
      </div>

      <div className="space-y-4">
        {workOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('equipmentFinalize.noWorkOrders')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('equipmentFinalize.noWorkOrdersDescription')}
              </p>
              <Button onClick={handleCreateWorkOrder}>
                <Plus className="h-4 w-4 mr-2" />
                {t('equipmentFinalize.createFirstWorkOrder')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          workOrders.map((workOrder) => {
            const adaptedWorkOrder = {
              ...workOrder,
              equipmentId: workOrder.equipment_id || '',
              createdDate: workOrder.created_date,
              dueDate: workOrder.due_date,
              estimatedHours: workOrder.estimated_hours,
              completedDate: workOrder.completed_date,
              assigneeId: workOrder.assignee_id,
              teamId: undefined,
              equipmentManufacturer: workOrder.equipmentManufacturer ?? equipmentManufacturer,
              equipmentModel: workOrder.equipmentModel ?? equipmentModel,
              equipmentSerialNumber: workOrder.equipmentSerialNumber ?? equipmentSerialNumber,
            };

            return (
              <div key={workOrder.id} className="space-y-2">
                {workOrder.is_historical && (
                  <HistoricalWorkOrderBadge workOrder={workOrder} />
                )}
                {isMobile ? (
                  <MobileWorkOrderCard workOrder={adaptedWorkOrder} />
                ) : (
                  <DesktopWorkOrderCard
                    workOrder={adaptedWorkOrder}
                    onNavigate={(id) => navigate(`/dashboard/work-orders/${id}`)}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      <WorkOrderForm
        open={showWorkOrderForm}
        onClose={() => setShowWorkOrderForm(false)}
        equipmentId={equipmentId}
      />
    </div>
  );
};

export default EquipmentWorkOrdersTab;
