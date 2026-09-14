import type { Language } from '@/i18n/I18nProvider';

// Residual user-facing copy finalized for the 3.34.1 VI/EN/KO audit.
export const finalHardcodedAuditRemainingCopy = {
  en: {
    equipmentLocationUpdated: 'Equipment location updated successfully',
    noteTimestampUpdated: 'Note timestamp updated',
    noteTimestampUpdateFailed: 'Failed to update note timestamp',
    batchAssigned: 'Assigned {{count}} work order(s) to you',
    noUnassignedWorkOrders: 'No unassigned work orders found',
    batchAssignFailed: 'Failed to assign work orders',
    workOrderUpdatedTitle: 'Work Order Updated',
    workOrderUpdatedDescription: 'Work order has been successfully updated.',
    workOrderUpdateFailedTitle: 'Update Failed',
    workOrderUpdatePermission: "You don't have permission to update this work order. Contact your administrator.",
    workOrderUpdateNotFound: 'Work order not found. It may have been deleted.',
    workOrderUpdateValidation: 'Please check all required fields and try again.',
    workOrderUpdateFailed: 'Failed to update work order. Please check your connection and try again.',
    savedOfflineTitle: 'Saved offline',
    workOrderSyncLater: 'This work order will sync when your connection returns.',
    workOrderCreationFailedTitle: 'Work Order Creation Failed',
  },
  vi: {
    equipmentLocationUpdated: 'Đã cập nhật vị trí thiết bị',
    noteTimestampUpdated: 'Đã cập nhật thời gian ghi chú',
    noteTimestampUpdateFailed: 'Không thể cập nhật thời gian ghi chú',
    batchAssigned: 'Đã phân công {{count}} lệnh công việc cho bạn',
    noUnassignedWorkOrders: 'Không có lệnh công việc chưa được phân công',
    batchAssignFailed: 'Không thể phân công các lệnh công việc',
    workOrderUpdatedTitle: 'Đã cập nhật lệnh công việc',
    workOrderUpdatedDescription: 'Lệnh công việc đã được cập nhật thành công.',
    workOrderUpdateFailedTitle: 'Cập nhật thất bại',
    workOrderUpdatePermission: 'Bạn không có quyền cập nhật lệnh công việc này. Hãy liên hệ quản trị viên.',
    workOrderUpdateNotFound: 'Không tìm thấy lệnh công việc. Lệnh có thể đã bị xóa.',
    workOrderUpdateValidation: 'Hãy kiểm tra các trường bắt buộc và thử lại.',
    workOrderUpdateFailed: 'Không thể cập nhật lệnh công việc. Kiểm tra kết nối và thử lại.',
    savedOfflineTitle: 'Đã lưu ngoại tuyến',
    workOrderSyncLater: 'Lệnh công việc này sẽ đồng bộ khi kết nối được khôi phục.',
    workOrderCreationFailedTitle: 'Không thể tạo lệnh công việc',
  },
  ko: {
    equipmentLocationUpdated: '설비 위치가 업데이트되었습니다',
    noteTimestampUpdated: '메모 시간이 업데이트되었습니다',
    noteTimestampUpdateFailed: '메모 시간을 업데이트하지 못했습니다',
    batchAssigned: '{{count}}개의 작업 지시가 나에게 배정되었습니다',
    noUnassignedWorkOrders: '미배정 작업 지시가 없습니다',
    batchAssignFailed: '작업 지시를 배정하지 못했습니다',
    workOrderUpdatedTitle: '작업 지시 업데이트됨',
    workOrderUpdatedDescription: '작업 지시가 성공적으로 업데이트되었습니다.',
    workOrderUpdateFailedTitle: '업데이트 실패',
    workOrderUpdatePermission: '이 작업 지시를 업데이트할 권한이 없습니다. 관리자에게 문의하세요.',
    workOrderUpdateNotFound: '작업 지시를 찾을 수 없습니다. 삭제되었을 수 있습니다.',
    workOrderUpdateValidation: '필수 항목을 확인한 후 다시 시도해 주세요.',
    workOrderUpdateFailed: '작업 지시를 업데이트하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.',
    savedOfflineTitle: '오프라인 저장됨',
    workOrderSyncLater: '연결이 복구되면 이 작업 지시가 동기화됩니다.',
    workOrderCreationFailedTitle: '작업 지시 생성 실패',
  },
} as const;

export function getFinalHardcodedAuditRemainingCopy(language: Language) {
  return finalHardcodedAuditRemainingCopy[language];
}

export function formatRemainingCopy(template: string, params: Record<string, string | number>) {
  return template.replace(/{{\s*([^}\s]+)\s*}}/g, (_match, token: string) => {
    const value = params[token];
    return value === undefined ? `{{${token}}}` : String(value);
  });
}
