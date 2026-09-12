import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, QrCode, MapPin, Calendar, Trash2, Clock, ChevronRight } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { getStatusColor } from '@/features/equipment/utils/equipmentHelpers';
import { useFormatTimestamp } from '@/hooks/useFormatTimestamp';
import { getEquipmentViewTransitionStyle } from '@/features/equipment/transitions/equipmentViewTransitionNames';
import { useEquipmentCardTransitionState } from '@/features/equipment/transitions/useEquipmentCardTransitionState';
import { useI18n } from '@/i18n';

type Equipment = Tables<'equipment'>;

interface MobileEquipmentHeaderProps {
  equipment: Equipment;
  onShowQRCode: () => void;
  canDelete?: boolean;
  onDelete?: () => void;
  onShowWorkingHours?: () => void;
}

const MobileEquipmentHeader: React.FC<MobileEquipmentHeaderProps> = ({
  equipment,
  onShowQRCode,
  canDelete = false,
  onDelete,
  onShowWorkingHours,
}) => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { formatDate } = useFormatTimestamp();
  const { activeEquipmentId } = useEquipmentCardTransitionState();
  const isTransitionActive = activeEquipmentId === equipment.id;
  const statusKey = equipment.status || 'active';
  const statusLabels: Record<string, string> = {
    active: t('equipmentList.active'),
    maintenance: t('equipmentList.maintenance'),
    inactive: t('equipmentList.inactive'),
    out_of_service: t('equipmentList.outOfService'),
  };
  const workingHours = equipment.working_hours?.toLocaleString() || '0';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard/equipment')}
          className="min-h-[44px] -ml-2 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('equipment.title')}
        </Button>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="min-h-[44px] px-3" onClick={onShowQRCode} aria-label={t('equipment.showQrCode')}>
            <QrCode className="h-4 w-4" />
          </Button>
          {canDelete && onDelete && (
            <Button size="sm" variant="destructive" className="min-h-[44px] px-3" onClick={onDelete} aria-label={t('equipment.deleteEquipment')}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1
            className="text-2xl font-bold leading-tight"
            style={getEquipmentViewTransitionStyle('name', isTransitionActive)}
          >
            {equipment.name}
          </h1>
          <Badge className={`${getStatusColor(statusKey)} rounded-full px-2 py-0.5 text-xs`} variant="outline">
            {statusLabels[statusKey] ?? statusKey.replace(/_/g, ' ')}
          </Badge>
        </div>
        <div style={getEquipmentViewTransitionStyle('meta', isTransitionActive)}>
          <p className="text-sm text-muted-foreground">
            {equipment.manufacturer} {equipment.model}
          </p>
          <p className="text-sm text-muted-foreground">
            S/N: {equipment.serial_number}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {onShowWorkingHours && (
          <button
            type="button"
            onClick={onShowWorkingHours}
            aria-label={t('equipmentMobile.workingHoursAria', { count: workingHours })}
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors text-left w-full min-h-[44px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={getEquipmentViewTransitionStyle('hours', isTransitionActive)}
          >
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t('equipmentDetails.workingHours')}</p>
              <p className="text-sm text-muted-foreground">
                {t('equipmentDetails.hoursValue', { count: workingHours })}
                <span className="text-muted-foreground/80"> · {t('equipmentMobile.tapToLog')}</span>
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
          </button>
        )}

        <div
          className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
          style={getEquipmentViewTransitionStyle('location', isTransitionActive)}
        >
          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{t('equipment.location')}</p>
            <p className="text-sm text-muted-foreground truncate">{equipment.location}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{t('equipmentDetails.lastMaintenance')}</p>
            <p className="text-sm text-muted-foreground">
              {equipment.last_maintenance ? formatDate(equipment.last_maintenance) : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileEquipmentHeader;
