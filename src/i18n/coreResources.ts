export const coreResources = {
  en: {
    dashboardLoading: {
      authStatus: 'Checking authentication',
      authMessage: 'Verifying access before opening the dashboard.',
      securityStatus: 'Checking security requirements',
      securityMessage: 'Verifying security requirements before opening the dashboard.',
      workspaceStatus: 'Checking workspace access',
      workspaceMessage: 'Checking workspace access before opening the dashboard.',
      onboardingStatus: 'Checking onboarding status',
      onboardingMessage: 'Checking onboarding status before opening the dashboard.',
    },
    breadcrumb: {
      dashboard: 'Dashboard', scanQr: 'Scan QR', equipment: 'Equipment', workOrders: 'Work Orders', fleetMap: 'Fleet Map', inventory: 'Inventory', partLookup: 'Part Lookup', partAlternates: 'Part Alternates', teams: 'Teams', settings: 'Settings', members: 'Members', integrations: 'Integrations', pmTemplates: 'PM Templates', newPmTemplate: 'New PM Template', editPmTemplate: 'Edit PM Template', dailyCheckIns: 'Daily Check-Ins', reports: 'Reports', auditLog: 'Audit Log', supportTickets: 'Support & tickets', switchTeam: 'Switch team', switchTeamCurrent: 'Switch team (current: {{name}})', createNewTeam: 'Create new team', allTeams: 'All teams', unassigned: 'Unassigned',
    },
  },
  vi: {
    dashboardLoading: {
      authStatus: 'Đang kiểm tra đăng nhập',
      authMessage: 'Đang xác minh quyền truy cập trước khi mở trang tổng quan.',
      securityStatus: 'Đang kiểm tra yêu cầu bảo mật',
      securityMessage: 'Đang xác minh yêu cầu bảo mật trước khi mở trang tổng quan.',
      workspaceStatus: 'Đang kiểm tra quyền truy cập không gian làm việc',
      workspaceMessage: 'Đang kiểm tra quyền truy cập không gian làm việc trước khi mở trang tổng quan.',
      onboardingStatus: 'Đang kiểm tra trạng thái thiết lập',
      onboardingMessage: 'Đang kiểm tra trạng thái thiết lập trước khi mở trang tổng quan.',
    },
    breadcrumb: {
      dashboard: 'Tổng quan', scanQr: 'Quét QR', equipment: 'Danh sách thiết bị', workOrders: 'Lệnh công việc', fleetMap: 'Bản đồ thiết bị', inventory: 'Kho vật tư', partLookup: 'Tra cứu linh kiện', partAlternates: 'Linh kiện thay thế', teams: 'Nhóm', settings: 'Cài đặt', members: 'Thành viên', integrations: 'Tích hợp', pmTemplates: 'Mẫu bảo trì định kỳ', newPmTemplate: 'Mẫu bảo trì mới', editPmTemplate: 'Chỉnh sửa mẫu bảo trì', dailyCheckIns: 'Kiểm tra hằng ngày', reports: 'Báo cáo', auditLog: 'Nhật ký kiểm toán', supportTickets: 'Hỗ trợ & yêu cầu', switchTeam: 'Chuyển nhóm', switchTeamCurrent: 'Chuyển nhóm (hiện tại: {{name}})', createNewTeam: 'Tạo nhóm mới', allTeams: 'Tất cả nhóm', unassigned: 'Chưa phân nhóm',
    },
  },
  ko: {
    dashboardLoading: {
      authStatus: '로그인 확인 중',
      authMessage: '대시보드를 열기 전에 접근 권한을 확인하고 있습니다.',
      securityStatus: '보안 요구사항 확인 중',
      securityMessage: '대시보드를 열기 전에 보안 요구사항을 확인하고 있습니다.',
      workspaceStatus: '워크스페이스 접근 권한 확인 중',
      workspaceMessage: '대시보드를 열기 전에 워크스페이스 접근 권한을 확인하고 있습니다.',
      onboardingStatus: '초기 설정 상태 확인 중',
      onboardingMessage: '대시보드를 열기 전에 초기 설정 상태를 확인하고 있습니다.',
    },
    breadcrumb: {
      dashboard: '대시보드', scanQr: 'QR 스캔', equipment: '설비', workOrders: '작업 지시', fleetMap: '설비 지도', inventory: '재고', partLookup: '부품 조회', partAlternates: '대체 부품', teams: '팀', settings: '설정', members: '구성원', integrations: '연동', pmTemplates: '예방정비 템플릿', newPmTemplate: '새 예방정비 템플릿', editPmTemplate: '예방정비 템플릿 수정', dailyCheckIns: '일일 점검', reports: '보고서', auditLog: '감사 로그', supportTickets: '지원 및 문의', switchTeam: '팀 전환', switchTeamCurrent: '팀 전환 (현재: {{name}})', createNewTeam: '새 팀 만들기', allTeams: '전체 팀', unassigned: '미지정',
    },
  },
} as const;
