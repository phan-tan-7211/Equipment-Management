import React, { useId } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getListPageCount,
  getListPageRange,
} from '@/utils/listPagination';
import { useI18n } from '@/i18n';

type ListPaginationFooterProps = {
  totalItems: number;
  page: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  itemLabel: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  testId?: string;
};

const ListPaginationFooter: React.FC<ListPaginationFooterProps> = ({
  totalItems,
  page,
  pageSize,
  pageSizeOptions,
  itemLabel,
  onPageChange,
  onPageSizeChange,
  testId = 'list-pagination-footer',
}) => {
  const { language, t } = useI18n();
  const pageSizeSelectId = useId();
  const totalPages = getListPageCount(totalItems, pageSize);
  const { start, end } = getListPageRange(totalItems, page, pageSize);
  const displayItemLabel = language === 'en' && totalItems !== 1 ? `${itemLabel}s` : itemLabel;

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 border-t pt-4" data-testid={testId}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t('commonPagination.showing', { start, end, total: totalItems, label: displayItemLabel })}
        </p>

        <div className="hidden md:flex items-center gap-2">
          <label htmlFor={pageSizeSelectId} className="text-sm text-muted-foreground whitespace-nowrap">
            {t('commonPagination.perPage')}
          </label>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              onPageSizeChange(Number(value));
              onPageChange(1);
            }}
          >
            <SelectTrigger id={pageSizeSelectId} className="w-22">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {totalPages > 1 ? (
        <>
          <div className="flex items-center justify-center gap-2 md:hidden">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label={t('commonPagination.previousPage')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-3 whitespace-nowrap">
              {t('commonPagination.pageOf', { page, totalPages })}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label={t('commonPagination.nextPage')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="hidden md:flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('commonPagination.previous')}
            </Button>
            <span className="text-sm px-4 whitespace-nowrap">
              {t('commonPagination.pageOf', { page, totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              {t('commonPagination.next')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ListPaginationFooter;
