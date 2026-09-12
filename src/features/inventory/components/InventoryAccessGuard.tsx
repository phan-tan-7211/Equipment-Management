import { useI18n } from '@/i18n';
import React from 'react';
import { Loader2 } from 'lucide-react';
import Page from '@/components/layout/Page';
import PageHeader from '@/components/layout/PageHeader';
import { useInventoryAccess } from '@/features/inventory/hooks/useInventoryAccess';

type InventoryAccessGuardProps = {
  children: React.ReactNode;
  title?: string;
};

export function InventoryAccessGuard({
  children,
  title,
}: InventoryAccessGuardProps) {
  const { t } = useI18n();
  const resolvedTitle = title === 'Part lookup access required'
    ? t('inventoryListAux.partLookupAccess')
    : title === 'Alternate groups access required'
      ? t('inventoryListAux.alternatesAccess')
      : title ?? t('inventoryListAux.accessRequired');
  const { canView, isLoading } = useInventoryAccess();

  if (isLoading) {
    return (
      <Page maxWidth="7xl" padding="responsive">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label={t('inventoryListAux.checkingAccess')} />
        </div>
      </Page>
    );
  }

  if (!canView) {
    return (
      <Page maxWidth="7xl" padding="responsive">
        <PageHeader
          title={resolvedTitle}
          description={t('inventoryListAux.accessHelp')}
        />
      </Page>
    );
  }

  return <>{children}</>;
}
