import type { Language } from '@/i18n';

/**
 * Read-only organization permission matrix (step 1).
 *
 * Describes what the app currently allows each role to do. Keep in sync with
 * docs/guides/permissions.md. This table does not grant or restrict anything.
 */

export const PERMISSION_MATRIX_ROLES = ['owner', 'admin', 'member', 'manager', 'technician', 'requestor', 'viewer'] as const;
export type PermissionMatrixRole = (typeof PERMISSION_MATRIX_ROLES)[number];
export const ORGANIZATION_LEVEL_ROLES: readonly PermissionMatrixRole[] = ['owner', 'admin', 'member'];

/** yes = allowed, no = denied, limited = allowed with a scope restriction (see note). */
export type PermissionCell = 'yes' | 'no' | 'limited';
export type PermissionNoteId =
  | 'platformAdminOnly' | 'ownerTransferOnly' | 'ownTeamsOnly' | 'teamScopedCreate' | 'managedTeamsOnly'
  | 'assignedOnly' | 'managedTeamsListOnly' | 'assignedOrOwnRequest' | 'teamWorkOrdersOnly' | 'costsTeamOrAssigned';

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
// Values describe what the app currently lets each role do (verified against
// the UI gating and database functions, not just the docs).
export const PERMISSION_MATRIX: PermissionMatrixSection[] = [
  {
    id: 'organization',
    rows: [
      row('createOrganization', 'n n n n n n n', 'platformAdminOnly'),
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
      row('changeMemberRoles', 'y y n n n n n', 'ownerTransferOnly'),
      row('viewMemberList', 'y y y y y y y'),
    ],
  },
  {
    id: 'teams',
    rows: [
      row('createTeams', 'y y n n n n n'),
      row('updateTeams', 'y y n l n n n', 'managedTeamsOnly'),
      row('manageTeamMembers', 'y y n l n n n', 'managedTeamsOnly'),
      row('deleteTeams', 'y y n n n n n'),
      row('viewTeams', 'y y n l l l l', 'ownTeamsOnly'),
    ],
  },
  {
    id: 'equipment',
    rows: [
      row('createEquipment', 'y y n l l n n', 'teamScopedCreate'),
      row('updateEquipment', 'y y n l l n n', 'teamScopedCreate'),
      row('deleteEquipment', 'y y n n n n n'),
      row('viewEquipment', 'y y n l l l l', 'ownTeamsOnly'),
      row('generateQrCodes', 'y y n l l l l', 'ownTeamsOnly'),
      row('scanQrCodes', 'y y y y y y y'),
    ],
  },
  {
    id: 'workOrders',
    rows: [
      row('createWorkOrders', 'y y y y y y y'),
      row('updateWorkOrderStatus', 'y y n l l n n', 'assignedOnly'),
      row('assignWorkOrders', 'y y n l n n n', 'managedTeamsListOnly'),
      row('completeWorkOrders', 'y y n l l n n', 'assignedOnly'),
      row('cancelWorkOrders', 'y y l l l l l', 'assignedOrOwnRequest'),
      row('deleteWorkOrders', 'y y n n n n n'),
      row('reopenWorkOrders', 'y y n n n n n'),
      row('viewWorkOrders', 'y y n l l l l', 'teamWorkOrdersOnly'),
    ],
  },
  {
    id: 'inventory',
    rows: [
      row('viewInventory', 'y y n n n n n'),
      row('manageInventory', 'y y n n n n n'),
      row('viewWorkOrderCosts', 'y y l l l l l', 'costsTeamOrAssigned'),
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
  | 'createTeams' | 'updateTeams' | 'manageTeamMembers' | 'deleteTeams' | 'viewTeams'
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
  customTitle: string;
  customDescriptionOwner: string;
  customDescriptionAdmin: string;
  customReset: string;
  customChanged: string;
  customSaved: string;
  customSaveFailed: string;
  customLoadFailed: string;
  customFootnote: string;
  roles: Record<PermissionMatrixRole, string>;
  sections: Record<PermissionSectionId, string>;
  actions: Record<PermissionActionId, string>;
  notes: Record<PermissionNoteId, string>;
};

const en: PermissionMatrixCopy = {
  title: 'Permission matrix',
  description: 'What each organization and team role can do in this workspace.',
  readOnlyNotice: 'This matrix shows what each role can currently do. Organization viewers and requestors have the same organization-level permissions as members; their access to equipment and work orders comes from their team role. Some team permissions can be customized at the bottom of this page.',
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
  customTitle: 'Custom team permissions',
  customDescriptionOwner: 'Choose what each team role can do on its own teams. Changes apply immediately and are recorded in the audit log.',
  customDescriptionAdmin: 'Only the organization owner can change these settings.',
  customReset: 'Restore defaults',
  customChanged: 'Changed',
  customSaved: 'Permission updated.',
  customSaveFailed: 'Permission was not updated.',
  customLoadFailed: 'Custom permissions could not be loaded.',
  customFootnote: 'Owners and admins always have these permissions. The table above shows the defaults.',
  roles: { owner: 'Owner', admin: 'Admin', member: 'Member', manager: 'Manager', technician: 'Technician', requestor: 'Requestor', viewer: 'Viewer' },
  sections: { organization: 'Organization', members: 'Members', teams: 'Teams', equipment: 'Equipment', workOrders: 'Work orders', inventory: 'Inventory and costs', audit: 'Audit log' },
  actions: {
    createOrganization: 'Create organization', updateOrganizationSettings: 'Update organization settings', deleteOrganization: 'Delete organization', viewOrganization: 'View organization details',
    inviteMembers: 'Invite members', removeMembers: 'Remove members', changeMemberRoles: 'Change member roles', viewMemberList: 'View member list',
    createTeams: 'Create teams', updateTeams: 'Update team details', deleteTeams: 'Delete teams', manageTeamMembers: 'Add or remove team members', viewTeams: 'View teams',
    createEquipment: 'Create equipment', updateEquipment: 'Update equipment', deleteEquipment: 'Delete equipment', viewEquipment: 'View equipment', generateQrCodes: 'Generate QR codes', scanQrCodes: 'Scan QR codes',
    createWorkOrders: 'Create work orders', updateWorkOrderStatus: 'Update work order status', assignWorkOrders: 'Assign work orders', completeWorkOrders: 'Complete work orders', cancelWorkOrders: 'Cancel work orders', deleteWorkOrders: 'Delete work orders', reopenWorkOrders: 'Reopen completed or cancelled work orders', viewWorkOrders: 'View work orders',
    viewInventory: 'View inventory and part lookup', manageInventory: 'Manage inventory', viewWorkOrderCosts: 'View work order costs and labor',
    viewAuditLog: 'View audit log',
  },
  notes: {
    platformAdminOnly: 'New organizations are created by platform administrators.',
    ownerTransferOnly: 'Owners and admins can change other roles. The owner role changes only through an ownership transfer.',
    ownTeamsOnly: 'Only for teams the person belongs to.',
    teamScopedCreate: 'Only for teams where the person is a manager or technician.',
    managedTeamsOnly: 'Only for teams where the person is a manager.',
    assignedOnly: 'Only work orders assigned to the person.',
    managedTeamsListOnly: 'Only from the work order list, for teams where the person is a manager.',
    assignedOrOwnRequest: 'Only work orders assigned to the person, or requests they submitted that are still waiting.',
    teamWorkOrdersOnly: "Only work orders for the person's teams and their equipment.",
    costsTeamOrAssigned: "Team managers and technicians see costs on their team's work orders. Anyone sees costs on work orders assigned to them.",
  },
};

const vi: PermissionMatrixCopy = {
  title: 'Ma trận quyền',
  description: 'Những gì mỗi vai trò tổ chức và vai trò nhóm được làm trong không gian làm việc này.',
  readOnlyNotice: 'Bảng này cho biết mỗi vai trò hiện được làm gì. Người xem và người yêu cầu ở cấp tổ chức có quyền cấp tổ chức giống thành viên; quyền với thiết bị và lệnh công việc đến từ vai trò trong nhóm. Một số quyền của vai trò nhóm có thể tùy chỉnh ở cuối trang.',
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
  customTitle: 'Quyền tùy chỉnh theo vai trò nhóm',
  customDescriptionOwner: 'Chọn mỗi vai trò nhóm được làm gì trong nhóm của mình. Thay đổi có hiệu lực ngay và được ghi vào nhật ký kiểm toán.',
  customDescriptionAdmin: 'Chỉ chủ sở hữu tổ chức mới thay đổi được các thiết lập này.',
  customReset: 'Khôi phục mặc định',
  customChanged: 'Đã đổi',
  customSaved: 'Đã cập nhật quyền.',
  customSaveFailed: 'Không cập nhật được quyền.',
  customLoadFailed: 'Không tải được quyền tùy chỉnh.',
  customFootnote: 'Chủ sở hữu và quản trị viên luôn có các quyền này. Bảng phía trên hiển thị giá trị mặc định.',
  roles: { owner: 'Chủ sở hữu', admin: 'Quản trị viên', member: 'Thành viên', manager: 'Quản lý', technician: 'Kỹ thuật viên', requestor: 'Người yêu cầu', viewer: 'Người xem' },
  sections: { organization: 'Tổ chức', members: 'Thành viên', teams: 'Nhóm', equipment: 'Thiết bị', workOrders: 'Lệnh công việc', inventory: 'Kho vật tư và chi phí', audit: 'Nhật ký kiểm toán' },
  actions: {
    createOrganization: 'Tạo tổ chức', updateOrganizationSettings: 'Cập nhật cài đặt tổ chức', deleteOrganization: 'Xóa tổ chức', viewOrganization: 'Xem thông tin tổ chức',
    inviteMembers: 'Mời thành viên', removeMembers: 'Xóa thành viên', changeMemberRoles: 'Đổi vai trò thành viên', viewMemberList: 'Xem danh sách thành viên',
    createTeams: 'Tạo nhóm', updateTeams: 'Sửa thông tin nhóm', deleteTeams: 'Xóa nhóm', manageTeamMembers: 'Thêm hoặc bớt thành viên nhóm', viewTeams: 'Xem nhóm',
    createEquipment: 'Tạo thiết bị', updateEquipment: 'Cập nhật thiết bị', deleteEquipment: 'Xóa thiết bị', viewEquipment: 'Xem thiết bị', generateQrCodes: 'Tạo mã QR', scanQrCodes: 'Quét mã QR',
    createWorkOrders: 'Tạo lệnh công việc', updateWorkOrderStatus: 'Cập nhật trạng thái lệnh công việc', assignWorkOrders: 'Giao lệnh công việc', completeWorkOrders: 'Hoàn thành lệnh công việc', cancelWorkOrders: 'Hủy lệnh công việc', deleteWorkOrders: 'Xóa lệnh công việc', reopenWorkOrders: 'Mở lại lệnh đã hoàn thành hoặc đã hủy', viewWorkOrders: 'Xem lệnh công việc',
    viewInventory: 'Xem kho vật tư và tra cứu linh kiện', manageInventory: 'Quản lý kho vật tư', viewWorkOrderCosts: 'Xem chi phí và giờ công lệnh công việc',
    viewAuditLog: 'Xem nhật ký kiểm toán',
  },
  notes: {
    platformAdminOnly: 'Tổ chức mới do quản trị nền tảng tạo.',
    ownerTransferOnly: 'Chủ sở hữu và quản trị viên đổi được vai trò khác. Vai trò chủ sở hữu chỉ đổi qua chuyển quyền sở hữu.',
    ownTeamsOnly: 'Chỉ với nhóm mà người đó thuộc về.',
    teamScopedCreate: 'Chỉ với nhóm mà người đó là quản lý hoặc kỹ thuật viên.',
    managedTeamsOnly: 'Chỉ với nhóm mà người đó là quản lý.',
    assignedOnly: 'Chỉ lệnh công việc được giao cho người đó.',
    managedTeamsListOnly: 'Chỉ từ danh sách lệnh công việc, với nhóm mà người đó là quản lý.',
    assignedOrOwnRequest: 'Chỉ lệnh được giao cho người đó, hoặc yêu cầu do họ gửi còn đang chờ.',
    teamWorkOrdersOnly: 'Chỉ lệnh công việc của nhóm mình và thiết bị của nhóm đó.',
    costsTeamOrAssigned: 'Quản lý và kỹ thuật viên thấy chi phí lệnh của nhóm mình. Ai cũng thấy chi phí của lệnh được giao cho mình.',
  },
};

const ko: PermissionMatrixCopy = {
  title: '권한 매트릭스',
  description: '이 워크스페이스에서 각 조직 역할과 팀 역할이 할 수 있는 작업입니다.',
  readOnlyNotice: '각 역할이 현재 할 수 있는 작업을 보여줍니다. 조직 조회자와 요청자는 조직 수준에서 구성원과 같은 권한을 가지며, 설비와 작업 지시 접근 권한은 팀 역할에 따라 정해집니다. 일부 팀 역할 권한은 이 페이지 하단에서 사용자 지정할 수 있습니다.',
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
  customTitle: '팀 역할별 사용자 지정 권한',
  customDescriptionOwner: '각 팀 역할이 자신의 팀에서 할 수 있는 작업을 선택하세요. 변경 사항은 즉시 적용되며 감사 로그에 기록됩니다.',
  customDescriptionAdmin: '조직 소유자만 이 설정을 변경할 수 있습니다.',
  customReset: '기본값 복원',
  customChanged: '변경됨',
  customSaved: '권한이 업데이트되었습니다.',
  customSaveFailed: '권한을 업데이트하지 못했습니다.',
  customLoadFailed: '사용자 지정 권한을 불러오지 못했습니다.',
  customFootnote: '소유자와 관리자는 항상 이 권한을 가집니다. 위 표는 기본값을 보여줍니다.',
  roles: { owner: '소유자', admin: '관리자', member: '구성원', manager: '매니저', technician: '기술자', requestor: '요청자', viewer: '조회자' },
  sections: { organization: '조직', members: '구성원', teams: '팀', equipment: '설비', workOrders: '작업 지시', inventory: '재고 및 비용', audit: '감사 로그' },
  actions: {
    createOrganization: '조직 생성', updateOrganizationSettings: '조직 설정 변경', deleteOrganization: '조직 삭제', viewOrganization: '조직 정보 보기',
    inviteMembers: '구성원 초대', removeMembers: '구성원 제거', changeMemberRoles: '구성원 역할 변경', viewMemberList: '구성원 목록 보기',
    createTeams: '팀 생성', updateTeams: '팀 정보 수정', deleteTeams: '팀 삭제', manageTeamMembers: '팀 구성원 추가 또는 제거', viewTeams: '팀 보기',
    createEquipment: '설비 생성', updateEquipment: '설비 수정', deleteEquipment: '설비 삭제', viewEquipment: '설비 보기', generateQrCodes: 'QR 코드 생성', scanQrCodes: 'QR 코드 스캔',
    createWorkOrders: '작업 지시 생성', updateWorkOrderStatus: '작업 지시 상태 변경', assignWorkOrders: '작업 지시 배정', completeWorkOrders: '작업 지시 완료', cancelWorkOrders: '작업 지시 취소', deleteWorkOrders: '작업 지시 삭제', reopenWorkOrders: '완료 또는 취소된 작업 지시 다시 열기', viewWorkOrders: '작업 지시 보기',
    viewInventory: '재고 및 부품 조회 보기', manageInventory: '재고 관리', viewWorkOrderCosts: '작업 지시 비용 및 인건비 보기',
    viewAuditLog: '감사 로그 보기',
  },
  notes: {
    platformAdminOnly: '새 조직은 플랫폼 관리자가 생성합니다.',
    ownerTransferOnly: '소유자와 관리자는 다른 역할을 변경할 수 있습니다. 소유자 역할은 소유권 이전으로만 변경됩니다.',
    ownTeamsOnly: '본인이 속한 팀에만 해당합니다.',
    teamScopedCreate: '본인이 매니저 또는 기술자인 팀에만 해당합니다.',
    managedTeamsOnly: '본인이 매니저인 팀에만 해당합니다.',
    assignedOnly: '본인에게 배정된 작업 지시만 해당합니다.',
    managedTeamsListOnly: '작업 지시 목록에서만, 본인이 매니저인 팀에 해당합니다.',
    assignedOrOwnRequest: '본인에게 배정된 작업 지시 또는 본인이 제출해 대기 중인 요청만 해당합니다.',
    teamWorkOrdersOnly: '본인 팀과 해당 팀 설비의 작업 지시만 해당합니다.',
    costsTeamOrAssigned: '팀 매니저와 기술자는 팀 작업 지시의 비용을 봅니다. 누구나 본인에게 배정된 작업 지시의 비용을 봅니다.',
  },
};

export const permissionMatrixCopy: Record<Language, PermissionMatrixCopy> = { en, vi, ko };
