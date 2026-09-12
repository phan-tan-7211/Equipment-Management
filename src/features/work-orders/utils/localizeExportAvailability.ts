type Translate = (key: string, params?: Record<string, string | number>) => string;

const driveTooltipKeys: Record<string, string> = {
  'A file is already linked to this work order. Use Update instead.': 'driveAlreadyLinked',
  'Google Workspace export is unavailable. Connect Google Workspace, grant export permissions, and set an organization Drive folder in Organization Settings.': 'driveUnavailable',
  'Export in progress…': 'exportInProgress',
  'Create a new file in your organization Drive folder.': 'driveCreateHint',
  'Create a file first before updating.': 'driveCreateFirst',
  'Replace the linked file with the latest work order data.': 'driveReplaceHint',
};

export function localizeDriveTooltip(tooltip: string, format: string, t: Translate): string {
  const key = driveTooltipKeys[tooltip];
  if (key) return t(`workOrderExportUi.${key}`);
  if (tooltip.startsWith('Create a ') && tooltip.endsWith(' first to open it in Google Drive.')) {
    return t('workOrderExportUi.driveCreateBeforeOpen', { format });
  }
  if (tooltip.startsWith('Open the linked ') && tooltip.endsWith(' in Google Drive.')) {
    return t('workOrderExportUi.driveOpenLinked', { format });
  }
  return tooltip;
}

const quickBooksTooltipKeys: Record<string, string> = {
  'Complete this work order first, then export to QuickBooks.': 'qbCompleteFirst',
  'QuickBooks is not connected. Go to Organization Settings > Integrations to connect QuickBooks.': 'qbConnect',
  'Assign this equipment to a team before exporting to QuickBooks.': 'qbAssignTeam',
  "This team's QuickBooks customer mapping is missing. Set it in Team Settings > QuickBooks.": 'qbCustomerMapping',
  'Exporting...': 'qbExporting',
  'Export work order as a draft invoice in QuickBooks': 'qbExportDraft',
};

export function localizeQuickBooksTooltip(tooltip: string, invoiceNumber: string | null | undefined, t: Translate): string {
  const key = quickBooksTooltipKeys[tooltip];
  if (key) return t(`workOrderExportUi.${key}`);
  if (tooltip.startsWith('Previously exported as Invoice ') && tooltip.endsWith('. Click to update.')) {
    return t('workOrderExportUi.qbPreviouslyExported', { number: invoiceNumber ?? '' });
  }
  return tooltip;
}
