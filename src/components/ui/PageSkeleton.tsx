import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/i18n';
import { getFinalHardcodedAuditCopy } from '@/i18n/finalHardcodedAuditCopy';

export function PageSkeleton() {
  const { language } = useI18n();
  const copy = getFinalHardcodedAuditCopy(language);

  return (
    <div className="p-6 space-y-4" role="status" aria-label={copy.loadingPageContent}>
      <span className="sr-only">{copy.loading}</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  );
}

export default PageSkeleton;
