import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PlatformAdministration from './PlatformAdministration';

const rpc = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (...args: unknown[]) => rpc(...args) },
}));

vi.mock('@/hooks/useFormatTimestamp', () => ({
  useFormatTimestamp: () => ({ formatDate: (v: string) => v, formatDateTime: (v: string) => v }),
}));

vi.mock('@/i18n', () => ({
  useI18n: () => ({ language: 'en' }),
}));

vi.mock('@/components/i18n/LanguageSwitcher', () => ({
  default: () => null,
}));

function reviewedRequest(index: number, overrides: Record<string, unknown> = {}) {
  return {
    request_id: `request-${index}`,
    user_id: `user-${index}`,
    email: `person${index}@example.com`,
    display_name: `Person ${index}`,
    request_status: index % 2 === 0 ? 'approved' : 'rejected',
    requested_at: '2026-09-28T00:00:00Z',
    organization_id: null,
    organization_name: null,
    assigned_role: null,
    reviewed_at: '2026-09-28T01:00:00Z',
    reviewed_by_name: 'Reviewer',
    rejection_reason: null,
    ...overrides,
  };
}

function renderPage(requests: unknown[]) {
  rpc.mockImplementation((name: string) => {
    if (name === 'platform_list_access_requests') return Promise.resolve({ data: requests, error: null });
    return Promise.resolve({ data: [], error: null });
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PlatformAdministration />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PlatformAdministration request history', () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it('pages through reviewed requests 20 at a time', async () => {
    renderPage(Array.from({ length: 25 }, (_, index) => reviewedRequest(index + 1)));

    expect(await screen.findByText('Person 1')).toBeInTheDocument();
    expect(screen.getByText('1–20 of 25')).toBeInTheDocument();
    expect(screen.queryByText('Person 21')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Person 21')).toBeInTheDocument();
    expect(screen.getByText('21–25 of 25')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('filters history by search term across name, email and organization', async () => {
    renderPage([
      reviewedRequest(1, { organization_name: 'Acme Plant' }),
      reviewedRequest(2),
      reviewedRequest(3, { email: 'someone@acme.test' }),
    ]);

    await screen.findByText('Person 1');
    fireEvent.change(screen.getByRole('textbox', { name: 'Search request history' }), { target: { value: 'acme' } });

    await waitFor(() => expect(screen.queryByText('Person 2')).not.toBeInTheDocument());
    expect(screen.getByText('Person 1')).toBeInTheDocument();
    expect(screen.getByText('Person 3')).toBeInTheDocument();
  });

  it('shows a no-match message when filters exclude every request', async () => {
    renderPage([reviewedRequest(1)]);

    await screen.findByText('Person 1');
    fireEvent.change(screen.getByRole('textbox', { name: 'Search request history' }), { target: { value: 'nobody' } });

    expect(await screen.findByText('No requests match your filters.')).toBeInTheDocument();
  });

  it('keeps pending requests out of the history list', async () => {
    renderPage([reviewedRequest(1), reviewedRequest(2, { request_status: 'pending', display_name: 'Waiting User' })]);

    await screen.findByText('Person 1');
    expect(screen.getAllByText('Waiting User')).toHaveLength(1);
  });
});
