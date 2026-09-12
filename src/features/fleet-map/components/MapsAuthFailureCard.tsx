import React from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import {
  MAPS_REFERRER_RUNBOOK_URL,
  type MapsAuthFailure,
} from '@/features/fleet-map/utils/mapsAuthFailure';

/**
 * Inline diagnostic rendered when Google Maps rejects the browser API key for
 * the current URL (`RefererNotAllowedMapError`). Surfaces the exact wildcard
 * referrer entry the operator must add to the API key's HTTP-referrer
 * allowlist (plus the current page URL for cross-reference with Google's own
 * console message) and links to the runbook. A simple page reload is the only
 * reliable retry — the bad key has already been baked into the cached Maps JS
 * bundle. See issue #617 follow-up.
 */
export const MapsAuthFailureCard: React.FC<{ failure: MapsAuthFailure }> = ({ failure }) => {
  const { t } = useI18n();
  return (
  <div
    className="flex items-center justify-center min-h-[400px] p-4"
    role="alert"
    aria-live="assertive"
    data-testid="maps-auth-failure-card"
  >
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        <CardTitle className="text-xl">{t('fleetMap.authTitle')}</CardTitle>
        <CardDescription>
          {t('fleetMap.authDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md space-y-2">
          <div>
            <p className="text-sm text-destructive font-medium">{t('fleetMap.referrerEntry')}</p>
            <p
              className="text-sm font-mono break-all text-muted-foreground mt-1"
              data-testid="maps-auth-failure-allowlist-entry"
            >
              {failure.allowlistEntry}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('fleetMap.currentUrl')}</p>
            <p
              className="text-xs font-mono break-all text-muted-foreground mt-1"
              data-testid="maps-auth-failure-current-url"
            >
              {failure.currentUrl}
            </p>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">{t('fleetMap.howToFix')}</p>
          <ol className="space-y-1 list-decimal list-inside">
            <li>{t('fleetMap.authStep1')}</li>
            <li>
              {t('fleetMap.authStep2Prefix')} <code className="font-mono text-xs">GOOGLE_MAPS_BROWSER_KEY</code>
              {' '}{t('fleetMap.authStep2Suffix')}
            </li>
            <li>
              {t('fleetMap.authStep3Prefix')} <strong>{t('fleetMap.authAllowlist')}</strong> {' '}
              {t('fleetMap.authStep3Middle')} <code className="font-mono text-xs">/*</code> {' '}
              {t('fleetMap.authStep3Suffix')}
            </li>
            <li>{t('fleetMap.authStep4')}</li>
          </ol>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={() => window.location.reload()}
            className="flex-1"
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('fleetMap.tryAgain')}
          </Button>
          <Button
            onClick={() => window.open(MAPS_REFERRER_RUNBOOK_URL, '_blank', 'noopener,noreferrer')}
            className="flex-1"
            variant="ghost"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {t('fleetMap.viewRunbook')}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
  );
};
