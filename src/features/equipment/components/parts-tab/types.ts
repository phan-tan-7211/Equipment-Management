/**
 * Types for Parts Tab filtering and sorting
 */

export type PartsSortField = 'name' | 'stock' | 'location';
export type PartsSortOrder = 'asc' | 'desc';
export type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

export interface PartsFiltersState {
  search: string;
  stockFilter: StockFilter;
  hasAlternatesOnly: boolean;
  sortField: PartsSortField;
  sortOrder: PartsSortOrder;
}

export const DEFAULT_PARTS_FILTERS: PartsFiltersState = {
  search: '',
  stockFilter: 'all',
  hasAlternatesOnly: false,
  sortField: 'name',
  sortOrder: 'asc',
};

export const SORT_OPTIONS = [
  { value: 'name-asc', labelKey: 'equipmentParts.sortNameAsc', field: 'name' as const, order: 'asc' as const },
  { value: 'name-desc', labelKey: 'equipmentParts.sortNameDesc', field: 'name' as const, order: 'desc' as const },
  { value: 'stock-asc', labelKey: 'equipmentParts.sortStockAsc', field: 'stock' as const, order: 'asc' as const },
  { value: 'stock-desc', labelKey: 'equipmentParts.sortStockDesc', field: 'stock' as const, order: 'desc' as const },
  { value: 'location-asc', labelKey: 'equipmentParts.sortLocationAsc', field: 'location' as const, order: 'asc' as const },
] as const;

export const STOCK_FILTER_OPTIONS = [
  { value: 'all', labelKey: 'equipmentParts.stockAll' },
  { value: 'in_stock', labelKey: 'equipmentParts.stockIn' },
  { value: 'low_stock', labelKey: 'equipmentParts.stockLow' },
  { value: 'out_of_stock', labelKey: 'equipmentParts.stockOut' },
] as const;
