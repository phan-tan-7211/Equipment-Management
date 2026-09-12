import { useMemo } from 'react';
import { ClipboardSignature, MessageSquarePlus, Plus, QrCode } from 'lucide-react';
import {
  QuickAccessDrawer,
  type QuickAccessSection,
} from '@/components/common/QuickAccessDrawer';
import { useEquipmentOperatorCheckinAssignments } from '@/features/operator-check-ins/hooks/useOperatorCheckinSettings';
import type { EquipmentQRVariant } from '@/features/equipment/components/QRCodeDisplay';
import { useI18n } from '@/i18n';

interface EquipmentQuickAccessDrawerProps {
  equipmentId: string;
  equipmentName: string;
  organizationId: string;
  onShowQrCode: (variant?: EquipmentQRVariant) => void;
  onCreateWorkOrder: () => void;
  onAddNote: () => void;
}

/**
 * Contextual quick access button for equipment details (issue #1151).
 * QR actions lead: the equipment scan QR plus a shortcut per enabled daily
 * check-in assignment, followed by work order creation and note capture.
 */
export function EquipmentQuickAccessDrawer({
  equipmentId,
  equipmentName,
  organizationId,
  onShowQrCode,
  onCreateWorkOrder,
  onAddNote,
}: EquipmentQuickAccessDrawerProps) {
  const { t } = useI18n();
  const { data: checkinAssignments = [] } = useEquipmentOperatorCheckinAssignments(
    equipmentId,
    organizationId,
  );

  const sections = useMemo<QuickAccessSection[]>(() => {
    const enabledAssignments = checkinAssignments.filter((assignment) => assignment.enabled);

    return [
      {
        id: 'qr-codes',
        title: t('equipmentFinalize.qrCodes'),
        actions: [
          {
            id: 'equipment-qr',
            label: t('equipmentFinalize.equipmentQrCode'),
            sublabel: t('equipmentFinalize.scanToOpenEquipment'),
            icon: QrCode,
            onSelect: () => onShowQrCode('equipment'),
          },
          ...enabledAssignments.map((assignment) => ({
            id: `checkin-qr-${assignment.id}`,
            label: t('equipmentFinalize.dailyCheckIn', { name: assignment.template?.name ?? t('equipmentFinalize.checklist') }),
            sublabel: t('equipmentFinalize.operatorCheckinQrCode'),
            icon: ClipboardSignature,
            onSelect: () => onShowQrCode(`assignment:${assignment.id}`),
          })),
        ],
      },
      {
        id: 'work-orders',
        title: t('equipmentFinalize.workOrders'),
        actions: [
          {
            id: 'new-work-order',
            label: t('equipmentFinalize.newWorkOrder'),
            icon: Plus,
            onSelect: onCreateWorkOrder,
          },
        ],
      },
      {
        id: 'notes',
        title: t('equipmentFinalize.notes'),
        actions: [
          {
            id: 'add-note',
            label: t('equipmentFinalize.addNote'),
            icon: MessageSquarePlus,
            onSelect: onAddNote,
          },
        ],
      },
    ];
  }, [checkinAssignments, onShowQrCode, onCreateWorkOrder, onAddNote, t]);

  return (
    <QuickAccessDrawer
      fabIcon={QrCode}
      fabAriaLabel={t('equipmentFinalize.quickActionsFor', { name: equipmentName })}
      title={equipmentName}
      description={t('equipmentFinalize.quickActionsDescription')}
      sections={sections}
    />
  );
}
