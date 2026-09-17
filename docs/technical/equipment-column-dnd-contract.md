# Equipment Table Column Drag-and-Drop Contract

This document records the stable interaction contract for column dragging in the Equipment table. It exists to prevent future changes from reintroducing the menu and drag-event regression.

## Current implementation

- Table: TanStack Table.
- Drag-and-drop: `@dnd-kit/core` and `@dnd-kit/sortable`.
- Drag preview: dnd-kit `DragOverlay`.
- Drag activation: a dedicated handle rendered by `DataTableDndHeaderSurface`.
- Reorder commit: the Equipment table commits the new visible column order on dnd-kit `onDragEnd`.

## Required interaction rules

1. Only the dedicated column drag handle may start a drag.
2. Apply `setNodeRef` to the sortable header surface, but apply `attributes`, `listeners`, and `setActivatorNodeRef` only to the drag handle.
3. The `...` column menu, sort control, filter control, Pin, Hide, and Show columns controls must remain outside the drag activator.
4. Use one drag implementation for Equipment columns. Do not add native HTML5 drag events or document-level `pointermove`, `pointerup`, or click-suppression handlers.
5. Keep the pointer activation threshold, keyboard sensor, and `DragOverlay` so mouse, touch, keyboard, and ghost-preview behavior remain consistent.
6. Do not call `preventDefault()` or `stopPropagation()` from a shared header handler in a way that blocks menu buttons.

## Regression acceptance

The focused Equipment table tests must cover both interaction groups:

- Open a column `...` menu and execute Pin, Hide, or Show columns without starting a drag.
- Start a drag from the handle, render the ghost preview, and commit a changed column order.

Run the focused test directly when validating one file because the repository wrapper shards the full component suite:

```powershell
npx vitest run --project component src/features/equipment/components/EquipmentTable.test.tsx
```

Also run:

```powershell
npm run type-check
```

## Files to review together

- `src/features/equipment/components/EquipmentTable.tsx`
- `src/components/common/dataTableShared.tsx`
- `src/features/equipment/components/EquipmentTable.test.tsx`

Any change to the drag surface, activator, menu event handling, or reorder commit must update the focused regression tests in the same change.
