import React from 'react';
import { useNavigate } from 'react-router-dom';
import { handleKeyboardActivation } from '@/components/a11y/keyboard';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, MapPin, Calendar, Forklift, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { getEquipmentCardDisplayModel } from "@/features/equipment/utils/getEquipmentCardDisplayModel";
import { getEquipmentCardPmReadout } from "@/features/equipment/utils/getEquipmentCardPmReadout";
import { useUserSettings } from '@/hooks/useUserSettings';
import { getEquipmentStatusRailClass, getEquipmentStatusBackgroundTint } from "@/lib/status-colors";
import { PendingSyncBadge } from '@/features/offline-queue/components/PendingSyncBadge';
import PMStatusIndicator from './PMStatusIndicator';
import { EquipmentCardGridView } from './EquipmentCardGridView';
import { EquipmentCardWorkOrderMenu } from './EquipmentCardWorkOrderMenu';
import type { EquipmentPMStatus } from '@/features/equipment/hooks/useEquipmentPMStatus';
import type { MergedEquipment } from '@/features/equipment/hooks/useOfflineMergedEquipment';
import { isOfflineEquipmentId } from '@/features/equipment/hooks/useOfflineMergedEquipment';
import { toast } from 'sonner';
import { displayableImageSrc } from '@/services/imageUploadService';
import { getEquipmentViewTransitionStyle } from '@/features/equipment/transitions/equipmentViewTransitionNames';
import { useEquipmentCardTransition } from '@/features/equipment/transitions/useEquipmentCardTransition';
import { useI18n } from '@/i18n';

interface Equipment {
  id: string; name: string; manufacturer: string; model: string; serial_number: string; status: string; location: string;
  last_maintenance?: string; image_url?: string; default_pm_template_id?: string | null; working_hours?: number | null; team_name?: string;
  management_code?: string | null;
}
export type EquipmentViewMode = 'grid' | 'table';
export const EQUIPMENT_ABOVE_FOLD_IMAGE_COUNT = 6;
interface EquipmentCardProps { equipment: Equipment; onShowQRCode: (id: string) => void; viewMode?: EquipmentViewMode; pmStatus?: EquipmentPMStatus; listIndex?: number; }

const EquipmentCard: React.FC<EquipmentCardProps> = ({ equipment, onShowQRCode, viewMode = 'grid', pmStatus, listIndex = 0 }) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { beginTransition, activeEquipmentId } = useEquipmentCardTransition();
  const { settings } = useUserSettings();
  const display = getEquipmentCardDisplayModel(equipment, settings, t);
  const pmReadout = getEquipmentCardPmReadout(pmStatus, t);
  const statusRailClass = getEquipmentStatusRailClass(equipment.status);
  const statusTintClass = viewMode === 'grid' ? getEquipmentStatusBackgroundTint(equipment.status) : '';
  const imageLoading = listIndex < EQUIPMENT_ABOVE_FOLD_IMAGE_COUNT ? ('eager' as const) : ('lazy' as const);
  const resolvedImageSrc = displayableImageSrc(equipment.image_url);
  const isTransitionActive = activeEquipmentId === equipment.id;

  const pending = (description: string) => toast.info(t('equipment.pendingSync'), { description });
  const handleCardClick = () => {
    if (isOfflineEquipmentId(equipment.id)) return pending(t('equipment.pendingViewDescription'));
    void beginTransition({ equipmentId: equipment.id, to: `/dashboard/equipment/${equipment.id}` });
  };
  const handleQRClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOfflineEquipmentId(equipment.id)) return pending(t('equipment.pendingQrDescription'));
    onShowQRCode(equipment.id);
  };
  const handleQuickAction = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    if (isOfflineEquipmentId(equipment.id)) return pending(t('equipment.pendingActionDescription'));
    navigate(path);
  };

  return (
    <Card className={cn("min-w-0 w-full max-w-full overflow-hidden cursor-pointer cv-auto-lg","card-lift hover:shadow-lg transition-all duration-normal",statusRailClass && "relative",statusTintClass,viewMode === 'grid' && "flex flex-col md:h-full")}
      style={getEquipmentViewTransitionStyle('shell', isTransitionActive)} role="button" tabIndex={0} data-equipment-id={equipment.id}
      {...(isTransitionActive ? { 'data-equipment-transition-active': '' } : {})} onClick={handleCardClick}
      onKeyDown={(e) => { if (e.target !== e.currentTarget) return; handleKeyboardActivation(e, handleCardClick); }}>
      {statusRailClass ? <div className={cn('pointer-events-none absolute inset-y-0 left-0 z-10 w-1 rounded-l-lg', statusRailClass)} aria-hidden /> : null}
      <div className="md:hidden">
        <div className="grid min-w-0 grid-cols-[4.5rem_1fr_auto] gap-x-2.5 gap-y-0.5 p-3">
          <div className="row-span-5 self-center"><div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-muted" style={getEquipmentViewTransitionStyle('image', isTransitionActive)}>
            {resolvedImageSrc ? <img src={resolvedImageSrc} alt={display.imageAlt} className="absolute inset-0 h-full w-full object-cover" loading={imageLoading} decoding="async" onError={(e) => { e.currentTarget.src = display.imageFallbackSrc; }} /> : <div className="flex h-full w-full items-center justify-center"><Forklift className="h-[45%] w-[45%] text-muted-foreground/50" /></div>}
          </div></div>
          <div className="col-start-2 row-start-1 flex min-w-0 items-center gap-1.5"><span className="truncate text-sm font-semibold leading-tight" style={getEquipmentViewTransitionStyle('name', isTransitionActive)}>{equipment.name}</span>{(equipment as MergedEquipment)._isPendingSync && <PendingSyncBadge className="flex-shrink-0" />}</div>
          <div className="col-start-3 row-start-1"><Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -mr-1 text-muted-foreground hover:text-foreground" onClick={handleQRClick} aria-label={t('equipment.showQrFor', { name: equipment.name })}><QrCode className="h-4 w-4" /></Button></div>
          {equipment.management_code ? <div className="col-start-2 row-start-2 truncate font-mono text-[11px] text-muted-foreground">{equipment.management_code}</div> : null}
          <div className={`col-start-2 ${equipment.management_code ? 'row-start-3' : 'row-start-2'} flex min-w-0 items-center gap-1 text-xs text-muted-foreground`}><Calendar className="h-3 w-3 flex-shrink-0" /><span className="truncate font-tabular">{display.lastMaintenanceMobileDisplay}</span></div>
          <div className={`col-start-2 ${equipment.management_code ? 'row-start-4' : 'row-start-3'} flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5`}><PMStatusIndicator status={pmStatus} size="sm" /><span className="inline-flex flex-shrink-0 items-center gap-0.5 text-xs text-muted-foreground" style={getEquipmentViewTransitionStyle('hours', isTransitionActive)}><Clock className="h-3 w-3" />{display.workingHoursShortText}</span></div>
          <div className={`col-start-2 ${equipment.management_code ? 'row-start-5' : 'row-start-4'} flex min-w-0 items-center gap-1 text-xs text-muted-foreground`} style={getEquipmentViewTransitionStyle('location', isTransitionActive)}><MapPin className="h-3 w-3 flex-shrink-0" /><span className="truncate">{equipment.location}</span></div>
          <div className={`col-start-3 ${equipment.management_code ? 'row-start-5' : 'row-start-4'} self-end`}><EquipmentCardWorkOrderMenu equipmentId={equipment.id} pmStatus={pmStatus} onQuickAction={handleQuickAction} variant="icon" /></div>
        </div>
      </div>
      {viewMode === 'grid' && <EquipmentCardGridView equipment={equipment} display={display} pmReadout={pmReadout} pmStatus={pmStatus} isPendingSync={(equipment as MergedEquipment)._isPendingSync} onQRClick={handleQRClick} onQuickAction={handleQuickAction} imageLoading={imageLoading} isTransitionActive={isTransitionActive} />}
    </Card>
  );
};
export default EquipmentCard;
