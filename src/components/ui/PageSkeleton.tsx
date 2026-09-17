import { Skeleton } from '@/components/ui/skeleton';
import Page from '@/components/layout/Page';
import { useI18n } from '@/i18n';
import { getFinalHardcodedAuditCopy } from '@/i18n/finalHardcodedAuditCopy';

export function PageSkeleton() {
  const { language } = useI18n();
  const copy = getFinalHardcodedAuditCopy(language);

  return (
    <Page maxWidth="full" padding="workspace" className="space-y-4">
      <div role="status" aria-label={copy.loadingPageContent} className="space-y-1 px-4">
        <span className="sr-only">{copy.loading}</span>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </Page>
  );
}

export default PageSkeleton;
