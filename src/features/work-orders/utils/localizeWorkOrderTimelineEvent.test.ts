import { describe, expect, it } from 'vitest';
import { workOrderDetailResources } from '@/i18n/workOrderDetailResources';
import { workOrderTimelineNoteResources } from '@/i18n/workOrderTimelineNoteResources';
import {
  localizeCreationDescription,
  localizeTimelineDescription,
  localizeTimelineTitle,
} from './localizeWorkOrderTimelineEvent';

type Language = 'vi' | 'en' | 'ko';
function translate(language: Language) {
  return (key: string, params?: Record<string, string | number>) => {
    const [namespace, name] = key.split('.');
    const value = namespace === 'workOrderDetail'
      ? (workOrderDetailResources[language].workOrderDetail as Record<string, string>)[name]
      : (workOrderTimelineNoteResources[language].workOrderTimelineNote as Record<string, string>)[name];
    if (!value) throw new Error(`Missing ${language} translation: ${key}`);
    return value.replace(/{{(\w+)}}/g, (_match, token: string) => String(params?.[token] ?? `{{${token}}}`));
  };
}

describe('work order timeline presentation', () => {
  it('localizes derived status text while preserving an audit reason verbatim', () => {
    const t = translate('vi');
    expect(localizeTimelineTitle('accepted', 'assigned', t)).toBe('Đã phân công');
    expect(localizeTimelineDescription('accepted', 'assigned', 'Customer approved 2-hour visit', t))
      .toBe('Trạng thái đổi từ Đã chấp nhận sang Đã giao — Customer approved 2-hour visit');
  });

  it('localizes creation text while preserving names and no reason or IDs are rewritten', () => {
    const t = translate('ko');
    expect(localizeCreationDescription('assigned', 'Stella', 'Minh', t))
      .toBe('Stella이(가) 제출함 • Minh에게 배정됨');
    expect(localizeTimelineTitle('completed', 'accepted', t)).toBe('되돌림');
    expect(localizeTimelineDescription('completed', 'accepted', 'Status updated', t))
      .toBe('상태가 완료됨에서 접수됨(으)로 변경되었습니다');
  });
});
