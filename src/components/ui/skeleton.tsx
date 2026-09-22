import { cn } from "@/lib/utils"
import { useI18n } from '@/i18n'
import { getFinalHardcodedAuditExtraCopy } from '@/i18n/finalHardcodedAuditExtraCopy'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted relative overflow-hidden",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-background/10 before:to-transparent before:bg-[length:200%_100%] before:animate-shimmer",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  )
}

function SkeletonCard({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-3", className)} style={style}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex items-center gap-4 pt-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}

function SkeletonWorkOrderCard({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn("rounded-lg border-l-4 border-l-muted border bg-card", className)} style={style}>
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-4">
          <Skeleton className="h-20 w-20 rounded-xl flex-shrink-0" />
          <div className="space-y-2 flex-1 min-w-0">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3.5 w-2/5" />
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-6 pt-3 border-t">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex items-center justify-between gap-3 pt-3 border-t">
          <Skeleton className="h-4 w-20" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-24 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonEquipmentCard({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn("rounded-lg border-l-4 border-l-muted border bg-card", className)} style={style}>
      <div className="md:hidden flex">
        <Skeleton className="h-24 w-24 flex-shrink-0 rounded-l-md" />
        <div className="flex-1 p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-7 w-7 rounded" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <div className="hidden md:block p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        <Skeleton className="aspect-video w-full rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  )
}

function SkeletonList({
  count = 3,
  type = 'card'
}: {
  count?: number
  type?: 'card' | 'work-order' | 'equipment'
}) {
  const { language } = useI18n()
  const copy = getFinalHardcodedAuditExtraCopy(language)
  const Component = type === 'work-order'
    ? SkeletonWorkOrderCard
    : type === 'equipment'
    ? SkeletonEquipmentCard
    : SkeletonCard

  return (
    <div className="space-y-4" role="status" aria-label={copy.loadingContent}>
      <span className="sr-only">{copy.loadingContent}</span>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} className="animate-stagger-in" style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties} />
      ))}
    </div>
  )
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonWorkOrderCard,
  SkeletonEquipmentCard,
  SkeletonList
}