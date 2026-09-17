import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  getAllEquipmentImages,
  createEquipmentDisplayMediaItem,
  type EquipmentImageData,
} from '@/features/equipment/services/equipmentImagesService';
import { equipment } from '@/lib/queryKeys';
import {
  DEFAULT_EQUIPMENT_MEDIA_FILTERS,
  countActiveEquipmentMediaFilters,
  filterAndSortEquipmentMedia,
  orderEquipmentMediaForDisplayCarousel,
  type EquipmentMediaFiltersState,
  type EquipmentMediaSortField,
  type EquipmentMediaSortOrder,
  type EquipmentMediaSourceFilter,
} from '@/features/equipment/utils/equipmentMediaFilters';

interface UseEquipmentMediaLibraryOptions {
  equipmentId: string;
  organizationId: string;
  currentDisplayImage?: string | null;
  enabled?: boolean;
}

export function useEquipmentMediaLibrary({
  equipmentId,
  organizationId,
  currentDisplayImage,
  enabled = true,
}: UseEquipmentMediaLibraryOptions) {
  const { currentOrganization } = useOrganization();
  const userRole = currentOrganization?.userRole || 'member';
  const [filters, setFilters] = useState<EquipmentMediaFiltersState>(DEFAULT_EQUIPMENT_MEDIA_FILTERS);

  const query = useQuery({
    queryKey: [...equipment.images(equipmentId), organizationId, userRole],
    queryFn: () => getAllEquipmentImages(equipmentId, organizationId, userRole),
    enabled: enabled && !!equipmentId && !!organizationId,
    staleTime: 2 * 60 * 1000,
  });

  const images = useMemo(() => query.data ?? [], [query.data]);

  const imagesWithDisplay = useMemo(() => {
    const hasPersistedCurrentDisplay = images.some(
      (image) =>
        image.source_type === 'equipment_display' &&
        image.description === `display-image:${currentDisplayImage ?? ''}`,
    );
    const displayImage = createEquipmentDisplayMediaItem(
      equipmentId,
      currentOrganization?.name || 'Equipment',
      currentDisplayImage,
    );
    return displayImage && !hasPersistedCurrentDisplay ? [displayImage, ...images] : images;
  }, [currentDisplayImage, currentOrganization?.name, equipmentId, images]);

  const filteredImages = useMemo(
    () => filterAndSortEquipmentMedia(imagesWithDisplay, filters),
    [imagesWithDisplay, filters],
  );

  const displayOrderedImages = useMemo(
    () => orderEquipmentMediaForDisplayCarousel(imagesWithDisplay, currentDisplayImage),
    [imagesWithDisplay, currentDisplayImage],
  );

  const recentThumbnails = useMemo(
    () => displayOrderedImages.slice(0, 4),
    [displayOrderedImages],
  );

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const setSource = useCallback((source: EquipmentMediaSourceFilter) => {
    setFilters((prev) => ({ ...prev, source }));
  }, []);

  const setUploader = useCallback((uploader: string) => {
    setFilters((prev) => ({ ...prev, uploader }));
  }, []);

  const setDateFrom = useCallback((dateFrom: string) => {
    setFilters((prev) => ({ ...prev, dateFrom }));
  }, []);

  const setDateTo = useCallback((dateTo: string) => {
    setFilters((prev) => ({ ...prev, dateTo }));
  }, []);

  const setSort = useCallback((sortField: EquipmentMediaSortField, sortOrder: EquipmentMediaSortOrder) => {
    setFilters((prev) => ({ ...prev, sortField, sortOrder }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_EQUIPMENT_MEDIA_FILTERS);
  }, []);

  const activeFilterCount = countActiveEquipmentMediaFilters(filters);

  return {
    images: imagesWithDisplay,
    filteredImages,
    displayOrderedImages,
    recentThumbnails,
    filters,
    activeFilterCount,
    hasActiveFilters: activeFilterCount > 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    setSearch,
    setSource,
    setUploader,
    setDateFrom,
    setDateTo,
    setSort,
    clearFilters,
    setFilters,
  };
}
