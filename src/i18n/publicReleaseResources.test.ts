import { describe, expect, it } from 'vitest';
import { getLocalizedPublicReleaseEntry } from '@/i18n/publicReleaseResources';
import type { PublicRelease, PublicReleaseSection } from '@/features/releases/lib/publicReleaseTypes';

const release: PublicRelease = {
  version: '3.34.7',
  date: '2026-09-15',
  isLatest: true,
  sections: [
    {
      id: 'added',
      label: 'Added',
      entries: [
        {
          title: null,
          body: 'Localized the complete Privacy Policy body for Vietnamese and Korean.',
          issueRefs: [],
        },
      ],
    },
  ],
};

const section = release.sections[0] as PublicReleaseSection;

describe('public release localization', () => {
  it('translates the release entry for Vietnamese and Korean', () => {
    expect(getLocalizedPublicReleaseEntry('vi', release, section, 0).body).toBe(
      'Đã bản địa hóa toàn bộ nội dung Chính sách quyền riêng tư sang tiếng Việt và tiếng Hàn.',
    );
    expect(getLocalizedPublicReleaseEntry('ko', release, section, 0).body).toBe(
      '개인정보 처리방침 전체 내용이 베트남어와 한국어로 현지화되었습니다.',
    );
  });

  it('keeps the reviewed English entry unchanged', () => {
    expect(getLocalizedPublicReleaseEntry('en', release, section, 0)).toEqual(section.entries[0]);
  });

  it('falls back to the source entry when no translation exists', () => {
    const olderRelease: PublicRelease = { ...release, version: '3.28.0' };
    expect(getLocalizedPublicReleaseEntry('vi', olderRelease, section, 0)).toEqual(section.entries[0]);
  });
});
