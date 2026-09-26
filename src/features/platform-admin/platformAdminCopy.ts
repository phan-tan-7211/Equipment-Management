import type { Language } from '@/i18n';

const en = {
  navigationGroup: 'Platform', title: 'Platform Administration', subtitle: 'Platform authority, separate from Organization roles', tenantDashboard: 'Tenant dashboard',
  organizations: 'Organizations', organizationsDescription: 'Lifecycle, ownership and initial owner delivery.', createOrganization: 'Create Organization',
  searchAria: 'Search organizations', searchPlaceholder: 'Search by organization name', filterLifecycle: 'Filter lifecycle', allStatuses: 'All statuses', active: 'Active', suspended: 'Suspended', pending: 'Pending',
  loadFailed: 'Organizations could not be loaded.', noMatches: 'No organizations match this view.', owner: 'Owner: {{name}} · {{email}}', ownerPending: 'Owner pending: {{email}}', noActiveOwner: 'No active owner',
  createDescription: 'Creates an empty Organization and a pending initial OWNER invitation. You do not become a member.', organizationName: 'Organization Name', initialOwnerEmail: 'Initial Owner Email', cancel: 'Cancel', create: 'Create',
  provisioningEmpty: 'Provisioning returned no organization', createSuccess: 'Organization created and owner invitation sent.', createEmailFailed: 'Organization created. Owner invitation is pending; email delivery failed and can be retried.', createFailed: 'Organization could not be created.',
  lifecycle: 'Lifecycle', created: 'Created {{date}}', currentOwner: 'Current Owner', organizationDetails: 'Organization details', organizationNotFound: 'Organization not found.',
  initialOwnerInvitation: 'Initial Owner Invitation', expires: 'Expires {{date}}', resend: 'Resend', resendSuccess: 'Owner invitation email resent.', resendFailed: 'Invitation was not resent. Refresh the organization state and try again.', invitationIneligible: 'Invitation is no longer eligible',
  ownershipNotice: 'Ownership transfer remains Owner-driven. The current OWNER can use the existing secure Organization workflow; Platform authority does not imply membership.', suspend: 'Suspend', reactivate: 'Reactivate',
  suspendedSuccess: 'Organization suspended.', reactivatedSuccess: 'Organization reactivated.', lifecycleRejected: 'The lifecycle action was rejected. Refresh and try again.',
  suspendTitle: 'Suspend Organization?', reactivateTitle: 'Reactivate Organization?', suspendDescription: 'Private Organization access will be blocked. Memberships and data are retained, reactivation remains possible, and public Equipment QR continues under its existing public contract.', reactivateDescription: 'Private Organization access will resume using the retained memberships and data.', confirm: 'Confirm',
  unavailable: 'Platform Administration unavailable', authorityRequired: 'Active Platform Admin authority is required.',
};

export type PlatformAdminCopy = typeof en;

const vi: PlatformAdminCopy = {
  navigationGroup: 'Nền tảng', title: 'Quản trị nền tảng', subtitle: 'Quyền quản trị nền tảng độc lập với vai trò trong tổ chức', tenantDashboard: 'Trang tổng quan tổ chức',
  organizations: 'Tổ chức', organizationsDescription: 'Vòng đời, quyền sở hữu và việc gửi lời mời chủ sở hữu ban đầu.', createOrganization: 'Tạo tổ chức',
  searchAria: 'Tìm kiếm tổ chức', searchPlaceholder: 'Tìm theo tên tổ chức', filterLifecycle: 'Lọc theo vòng đời', allStatuses: 'Tất cả trạng thái', active: 'Đang hoạt động', suspended: 'Đã tạm ngưng', pending: 'Đang chờ',
  loadFailed: 'Không thể tải danh sách tổ chức.', noMatches: 'Không có tổ chức phù hợp với chế độ xem này.', owner: 'Chủ sở hữu: {{name}} · {{email}}', ownerPending: 'Đang chờ chủ sở hữu: {{email}}', noActiveOwner: 'Chưa có chủ sở hữu đang hoạt động',
  createDescription: 'Tạo một tổ chức trống và lời mời CHỦ SỞ HỮU ban đầu đang chờ. Bạn không tự trở thành thành viên.', organizationName: 'Tên tổ chức', initialOwnerEmail: 'Email chủ sở hữu ban đầu', cancel: 'Hủy', create: 'Tạo',
  provisioningEmpty: 'Quá trình cấp phát không trả về tổ chức', createSuccess: 'Đã tạo tổ chức và gửi lời mời chủ sở hữu.', createEmailFailed: 'Đã tạo tổ chức. Lời mời chủ sở hữu đang chờ; gửi email thất bại và có thể thử lại.', createFailed: 'Không thể tạo tổ chức.',
  lifecycle: 'Vòng đời', created: 'Được tạo ngày {{date}}', currentOwner: 'Chủ sở hữu hiện tại', organizationDetails: 'Chi tiết tổ chức', organizationNotFound: 'Không tìm thấy tổ chức.',
  initialOwnerInvitation: 'Lời mời chủ sở hữu ban đầu', expires: 'Hết hạn {{date}}', resend: 'Gửi lại', resendSuccess: 'Đã gửi lại email mời chủ sở hữu.', resendFailed: 'Không thể gửi lại lời mời. Hãy làm mới trạng thái tổ chức và thử lại.', invitationIneligible: 'Lời mời không còn đủ điều kiện gửi lại',
  ownershipNotice: 'Việc chuyển quyền sở hữu vẫn do Chủ sở hữu thực hiện. CHỦ SỞ HỮU hiện tại có thể dùng quy trình bảo mật sẵn có của tổ chức; quyền quản trị nền tảng không đồng nghĩa với tư cách thành viên.', suspend: 'Tạm ngưng', reactivate: 'Kích hoạt lại',
  suspendedSuccess: 'Đã tạm ngưng tổ chức.', reactivatedSuccess: 'Đã kích hoạt lại tổ chức.', lifecycleRejected: 'Thao tác vòng đời bị từ chối. Hãy làm mới và thử lại.',
  suspendTitle: 'Tạm ngưng tổ chức?', reactivateTitle: 'Kích hoạt lại tổ chức?', suspendDescription: 'Quyền truy cập riêng tư vào tổ chức sẽ bị chặn. Thành viên và dữ liệu được giữ lại, vẫn có thể kích hoạt lại, và QR thiết bị công khai tiếp tục hoạt động theo quy tắc hiện tại.', reactivateDescription: 'Quyền truy cập riêng tư vào tổ chức sẽ được khôi phục với thành viên và dữ liệu đã giữ lại.', confirm: 'Xác nhận',
  unavailable: 'Không thể truy cập Quản trị nền tảng', authorityRequired: 'Bạn cần có quyền Platform Admin đang hoạt động.',
};

const ko: PlatformAdminCopy = {
  navigationGroup: '플랫폼', title: '플랫폼 관리', subtitle: '조직 역할과 분리된 플랫폼 권한', tenantDashboard: '조직 대시보드',
  organizations: '조직', organizationsDescription: '수명 주기, 소유권 및 최초 소유자 초대 전송을 관리합니다.', createOrganization: '조직 만들기',
  searchAria: '조직 검색', searchPlaceholder: '조직 이름으로 검색', filterLifecycle: '수명 주기 필터', allStatuses: '모든 상태', active: '활성', suspended: '일시 중지', pending: '대기 중',
  loadFailed: '조직을 불러올 수 없습니다.', noMatches: '이 보기에 해당하는 조직이 없습니다.', owner: '소유자: {{name}} · {{email}}', ownerPending: '소유자 대기 중: {{email}}', noActiveOwner: '활성 소유자 없음',
  createDescription: '빈 조직과 대기 중인 최초 소유자 초대를 만듭니다. 본인은 구성원이 되지 않습니다.', organizationName: '조직 이름', initialOwnerEmail: '최초 소유자 이메일', cancel: '취소', create: '만들기',
  provisioningEmpty: '프로비저닝 결과에 조직이 없습니다', createSuccess: '조직을 만들고 소유자 초대를 전송했습니다.', createEmailFailed: '조직을 만들었습니다. 소유자 초대가 대기 중이며 이메일 전송을 다시 시도할 수 있습니다.', createFailed: '조직을 만들 수 없습니다.',
  lifecycle: '수명 주기', created: '{{date}} 생성', currentOwner: '현재 소유자', organizationDetails: '조직 상세 정보', organizationNotFound: '조직을 찾을 수 없습니다.',
  initialOwnerInvitation: '최초 소유자 초대', expires: '{{date}} 만료', resend: '다시 보내기', resendSuccess: '소유자 초대 이메일을 다시 보냈습니다.', resendFailed: '초대를 다시 보내지 못했습니다. 조직 상태를 새로 고친 후 다시 시도하세요.', invitationIneligible: '초대를 더 이상 다시 보낼 수 없습니다',
  ownershipNotice: '소유권 이전은 계속 소유자가 수행합니다. 현재 소유자는 기존의 안전한 조직 절차를 사용할 수 있으며 플랫폼 권한은 조직 구성원 자격을 의미하지 않습니다.', suspend: '일시 중지', reactivate: '다시 활성화',
  suspendedSuccess: '조직을 일시 중지했습니다.', reactivatedSuccess: '조직을 다시 활성화했습니다.', lifecycleRejected: '수명 주기 작업이 거부되었습니다. 새로 고친 후 다시 시도하세요.',
  suspendTitle: '조직을 일시 중지할까요?', reactivateTitle: '조직을 다시 활성화할까요?', suspendDescription: '비공개 조직 접근이 차단됩니다. 구성원과 데이터는 유지되며 다시 활성화할 수 있고 공개 장비 QR은 기존 공개 규칙에 따라 계속 작동합니다.', reactivateDescription: '유지된 구성원과 데이터를 사용하여 비공개 조직 접근을 재개합니다.', confirm: '확인',
  unavailable: '플랫폼 관리를 사용할 수 없습니다', authorityRequired: '활성 플랫폼 관리자 권한이 필요합니다.',
};

export const platformAdminCopy: Record<Language, PlatformAdminCopy> = { en, vi, ko };

export function formatPlatformAdminCopy(template: string, values: Record<string, string>) {
  return template.replace(/{{\s*([^}\s]+)\s*}}/g, (_, key: string) => values[key] ?? `{{${key}}}`);
}
