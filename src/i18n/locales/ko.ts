const ko = {
  common: {
    skipToMainContent: '본문으로 바로가기',
    language: '언어',
    openSidebar: '사이드바 열기',
  },
  languages: {
    vi: '베트남어',
    en: '영어',
    ko: '한국어',
  },
  navigation: {
    mainNavigation: '주요 탐색',
    groups: {
      fleet: '설비',
      operations: '운영',
      infrastructure: '관리',
    },
    items: {
      equipment: '설비',
      fleetMap: '설비 지도',
      inventory: '재고',
      partLookup: '부품 조회',
      partAlternates: '대체 부품',
      dashboard: '대시보드',
      workOrders: '작업 지시',
      pmTemplates: '예방정비 템플릿',
      dailyCheckIns: '일일 점검',
      quickForms: '빠른 양식',
      reports: '보고서',
      teams: '팀',
      organization: '조직',
      integrations: '연동',
    },
  },
} as const;

export default ko;
