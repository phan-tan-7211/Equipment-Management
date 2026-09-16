export const equipmentCustomAttributeResources = {
  en: {
    equipmentCustomAttributes: {
      title: 'Custom Attributes', editTitle: 'Edit Custom Attributes', none: 'No custom attributes', editAria: 'Edit custom attributes',
      save: 'Save', cancel: 'Cancel', add: 'Add Attribute', uniqueRequired: 'Attribute names must be unique and not empty',
      name: 'Attribute Name', namePlaceholder: 'Attribute name', value: 'Attribute Value', valuePlaceholder: 'Attribute value',
      deleteAria: 'Delete attribute {{name}}', unnamed: 'unnamed', emptyValue: '—', trueValue: 'Yes', falseValue: 'No',
      managementResponsiblePrimary: 'Management Responsible Primary', managementResponsibleSecondary: 'Management Responsible Secondary',
      attributeLabels: {
        origin: 'Origin', migration: 'Migration', criticality: 'Criticality', currentArea: 'Current Area', currentLine: 'Current Line',
        registeredAt: 'Registered At', registeredBy: 'Registered By', sourceQrCode: 'Source QR Code', criticalityRule: 'Criticality Rule',
        usingDepartment: 'Using Department', criticalityFacts: 'Criticality Facts', equipmentCategory: 'Equipment Category',
        managingDepartment: 'Managing Department', sourceEquipmentId: 'Source Equipment ID', sourceControlNumber: 'Source Control Number',
        managementResponsiblePrimary: 'Management Responsible Primary', managementResponsibleSecondary: 'Management Responsible Secondary',
      },
    },
  },
  vi: {
    equipmentCustomAttributes: {
      title: 'Thuộc tính tùy chỉnh', editTitle: 'Chỉnh sửa thuộc tính tùy chỉnh', none: 'Chưa có thuộc tính tùy chỉnh', editAria: 'Chỉnh sửa thuộc tính tùy chỉnh',
      save: 'Lưu', cancel: 'Hủy', add: 'Thêm thuộc tính', uniqueRequired: 'Tên thuộc tính phải duy nhất và không được để trống',
      name: 'Tên thuộc tính', namePlaceholder: 'Tên thuộc tính', value: 'Giá trị thuộc tính', valuePlaceholder: 'Giá trị thuộc tính',
      deleteAria: 'Xóa thuộc tính {{name}}', unnamed: 'chưa đặt tên', emptyValue: '—', trueValue: 'Có', falseValue: 'Không',
      managementResponsiblePrimary: 'Quản lý chính', managementResponsibleSecondary: 'Quản lý phụ',
      attributeLabels: {
        origin: 'Nguồn gốc', migration: 'Di chuyển dữ liệu', criticality: 'Mức độ quan trọng', currentArea: 'Khu vực hiện tại', currentLine: 'Dây chuyền hiện tại',
        registeredAt: 'Ngày đăng ký', registeredBy: 'Người đăng ký', sourceQrCode: 'Mã QR nguồn', criticalityRule: 'Quy tắc mức độ quan trọng',
        usingDepartment: 'Bộ phận sử dụng', criticalityFacts: 'Cơ sở đánh giá mức độ quan trọng', equipmentCategory: 'Loại thiết bị',
        managingDepartment: 'Bộ phận quản lý', sourceEquipmentId: 'ID thiết bị nguồn', sourceControlNumber: 'Số kiểm soát nguồn',
        managementResponsiblePrimary: 'Quản lý chính', managementResponsibleSecondary: 'Quản lý phụ',
      },
    },
  },
  ko: {
    equipmentCustomAttributes: {
      title: '사용자 정의 속성', editTitle: '사용자 정의 속성 수정', none: '사용자 정의 속성이 없습니다', editAria: '사용자 정의 속성 수정',
      save: '저장', cancel: '취소', add: '속성 추가', uniqueRequired: '속성 이름은 비어 있지 않고 서로 달라야 합니다',
      name: '속성 이름', namePlaceholder: '속성 이름', value: '속성 값', valuePlaceholder: '속성 값',
      deleteAria: '{{name}} 속성 삭제', unnamed: '이름 없음', emptyValue: '—', trueValue: '예', falseValue: '아니요',
      managementResponsiblePrimary: '주 관리 책임자', managementResponsibleSecondary: '보조 관리 책임자',
      attributeLabels: {
        origin: '출처', migration: '데이터 마이그레이션', criticality: '중요도', currentArea: '현재 구역', currentLine: '현재 라인',
        registeredAt: '등록일', registeredBy: '등록자', sourceQrCode: '원본 QR 코드', criticalityRule: '중요도 규칙',
        usingDepartment: '사용 부서', criticalityFacts: '중요도 평가 근거', equipmentCategory: '설비 분류',
        managingDepartment: '관리 부서', sourceEquipmentId: '원본 설비 ID', sourceControlNumber: '원본 관리 번호',
        managementResponsiblePrimary: '주 관리 책임자', managementResponsibleSecondary: '보조 관리 책임자',
      },
    },
  },
} as const;
