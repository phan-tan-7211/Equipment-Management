import React from 'react';
import { render, screen, fireEvent, waitFor } from '@vitest-harness/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AuditLogDetailPanel } from './AuditLogDetailPanel';
import { FormattedAuditEntry } from '@/types/audit';
import { I18nProvider } from '@/i18n/I18nProvider';

const sampleEntry: FormattedAuditEntry = {
  id: 'entry-123',
  organization_id: 'org-456',
  entity_type: 'equipment',
  entity_id: 'equip-789',
  entity_name: 'Forklift A',
  action: 'UPDATE',
  actor_id: 'actor-001',
  actor_name: 'Test User',
  actor_email: 'test@example.com',
  changes: {
    status: { old: 'active', new: 'inactive' },
  },
  metadata: { team_id: 'team-1' },
  created_at: '2026-04-20T10:00:00.000Z',
  actionLabel: 'Updated',
  entityTypeLabel: 'Equipment',
  formattedDate: 'Apr 20, 2026 10:00 AM',
  relativeTime: '2 hours ago',
  changeCount: 1,
};

describe('AuditLogDetailPanel', () => {
  it.each([
    ['vi', 'Chi tiết bản ghi', 'Đã cập nhật'],
    ['ko', '기록 상세', '업데이트됨'],
  ])('localizes detail labels in %s while preserving the audit values', (language, heading, action) => {
    window.localStorage.setItem('znteqr-language', language);
    try {
      render(<I18nProvider><AuditLogDetailPanel entry={sampleEntry} /></I18nProvider>);
      expect(screen.getByText(heading)).toBeInTheDocument();
      expect(screen.getAllByText(action).length).toBeGreaterThan(0);
      expect(screen.getByRole('heading', { name: 'Forklift A' })).toBeInTheDocument();
      expect(screen.getByText('2026-04-20T10:00:00.000Z')).toBeInTheDocument();
    } finally {
      window.localStorage.removeItem('znteqr-language');
    }
  });

  it('renders the empty state when no entry is selected', () => {
    render(<AuditLogDetailPanel entry={null} />);
    expect(screen.getByTestId('audit-detail-empty')).toBeInTheDocument();
    expect(screen.getByText(/No entry selected/i)).toBeInTheDocument();
  });

  it('renders the entry header and Overview tab by default', () => {
    render(<AuditLogDetailPanel entry={sampleEntry} />);

    expect(screen.getByTestId('audit-detail-panel')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Forklift A/i })).toBeInTheDocument();
    // Overview tab is selected by default and shows "Entry Details" section.
    expect(screen.getByText(/Entry Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Identifiers/i)).toBeInTheDocument();
  });

  it('shows audit instant as ISO-8601 Zulu in Overview', () => {
    render(<AuditLogDetailPanel entry={sampleEntry} />);

    expect(screen.getByText('2026-04-20T10:00:00.000Z')).toBeInTheDocument();
  });

  it('switches to the Changes tab and renders the diff', async () => {
    const user = userEvent.setup();
    render(<AuditLogDetailPanel entry={sampleEntry} />);

    await user.click(screen.getByRole('tab', { name: /Changes/i }));

    // The ChangesDiff component renders the field name "status" once selected.
    expect(await screen.findByText(/status/i)).toBeInTheDocument();
  });

  it('switches to the JSON tab and renders the raw entry', async () => {
    const user = userEvent.setup();
    render(<AuditLogDetailPanel entry={sampleEntry} />);

    await user.click(screen.getByRole('tab', { name: /JSON/i }));

    const jsonBlock = await screen.findByTestId('audit-detail-json');
    expect(jsonBlock).toHaveTextContent('"id": "entry-123"');
    expect(jsonBlock).toHaveTextContent('"entity_id": "equip-789"');
  });

  it('writes the entry id to the clipboard when the copy button is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    render(<AuditLogDetailPanel entry={sampleEntry} />);

    const copyButtons = screen.getAllByRole('button', { name: /Copy to clipboard/i });
    expect(copyButtons.length).toBeGreaterThan(0);

    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('entry-123');
    });
  });
});
