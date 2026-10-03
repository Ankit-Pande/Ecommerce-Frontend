"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/store/toast-store";
import type { Paginated } from "@/lib/types";

// `load` is an API function; wrap it in useCallback so the list reloads only when its inputs change.
export function usePaginatedList<T>(
  load: (cursor?: string) => Promise<Paginated<T>>,
  enabled = true,
) {
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    setLoading(true);
    setFailed(false);

    load()
      .then((res) => {
        if (!active) return;
        setItems(res.items);
        setCursor(res.nextCursor);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
        setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [load, enabled, reloadKey]);

  const loadMore = useCallback(async () => {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const res = await load(cursor);
      setItems((prev) => [...prev, ...res.items]);
      setCursor(res.nextCursor);
    } catch {
      toast.error("Could not load more items");
    } finally {
      setLoadingMore(false);
    }
  }, [load, cursor]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return {
    items,
    setItems,
    cursor,
    loading,
    loadingMore,
    failed,
    loadMore,
    reload,
  };
}
