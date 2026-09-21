import React from 'react';
import {
  Navigate,
  BulkEditOfflinePanel,
  useBrowserOnline,
  BulkEditBackButton,
  Page,
  PageHeader,
  useOrganization,
  usePermissions,
  useIsMobile,
  BulkCommitToolbar,
} from '@/components/bulk-edit/bulkEditPageImports';
import { useEquipmentFiltering } from '@/features/equipment/hooks/useEquipmentFiltering';
import { useBulkEditEquipment } from '@/features/equipment/hooks/useBulkEditEquipment';
import EquipmentLoadingState from '@/features/equipment/components/EquipmentLoadingState';
import { BulkEquipmentGrid } from '../components/BulkEquipmentGrid';
import { useI18n } from '@/i18n';
import type { EquipmentRecord } from '@/features/equipment/types/equipment';

const BulkEquipment: React.FC = () => {
  const { currentOrganization } = useOrganization();
  const { canCreateEquipment, canCreateEquipmentForAnyTeam } = usePermissions();
  const isOnline = useBrowserOnline();
  const isMobile = useIsMobile();
  const { t } = useI18n();

  const {
    filteredAndSortedEquipment,
    isLoading,
  } = useEquipmentFiltering(currentOrganization?.id);

  const {
    dirtyRows,
    selectedRowIds,
    dirtyCount,
    selectedCount,
    isPending,
    setCellValue,
    setCellValueOnRows,
    clearDirty,
    toggleSelected,
    selectAll,
    clearSelection,
    commit,
  // filteredAndSortedEquipment is EquipmentWithTeam[] from
  // EquipmentService.ts (the paginated list query), a differently-declared
  // type from EquipmentRecord that happens to share the same field names
  // useBulkEditEquipment/BulkEquipmentGrid actually read.
  } = useBulkEditEquipment(filteredAndSortedEquipment as unknown as EquipmentRecord[]);

  if (isMobile) {
    return <Navigate to="/dashboard/equipment" replace />;
  }

  if (!currentOrganization) {
    return (
      <Page maxWidth="full" padding="workspace">
        <PageHeader
          title={t('equipmentBulk.title')}
          description={t('equipmentBulk.selectOrganization')}
          actions={<BulkEditBackButton to="/dashboard/equipment" />}
        />
      </Page>
    );
  }

  if (!canCreateEquipment() && !canCreateEquipmentForAnyTeam()) {
    return (
      <Page maxWidth="full" padding="workspace">
        <PageHeader
          title={t('equipmentBulk.title')}
          description={t('equipmentBulk.restricted')}
          actions={<BulkEditBackButton to="/dashboard/equipment" />}
        />
      </Page>
    );
  }

  if (!isOnline) {
    return (
      <Page maxWidth="full" padding="workspace">
        <PageHeader
          title={t('equipmentBulk.title')}
          actions={<BulkEditBackButton to="/dashboard/equipment" />}
        />
        <BulkEditOfflinePanel
          message={t('equipmentBulk.offlineMessage')}
          backHref="/dashboard/equipment"
          backLabel={t('equipmentBulk.backToEquipment')}
        />
      </Page>
    );
  }

  if (isLoading) {
    return (
      <Page maxWidth="full" padding="workspace">
        <EquipmentLoadingState />
      </Page>
    );
  }

  return (
    <Page maxWidth="full" padding="workspace">
      <div className="space-y-4 pb-4">
        <PageHeader
          title={t('equipmentBulk.title')}
          description={t('equipmentBulk.description', { name: currentOrganization.name })}
          hideDescriptionOnMobile
          actions={<BulkEditBackButton to="/dashboard/equipment" />}
        />

        <BulkEquipmentGrid
          rows={filteredAndSortedEquipment as unknown as EquipmentRecord[]}
          dirtyRows={dirtyRows}
          selectedRowIds={selectedRowIds}
          onSetCellValue={setCellValue}
          onSetCellValueOnRows={setCellValueOnRows}
          onToggleSelected={toggleSelected}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
        />

        <BulkCommitToolbar
          dirtyCount={dirtyCount}
          selectedCount={selectedCount}
          isPending={isPending}
          onDiscard={clearDirty}
          onCommit={() => {
            void commit();
          }}
        />
      </div>
    </Page>
  );
};

export default BulkEquipment;
