import { vi } from 'vitest';
import type * as useWorkOrderDetailsDataModule from '@/features/work-orders/components/hooks/useWorkOrderDetailsData';
import type * as useWorkOrderDetailsActionsModule from '@/features/work-orders/hooks/useWorkOrderDetailsActions';
import type { EquipmentWithTeam } from '@/features/equipment/services/EquipmentService';
import type { WorkOrder } from '@/features/work-orders/types/workOrder';

export const defaultWorkOrderDetailsDataMock = {
  // Only the fields the components under test actually read are set; the rest
  // of the real `work_orders` row shape (acceptance/completion timestamps,
  // cost fields, etc.) is irrelevant to these tests.
  workOrder: {
    id: 'wo-1',
    title: 'Replace hydraulic line',
    description: 'Repair leak',
    status: 'submitted',
    priority: 'medium',
    created_date: '2024-01-01T00:00:00Z',
    due_date: null,
    equipment_id: 'eq-1',
    has_pm: false,
    teamName: undefined,
    assigneeName: undefined,
    effectiveLocation: null,
  } as WorkOrder,
  // Only the fields the components under test actually read are set; the rest
  // of the real `equipment` row shape (timestamps, location coordinates, etc.)
  // is irrelevant to these tests.
  equipment: {
    id: 'eq-1',
    name: 'Excavator 1',
    manufacturer: 'Caterpillar',
    model: '320',
    serial_number: 'SN-0001',
    status: 'active',
    location: 'Warehouse A',
    team_id: 'team-1',
    custom_attributes: null,
    image_url: null,
    default_pm_template_id: null,
  } as EquipmentWithTeam,
  pmData: undefined,
  workOrderLoading: false,
  pmLoading: false,
  pmError: false,
  permissionLevels: {
    isManager: false,
    isTechnician: false,
    isRequestor: true,
    canEdit: false,
    canDelete: false,
    canAssign: false,
    canChangeStatus: false,
    canAddNotes: false,
    canAddImages: false,
    exportAudience: 'none',
    getFormMode: () => 'requestor',
  },
  formMode: 'requestor' as const,
  isWorkOrderLocked: false,
  canAddCosts: false,
  canEditCosts: false,
  canViewWorkOrderCosts: false,
  canAddNotes: false,
  canUsePrivateNotes: false,
  canUpload: false,
  canEdit: false,
  baseCanAddNotes: false,
  currentOrganization: {
    id: 'org-1',
    name: 'Test Org',
    plan: 'free',
    memberCount: 1,
    maxMembers: 5,
    features: [],
    scanLocationCollectionEnabled: false,
    userRole: 'owner',
    userStatus: 'active',
  },
} satisfies Partial<ReturnType<typeof useWorkOrderDetailsDataModule.useWorkOrderDetailsData>>;

export const defaultWorkOrderDetailsActionsMock = {
  isEditFormOpen: false,
  showMobileSidebar: false,
  setShowMobileSidebar: vi.fn(),
  handleEditWorkOrder: vi.fn(),
  handleCloseEditForm: vi.fn(),
  handleUpdateWorkOrder: vi.fn(),
  handleStatusUpdate: vi.fn(),
  handlePMUpdate: vi.fn(),
  showPMWarning: false,
  setShowPMWarning: vi.fn(),
  pmChangeType: undefined,
  handleConfirmPMChange: vi.fn(),
  handleCancelPMChange: vi.fn(),
  getPMDataDetails: () => ({ hasNotes: false, hasCompletedItems: false }),
  isUpdating: false,
} satisfies Partial<ReturnType<typeof useWorkOrderDetailsActionsModule.useWorkOrderDetailsActions>>;

type WorkOrderDetailsDataResult = ReturnType<typeof useWorkOrderDetailsDataModule.useWorkOrderDetailsData>;

// The hook's real return type has fully-shaped nested objects (workOrder,
// equipment, pmData, permissionLevels). `Partial<WorkOrderDetailsDataResult>`
// only makes the top-level keys optional, so a test fixture that supplies a
// deliberately partial nested object (the common case here) would still be
// checked against the full nested interface. These per-field partials let
// call sites override just the fields a given test cares about; the merge
// logic below (unchanged) fills in the rest from the defaults.
type WorkOrderDetailsDataOverrides = Partial<
  Omit<WorkOrderDetailsDataResult, 'workOrder' | 'equipment' | 'pmData' | 'permissionLevels'>
> & {
  workOrder?: Partial<NonNullable<WorkOrderDetailsDataResult['workOrder']>>;
  equipment?: Partial<NonNullable<WorkOrderDetailsDataResult['equipment']>>;
  pmData?: Partial<NonNullable<WorkOrderDetailsDataResult['pmData']>> | null;
  permissionLevels?: Partial<WorkOrderDetailsDataResult['permissionLevels']>;
};

export function createWorkOrderDetailsDataMock(
  overrides: WorkOrderDetailsDataOverrides = {},
): WorkOrderDetailsDataResult {
  return {
    ...defaultWorkOrderDetailsDataMock,
    ...overrides,
    workOrder: {
      ...defaultWorkOrderDetailsDataMock.workOrder,
      ...(overrides.workOrder ?? {}),
    },
    equipment: overrides.equipment === undefined
      ? defaultWorkOrderDetailsDataMock.equipment
      : overrides.equipment,
    pmData: overrides.pmData === undefined
      ? defaultWorkOrderDetailsDataMock.pmData
      : overrides.pmData,
    permissionLevels: {
      ...defaultWorkOrderDetailsDataMock.permissionLevels,
      ...(overrides.permissionLevels ?? {}),
    },
  } as WorkOrderDetailsDataResult;
}

export function createManagerWorkOrderDetailsDataMock(
  overrides: WorkOrderDetailsDataOverrides = {},
): WorkOrderDetailsDataResult {
  return createWorkOrderDetailsDataMock({
    permissionLevels: {
      isManager: true,
      isTechnician: true,
      isRequestor: false,
      canEdit: true,
      canDelete: true,
      canAssign: true,
      canChangeStatus: true,
      canAddNotes: true,
      canAddImages: true,
      exportAudience: 'admin',
      getFormMode: () => 'manager',
    },
    formMode: 'manager',
    isWorkOrderLocked: false,
    canAddCosts: true,
    canEditCosts: true,
    canViewWorkOrderCosts: true,
    canAddNotes: true,
    canUsePrivateNotes: true,
    canUpload: true,
    canEdit: true,
    baseCanAddNotes: true,
    currentOrganization: {
      id: 'org-1',
      name: 'Test Org',
      plan: 'free',
      memberCount: 1,
      maxMembers: 5,
      features: [],
      scanLocationCollectionEnabled: false,
      userRole: 'owner',
      userStatus: 'active',
    },
    ...overrides,
  });
}

export function createWorkOrderDetailsActionsMock(
  overrides: Partial<ReturnType<typeof useWorkOrderDetailsActionsModule.useWorkOrderDetailsActions>> = {},
): ReturnType<typeof useWorkOrderDetailsActionsModule.useWorkOrderDetailsActions> {
  return {
    ...defaultWorkOrderDetailsActionsMock,
    ...overrides,
  } as ReturnType<typeof useWorkOrderDetailsActionsModule.useWorkOrderDetailsActions>;
}
