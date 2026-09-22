export const toggleSelection = (
  selectedIds: string[],
  entityId: string,
): string[] =>
  selectedIds.includes(entityId)
    ? selectedIds.filter((id) => id !== entityId)
    : [...selectedIds, entityId];
