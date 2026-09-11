import { MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

type MapsUnavailableRetryPanelProps = {
  mapHeight: string;
  onRetry: () => void;
};

export function MapsUnavailableRetryPanel({ mapHeight, onRetry }: MapsUnavailableRetryPanelProps) {
  const { t } = useI18n();

  return (
    <div
      className="rounded-lg border border-dashed border-destructive/40 bg-destructive/5 flex flex-col items-center justify-center gap-2 px-4 text-center"
      style={{ height: mapHeight }}
    >
      <MapPin className="h-6 w-6 text-destructive/70" />
      <p className="text-xs text-muted-foreground">{t('equipmentLocation.mapUnavailable')}</p>
      <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={onRetry}>
        <RefreshCw className="h-3 w-3" />
        {t('equipmentLocation.retry')}
      </Button>
    </div>
  );
}
