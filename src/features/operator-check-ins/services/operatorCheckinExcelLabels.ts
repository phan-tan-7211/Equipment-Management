import type { Language } from '@/i18n/I18nProvider';

const labels = {
  en: {
    title: 'Daily Operator Check-In Report', period: 'Report period', template: 'Report template', equipment: 'Equipment', submissions: 'Submissions', complete: 'Complete', incomplete: 'Incomplete', summary: 'Summary', serial: 'Serial number', submitted: 'Submitted at', requiredAnswered: 'Required answered', label: 'Label', source: 'Source', value: 'Value', section: 'Section', item: 'Item', required: 'Required', result: 'Result', notes: 'Notes', yes: 'Yes', no: 'No', pass: 'Pass', fail: 'Fail', checklist: 'Checklist', captured: 'Captured Fields', submittedSheet: 'Submissions', operatorInput: 'Operator input', equipmentSnapshot: 'Equipment snapshot', clientContext: 'Client context',
  },
  vi: {
    title: 'Báo cáo kiểm tra hằng ngày của người vận hành', period: 'Khoảng báo cáo', template: 'Mẫu báo cáo', equipment: 'Thiết bị', submissions: 'Số phiếu', complete: 'Hoàn thành', incomplete: 'Chưa hoàn thành', summary: 'Tóm tắt', serial: 'Số sê-ri', submitted: 'Thời điểm gửi', requiredAnswered: 'Mục bắt buộc đã trả lời', label: 'Nhãn', source: 'Nguồn', value: 'Giá trị', section: 'Nhóm', item: 'Mục', required: 'Bắt buộc', result: 'Kết quả', notes: 'Ghi chú', yes: 'Có', no: 'Không', pass: 'Đạt', fail: 'Không đạt', checklist: 'Danh sách kiểm tra', captured: 'Trường đã thu thập', submittedSheet: 'Phiếu đã gửi', operatorInput: 'Người vận hành nhập', equipmentSnapshot: 'Dữ liệu thiết bị', clientContext: 'Thông tin thiết bị truy cập',
  },
  ko: {
    title: '일일 작업자 점검 보고서', period: '보고 기간', template: '보고서 템플릿', equipment: '장비', submissions: '제출 건수', complete: '완료', incomplete: '미완료', summary: '요약', serial: '일련번호', submitted: '제출 시각', requiredAnswered: '응답한 필수 항목', label: '레이블', source: '출처', value: '값', section: '섹션', item: '항목', required: '필수', result: '결과', notes: '메모', yes: '예', no: '아니요', pass: '통과', fail: '실패', checklist: '점검표', captured: '수집 필드', submittedSheet: '제출 내역', operatorInput: '작업자 입력', equipmentSnapshot: '장비 스냅샷', clientContext: '클라이언트 정보',
  },
} as const;

export type OperatorCheckinExcelLabels = { [Key in keyof typeof labels.en]: string };

export function getOperatorCheckinExcelLabels(language: Language): OperatorCheckinExcelLabels {
  return labels[language];
}
