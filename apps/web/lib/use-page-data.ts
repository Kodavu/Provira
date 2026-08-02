"use client";

// Tiny data hook every authenticated page uses: run a fetcher keyed to the
// current user, expose {data, error, loading, reload}. Keeps the load/guard
// boilerplate out of the pages.
import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/session-context";

export function usePageData<T>(fetcher: (userId: string) => Promise<T>) {
  const { userId } = useSession();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      setData(await fetcher(userId));
    } catch (e) {
      setError((e as Error).message.replace(/^API \d+:\s*/, ""));
    }
    // fetcher is stable per-page (defined inline but wrapped by the caller's
    // useCallback where needed); userId is stable for the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading: data === null && error === null, reload, userId };
}
