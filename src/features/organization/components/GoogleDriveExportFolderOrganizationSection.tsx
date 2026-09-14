import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileText, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
import {
  buildGoogleDriveExportFolderPreview,
  formatGoogleDriveExportFolderPath,
  type GoogleDriveExportFolderPreviewSegment,
} from '@/features/organization/utils/googleDriveExportFolderPreview';

type GoogleDriveExportFolderOrganizationSectionProps = {
  rootFolderName: string;
  folderByTeam: boolean;
  folderByEquipment: boolean;
  disabled?: boolean;
  onToggleTeam: (checked: boolean) => void;
  onToggleEquipment: (checked: boolean) => void;
};

function previewDepthClassName(depth: number): string {
  switch (depth) {
    case 0:
      return 'pl-0';
    case 1:
      return 'pl-3';
    case 2:
      return 'pl-6';
    default:
      return 'pl-9';
  }
}

function PreviewSegmentIcon({
  kind,
}: {
  kind: GoogleDriveExportFolderPreviewSegment['kind'];
}) {
  if (kind === 'file') {
    return <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />;
  }

  return <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />;
}

export function GoogleDriveExportFolderOrganizationSection({
  rootFolderName,
  folderByTeam,
  folderByEquipment,
  disabled = false,
  onToggleTeam,
  onToggleEquipment,
}: GoogleDriveExportFolderOrganizationSectionProps) {
  const { t } = useI18n();
  const previewSegments = buildGoogleDriveExportFolderPreview({
    rootFolderName,
    folderByTeam,
    folderByEquipment,
    exampleTeamName: t('organizationIntegrations.exampleTeam'),
    exampleEquipmentName: t('organizationIntegrations.exampleEquipment'),
    exampleFileName: t('organizationIntegrations.exampleFile'),
  });
  const previewPath = formatGoogleDriveExportFolderPath(previewSegments);
  const routingSummary = t(folderByTeam
    ? folderByEquipment ? 'organizationIntegrations.groupedBoth' : 'organizationIntegrations.groupedTeam'
    : folderByEquipment ? 'organizationIntegrations.groupedEquipment' : 'organizationIntegrations.groupedNone');

  return (
    <fieldset className="space-y-3" role="group" aria-label={t('organizationIntegrations.routing')}>
      <legend className="sr-only">{t('organizationIntegrations.routing')}</legend>

      <div className="space-y-1">
        <p className="text-sm font-medium">{t('organizationIntegrations.routing')}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('organizationIntegrations.routingDescription')}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-2.5">
          <Checkbox
            id="folder-by-team"
            checked={folderByTeam}
            disabled={disabled}
            onCheckedChange={(checked) => onToggleTeam(Boolean(checked))}
            className="mt-0.5"
          />
          <div className="space-y-0.5">
            <Label htmlFor="folder-by-team" className="text-sm leading-snug cursor-pointer">
              {t('organizationIntegrations.byTeam')}
            </Label>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('organizationIntegrations.byTeamHelp')}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Checkbox
            id="folder-by-equipment"
            checked={folderByEquipment}
            disabled={disabled}
            onCheckedChange={(checked) => onToggleEquipment(Boolean(checked))}
            className="mt-0.5"
          />
          <div className="space-y-0.5">
            <Label htmlFor="folder-by-equipment" className="text-sm leading-snug cursor-pointer">
              {t('organizationIntegrations.byEquipment')}
            </Label>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('organizationIntegrations.byEquipmentHelp')}
            </p>
          </div>
        </div>
      </div>

      <div
        className="rounded-md border border-border/60 bg-background/80 p-3 space-y-2"
        aria-live="polite"
      >
        <div className="space-y-0.5">
          <p className="text-xs font-medium">{t('organizationIntegrations.examplePath')}</p>
          <p className="text-xs text-muted-foreground">{routingSummary}</p>
        </div>

        <p className="text-xs font-mono text-foreground break-words">{previewPath}</p>

        <ol className="space-y-1 border-t border-border/60 pt-2" aria-label={t('organizationIntegrations.exampleTree')}>
          {previewSegments.map((segment) => (
            <li
              key={segment.kind}
              className={cn(
                'flex min-w-0 items-center gap-1.5 text-xs font-mono',
                previewDepthClassName(segment.depth),
              )}
            >
              <PreviewSegmentIcon kind={segment.kind} />
              <span
                className={cn(
                  'truncate',
                  segment.kind === 'file' ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {segment.name}
                {segment.kind !== 'file' ? '/' : ''}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </fieldset>
  );
}
