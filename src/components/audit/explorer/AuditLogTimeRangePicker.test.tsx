import React from 'react';
import { render, screen, fireEvent } from '@vitest-harness/utils/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { AuditLogTimeRangePicker } from './AuditLogTimeRangePicker';
import { DEFAULT_AUDIT_TIME_PRESET } from '@/types/audit';
import { I18nProvider } from '@/i18n/I18nProvider';

describe('AuditLogTimeRangePicker', () => {
  it.each([
    ['vi', 'Mọi lúc', 'Khoảng ngày tùy chỉnh'],
    ['ko', '전체 기간', '사용자 지정 날짜 범위'],
  ])('translates the preset and custom date controls in %s', (language, allTime, custom) => {
    window.localStorage.setItem('znteqr-language', language);
    try {
      render(<I18nProvider><AuditLogTimeRangePicker preset="all" onChange={vi.fn()} /></I18nProvider>);
      expect(screen.getByRole('radio', { name: allTime })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: custom })).toBeInTheDocument();
    } finally {
      window.localStorage.removeItem('znteqr-language');
    }
  });

  it('renders the All time preset control alongside rolling-window presets', () => {
    const onChange = vi.fn();
    render(
      <AuditLogTimeRangePicker preset={DEFAULT_AUDIT_TIME_PRESET} onChange={onChange} />
    );

    const allTime = screen.getByRole('radio', { name: 'All time' });
    expect(allTime).toBeInTheDocument();
    fireEvent.click(allTime);
    expect(onChange).toHaveBeenCalledWith('all');
  });

  it('emits an exclusive upper bound for the custom "To" date on Apply', () => {
    const onChange = vi.fn();
    render(
      <AuditLogTimeRangePicker
        preset="custom"
        isoFrom="2026-04-10T05:00:00.000Z"
        isoTo="2026-04-21T05:00:00.000Z"
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /custom date range/i }));

    const fromInput = screen.getByLabelText(/custom range start date/i);
    const toInput = screen.getByLabelText(/custom range end date/i);
    fireEvent.change(fromInput, { target: { value: '2026-04-10' } });
    fireEvent.change(toInput, { target: { value: '2026-04-20' } });

    fireEvent.click(screen.getByRole('button', { name: /^apply$/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const [, fromIso, toIso] = onChange.mock.calls[0];
    expect(typeof fromIso).toBe('string');
    expect(typeof toIso).toBe('string');
    expect(fromIso).toMatch(/2026-04-10/);
    const toMs = new Date(toIso as string).getTime();
    const expectedExclusive = new Date(2026, 3, 21, 0, 0, 0, 0).getTime();
    expect(toMs).toBe(expectedExclusive);
  });
});
