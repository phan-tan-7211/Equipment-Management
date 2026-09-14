import type { Language } from '@/i18n/I18nProvider';

export const cookieConsentResources = {
  en: {
    aria: 'Cookie consent',
    title: 'Cookies and browser storage',
    message: 'ZNTEQR uses cookies and browser storage for sign-in, security, and optional preferences such as sidebar layout. We do not use advertising or third-party tracking cookies. See',
    privacyLink: 'Privacy Policy — Cookies, Local Storage, and Session Data',
    reject: 'Reject',
    accept: 'Accept',
  },
  vi: {
    aria: 'Đồng ý cookie',
    title: 'Cookie và bộ nhớ trình duyệt',
    message: 'ZNTEQR sử dụng cookie và bộ nhớ trình duyệt để đăng nhập, bảo mật và lưu các tùy chọn không bắt buộc như bố cục thanh bên. Chúng tôi không sử dụng cookie quảng cáo hoặc cookie theo dõi của bên thứ ba. Xem',
    privacyLink: 'Chính sách quyền riêng tư — Cookie, bộ nhớ cục bộ và dữ liệu phiên',
    reject: 'Từ chối',
    accept: 'Chấp nhận',
  },
  ko: {
    aria: '쿠키 동의',
    title: '쿠키 및 브라우저 저장소',
    message: 'ZNTEQR은 로그인, 보안 및 사이드바 레이아웃 같은 선택적 환경설정을 위해 쿠키와 브라우저 저장소를 사용합니다. 광고 또는 제3자 추적 쿠키는 사용하지 않습니다. 자세한 내용:',
    privacyLink: '개인정보 처리방침 — 쿠키, 로컬 저장소 및 세션 데이터',
    reject: '거부',
    accept: '동의',
  },
} as const;

export function getCookieConsentCopy(language: Language) {
  return cookieConsentResources[language];
}
