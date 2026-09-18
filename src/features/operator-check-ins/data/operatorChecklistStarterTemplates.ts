import { nanoid } from 'nanoid';
import type { OperatorChecklistTemplateData } from '@/features/operator-check-ins/types/operatorChecklist';
import type { Language } from '@/i18n';

export interface OperatorChecklistStarterTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  templateData: OperatorChecklistTemplateData;
}

function freshId(): string {
  return nanoid(10);
}

function materializeTemplateData(data: OperatorChecklistTemplateData): OperatorChecklistTemplateData {
  return {
    dataFields: data.dataFields.map((field) => ({
      ...field,
      id: freshId(),
    })),
    checklistItems: data.checklistItems.map((item) => ({
      ...item,
      id: freshId(),
    })),
  };
}

const ODOMETER_LOG_STARTER: OperatorChecklistStarterTemplate = {
  id: 'starter-odometer-log',
  name: 'Odometer Log',
  icon: 'Gauge',
  description:
    'Quick daily odometer reading with operator name and optional notes. Supports audit documentation.',
  templateData: {
    dataFields: [
      {
        id: 'placeholder-name',
        label: 'Your name',
        source: 'operator_input',
        inputType: 'text',
        required: true,
      },
      {
        id: 'placeholder-odometer',
        label: 'Odometer reading',
        source: 'operator_input',
        inputType: 'number',
        required: true,
        helpText: 'Enter the current odometer or hour meter reading.',
      },
      {
        id: 'placeholder-notes',
        label: 'Notes',
        source: 'operator_input',
        inputType: 'textarea',
        required: false,
      },
      {
        id: 'placeholder-ts',
        label: 'Submitted at',
        source: 'client_context',
        clientKey: 'submitted_timestamp',
        required: true,
      },
    ],
    checklistItems: [],
  },
};

const DVIR_SECTIONS: { section: string; items: string[] }[] = [
  {
    section: 'Brakes',
    items: ['Service brakes operate correctly', 'Parking brake holds vehicle'],
  },
  {
    section: 'Steering',
    items: ['Steering wheel free of excessive play', 'Steering linkage secure'],
  },
  {
    section: 'Lights & Reflectors',
    items: ['Headlights and tail lights working', 'Turn signals and brake lights working', 'Reflectors present and visible'],
  },
  {
    section: 'Tires, Wheels & Rims',
    items: ['Tires properly inflated and not damaged', 'Wheels and rims secure, no cracks'],
  },
  {
    section: 'Visibility',
    items: ['Windshield and mirrors clean and intact', 'Wipers and washers functional'],
  },
  {
    section: 'Coupling Devices',
    items: ['Fifth wheel / coupling secure (if applicable)', 'Safety chains and pins in place (if applicable)'],
  },
  {
    section: 'Emergency Equipment',
    items: ['Fire extinguisher present and charged', 'Warning triangles / flares available'],
  },
  {
    section: 'Cargo Securement',
    items: ['Cargo properly blocked, braced, tied, or otherwise secured'],
  },
];

const FMCSA_DVIR_STARTER: OperatorChecklistStarterTemplate = {
  id: 'starter-fmcsa-dvir',
  name: 'FMCSA-style DVIR starter',
  icon: 'Truck',
  description:
    'Driver vehicle inspection checklist covering common pre-trip areas. Supports documentation — not a legal compliance certification.',
  templateData: {
    dataFields: [
      {
        id: 'placeholder-name',
        label: 'Driver / operator name',
        source: 'operator_input',
        inputType: 'text',
        required: true,
      },
      {
        id: 'placeholder-odometer',
        label: 'Odometer reading',
        source: 'operator_input',
        inputType: 'number',
        required: false,
      },
      {
        id: 'placeholder-ts',
        label: 'Submitted at',
        source: 'client_context',
        clientKey: 'submitted_timestamp',
        required: true,
      },
      {
        id: 'placeholder-equip-name',
        label: 'Equipment name',
        source: 'equipment_snapshot',
        equipmentKey: 'name',
        required: true,
      },
      {
        id: 'placeholder-serial',
        label: 'Serial number',
        source: 'equipment_snapshot',
        equipmentKey: 'serial_number',
        required: false,
      },
    ],
    checklistItems: DVIR_SECTIONS.flatMap(({ section, items }) =>
      items.map((title) => ({
        id: 'placeholder-item',
        title,
        required: true,
        section,
      })),
    ),
  },
};

const CHAIN_CONVEYOR_OVEN_DAILY_SECTIONS: { section: string; items: string[] }[] = [
  {
    section: 'Conveyor & Path',
    items: [
      'Chain runs freely with no binding, derailment, or abnormal slack',
      'Sprockets and screw tensioners are secure with no obvious misalignment',
      'Conveyor path and tray route are clean, dry, and clear of obstructions',
    ],
  },
  {
    section: 'Drive System',
    items: [
      'Motor and gearbox show no abnormal noise, vibration, overheating, or oil leak',
      'VFD / SPG controller powers up with no alarm and speed control responds normally',
    ],
  },
  {
    section: 'Temperature & Heating',
    items: [
      'Temperature controller and sensor show a plausible reading with no fault or alarm',
      'Heating system (coil heater or IR, as fitted) starts normally with no visibly failed or damaged element',
    ],
  },
  {
    section: 'Safety & Electrical',
    items: [
      'Stop / emergency stop / stop sensor functions normally where fitted',
      'Electrical cabinet exterior shows no burning smell, abnormal noise, or fault indication',
    ],
  },
  {
    section: 'Startup Run',
    items: [
      'Short no-load startup run is smooth: no chain jump or jerking and temperature begins rising normally',
    ],
  },
];

const CHAIN_CONVEYOR_OVEN_DAILY_STARTER: OperatorChecklistStarterTemplate = {
  id: 'starter-chain-conveyor-oven-daily',
  name: 'Chain Conveyor Oven Daily Pre-Start',
  icon: 'Gauge',
  description:
    'Daily pre-start check for chain conveyor ovens covering chain and tension, drive, VFD/SPG control, temperature and heating, safety devices, electrical cabinet, and a short no-load run.',
  templateData: {
    dataFields: [
      {
        id: 'placeholder-name',
        label: 'Operator name',
        source: 'operator_input',
        inputType: 'text',
        required: true,
      },
      {
        id: 'placeholder-notes',
        label: 'Startup notes / abnormalities',
        source: 'operator_input',
        inputType: 'textarea',
        required: false,
      },
      {
        id: 'placeholder-ts',
        label: 'Submitted at',
        source: 'client_context',
        clientKey: 'submitted_timestamp',
        required: true,
      },
      {
        id: 'placeholder-equip-name',
        label: 'Equipment name',
        source: 'equipment_snapshot',
        equipmentKey: 'name',
        required: true,
      },
      {
        id: 'placeholder-serial',
        label: 'Serial number',
        source: 'equipment_snapshot',
        equipmentKey: 'serial_number',
        required: false,
      },
    ],
    checklistItems: CHAIN_CONVEYOR_OVEN_DAILY_SECTIONS.flatMap(({ section, items }) =>
      items.map((title) => ({
        id: 'placeholder-item',
        title,
        required: true,
        section,
      })),
    ),
  },
};


interface StarterLocalization {
  name: string;
  description: string;
  fieldLabels?: Record<string, string>;
  fieldHelpText?: Record<string, string>;
  sectionLabels?: Record<string, string>;
  itemTitles?: Record<string, string>;
}

type LocalizedStarterMap = Record<string, Partial<Record<Language, StarterLocalization>>>;

const STARTER_LOCALIZATIONS: LocalizedStarterMap = {
  'starter-odometer-log': {
    vi: {
      name: 'Nhật ký công tơ mét',
      description: 'Ghi nhanh số công tơ mét hằng ngày, tên người vận hành và ghi chú tùy chọn. Hỗ trợ lưu hồ sơ kiểm toán.',
      fieldLabels: {
        'Your name': 'Tên của bạn',
        'Odometer reading': 'Số công tơ mét',
        'Notes': 'Ghi chú',
        'Submitted at': 'Thời điểm gửi',
      },
      fieldHelpText: {
        'Enter the current odometer or hour meter reading.': 'Nhập số công tơ mét hoặc đồng hồ giờ hiện tại.',
      },
    },
    ko: {
      name: '주행 거리 기록',
      description: '일일 주행 거리와 작업자 이름, 선택적 메모를 빠르게 기록합니다. 감사 문서화에 도움이 됩니다.',
      fieldLabels: {
        'Your name': '이름',
        'Odometer reading': '주행 거리',
        'Notes': '메모',
        'Submitted at': '제출 시각',
      },
      fieldHelpText: {
        'Enter the current odometer or hour meter reading.': '현재 주행 거리계 또는 시간계 값을 입력하세요.',
      },
    },
  },
  'starter-fmcsa-dvir': {
    vi: {
      name: 'Mẫu kiểm tra xe kiểu FMCSA',
      description: 'Danh sách kiểm tra các hạng mục xe thường gặp trước chuyến đi. Hỗ trợ lưu hồ sơ, không chứng nhận tuân thủ pháp luật.',
      fieldLabels: {
        'Driver / operator name': 'Tên tài xế / người vận hành',
        'Odometer reading': 'Số công tơ mét',
        'Submitted at': 'Thời điểm gửi',
        'Equipment name': 'Tên thiết bị',
        'Serial number': 'Số sê-ri',
      },
      sectionLabels: {
        'Brakes': 'Phanh',
        'Steering': 'Hệ thống lái',
        'Lights & Reflectors': 'Đèn & phản quang',
        'Tires, Wheels & Rims': 'Lốp, bánh xe & vành',
        'Visibility': 'Tầm nhìn',
        'Coupling Devices': 'Thiết bị nối',
        'Emergency Equipment': 'Thiết bị khẩn cấp',
        'Cargo Securement': 'Cố định hàng hóa',
      },
      itemTitles: {
        'Service brakes operate correctly': 'Phanh chính hoạt động bình thường',
        'Parking brake holds vehicle': 'Phanh đỗ giữ xe chắc chắn',
        'Steering wheel free of excessive play': 'Vô lăng không có độ rơ quá mức',
        'Steering linkage secure': 'Liên kết hệ thống lái chắc chắn',
        'Headlights and tail lights working': 'Đèn trước và đèn sau hoạt động',
        'Turn signals and brake lights working': 'Đèn xi-nhan và đèn phanh hoạt động',
        'Reflectors present and visible': 'Phản quang đầy đủ và nhìn thấy rõ',
        'Tires properly inflated and not damaged': 'Lốp đủ áp suất và không hư hỏng',
        'Wheels and rims secure, no cracks': 'Bánh xe và vành chắc chắn, không nứt',
        'Windshield and mirrors clean and intact': 'Kính chắn gió và gương sạch, nguyên vẹn',
        'Wipers and washers functional': 'Gạt mưa và hệ thống rửa kính hoạt động',
        'Fifth wheel / coupling secure (if applicable)': 'Mâm kéo / khớp nối chắc chắn (nếu áp dụng)',
        'Safety chains and pins in place (if applicable)': 'Xích an toàn và chốt đúng vị trí (nếu áp dụng)',
        'Fire extinguisher present and charged': 'Có bình chữa cháy và còn đủ áp suất',
        'Warning triangles / flares available': 'Có tam giác cảnh báo / pháo hiệu',
        'Cargo properly blocked, braced, tied, or otherwise secured': 'Hàng hóa được chèn, chống, buộc hoặc cố định đúng cách',
      },
    },
    ko: {
      name: 'FMCSA 방식 DVIR 기본 템플릿',
      description: '운행 전 일반적인 차량 점검 항목입니다. 문서화를 지원하며 법적 준수 인증은 아닙니다.',
      fieldLabels: {
        'Driver / operator name': '운전자 / 작업자 이름',
        'Odometer reading': '주행 거리',
        'Submitted at': '제출 시각',
        'Equipment name': '장비명',
        'Serial number': '일련번호',
      },
      sectionLabels: {
        'Brakes': '브레이크',
        'Steering': '조향 장치',
        'Lights & Reflectors': '조명 및 반사판',
        'Tires, Wheels & Rims': '타이어, 휠 및 림',
        'Visibility': '시야',
        'Coupling Devices': '연결 장치',
        'Emergency Equipment': '비상 장비',
        'Cargo Securement': '화물 고정',
      },
      itemTitles: {
        'Service brakes operate correctly': '주 브레이크가 정상 작동함',
        'Parking brake holds vehicle': '주차 브레이크가 차량을 확실히 고정함',
        'Steering wheel free of excessive play': '스티어링 휠에 과도한 유격이 없음',
        'Steering linkage secure': '조향 연결부가 확실히 고정됨',
        'Headlights and tail lights working': '전조등과 후미등이 정상 작동함',
        'Turn signals and brake lights working': '방향지시등과 브레이크등이 정상 작동함',
        'Reflectors present and visible': '반사판이 구비되어 있고 잘 보임',
        'Tires properly inflated and not damaged': '타이어 공기압이 적정하고 손상이 없음',
        'Wheels and rims secure, no cracks': '휠과 림이 확실히 고정되고 균열이 없음',
        'Windshield and mirrors clean and intact': '앞유리와 미러가 깨끗하고 손상이 없음',
        'Wipers and washers functional': '와이퍼와 워셔가 정상 작동함',
        'Fifth wheel / coupling secure (if applicable)': '5륜 / 커플링이 확실히 고정됨 (해당 시)',
        'Safety chains and pins in place (if applicable)': '안전 체인과 핀이 제자리에 있음 (해당 시)',
        'Fire extinguisher present and charged': '소화기가 비치되어 있고 정상 압력 상태임',
        'Warning triangles / flares available': '비상 삼각대 / 신호탄이 구비됨',
        'Cargo properly blocked, braced, tied, or otherwise secured': '화물이 적절히 받침, 지지, 결속 또는 기타 방식으로 고정됨',
      },
    },
  },
  'starter-chain-conveyor-oven-daily': {
    vi: {
      name: 'Kiểm tra trước khi khởi động lò băng tải xích hằng ngày',
      description: 'Kiểm tra hằng ngày trước khi chạy cho lò băng tải xích, bao gồm xích và độ căng, truyền động, điều khiển VFD/SPG, nhiệt độ và gia nhiệt, thiết bị an toàn, tủ điện và chạy thử không tải.',
      fieldLabels: {
        'Operator name': 'Tên người vận hành',
        'Startup notes / abnormalities': 'Ghi chú khởi động / bất thường',
        'Submitted at': 'Thời điểm gửi',
        'Equipment name': 'Tên thiết bị',
        'Serial number': 'Số sê-ri',
      },
      sectionLabels: {
        'Conveyor & Path': 'Băng tải & đường chạy',
        'Drive System': 'Hệ thống truyền động',
        'Temperature & Heating': 'Nhiệt độ & gia nhiệt',
        'Safety & Electrical': 'An toàn & điện',
        'Startup Run': 'Chạy thử khởi động',
      },
      itemTitles: {
        'Chain runs freely with no binding, derailment, or abnormal slack': 'Xích chạy tự do, không kẹt, lệch khỏi đường dẫn hoặc chùng bất thường',
        'Sprockets and screw tensioners are secure with no obvious misalignment': 'Nhông xích và bộ tăng đơ vít chắc chắn, không thấy lệch tâm rõ ràng',
        'Conveyor path and tray route are clean, dry, and clear of obstructions': 'Đường băng tải và đường khay sạch, khô và không có vật cản',
        'Motor and gearbox show no abnormal noise, vibration, overheating, or oil leak': 'Động cơ và hộp số không có tiếng ồn, rung, quá nhiệt hoặc rò dầu bất thường',
        'VFD / SPG controller powers up with no alarm and speed control responds normally': 'Bộ điều khiển VFD / SPG khởi động không báo lỗi và điều chỉnh tốc độ phản hồi bình thường',
        'Temperature controller and sensor show a plausible reading with no fault or alarm': 'Bộ điều khiển nhiệt độ và cảm biến hiển thị giá trị hợp lý, không có lỗi hoặc cảnh báo',
        'Heating system (coil heater or IR, as fitted) starts normally with no visibly failed or damaged element': 'Hệ thống gia nhiệt (điện trở hoặc IR tùy cấu hình) khởi động bình thường, không thấy phần tử hỏng hoặc hư hại',
        'Stop / emergency stop / stop sensor functions normally where fitted': 'Nút dừng / dừng khẩn cấp / cảm biến dừng hoạt động bình thường tại các vị trí được trang bị',
        'Electrical cabinet exterior shows no burning smell, abnormal noise, or fault indication': 'Bên ngoài tủ điện không có mùi khét, tiếng ồn bất thường hoặc dấu hiệu báo lỗi',
        'Short no-load startup run is smooth: no chain jump or jerking and temperature begins rising normally': 'Chạy thử không tải ngắn diễn ra êm: xích không nhảy hoặc giật và nhiệt độ bắt đầu tăng bình thường',
      },
    },
    ko: {
      name: '체인 컨베이어 오븐 일일 가동 전 점검',
      description: '체인 컨베이어 오븐의 일일 가동 전 점검입니다. 체인과 장력, 구동부, VFD/SPG 제어, 온도와 가열, 안전장치, 전기반 및 짧은 무부하 시운전을 확인합니다.',
      fieldLabels: {
        'Operator name': '작업자 이름',
        'Startup notes / abnormalities': '가동 전 메모 / 이상 사항',
        'Submitted at': '제출 시각',
        'Equipment name': '장비명',
        'Serial number': '일련번호',
      },
      sectionLabels: {
        'Conveyor & Path': '컨베이어 및 이동 경로',
        'Drive System': '구동 시스템',
        'Temperature & Heating': '온도 및 가열',
        'Safety & Electrical': '안전 및 전기',
        'Startup Run': '가동 시험',
      },
      itemTitles: {
        'Chain runs freely with no binding, derailment, or abnormal slack': '체인이 걸림, 이탈 또는 비정상적인 처짐 없이 원활하게 움직임',
        'Sprockets and screw tensioners are secure with no obvious misalignment': '스프로킷과 스크루 텐셔너가 확실히 고정되어 있고 뚜렷한 정렬 불량이 없음',
        'Conveyor path and tray route are clean, dry, and clear of obstructions': '컨베이어 및 트레이 이동 경로가 깨끗하고 건조하며 장애물이 없음',
        'Motor and gearbox show no abnormal noise, vibration, overheating, or oil leak': '모터와 기어박스에 이상 소음, 진동, 과열 또는 오일 누유가 없음',
        'VFD / SPG controller powers up with no alarm and speed control responds normally': 'VFD / SPG 제어기가 경보 없이 켜지고 속도 제어가 정상적으로 반응함',
        'Temperature controller and sensor show a plausible reading with no fault or alarm': '온도 제어기와 센서가 정상 범위의 값을 표시하고 오류나 경보가 없음',
        'Heating system (coil heater or IR, as fitted) starts normally with no visibly failed or damaged element': '가열 시스템(코일 히터 또는 IR, 적용 사양)이 정상적으로 기동되며 눈에 보이는 고장 또는 손상 요소가 없음',
        'Stop / emergency stop / stop sensor functions normally where fitted': '설치된 정지 / 비상 정지 / 정지 센서가 정상 작동함',
        'Electrical cabinet exterior shows no burning smell, abnormal noise, or fault indication': '전기반 외부에서 타는 냄새, 이상 소음 또는 고장 표시가 없음',
        'Short no-load startup run is smooth: no chain jump or jerking and temperature begins rising normally': '짧은 무부하 가동 시험이 원활하며 체인 튐이나 급격한 움직임이 없고 온도가 정상적으로 상승하기 시작함',
      },
    },
  },
};

function localizeTemplateData(
  data: OperatorChecklistTemplateData,
  localization?: StarterLocalization,
): OperatorChecklistTemplateData {
  if (!localization) return data;

  return {
    dataFields: data.dataFields.map((field) => ({
      ...field,
      label: localization.fieldLabels?.[field.label] ?? field.label,
      helpText: field.helpText
        ? localization.fieldHelpText?.[field.helpText] ?? field.helpText
        : field.helpText,
    })),
    checklistItems: data.checklistItems.map((item) => ({
      ...item,
      title: localization.itemTitles?.[item.title] ?? item.title,
      section: item.section
        ? localization.sectionLabels?.[item.section] ?? item.section
        : item.section,
    })),
  };
}

export const OPERATOR_CHECKLIST_STARTER_TEMPLATES: OperatorChecklistStarterTemplate[] = [
  ODOMETER_LOG_STARTER,
  FMCSA_DVIR_STARTER,
  CHAIN_CONVEYOR_OVEN_DAILY_STARTER,
];

export function materializeOperatorChecklistStarter(
  starter: OperatorChecklistStarterTemplate,
  language: Language = 'en',
): { name: string; description: string; templateData: OperatorChecklistTemplateData } {
  const localization = STARTER_LOCALIZATIONS[starter.id]?.[language];
  const localizedTemplateData = localizeTemplateData(starter.templateData, localization);

  return {
    name: localization?.name ?? starter.name,
    description: localization?.description ?? starter.description,
    templateData: materializeTemplateData(localizedTemplateData),
  };
}