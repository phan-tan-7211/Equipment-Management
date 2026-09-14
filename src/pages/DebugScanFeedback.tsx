import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getScanFeedbackDebugInfo,
  markScanFeedbackPending,
  playDirectScanFeedbackTone,
  prepareScanFeedback,
  triggerPendingScanFeedback,
} from '@/lib/scanFeedback';
import { useI18n } from '@/i18n';

/**
 * Development-only page to critique scan feedback audio/haptics.
 * Route is registered only when `import.meta.env.DEV` is true (see App.tsx).
 */
const DebugScanFeedback: React.FC = () => {
  const { t } = useI18n();
  const [info, setInfo] = useState(() => getScanFeedbackDebugInfo());

  const refresh = useCallback(() => {
    setInfo(getScanFeedbackDebugInfo());
  }, []);

  const handlePrepare = () => {
    prepareScanFeedback();
    refresh();
  };

  const handleMarkPending = () => {
    markScanFeedbackPending();
    refresh();
  };

  const handleTriggerPending = () => {
    triggerPendingScanFeedback();
    refresh();
  };

  const handleDirectTone = () => {
    playDirectScanFeedbackTone();
    refresh();
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-lg space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('authRoutes.scanDebugTitle')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('authRoutes.scanDebugLead')} <strong>{t('authRoutes.liveCamera')}</strong> {t('authRoutes.scanDebugEnd')}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t('authRoutes.webAudio')}</dt>
                <dd>{info.webAudioSupported ? t('authRoutes.supported') : t('authRoutes.unavailable')}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t('authRoutes.sharedAudioContext')}</dt>
                <dd>{info.contextState ?? t('authRoutes.noContext')}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t('authRoutes.vibrationApi')}</dt>
                <dd>{info.vibrationSupported ? t('authRoutes.supported') : t('authRoutes.unavailable')}</dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={handlePrepare}>
                {t('authRoutes.prepareAudio')}
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={handleDirectTone}>
                {t('authRoutes.directTone')}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleMarkPending}>
                {t('authRoutes.markPending')}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleTriggerPending}>
                {t('authRoutes.consumePending')}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {t('authRoutes.scanDebugHelp')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DebugScanFeedback;
