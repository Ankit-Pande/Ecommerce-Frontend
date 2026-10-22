"use client";

import { useCallback, useEffect, useState } from "react";

// Loads admin data once, with loading and failed flags and a reload.
export function useAdminData<T>(fetchData: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // Loads (or reloads) the data.
  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setData(await fetchData());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, setData, loading, failed, load };
}
