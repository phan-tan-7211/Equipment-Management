import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import type { PlaceLocationData } from '@/components/ui/GooglePlacesAutocomplete';
import { CenterPinMapPicker } from '@/components/location/CenterPinMapPicker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  buildLiveLocationPlaceData,
  DeviceGeolocationError,
  requestCurrentDevicePosition,
  type DeviceGeolocationErrorCode,
  type LatLng,
} from '@/components/location/liveLocationCapture';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';
import { useIsDarkTheme } from '@/hooks/useThemeVersion';
import { useI18n } from '@/i18n';

type LiveLocationCaptureDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: PlaceLocationData) => Promise<void>;
  isSaving?: boolean;
  title?: string;
  confirmLabel?: string;
  initialPosition?: LatLng | null;
};

const GEO_ERROR_KEYS: Record<DeviceGeolocationErrorCode, string> = {
  unsupported: 'equipmentLocation.geoUnsupported',
  permission_denied: 'equipmentLocation.geoPermissionDenied',
  position_unavailable: 'equipmentLocation.geoPositionUnavailable',
  timeout: 'equipmentLocation.geoTimeout',
  unknown: 'equipmentLocation.geoUnknown',
};

export function LiveLocationCaptureDialog({
  open,
  onOpenChange,
  onConfirm,
  isSaving = false,
  title,
  confirmLabel,
  initialPosition = null,
}: LiveLocationCaptureDialogProps) {
  const { t } = useI18n();
  const isDark = useIsDarkTheme();
  const {
    googleMapsKey,
    mapId,
    isLoading: isKeyLoading,
    error: keyError,
  } = useGoogleMapsKey();

  const [pendingPosition, setPendingPosition] = useState<LatLng | null>(initialPosition);
  const [recenterTarget, setRecenterTarget] = useState<LatLng | null>(initialPosition);
  const [recenterKey, setRecenterKey] = useState(initialPosition ? 1 : 0);
  const [wasAdjusted, setWasAdjusted] = useState(false);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'detected' | 'error'>(
    initialPosition ? 'detected' : 'idle',
  );
  const [errorCode, setErrorCode] = useState<DeviceGeolocationErrorCode | null>(null);

  const resetState = useCallback(() => {
    setPendingPosition(initialPosition);
    setRecenterTarget(initialPosition);
    setRecenterKey(initialPosition ? 1 : 0);
    setWasAdjusted(false);
    setGeoStatus(initialPosition ? 'detected' : 'idle');
    setErrorCode(null);
  }, [initialPosition]);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  const handleRequestLocation = useCallback(async () => {
    setGeoStatus('loading');
    setErrorCode(null);

    try {
      const position = await requestCurrentDevicePosition();
      setPendingPosition(position);
      setRecenterTarget(position);
      setRecenterKey((current) => current + 1);
      setWasAdjusted(false);
      setGeoStatus('detected');
    } catch (error) {
      setGeoStatus('error');
      setErrorCode(error instanceof DeviceGeolocationError ? error.code : 'unknown');
    }
  }, []);

  const handleMapCenterChange = useCallback((center: LatLng) => {
    setPendingPosition(center);
    setWasAdjusted(true);
    setGeoStatus('detected');
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!pendingPosition) {
      return;
    }

    await onConfirm(buildLiveLocationPlaceData(pendingPosition, { wasAdjusted }));
    onOpenChange(false);
  }, [onConfirm, onOpenChange, pendingPosition, wasAdjusted]);

  const canConfirm = geoStatus === 'detected' && pendingPosition != null && !isSaving;
  const resolvedTitle = title ?? t('equipmentLocation.captureDefaultTitle');
  const resolvedConfirmLabel = confirmLabel ?? t('equipmentLocation.captureDefaultConfirm');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{resolvedTitle}</DialogTitle>
          <DialogDescription>{t('equipmentLocation.captureDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {geoStatus !== 'detected' ? (
            <div className="rounded-md border border-dashed bg-muted/20 p-4 text-center">
              <MapPin className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                {t('equipmentLocation.locationRequestNotice')}
              </p>
              <Button
                type="button"
                className="mt-3 gap-2"
                onClick={() => void handleRequestLocation()}
                disabled={geoStatus === 'loading' || isSaving}
              >
                {geoStatus === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                {t('equipmentLocation.useCurrentLocation')}
              </Button>
              {errorCode ? (
                <p className="mt-3 text-sm text-destructive">{t(GEO_ERROR_KEYS[errorCode])}</p>
              ) : null}
            </div>
          ) : null}

          {geoStatus === 'detected' && pendingPosition ? (
            <div className="space-y-2">
              {isKeyLoading ? (
                <div className="flex h-64 items-center justify-center rounded-lg border bg-muted/30">
                  <p className="text-sm text-muted-foreground">{t('equipmentLocation.loadingMapPreview')}</p>
                </div>
              ) : keyError || !googleMapsKey ? (
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted/30 px-4 text-center">
                  <p className="text-sm text-muted-foreground">{t('equipmentLocation.mapPreviewUnavailable')}</p>
                </div>
              ) : (
                <CenterPinMapPicker
                  center={pendingPosition}
                  recenterTarget={recenterTarget}
                  recenterKey={recenterKey}
                  onCenterChange={handleMapCenterChange}
                  googleMapsKey={googleMapsKey}
                  mapId={mapId}
                  isDark={isDark}
                  className="rounded-lg border"
                />
              )}
              <p className="text-xs text-muted-foreground">
                {t('equipmentLocation.selectedLocation', {
                  lat: pendingPosition.lat.toFixed(5),
                  lng: pendingPosition.lng.toFixed(5),
                })}
                {wasAdjusted ? ` (${t('equipmentLocation.adjustedOnMap')})` : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('equipmentLocation.confirmShadowHint')}
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t('equipmentLocation.cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!canConfirm}
          >
            {isSaving ? t('equipmentLocation.saving') : resolvedConfirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
