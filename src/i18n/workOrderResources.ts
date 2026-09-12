export const workOrderResources = {
  vi: {
    workOrders: {
      list: {
        title: 'Lệnh công việc',
        loading: 'Đang tải lệnh công việc theo nhóm...',
        pendingSync: 'Đang chờ đồng bộ',
        deleteAfterSync: 'Có thể xóa sau khi lệnh công việc đồng bộ xong.',
        noTeamAssignments: 'Bạn chưa được phân vào nhóm nào - hãy liên hệ quản trị viên để được cấp quyền',
        admin: 'Quản trị viên',
        team: '{{count}} nhóm',
        teams: '{{count}} nhóm',
        createWorkOrder: 'Tạo lệnh công việc',
        itemLabel: 'lệnh công việc',
        itemLabelPlural: 'lệnh công việc',
        createWorkOrderAria: 'Tạo lệnh công việc',
      },
    },
  },
  en: {
    workOrders: {
      list: {
        title: 'Work Orders',
        loading: 'Loading team-based work orders...',
        pendingSync: 'Pending sync',
        deleteAfterSync: 'Delete is available after the work order syncs.',
        noTeamAssignments: 'No team assignments - contact your administrator for access',
        admin: 'Admin',
        team: '{{count}} team',
        teams: '{{count}} teams',
        createWorkOrder: 'Create Work Order',
        itemLabel: 'work order',
        itemLabelPlural: 'work orders',
        createWorkOrderAria: 'Create work order',
      },
    },
  },
  ko: {
    workOrders: {
      list: {
        title: '작업 지시',
        loading: '팀 기반 작업 지시를 불러오는 중...',
        pendingSync: '동기화 대기 중',
        deleteAfterSync: '작업 지시가 동기화된 후 삭제할 수 있습니다.',
        noTeamAssignments: '배정된 팀이 없습니다. 액세스 권한은 관리자에게 문의하세요.',
        admin: '관리자',
        team: '{{count}}개 팀',
        teams: '{{count}}개 팀',
        createWorkOrder: '작업 지시 만들기',
        itemLabel: '작업 지시',
        itemLabelPlural: '작업 지시',
        createWorkOrderAria: '작업 지시 만들기',
      },
    },
  },
} as const;
