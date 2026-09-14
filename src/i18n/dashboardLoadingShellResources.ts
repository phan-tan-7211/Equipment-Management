import type { Language } from '@/i18n/I18nProvider';

export const dashboardLoadingShellResources = {
  en: {
    loadingDashboard: 'Loading dashboard',
    loadingContent: 'Loading dashboard content.',
    navigationLoading: 'Dashboard navigation loading',
    headerLoading: 'Dashboard header loading',
    fleet: 'Fleet',
    operations: 'Operations',
    infrastructure: 'Infrastructure',
  },
  vi: {
    loadingDashboard: 'Đang tải bảng điều khiển',
    loadingContent: 'Đang tải nội dung bảng điều khiển.',
    navigationLoading: 'Đang tải điều hướng bảng điều khiển',
    headerLoading: 'Đang tải phần đầu bảng điều khiển',
    fleet: 'Đội thiết bị',
    operations: 'Vận hành',
    infrastructure: 'Hạ tầng',
  },
  ko: {
    loadingDashboard: '대시보드 로딩 중',
    loadingContent: '대시보드 콘텐츠 로딩 중입니다.',
    navigationLoading: '대시보드 탐색 로딩 중',
    headerLoading: '대시보드 헤더 로딩 중',
    fleet: '설비',
    operations: '운영',
    infrastructure: '인프라',
  },
} as const;

export function getDashboardLoadingShellCopy(language: Language) {
  return dashboardLoadingShellResources[language];
}
