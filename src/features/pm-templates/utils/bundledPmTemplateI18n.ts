import type { Language } from '@/i18n';

type BundledTemplateIdentity = {
  name: string;
  organization_id: string | null;
  is_protected: boolean;
};

type LocalizedTemplateMeta = {
  name: string;
  description: string;
};

const BUNDLED_TEMPLATE_META: Record<string, Partial<Record<Language, LocalizedTemplateMeta>>> = {
  'Forklift PM': {
    vi: {
      name: 'Bảo trì định kỳ xe nâng',
      description: 'Danh sách kiểm tra bảo trì phòng ngừa toàn diện cho xe nâng, bao gồm kiểm tra trực quan, khoang động cơ, điện, thủy lực, phanh, lái, vi sai & truyền động, đánh lửa, cột nâng & giá nâng, làm mát, nhiên liệu và kiểm tra cuối.',
    },
    ko: {
      name: '지게차 예방 정비',
      description: '지게차용 종합 예방 정비 점검표입니다. 외관, 엔진룸, 전기, 유압, 브레이크, 조향, 차동 및 변속기, 점화, 마스트 및 캐리지, 냉각, 연료 계통과 최종 점검을 포함합니다.',
    },
  },
  'Pull Trailer PM': {
    vi: {
      name: 'Bảo trì định kỳ rơ-moóc kéo',
      description: 'Danh sách kiểm tra bảo trì phòng ngừa toàn diện cho rơ-moóc kéo, bao gồm kiểm tra trực quan, khung & kết cấu, trục & hệ thống treo, bánh & lốp, phanh, khớp nối & chân chống, đèn & điện, sàn & thân xe và kiểm tra cuối.',
    },
    ko: {
      name: '견인 트레일러 예방 정비',
      description: '견인 트레일러용 종합 예방 정비 점검표입니다. 외관, 프레임 및 구조, 액슬 및 서스펜션, 휠 및 타이어, 브레이크, 커플러 및 잭, 조명 및 전기, 데크 및 차체와 최종 점검을 포함합니다.',
    },
  },
  'Compressor PM': {
    vi: {
      name: 'Bảo trì định kỳ máy nén khí',
      description: 'Danh sách kiểm tra bảo trì phòng ngừa toàn diện cho máy nén khí, bao gồm kiểm tra trực quan, khoang động cơ, hệ thống điện, hệ thống máy nén & khí, làm mát, nhiên liệu, khung gầm & khung và kiểm tra cuối.',
    },
    ko: {
      name: '공기압축기 예방 정비',
      description: '공기압축기용 종합 예방 정비 점검표입니다. 외관, 엔진룸, 전기 계통, 압축기 및 공기 계통, 냉각, 연료, 섀시 및 프레임과 최종 점검을 포함합니다.',
    },
  },
  'Scissor Lift PM': {
    vi: {
      name: 'Bảo trì định kỳ xe nâng cắt kéo',
      description: 'Danh sách kiểm tra bảo trì phòng ngừa toàn diện cho xe nâng cắt kéo, bao gồm kiểm tra trực quan, ắc quy & bộ sạc, động cơ & nhiên liệu, điện, thủy lực, cơ cấu nâng, sàn thao tác & an toàn, điều khiển & chỉ báo, truyền động & lái và kiểm tra cuối.',
    },
    ko: {
      name: '시저 리프트 예방 정비',
      description: '시저 리프트용 종합 예방 정비 점검표입니다. 외관, 배터리 및 충전기, 엔진 및 연료, 전기, 유압, 리프트 메커니즘, 플랫폼 및 안전장치, 제어 및 표시장치, 구동 및 조향과 최종 점검을 포함합니다.',
    },
  },
  'Excavator PM': {
    vi: {
      name: 'Bảo trì định kỳ máy xúc',
      description: 'Danh sách kiểm tra bảo trì phòng ngừa toàn diện cho máy xúc, bao gồm kiểm tra trực quan, khoang động cơ, điện, thủy lực, gầm & xích, hệ thống quay, cần/đòn & bộ công tác, làm mát, nhiên liệu, cabin & điều khiển và kiểm tra cuối.',
    },
    ko: {
      name: '굴착기 예방 정비',
      description: '굴착기용 종합 예방 정비 점검표입니다. 외관, 엔진룸, 전기, 유압, 하부체 및 트랙, 선회, 붐/스틱/어태치먼트, 냉각, 연료, 운전실 및 제어와 최종 점검을 포함합니다.',
    },
  },
  'Skid Steer PM': {
    vi: {
      name: 'Bảo trì định kỳ xe xúc trượt',
      description: 'Danh sách kiểm tra bảo trì phòng ngừa toàn diện cho xe xúc trượt, bao gồm kiểm tra trực quan, khoang động cơ, điện, thủy lực, tay nâng & bộ công tác, gầm & truyền động, làm mát, nhiên liệu, cabin & điều khiển và kiểm tra cuối.',
    },
    ko: {
      name: '스키드 스티어 예방 정비',
      description: '스키드 스티어 로더용 종합 예방 정비 점검표입니다. 외관, 엔진룸, 전기, 유압, 로더 암 및 어태치먼트, 하부체 및 구동, 냉각, 연료, 운전실 및 제어와 최종 점검을 포함합니다.',
    },
  },
};

const SECTION_NAMES: Partial<Record<Language, Record<string, string>>> = {
  vi: {
    'Visual Inspection': 'Kiểm tra trực quan',
    'Engine Compartment': 'Khoang động cơ',
    'Electrical Inspection': 'Kiểm tra hệ thống điện',
    'Hydraulic Inspection': 'Kiểm tra hệ thống thủy lực',
    'Brake': 'Phanh',
    'Steering': 'Hệ thống lái',
    'Differential & Transmission': 'Vi sai & truyền động',
    'Ignition System': 'Hệ thống đánh lửa',
    'Mast & Carriage': 'Cột nâng & giá nâng',
    'Cooling System': 'Hệ thống làm mát',
    'Fuel System': 'Hệ thống nhiên liệu',
    'Final Inspection': 'Kiểm tra cuối',
    'Frame & Structure': 'Khung & kết cấu',
    'Axle & Suspension': 'Trục & hệ thống treo',
    'Wheels & Tires': 'Bánh xe & lốp',
    'Brake System': 'Hệ thống phanh',
    'Coupler & Jack': 'Khớp nối & chân chống',
    'Lights & Electrical': 'Đèn & hệ thống điện',
    'Deck & Body': 'Sàn & thân xe',
    'Electrical System': 'Hệ thống điện',
    'Compressor & Air System': 'Máy nén & hệ thống khí',
    'Chassis & Frame': 'Khung gầm & khung',
    'Battery & Charger': 'Ắc quy & bộ sạc',
    'Engine & Fuel System (if equipped)': 'Động cơ & hệ thống nhiên liệu (nếu có)',
    'Hydraulic System': 'Hệ thống thủy lực',
    'Lift Mechanism (Scissor Assembly)': 'Cơ cấu nâng (cụm cắt kéo)',
    'Platform & Safety Systems': 'Sàn thao tác & hệ thống an toàn',
    'Controls & Indicators': 'Điều khiển & chỉ báo',
    'Drive & Steering': 'Truyền động & lái',
    'Undercarriage & Tracks': 'Gầm & xích',
    'Swing System': 'Hệ thống quay',
    'Boom, Stick & Attachment': 'Cần, đòn & bộ công tác',
    'Cab & Controls': 'Cabin & điều khiển',
    'Loader Arms & Attachment': 'Tay nâng & bộ công tác',
    'Undercarriage & Drive': 'Gầm & truyền động',
  },
  ko: {
    'Visual Inspection': '외관 점검',
    'Engine Compartment': '엔진룸',
    'Electrical Inspection': '전기 계통 점검',
    'Hydraulic Inspection': '유압 계통 점검',
    'Brake': '브레이크',
    'Steering': '조향 장치',
    'Differential & Transmission': '차동 및 변속기',
    'Ignition System': '점화 계통',
    'Mast & Carriage': '마스트 및 캐리지',
    'Cooling System': '냉각 계통',
    'Fuel System': '연료 계통',
    'Final Inspection': '최종 점검',
    'Frame & Structure': '프레임 및 구조',
    'Axle & Suspension': '액슬 및 서스펜션',
    'Wheels & Tires': '휠 및 타이어',
    'Brake System': '브레이크 계통',
    'Coupler & Jack': '커플러 및 잭',
    'Lights & Electrical': '조명 및 전기',
    'Deck & Body': '데크 및 차체',
    'Electrical System': '전기 계통',
    'Compressor & Air System': '압축기 및 공기 계통',
    'Chassis & Frame': '섀시 및 프레임',
    'Battery & Charger': '배터리 및 충전기',
    'Engine & Fuel System (if equipped)': '엔진 및 연료 계통 (해당 시)',
    'Hydraulic System': '유압 계통',
    'Lift Mechanism (Scissor Assembly)': '리프트 메커니즘 (시저 어셈블리)',
    'Platform & Safety Systems': '플랫폼 및 안전 시스템',
    'Controls & Indicators': '제어 및 표시장치',
    'Drive & Steering': '구동 및 조향',
    'Undercarriage & Tracks': '하부체 및 트랙',
    'Swing System': '선회 시스템',
    'Boom, Stick & Attachment': '붐, 스틱 및 어태치먼트',
    'Cab & Controls': '운전실 및 제어',
    'Loader Arms & Attachment': '로더 암 및 어태치먼트',
    'Undercarriage & Drive': '하부체 및 구동',
  },
};

export function isBundledPmTemplate(template: BundledTemplateIdentity): boolean {
  return template.organization_id === null && template.is_protected;
}

export function localizeBundledPmTemplateMeta(
  template: BundledTemplateIdentity & { description?: string | null },
  language: Language,
): { name: string; description: string | null } {
  if (!isBundledPmTemplate(template) || language === 'en') {
    return { name: template.name, description: template.description ?? null };
  }

  const localized = BUNDLED_TEMPLATE_META[template.name]?.[language];
  return {
    name: localized?.name ?? template.name,
    description: localized?.description ?? template.description ?? null,
  };
}

export function localizeBundledPmSectionName(
  sectionName: string,
  language: Language,
): string {
  if (language === 'en') return sectionName;
  return SECTION_NAMES[language]?.[sectionName] ?? sectionName;
}
