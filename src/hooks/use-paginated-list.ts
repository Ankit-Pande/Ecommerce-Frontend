"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/store/toast-store";
import type { Paginated } from "@/lib/types";

// A list loaded page by page with a cursor; firstPage from the server skips the first load.
export function usePaginatedList<T>(
  load: (cursor?: string) => Promise<Paginated<T>>,
  enabled = true,
  firstPage?: Paginated<T> | null,
) {
  const [items, setItems] = useState<T[]>(firstPage?.items ?? []);
  const [cursor, setCursor] = useState<string | null>(
    firstPage?.nextCursor ?? null,
  );
  const [loading, setLoading] = useState(!firstPage);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const skipFirstLoad = useRef(Boolean(firstPage));
  const listVersion = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    if (skipFirstLoad.current) {
      skipFirstLoad.current = false;
      return;
    }
    listVersion.current++;
    let active = true;
    setLoading(true);
    setFailed(false);

    load()
      .then((page) => {
        if (!active) return;
        setItems(page.items);
        setCursor(page.nextCursor);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
        setCursor(null);
        setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [load, enabled, reloadKey]);

  // Adds the next page; a result for an old list (filters changed) is ignored.
  const loadMore = useCallback(async () => {
    if (!cursor) return;
    const version = listVersion.current;
    setLoadingMore(true);
    try {
      const page = await load(cursor);
      if (version !== listVersion.current) return;
      setItems((current) => [...current, ...page.items]);
      setCursor(page.nextCursor);
    } catch {
      if (version === listVersion.current) {
        toast.error("Could not load more. Please try again.");
      }
    } finally {
      setLoadingMore(false);
    }
  }, [load, cursor]);

  // Loads the list again from the first page.
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
