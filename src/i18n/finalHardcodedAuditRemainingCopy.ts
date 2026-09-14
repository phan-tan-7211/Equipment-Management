import type { Language } from '@/i18n/I18nProvider';

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
    workOrderUpdateFailed: 'Failed to update work order. Please check your connection and try again.',
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
    workOrderUpdateFailed: 'Không thể cập nhật lệnh công việc. Kiểm tra kết nối và thử lại.',
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
    workOrderUpdateFailed: '작업 지시를 업데이트하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.',
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
