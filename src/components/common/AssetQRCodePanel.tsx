import React from 'react';
import { Capacitor } from '@capacitor/core';
import { Media } from '@capacitor-community/media';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Copy, CheckCircle, ExternalLink, ChevronRight, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateQRDataUrl } from '@/utils/qr';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useI18n } from '@/i18n';

type QrDownloadFormat = 'png' | 'jpg';

const ANDROID_QR_ALBUM_NAME = 'EquipQR';

export interface AssetQRCodePanelProps {
  entityId: string;
  entityName?: string;
  qrCodeUrl: string;
  qrImageAlt: string;
  defaultFilenameStem: string;
  instructionBullets: string[];
  imageLoading?: 'lazy';
  showCloseButton?: boolean;
  onClose?: () => void;
  qrImageTestId?: string;
  urlTestId?: string;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

async function getOrCreateAndroidQrAlbum(): Promise<string> {
  const albumsPath = (await Media.getAlbumsPath()).path;
  let { albums } = await Media.getAlbums();

  let album = albums.find(
    (candidate) =>
      candidate.name === ANDROID_QR_ALBUM_NAME &&
      candidate.identifier.startsWith(albumsPath)
  );

  if (!album) {
    await Media.createAlbum({ name: ANDROID_QR_ALBUM_NAME });
    ({ albums } = await Media.getAlbums());
    album = albums.find(
      (candidate) =>
        candidate.name === ANDROID_QR_ALBUM_NAME &&
        candidate.identifier.startsWith(albumsPath)
    );
  }

  if (!album) {
    throw new Error('Could not create the EquipQR gallery album.');
  }

  return album.identifier;
}

const AssetQRCodePanel: React.FC<AssetQRCodePanelProps> = ({
  entityId,
  entityName,
  qrCodeUrl,
  qrImageAlt,
  defaultFilenameStem,
  instructionBullets,
  imageLoading,
  showCloseButton = false,
  onClose,
  qrImageTestId,
  urlTestId,
}) => {
  const { t } = useI18n();
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [instructionsOpen, setInstructionsOpen] = React.useState(false);
  const isMobile = useIsMobile();

  const generateQRCode = React.useCallback(async () => {
    try {
      const dataUrl = await generateQRDataUrl(qrCodeUrl);
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error(t('qrCommon.generateFailed'));
    }
  }, [qrCodeUrl, t]);

  React.useEffect(() => {
    if (entityId) {
      generateQRCode();
    }
  }, [entityId, generateQRCode]);

  const baseFilename = entityName ? sanitizeFilename(entityName) : defaultFilenameStem;

  const downloadQRCode = async (format: QrDownloadFormat) => {
    if (!qrCodeDataUrl) return;

    try {
      const QRCode = (await import('qrcode')).default;
      const dataUrl = await QRCode.toDataURL(qrCodeUrl, {
        width: 256,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
        type: format === 'jpg' ? 'image/jpeg' : 'image/png',
      });

      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        const albumIdentifier = await getOrCreateAndroidQrAlbum();
        await Media.savePhoto({
          path: dataUrl,
          albumIdentifier,
          fileName: `${baseFilename}-qr`,
        });

        toast.success(`QR saved to Gallery > ${ANDROID_QR_ALBUM_NAME}`);
        return;
      }

      const link = document.createElement('a');
      link.download = `${baseFilename}-qr.${format}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(t('qrCommon.downloaded', { format: format.toUpperCase() }));
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error(t('qrCommon.downloadFailed'));
    }
  };

  const copyQRCodeUrl = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeUrl);
      setCopied(true);
      toast.success(t('qrCommon.copiedSuccess'));
    } catch (error) {
      console.error('Failed to copy URL:', error);
      toast.error(t('qrCommon.copyFailed'));
    }
  };

  return (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
      <div className="flex justify-center">
        {qrCodeDataUrl ? (
          <div className={`${isMobile ? 'p-2' : 'p-4'} bg-background rounded-lg border`}>
            <img
              src={qrCodeDataUrl}
              alt={qrImageAlt}
              loading={imageLoading}
              className={isMobile ? 'w-48 h-48' : 'w-64 h-64'}
              data-testid={qrImageTestId}
            />
          </div>
        ) : (
          <div
            className={`${isMobile ? 'w-48 h-48' : 'w-64 h-64'} bg-muted rounded-lg flex items-center justify-center`}
          >
            <div className="text-muted-foreground text-center px-2">{t('qrCommon.generating')}</div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">{t('qrCommon.urlLabel')}</span>
        <div className="flex items-center gap-2">
          <div
            className="flex-1 p-2 bg-muted rounded border text-sm font-mono break-all text-muted-foreground"
            data-testid={urlTestId}
          >
            {qrCodeUrl}
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyQRCodeUrl}
              className="flex items-center gap-1"
              aria-label={t('qrCommon.copyAria')}
              disabled={copied}
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-primary" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? t('qrCommon.copied') : t('qrCommon.copy')}
            </Button>
            {copied && (
              <Button variant="outline" size="sm" asChild className="flex items-center gap-1">
                <a href={qrCodeUrl} target="_blank" rel="noopener noreferrer" aria-label={t('qrCommon.openAria')}>
                  <ExternalLink className="h-4 w-4" />
                  {t('qrCommon.test')}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <Collapsible
        open={instructionsOpen}
        onOpenChange={setInstructionsOpen}
        className="text-sm text-muted-foreground bg-muted rounded-lg"
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 p-3 text-left font-medium text-foreground rounded-lg transition-colors hover:bg-muted/80 motion-reduce:transition-none group">
          {t('qrCommon.howToUse')}
          <ChevronRight
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none group-data-[state=open]:rotate-90"
            aria-hidden
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="list-disc list-inside space-y-1 px-3 pb-3 text-xs">
            {instructionBullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex gap-2">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button disabled={!qrCodeDataUrl} className="flex-1">
              <Download className="h-4 w-4" />
              {t('qrCommon.download')}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              {Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
                ? `Save to Gallery > ${ANDROID_QR_ALBUM_NAME}`
                : t('qrCommon.downloadFormat')}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                void downloadQRCode('png');
              }}
              className="cursor-pointer"
            >
              <div className="flex flex-col">
                <span>PNG</span>
                <span className="text-[10px] text-muted-foreground">{`${baseFilename}-qr.png`}</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                void downloadQRCode('jpg');
              }}
              className="cursor-pointer"
            >
              <div className="flex flex-col">
                <span>JPG</span>
                <span className="text-[10px] text-muted-foreground">{`${baseFilename}-qr.jpg`}</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {showCloseButton && onClose && (
          <Button variant="outline" onClick={onClose} className="flex-1 min-h-11">
            {t('qrCommon.close')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default AssetQRCodePanel;
