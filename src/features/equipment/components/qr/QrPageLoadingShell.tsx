import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/i18n';

interface QrPageLoadingShellProps {
  message?: string;
}

export default function QrPageLoadingShell({ message }: QrPageLoadingShellProps) {
  const { t } = useI18n();
  const resolvedMessage = message ?? t('equipmentQRScan.loadingScanned');

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">{resolvedMessage}</p>
        </CardContent>
      </Card>
    </div>
  );
}
