import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CookieConsentBanner } from '@/components/privacy/CookieConsentBanner';
import * as initialModule from '@/contexts/CookieConsentContext';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

type CookieConsentModule = typeof initialModule;

/**
 * Vite HMR re-executes `CookieConsentContext.tsx` (it exports a provider and
 * hooks, so it is not a Fast Refresh boundary) under a new `?t=` URL. A query
 * suffix gives the same fresh module instance here while its imports stay
 * shared, exactly like the browser after a hot update.
 */
async function importHotReloadedModule(): Promise<CookieConsentModule> {
  return (await import(
    /* @vite-ignore */ `${'@/contexts/CookieConsentContext'}?hmr=${Date.now()}`
  )) as CookieConsentModule;
}

function ConsentProbe({ useConsent }: { useConsent: CookieConsentModule['useCookieConsent'] }) {
  const { needsConsent } = useConsent();
  return <p>needsConsent:{String(needsConsent)}</p>;
}

describe('CookieConsentContext across hot reloads', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('re-evaluating the module yields a distinct provider but the same context', async () => {
    const reloaded = await importHotReloadedModule();

    expect(reloaded.CookieConsentProvider).not.toBe(initialModule.CookieConsentProvider);

    const { unmount } = render(
      <reloaded.CookieConsentProvider>
        <ConsentProbe useConsent={initialModule.useCookieConsent} />
      </reloaded.CookieConsentProvider>,
    );
    expect(screen.getByText('needsConsent:true')).toBeInTheDocument();
    unmount();

    render(
      <initialModule.CookieConsentProvider>
        <ConsentProbe useConsent={reloaded.useCookieConsent} />
      </initialModule.CookieConsentProvider>,
    );
    expect(screen.getByText('needsConsent:true')).toBeInTheDocument();
  });

  it('keeps the banner rendering when only the provider module was hot-swapped', async () => {
    const reloaded = await importHotReloadedModule();

    render(
      <MemoryRouter>
        <reloaded.CookieConsentProvider>
          <CookieConsentBanner />
        </reloaded.CookieConsentProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('region', { name: /cookie consent/i })).toBeInTheDocument();
  });
});
