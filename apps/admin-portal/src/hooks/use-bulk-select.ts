import { useState, useCallback } from "react";

export function useBulkSelect<T extends { id: string }>(items: T[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === items.length && items.length > 0) {
        return new Set();
      }
      return new Set(items.map((i) => i.id));
    });
  }, [items]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback(
    (id: string) => selected.has(id),
    [selected],
  );

  const isAllSelected = items.length > 0 && items.every((i) => selected.has(i.id));

  const selectedCount = selected.size;

  const selectedItems = items.filter((i) => selected.has(i.id));

  return {
    selected,
    toggle,
    toggleAll,
    clear,
    isSelected,
    isAllSelected,
    selectedCount,
    selectedItems,
  };
}
