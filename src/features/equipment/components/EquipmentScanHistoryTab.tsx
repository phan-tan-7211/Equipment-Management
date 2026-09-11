import React from 'react';
import {
  Camera,
  ClipboardList,
  Clock,
  Eye,
  ExternalLink,
  History,
  MapPin,
  Navigation,
  QrCode,
  User,
  Wrench,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import ClickableAddress from '@/components/ui/ClickableAddress';
import { cn } from '@/lib/utils';
import {
  useEquipmentScans,
  useEquipmentScanFollowUps,
} from '@/features/equipment/hooks/useEquipment';
import { useEquipmentLocationHistory } from '@/features/equipment/hooks/useEquipmentLocationHistory';
import {
  getCoordinateHistoryRows,
  type EquipmentLocationHistorySource,
} from '@/features/equipment/services/equipmentLocationHistoryService';
import { useFormatTimestamp } from '@/hooks/useFormatTimestamp';
import { buildGoogleMapsUrlFromCoords } from '@/utils/effectiveLocation';
import {
  buildScanHistoryTimeline,
  type ScanHistoryAction,
  type ScanHistoryActionDetail,
} from '@/features/equipment/utils/scanHistoryTimeline';
import { useI18n } from '@/i18n';

interface EquipmentScanHistoryTabProps {
  equipmentId: string;
  organizationId: string;
  scanLocationCollectionEnabled?: boolean;
}

const LOCATION_SOURCE_KEYS: Record<EquipmentLocationHistorySource, string> = {
  scan: 'equipmentScan.sourceScan',
  manual: 'equipmentScan.sourceManual',
  team_sync: 'equipmentScan.sourceTeamSync',
  quickbooks: 'equipmentScan.sourceQuickBooks',
};

const ACTION_LABEL_KEYS = {
  dashboard_opened: 'equipmentScan.actionDashboardOpened',
  pm_work_order_created: 'equipmentScan.actionPmWorkOrderCreated',
  generic_work_order_created: 'equipmentScan.actionWorkOrderCreated',
  working_hours_updated: 'equipmentScan.actionWorkingHoursUpdated',
  note_image_added: 'equipmentScan.actionNoteImageAdded',
} as const;

function ActionIcon({ action }: { action: ScanHistoryAction }) {
  switch (action.eventType) {
    case 'dashboard_opened':
      return <ExternalLink className="h-4 w-4" />;
    case 'pm_work_order_created':
      return <Wrench className="h-4 w-4" />;
    case 'generic_work_order_created':
      return <ClipboardList className="h-4 w-4" />;
    case 'working_hours_updated':
      return <Clock className="h-4 w-4" />;
    case 'note_image_added':
      return <Camera className="h-4 w-4" />;
    default:
      return <Eye className="h-4 w-4" />;
  }
}

const EquipmentScanHistoryTab: React.FC<EquipmentScanHistoryTabProps> = ({
  equipmentId,
  organizationId,
  scanLocationCollectionEnabled = true,
}) => {
  const { t } = useI18n();
  const { data: scans = [], isLoading: scansLoading, error: scansError } =
    useEquipmentScans(organizationId, equipmentId);
  const {
    data: followUps = [],
    isLoading: followUpsLoading,
    error: followUpsError,
  } = useEquipmentScanFollowUps(organizationId, equipmentId);
  const {
    data: locationHistory = [],
    isLoading: historyLoading,
    error: historyError,
  } = useEquipmentLocationHistory(organizationId, equipmentId);
  const { formatDateTime, formatRelative } = useFormatTimestamp();

  const isLoading = scansLoading || followUpsLoading || historyLoading;
  const error = scansError ?? followUpsError ?? historyError;
  const coordinateHistory = getCoordinateHistoryRows(locationHistory);

  const getActionLabel = (action: ScanHistoryAction): string => {
    if (!action.eventType) return t('equipmentScan.actionViewedScanPage');
    const key = ACTION_LABEL_KEYS[action.eventType as keyof typeof ACTION_LABEL_KEYS];
    return key ? t(key) : t('equipmentScan.actionPerformed');
  };

  const getActionDetail = (detail: ScanHistoryActionDetail | undefined): string | null => {
    if (!detail) return null;

    switch (detail.kind) {
      case 'title':
        return detail.value;
      case 'hours':
        return t('equipmentScan.hoursValue', { count: detail.value });
      case 'note_image': {
        const parts: string[] = [];
        if (detail.imageCount != null && detail.imageCount > 0) {
          parts.push(
            t(
              detail.imageCount === 1
                ? 'equipmentScan.imageCount'
                : 'equipmentScan.imagesCount',
              { count: detail.imageCount },
            ),
          );
        }
        if (detail.isPrivate) parts.push(t('equipmentScan.private'));
        return parts.length > 0 ? parts.join(', ') : null;
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-20 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={History}
        title={t('equipmentScan.historyLoadFailed')}
        description={t('equipmentScan.genericError')}
      />
    );
  }

  const timeline = buildScanHistoryTimeline(scans, followUps);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{t('equipmentScan.locationMovement')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('equipmentScan.locationMovementDescription')}
          </p>
        </div>

        {!scanLocationCollectionEnabled ? (
          <EmptyState
            icon={MapPin}
            title={t('equipmentScan.gpsDisabled')}
            description={t('equipmentScan.gpsDisabledDescription')}
          />
        ) : coordinateHistory.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={t('equipmentScan.noCoordinateHistory')}
            description={t('equipmentScan.noCoordinateHistoryDescription')}
          />
        ) : (
          <div className="space-y-3">
            {coordinateHistory.map((row) => {
              const label = t(LOCATION_SOURCE_KEYS[row.source]);
              const address =
                row.formatted_address ||
                [row.address_street, row.address_city, row.address_state, row.address_country]
                  .filter(Boolean)
                  .join(', ') ||
                `${row.latitude}, ${row.longitude}`;

              return (
                <Card key={row.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{label}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatRelative(row.created_at)}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          {row.latitude != null && row.longitude != null ? (
                            <ClickableAddress
                              address={address}
                              lat={row.latitude}
                              lng={row.longitude}
                              className="text-sm"
                            />
                          ) : (
                            <span className="text-muted-foreground">{address}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(row.created_at)}
                        </p>
                      </div>
                      {row.latitude != null && row.longitude != null && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          onClick={() =>
                            window.open(
                              buildGoogleMapsUrlFromCoords(row.latitude!, row.longitude!),
                              '_blank',
                              'noopener,noreferrer',
                            )
                          }
                        >
                          <Navigation className="h-3.5 w-3.5 mr-1" />
                          {t('equipmentScan.directions')}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">{t('equipmentScan.scanHistory')}</h3>
          <p className="text-sm text-muted-foreground">
            {t(
              scans.length === 1 ? 'equipmentScan.scanRecorded' : 'equipmentScan.scansRecorded',
              { count: scans.length },
            )}
          </p>
        </div>

        {timeline.length === 0 ? (
          <EmptyState
            icon={QrCode}
            title={t('equipmentScan.noScanHistory')}
            description={t('equipmentScan.noScanHistoryDescription')}
          />
        ) : (
          <div className="relative space-y-6">
            {timeline.map((entry) => (
              <div key={entry.scan.id} className="relative flex gap-4">
                <div className="relative z-10 flex flex-col items-center">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <QrCode className="h-5 w-5" />
                  </div>
                </div>

                <div className="flex-1 pb-2">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {entry.scan.scannedByName || t('equipmentScan.unknownUser')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatRelative(entry.scan.scanned_at)}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {formatDateTime(entry.scan.scanned_at)}
                        </Badge>
                      </div>

                      {entry.scan.location && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{entry.scan.location}</span>
                        </div>
                      )}

                      <div className="mt-4 border-t pt-4">
                        <ul className="space-y-3">
                          {entry.actions.map((action) => {
                            const detail = getActionDetail(action.detail);
                            return (
                              <li key={action.id} className="flex items-start gap-3">
                                <div
                                  className={cn(
                                    'mt-0.5 rounded-md p-1.5',
                                    action.eventType
                                      ? 'bg-info/15 text-info'
                                      : 'bg-muted text-muted-foreground',
                                  )}
                                >
                                  <ActionIcon action={action} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium">{getActionLabel(action)}</div>
                                  {detail && (
                                    <div className="text-sm text-muted-foreground">{detail}</div>
                                  )}
                                  <div className="mt-0.5 text-xs text-muted-foreground">
                                    {action.performedByName || t('equipmentScan.unknownUser')}
                                    {' · '}
                                    {formatDateTime(action.performedAt)}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default EquipmentScanHistoryTab;
