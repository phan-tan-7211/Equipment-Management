import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerAndroidScanningLibrary,
  CapacitorBarcodeScannerCameraDirection,
  CapacitorBarcodeScannerScanOrientation,
  CapacitorBarcodeScannerTypeHint,
} from '@capacitor/barcode-scanner';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { AlertCircle, Camera, RotateCcw, Upload, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { parseEquipQRTarget } from '@/utils/qr';
import { prepareScanFeedback, playDirectScanFeedbackTone } from '@/lib/scanFeedback';

type Phase = 'ready' | 'starting' | 'decoded' | 'error';
type DecodeSource = 'camera' | 'upload';

function nativeScannerErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const normalized = message.toLowerCase();

  if (normalized.includes('permission') || normalized.includes('denied')) {
    return 'Camera permission is required. Enable Camera in Android Settings > Apps > Equipment Management > Permissions, then retry.';
  }

  if (normalized.includes('cancel')) {
    return '';
  }

  return message || 'The native QR scanner could not start. Try again or upload a QR image.';
}

const NativeEquipmentScanner: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handledDecodeRef = useRef(false);

  const [phase, setPhase] = useState<Phase>('ready');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isImageScanning, setIsImageScanning] = useState(false);

  const handleDecodedPayload = useCallback(
    async (raw: string, source: DecodeSource) => {
      if (handledDecodeRef.current) return;

      const parsed = parseEquipQRTarget(raw);
      if (!parsed.ok) {
        handledDecodeRef.current = true;
        setPhase('error');
        setErrorMessage(parsed.message);
        return;
      }

      handledDecodeRef.current = true;
      setPhase('decoded');
      setErrorMessage(null);

      if (source === 'camera') {
        try {
          await Haptics.notification({ type: NotificationType.Success });
        } catch {
          // Haptics are enhancement-only; QR navigation must still continue.
        }

        // Audio is prepared from the Start button user gesture before the native
        // scanner opens, so the success ping can play when control returns.
        playDirectScanFeedbackTone();
      }

      navigate(parsed.path);
    },
    [navigate]
  );

  const handleStartNativeScan = async () => {
    handledDecodeRef.current = false;
    setErrorMessage(null);
    setPhase('starting');

    // Unlock WebAudio from the explicit user gesture before Android opens the
    // native scanner activity.
    prepareScanFeedback();

    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
        cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
        scanOrientation: CapacitorBarcodeScannerScanOrientation.ADAPTIVE,
        scanInstructions: 'Align the EquipQR code inside the frame',
        scanButton: false,
        scanText: 'Scan QR',
        cancelButtonAccessibilityLabel: 'Cancel QR scan',
        torchButtonOnAccessibilityLabel: 'Turn flashlight off',
        torchButtonOffAccessibilityLabel: 'Turn flashlight on',
        android: {
          scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.MLKIT,
        },
      });

      if (!result.ScanResult) {
        setPhase('ready');
        return;
      }

      await handleDecodedPayload(result.ScanResult, 'camera');
    } catch (error) {
      const message = nativeScannerErrorMessage(error);
      if (!message) {
        setPhase('ready');
        return;
      }

      setPhase('error');
      setErrorMessage(message);
    }
  };

  const handleImageSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    handledDecodeRef.current = false;
    setIsImageScanning(true);
    setErrorMessage(null);

    try {
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      await handleDecodedPayload(result.data, 'upload');
    } catch {
      setPhase('error');
      setErrorMessage('No QR code found in this image. Try another photo or use the native camera scanner.');
    } finally {
      setIsImageScanning(false);
    }
  };

  const handleRetry = () => {
    handledDecodeRef.current = false;
    setErrorMessage(null);
    setPhase('ready');
  };

  return (
    <div className="mx-auto w-full max-w-lg space-y-4 p-4 pb-24 md:pb-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Scan QR</CardTitle>
          <p className="text-sm text-muted-foreground">
            Android native scanner uses the rear camera and ML Kit for fast EquipQR scanning.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive" role="alert">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="space-y-3">
                <p>{errorMessage}</p>
                <Button type="button" variant="outline" size="sm" onClick={handleRetry}>
                  <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {phase === 'decoded' && (
            <Alert>
              <AlertDescription>QR recognized. Opening equipment…</AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <Camera className="h-4 w-4" aria-hidden />
              <span className="font-medium">Native Android camera</span>
            </div>
            <p className="mt-2">
              Camera permission is requested by Android. The scanner opens with the rear camera and includes a flashlight control for low-light areas.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 [&>button]:min-h-[44px]">
            <Button
              type="button"
              onClick={() => void handleStartNativeScan()}
              disabled={phase === 'starting' || phase === 'decoded'}
              data-testid="scanner-start-native-camera"
            >
              <Camera className="mr-2 h-4 w-4" aria-hidden />
              {phase === 'starting' ? 'Opening camera…' : 'Start native QR scan'}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isImageScanning || phase === 'decoded'}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" aria-hidden />
              {isImageScanning ? 'Reading image…' : 'Upload QR image'}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => void handleImageSelected(event)}
              disabled={isImageScanning}
              aria-label="Upload an image containing a QR code"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-3.5 w-3.5" aria-hidden />
            <span>Flash/torch is available inside the native scanner.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NativeEquipmentScanner;
