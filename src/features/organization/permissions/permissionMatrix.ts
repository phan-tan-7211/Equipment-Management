import type { Language } from '@/i18n';

/**
 * Read-only organization permission matrix (step 1).
 *
 * Mirrors the enforced rules documented in docs/guides/permissions.md. Keep
 * both in sync: this table describes current behavior, it does not grant or
 * restrict anything by itself.
 */

export const PERMISSION_MATRIX_ROLES = ['owner', 'admin', 'member', 'manager', 'technician', 'requestor', 'viewer'] as const;
export type PermissionMatrixRole = (typeof PERMISSION_MATRIX_ROLES)[number];
export const ORGANIZATION_LEVEL_ROLES: readonly PermissionMatrixRole[] = ['owner', 'admin', 'member'];

/** yes = allowed, no = denied, limited = allowed with a scope restriction (see note). */
export type PermissionCell = 'yes' | 'no' | 'limited';
export type PermissionNoteId = 'adminNotOwner' | 'managedTeamsOnly' | 'teamScopedCreate' | 'statusAndMaintenance' | 'assignedOnly' | 'relevantOnly';

type Cells = Record<PermissionMatrixRole, PermissionCell>;

export type PermissionMatrixRow = {
  id: PermissionActionId;
  cells: Cells;
  note?: PermissionNoteId;
};

export type PermissionMatrixSection = {
  id: PermissionSectionId;
  rows: PermissionMatrixRow[];
};

const row = (id: PermissionActionId, values: string, note?: PermissionNoteId): PermissionMatrixRow => {
  const codes = values.split(' ');
  const cells = Object.fromEntries(
    PERMISSION_MATRIX_ROLES.map((role, index) => [role, codes[index] === 'y' ? 'yes' : codes[index] === 'l' ? 'limited' : 'no']),
  ) as Cells;
  return note ? { id, cells, note } : { id, cells };
};

// Column order: owner admin member manager technician requestor viewer
export const PERMISSION_MATRIX: PermissionMatrixSection[] = [
  {
    id: 'organization',
    rows: [
      row('createOrganization', 'y n n n n n n'),
      row('updateOrganizationSettings', 'y y n n n n n'),
      row('deleteOrganization', 'y n n n n n n'),
      row('viewOrganization', 'y y y y y y y'),
    ],
  },
  {
    id: 'members',
    rows: [
      row('inviteMembers', 'y y n n n n n'),
      row('removeMembers', 'y y n n n n n'),
      row('changeMemberRoles', 'y l n n n n n', 'adminNotOwner'),
      row('viewMemberList', 'y y y y y y y'),
    ],
  },
  {
    id: 'teams',
    rows: [
      row('createTeams', 'y y n n n n n'),
      row('updateTeams', 'y y n l n n n', 'managedTeamsOnly'),
      row('manageTeamMembers', 'y y n l n n n', 'managedTeamsOnly'),
      row('viewTeams', 'y y y y y y y'),
    ],
  },
  {
    id: 'equipment',
    rows: [
      row('createEquipment', 'y y n l l n n', 'teamScopedCreate'),
      row('updateEquipment', 'y y n y l n n', 'statusAndMaintenance'),
      row('deleteEquipment', 'y y n y n n n'),
      row('viewEquipment', 'y y y y y y y'),
      row('generateQrCodes', 'y y n y y n n'),
      row('scanQrCodes', 'y y y y y y y'),
    ],
  },
  {
    id: 'workOrders',
    rows: [
      row('createWorkOrders', 'y y y y y y n'),
      row('updateWorkOrderStatus', 'y y n y l n n', 'assignedOnly'),
      row('assignWorkOrders', 'y y n y n n n'),
      row('completeWorkOrders', 'y y n y l n n', 'assignedOnly'),
      row('cancelWorkOrders', 'y y n y n n n'),
      row('deleteWorkOrders', 'y y n y n n n'),
      row('reopenWorkOrders', 'y y n n n n n'),
      row('viewWorkOrders', 'y y l y l l l', 'relevantOnly'),
    ],
  },
  {
    id: 'inventory',
    rows: [
      row('viewInventory', 'y y n n n n n'),
      row('manageInventory', 'y y n n n n n'),
      row('viewWorkOrderCosts', 'y y n y y n n'),
    ],
  },
  {
    id: 'audit',
    rows: [row('viewAuditLog', 'y y n n n n n')],
  },
];

export type PermissionSectionId = 'organization' | 'members' | 'teams' | 'equipment' | 'workOrders' | 'inventory' | 'audit';
export type PermissionActionId =
  | 'createOrganization' | 'updateOrganizationSettings' | 'deleteOrganization' | 'viewOrganization'
  | 'inviteMembers' | 'removeMembers' | 'changeMemberRoles' | 'viewMemberList'
  | 'createTeams' | 'updateTeams' | 'manageTeamMembers' | 'viewTeams'
  | 'createEquipment' | 'updateEquipment' | 'deleteEquipment' | 'viewEquipment' | 'generateQrCodes' | 'scanQrCodes'
  | 'createWorkOrders' | 'updateWorkOrderStatus' | 'assignWorkOrders' | 'completeWorkOrders' | 'cancelWorkOrders' | 'deleteWorkOrders' | 'reopenWorkOrders' | 'viewWorkOrders'
  | 'viewInventory' | 'manageInventory' | 'viewWorkOrderCosts'
  | 'viewAuditLog';

type PermissionMatrixCopy = {
  title: string;
  description: string;
  readOnlyNotice: string;
  accessDenied: string;
  adminOnly: string;
  noOrganization: string;
  searchAria: string;
  searchPlaceholder: string;
  noMatches: string;
  actionColumn: string;
  organizationRoles: string;
  teamRoles: string;
  legendYes: string;
  legendNo: string;
  legendLimited: string;
  inventoryGrantNote: string;
  roles: Record<PermissionMatrixRole, string>;
  sections: Record<PermissionSectionId, string>;
  actions: Record<PermissionActionId, string>;
  notes: Record<PermissionNoteId, string>;
};

const en: PermissionMatrixCopy = {
  title: 'Permission matrix',
  description: 'What each organization and team role can do in this workspace.',
  readOnlyNotice: 'This matrix shows the permissions currently enforced. Custom permissions are not available yet.',
  accessDenied: 'Access denied',
  adminOnly: 'Only organization owners and admins can view the permission matrix.',
  noOrganization: 'Choose an organization to view its permission matrix.',
  searchAria: 'Search permissions',
  searchPlaceholder: 'Search permissions',
  noMatches: 'No permissions match your search.',
  actionColumn: 'Permission',
  organizationRoles: 'Organization roles',
  teamRoles: 'Team roles',
  legendYes: 'Allowed',
  legendNo: 'Not allowed',
  legendLimited: 'Allowed with limits',
  inventoryGrantNote: 'Inventory access for other people is granted separately with Parts Manager or Parts Consumer access.',
  roles: { owner: 'Owner', admin: 'Admin', member: 'Member', manager: 'Manager', technician: 'Technician', requestor: 'Requestor', viewer: 'Viewer' },
  sections: { organization: 'Organization', members: 'Members', teams: 'Teams', equipment: 'Equipment', workOrders: 'Work orders', inventory: 'Inventory and costs', audit: 'Audit log' },
  actions: {
    createOrganization: 'Create organization', updateOrganizationSettings: 'Update organization settings', deleteOrganization: 'Delete organization', viewOrganization: 'View organization details',
    inviteMembers: 'Invite members', removeMembers: 'Remove members', changeMemberRoles: 'Change member roles', viewMemberList: 'View member list',
    createTeams: 'Create teams', updateTeams: 'Update or delete teams', manageTeamMembers: 'Add or remove team members', viewTeams: 'View teams',
    createEquipment: 'Create equipment', updateEquipment: 'Update equipment', deleteEquipment: 'Delete equipment', viewEquipment: 'View equipment', generateQrCodes: 'Generate QR codes', scanQrCodes: 'Scan QR codes',
    createWorkOrders: 'Create work orders', updateWorkOrderStatus: 'Update work order status', assignWorkOrders: 'Assign work orders', completeWorkOrders: 'Complete work orders', cancelWorkOrders: 'Cancel work orders', deleteWorkOrders: 'Delete work orders', reopenWorkOrders: 'Reopen completed or cancelled work orders', viewWorkOrders: 'View work orders',
    viewInventory: 'View inventory and part lookup', manageInventory: 'Manage inventory', viewWorkOrderCosts: 'View work order costs and labor',
    viewAuditLog: 'View audit log',
  },
  notes: {
    adminNotOwner: 'Admins cannot change the owner role or promote someone to owner.',
    managedTeamsOnly: 'Only for teams where the person is a manager.',
    teamScopedCreate: 'Only for teams where the person is a manager or technician.',
    statusAndMaintenance: 'Limited to status updates and maintenance records.',
    assignedOnly: 'Only work orders assigned to the person.',
    relevantOnly: 'Only relevant work orders: assigned, created by the person, or related to their teams.',
  },
};

const vi: PermissionMatrixCopy = {
  title: 'Ma trận quyền',
  description: 'Những gì mỗi vai trò tổ chức và vai trò nhóm được làm trong không gian làm việc này.',
  readOnlyNotice: 'Bảng này hiển thị các quyền đang được áp dụng. Chưa hỗ trợ tùy chỉnh quyền.',
  accessDenied: 'Không có quyền truy cập',
  adminOnly: 'Chỉ chủ sở hữu và quản trị viên tổ chức mới xem được ma trận quyền.',
  noOrganization: 'Hãy chọn một tổ chức để xem ma trận quyền.',
  searchAria: 'Tìm quyền',
  searchPlaceholder: 'Tìm quyền',
  noMatches: 'Không có quyền nào khớp với từ khóa.',
  actionColumn: 'Quyền',
  organizationRoles: 'Vai trò tổ chức',
  teamRoles: 'Vai trò nhóm',
  legendYes: 'Được phép',
  legendNo: 'Không được phép',
  legendLimited: 'Được phép có giới hạn',
  inventoryGrantNote: 'Quyền kho vật tư cho người khác được cấp riêng qua quyền Quản lý linh kiện hoặc Sử dụng linh kiện.',
  roles: { owner: 'Chủ sở hữu', admin: 'Quản trị viên', member: 'Thành viên', manager: 'Quản lý', technician: 'Kỹ thuật viên', requestor: 'Người yêu cầu', viewer: 'Người xem' },
  sections: { organization: 'Tổ chức', members: 'Thành viên', teams: 'Nhóm', equipment: 'Thiết bị', workOrders: 'Lệnh công việc', inventory: 'Kho vật tư và chi phí', audit: 'Nhật ký kiểm toán' },
  actions: {
    createOrganization: 'Tạo tổ chức', updateOrganizationSettings: 'Cập nhật cài đặt tổ chức', deleteOrganization: 'Xóa tổ chức', viewOrganization: 'Xem thông tin tổ chức',
    inviteMembers: 'Mời thành viên', removeMembers: 'Xóa thành viên', changeMemberRoles: 'Đổi vai trò thành viên', viewMemberList: 'Xem danh sách thành viên',
    createTeams: 'Tạo nhóm', updateTeams: 'Sửa hoặc xóa nhóm', manageTeamMembers: 'Thêm hoặc bớt thành viên nhóm', viewTeams: 'Xem nhóm',
    createEquipment: 'Tạo thiết bị', updateEquipment: 'Cập nhật thiết bị', deleteEquipment: 'Xóa thiết bị', viewEquipment: 'Xem thiết bị', generateQrCodes: 'Tạo mã QR', scanQrCodes: 'Quét mã QR',
    createWorkOrders: 'Tạo lệnh công việc', updateWorkOrderStatus: 'Cập nhật trạng thái lệnh công việc', assignWorkOrders: 'Giao lệnh công việc', completeWorkOrders: 'Hoàn thành lệnh công việc', cancelWorkOrders: 'Hủy lệnh công việc', deleteWorkOrders: 'Xóa lệnh công việc', reopenWorkOrders: 'Mở lại lệnh đã hoàn thành hoặc đã hủy', viewWorkOrders: 'Xem lệnh công việc',
    viewInventory: 'Xem kho vật tư và tra cứu linh kiện', manageInventory: 'Quản lý kho vật tư', viewWorkOrderCosts: 'Xem chi phí và giờ công lệnh công việc',
    viewAuditLog: 'Xem nhật ký kiểm toán',
  },
  notes: {
    adminNotOwner: 'Quản trị viên không thể đổi vai trò chủ sở hữu hoặc nâng ai đó lên chủ sở hữu.',
    managedTeamsOnly: 'Chỉ với nhóm mà người đó là quản lý.',
    teamScopedCreate: 'Chỉ với nhóm mà người đó là quản lý hoặc kỹ thuật viên.',
    statusAndMaintenance: 'Chỉ cập nhật trạng thái và hồ sơ bảo trì.',
    assignedOnly: 'Chỉ lệnh công việc được giao cho người đó.',
    relevantOnly: 'Chỉ lệnh liên quan: được giao, do người đó tạo, hoặc thuộc nhóm của họ.',
  },
};

const ko: PermissionMatrixCopy = {
  title: '권한 매트릭스',
  description: '이 워크스페이스에서 각 조직 역할과 팀 역할이 할 수 있는 작업입니다.',
  readOnlyNotice: '현재 적용 중인 권한을 보여줍니다. 권한 사용자 지정은 아직 지원되지 않습니다.',
  accessDenied: '접근 거부',
  adminOnly: '조직 소유자와 관리자만 권한 매트릭스를 볼 수 있습니다.',
  noOrganization: '권한 매트릭스를 보려면 조직을 선택하세요.',
  searchAria: '권한 검색',
  searchPlaceholder: '권한 검색',
  noMatches: '검색과 일치하는 권한이 없습니다.',
  actionColumn: '권한',
  organizationRoles: '조직 역할',
  teamRoles: '팀 역할',
  legendYes: '허용',
  legendNo: '허용 안 됨',
  legendLimited: '제한적으로 허용',
  inventoryGrantNote: '다른 사용자의 재고 접근 권한은 부품 관리자 또는 부품 사용자 권한으로 별도 부여됩니다.',
  roles: { owner: '소유자', admin: '관리자', member: '구성원', manager: '매니저', technician: '기술자', requestor: '요청자', viewer: '조회자' },
  sections: { organization: '조직', members: '구성원', teams: '팀', equipment: '설비', workOrders: '작업 지시', inventory: '재고 및 비용', audit: '감사 로그' },
  actions: {
    createOrganization: '조직 생성', updateOrganizationSettings: '조직 설정 변경', deleteOrganization: '조직 삭제', viewOrganization: '조직 정보 보기',
    inviteMembers: '구성원 초대', removeMembers: '구성원 제거', changeMemberRoles: '구성원 역할 변경', viewMemberList: '구성원 목록 보기',
    createTeams: '팀 생성', updateTeams: '팀 수정 또는 삭제', manageTeamMembers: '팀 구성원 추가 또는 제거', viewTeams: '팀 보기',
    createEquipment: '설비 생성', updateEquipment: '설비 수정', deleteEquipment: '설비 삭제', viewEquipment: '설비 보기', generateQrCodes: 'QR 코드 생성', scanQrCodes: 'QR 코드 스캔',
    createWorkOrders: '작업 지시 생성', updateWorkOrderStatus: '작업 지시 상태 변경', assignWorkOrders: '작업 지시 배정', completeWorkOrders: '작업 지시 완료', cancelWorkOrders: '작업 지시 취소', deleteWorkOrders: '작업 지시 삭제', reopenWorkOrders: '완료 또는 취소된 작업 지시 다시 열기', viewWorkOrders: '작업 지시 보기',
    viewInventory: '재고 및 부품 조회 보기', manageInventory: '재고 관리', viewWorkOrderCosts: '작업 지시 비용 및 인건비 보기',
    viewAuditLog: '감사 로그 보기',
  },
  notes: {
    adminNotOwner: '관리자는 소유자 역할을 변경하거나 소유자로 승격할 수 없습니다.',
    managedTeamsOnly: '본인이 매니저인 팀에만 해당합니다.',
    teamScopedCreate: '본인이 매니저 또는 기술자인 팀에만 해당합니다.',
    statusAndMaintenance: '상태 변경과 정비 기록으로 제한됩니다.',
    assignedOnly: '본인에게 배정된 작업 지시만 해당합니다.',
    relevantOnly: '관련 작업 지시만 해당합니다: 배정됨, 본인이 생성함, 또는 본인 팀 관련.',
  },
};

export const permissionMatrixCopy: Record<Language, PermissionMatrixCopy> = { en, vi, ko };
