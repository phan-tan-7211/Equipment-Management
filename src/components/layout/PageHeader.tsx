import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useI18n } from '@/i18n';
import { getFinalHardcodedAuditExtraCopy } from '@/i18n/finalHardcodedAuditExtraCopy';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  meta?: React.ReactNode;
  backLink?: {
    label: string;
    href: string;
  };
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
  hideDescriptionOnMobile?: boolean;
  inlineMetaOnMobile?: boolean;
  density?: 'default' | 'compact';
  titleStyle?: React.CSSProperties;
  descriptionStyle?: React.CSSProperties;
}

const densityClasses = {
  default: 'space-y-2',
  compact: 'space-y-1',
} as const;

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  meta,
  backLink,
  breadcrumbs,
  actions,
  className,
  hideDescriptionOnMobile = false,
  inlineMetaOnMobile = false,
  density = 'default',
  titleStyle,
  descriptionStyle,
}) => {
  const { language } = useI18n();
  const copy = getFinalHardcodedAuditExtraCopy(language);
  useDocumentTitle(title);

  return (
    <div className={cn(densityClasses[density], className)}>
      {backLink && (
        <div className="flex items-center">
          <Link
            to={backLink.href}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span aria-hidden="true">←</span>
            <span>{backLink.label}</span>
          </Link>
        </div>
      )}

      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground" aria-label={copy.breadcrumb}>
          {breadcrumbs.map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden="true" />
              )}
              {item.href ? (
                <Link
                  to={item.href}
                  className="hover:text-foreground hover:underline underline-offset-4 decoration-muted-foreground/40 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium truncate max-w-[20ch] sm:max-w-none" aria-current="page" title={item.label}>
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      )}

      <div className={cn(
        'flex flex-col sm:flex-row sm:items-start sm:justify-between',
        density === 'compact' ? 'gap-1' : 'gap-2',
      )}>
        <div className={cn('min-w-0 flex-1', density === 'compact' ? 'space-y-0' : 'space-y-0.5')}>
          <div className="flex flex-wrap items-center gap-2">
            <h1
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              data-route-heading="true"
              tabIndex={-1}
              style={titleStyle}
            >
              {title}
            </h1>
            {meta && (
              <div className={cn('flex items-center gap-2', !inlineMetaOnMobile && 'hidden sm:flex')}>
                {meta}
              </div>
            )}
          </div>

          {meta && !inlineMetaOnMobile && (
            <div className="flex items-center gap-2 sm:hidden">
              {meta}
            </div>
          )}

          {description && (
            <p
              className={cn(
                'text-sm text-muted-foreground line-clamp-2',
                hideDescriptionOnMobile && 'hidden md:block',
              )}
              style={descriptionStyle}
            >
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
