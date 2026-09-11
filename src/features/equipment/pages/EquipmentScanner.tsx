import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import { AlertCircle, Camera, RotateCcw, Upload, Zap, ZapOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { parseEquipQRTarget, type ParseEquipQRTargetResult } from '@/utils/qr';
import {
  getCameraAccessErrorCode,
  type CameraAccessErrorCode,
} from '@/features/equipment/utils/cameraAccessErrors';
import { useScanFeedback } from '@/hooks/useScanFeedback';
import { useI18n } from '@/i18n';

const BACK_CAMERA_LABEL_PATTERN = /\b(back|rear|environment|world|wide|telephoto)\b/i;

type Phase =
  | 'ready'
  | 'checking'
  | 'starting'
  | 'scanning'
  | 'decoded'
  | 'error'
  | 'no-camera';

type DecodeSource = 'camera' | 'upload';
type ParseErrorReason = Extract<ParseEquipQRTargetResult, { ok: false }>['reason'];

const CAMERA_ERROR_KEYS: Record<CameraAccessErrorCode, string> = {
  policy_blocked: 'equipmentScanner.cameraPolicyBlocked',
  permission_denied: 'equipmentScanner.cameraDenied',
  not_found: 'equipmentScanner.cameraNotFound',
  not_readable: 'equipmentScanner.cameraNotReadable',
  unknown: 'equipmentScanner.cameraFallback',
};

const PARSE_ERROR_KEYS: Record<ParseErrorReason, string> = {
  empty: 'equipmentScanner.parseEmpty',
  malformed: 'equipmentScanner.parseMalformed',
  external: 'equipmentScanner.parseExternal',
  unsupported: 'equipmentScanner.parseUnsupported',
};

function getPreferredListedCameraId(cameras: QrScanner.Camera[]): string {
  return cameras.find((camera) => BACK_CAMERA_LABEL_PATTERN.test(camera.label))?.id ?? cameras[0]?.id ?? '';
}

const EquipmentScanner: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { prepareFeedback, markPendingFeedback } = useScanFeedback();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const handledDecodeRef = useRef(false);

  const [phase, setPhase] = useState<Phase>('ready');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [cameraRunId, setCameraRunId] = useState(0);
  const [cameras, setCameras] = useState<QrScanner.Camera[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [isImageScanning, setIsImageScanning] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');

  const stopScannerSafe = useCallback(() => {
    try {
      scannerRef.current?.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const destroyScannerSafe = useCallback(() => {
    try {
      scannerRef.current?.destroy();
    } catch {
      /* ignore */
    }
    scannerRef.current = null;
  }, []);

  const handleDecodedPayload = useCallback(
    (raw: string, source: DecodeSource) => {
      if (handledDecodeRef.current) return;
      const parsed = parseEquipQRTarget(raw);
      if (!parsed.ok) {
        const message = t(PARSE_ERROR_KEYS[parsed.reason]);
        handledDecodeRef.current = true;
        stopScannerSafe();
        setPhase('error');
        setErrorMessage(message);
        setLiveMessage(message);
        return;
      }
      handledDecodeRef.current = true;
      stopScannerSafe();
      setPhase('decoded');
      setLiveMessage(t('equipmentScanner.recognized'));
      if (source === 'camera') {
        markPendingFeedback();
      }
      navigate(parsed.path);
    },
    [markPendingFeedback, navigate, stopScannerSafe, t],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    if (cameraRunId === 0) {
      setPhase('ready');
      return () => {
        cancelled = true;
      };
    }

    handledDecodeRef.current = false;
    destroyScannerSafe();
    setErrorMessage(null);
    setCameras([]);
    setSelectedCameraId('');
    setHasFlash(false);
    setFlashOn(false);

    const run = async () => {
      setPhase('checking');
      try {
        const hasCam = await QrScanner.hasCamera();
        if (cancelled) return;
        if (!hasCam) {
          setPhase('no-camera');
          return;
        }

        setPhase('starting');
        const scanner = new QrScanner(
          video,
          (result) => {
            handleDecodedPayload(result.data, 'camera');
          },
          {
            onDecodeError: () => {
              /* expected noise between frames */
            },
            preferredCamera: 'environment',
            highlightScanRegion: true,
            highlightCodeOutline: true,
            returnDetailedScanResult: true,
          },
        );
        scannerRef.current = scanner;

        await scanner.start();
        if (cancelled) {
          scanner.destroy();
          scannerRef.current = null;
          return;
        }

        setPhase('scanning');

        const listed = await QrScanner.listCameras(true);
        if (!cancelled && listed.length > 0) {
          setCameras(listed);
          setSelectedCameraId(getPreferredListedCameraId(listed));
        }

        const hf = await scanner.hasFlash();
        if (!cancelled) setHasFlash(hf);
      } catch (error) {
        if (!cancelled) {
          setPhase('error');
          setErrorMessage(t(CAMERA_ERROR_KEYS[getCameraAccessErrorCode(error)]));
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      destroyScannerSafe();
    };
  }, [cameraRunId, retryKey, destroyScannerSafe, handleDecodedPayload, t]);

  const handleCameraChange = async (cameraId: string) => {
    const scanner = scannerRef.current;
    if (!scanner || phase !== 'scanning') return;

    setSelectedCameraId(cameraId);
    setFlashOn(false);
    try {
      await scanner.setCamera(cameraId);
      const hf = await scanner.hasFlash();
      setHasFlash(hf);
    } catch (error) {
      setHasFlash(false);
      setPhase('error');
      setErrorMessage(t(CAMERA_ERROR_KEYS[getCameraAccessErrorCode(error)]));
    }
  };

  const handleTorchToggle = async () => {
    const scanner = scannerRef.current;
    if (!scanner || !hasFlash) return;
    try {
      await scanner.toggleFlash();
      setFlashOn(scanner.isFlashOn());
    } catch {
      /* ignore unsupported torch */
    }
  };

  const handleImageSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsImageScanning(true);
    setErrorMessage(null);
    try {
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      handleDecodedPayload(result.data, 'upload');
    } catch {
      setPhase('error');
      setErrorMessage(t('equipmentScanner.noQrInImage'));
    } finally {
      setIsImageScanning(false);
    }
  };

  const handleRetry = () => {
    handledDecodeRef.current = false;
    setErrorMessage(null);
    setRetryKey((key) => key + 1);
  };

  const handleStartCameraScan = () => {
    setErrorMessage(null);
    prepareFeedback();
    setCameraRunId((runId) => runId + 1);
  };

  const showCameraPreview =
    phase === 'checking' || phase === 'starting' || phase === 'scanning';

  const placeholderMessage = (() => {
    if (phase === 'ready') {
      return t('equipmentScanner.readyHint');
    }
    if (phase === 'checking' || phase === 'starting') {
      return t('equipmentScanner.startingCamera');
    }
    return null;
  })();

  return (
    <div className="mx-auto w-full max-w-lg space-y-4 p-4 pb-24 md:pb-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">{t('equipmentScanner.title')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('equipmentScanner.description')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
            {liveMessage}
          </div>
          {(phase === 'error' || (phase === 'no-camera' && errorMessage)) && errorMessage && (
            <Alert variant="destructive" role="alert">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>{errorMessage}</span>
                <Button type="button" variant="outline" size="sm" onClick={handleRetry} className="shrink-0">
                  <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
                  {t('equipmentScanner.retryScan')}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {phase === 'no-camera' && !errorMessage && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t('equipmentScanner.noCamera')}</AlertDescription>
            </Alert>
          )}

          {phase === 'decoded' && (
            <Alert>
              <AlertDescription data-testid="scanner-decoded-state">
                {t('equipmentScanner.openingLink')}
              </AlertDescription>
            </Alert>
          )}

          <div
            className="relative overflow-hidden rounded-lg border bg-black aspect-[4/3]"
            data-testid="scanner-video-container"
          >
            <video
              ref={videoRef}
              className={`h-full w-full object-cover ${showCameraPreview ? 'block' : 'hidden'}`}
              muted
              playsInline
              aria-label={t('equipmentScanner.cameraPreviewAria')}
            />
            {!showCameraPreview && phase !== 'decoded' && (
              <div className="flex h-full min-h-[200px] items-center justify-center px-4 text-center text-sm text-muted-foreground">
                {placeholderMessage}
              </div>
            )}
          </div>

          {phase === 'scanning' && cameras.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="scanner-camera-select">{t('equipmentScanner.camera')}</Label>
              <Select value={selectedCameraId} onValueChange={(cameraId) => void handleCameraChange(cameraId)}>
                <SelectTrigger id="scanner-camera-select">
                  <SelectValue placeholder={t('equipmentScanner.chooseCamera')} />
                </SelectTrigger>
                <SelectContent>
                  {cameras.map((camera) => (
                    <SelectItem key={camera.id} value={camera.id}>
                      {camera.label || camera.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-wrap gap-2 [&>button]:min-h-[44px]">
            {phase === 'ready' && (
              <Button
                type="button"
                variant="default"
                size="sm"
                data-testid="scanner-start-camera"
                onClick={handleStartCameraScan}
              >
                <Camera className="mr-2 h-4 w-4" aria-hidden />
                {t('equipmentScanner.startCamera')}
              </Button>
            )}

            {phase === 'scanning' && hasFlash && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleTorchToggle()}
                aria-pressed={flashOn}
                aria-label={
                  flashOn
                    ? t('equipmentScanner.turnFlashOff')
                    : t('equipmentScanner.turnFlashOn')
                }
              >
                {flashOn ? (
                  <>
                    <ZapOff className="mr-2 h-4 w-4" aria-hidden />
                    {t('equipmentScanner.flashOff')}
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" aria-hidden />
                    {t('equipmentScanner.flashOn')}
                  </>
                )}
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isImageScanning}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" aria-hidden />
              {isImageScanning
                ? t('equipmentScanner.readingImage')
                : t('equipmentScanner.uploadQrImage')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => void handleImageSelected(event)}
              disabled={isImageScanning}
              aria-label={t('equipmentScanner.uploadImageAria')}
            />

            {(phase === 'error' || phase === 'no-camera') && (
              <Button type="button" variant="default" size="sm" onClick={handleRetry}>
                <Camera className="mr-2 h-4 w-4" aria-hidden />
                {t('equipmentScanner.retryCamera')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentScanner;
