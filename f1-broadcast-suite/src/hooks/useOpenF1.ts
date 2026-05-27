import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { openf1 } from "@/lib/openf1";

interface Options {
  intervalMs?: number; // polling cadence. 0 = fetch once
  enabled?: boolean;
}

export function useOpenF1<T = unknown>(
  endpoint: string,
  params: Record<string, string | number | undefined>,
  opts: Options = {},
) {
  const { intervalMs = 0, enabled = true } = opts;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const paramsKey = JSON.stringify(params);

  // store latest data ref to enable manual refresh
  const lastAbort = useRef<AbortController | null>(null);

  const fetchFn = useCallback(async () => {
    lastAbort.current?.abort();
    const ac = new AbortController();
    lastAbort.current = ac;
    setLoading(true);
    try {
      const result = await openf1<T>(endpoint, params, ac.signal);
      if (!ac.signal.aborted) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (!ac.signal.aborted && (err as Error)?.name !== "AbortError") {
        setError(err as Error);
      }
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [endpoint, paramsKey]);

  useEffect(() => {
    if (!enabled) return;
    
    fetchFn();

    if (intervalMs > 0) {
      const id = setInterval(fetchFn, intervalMs);
      return () => {
        clearInterval(id);
        lastAbort.current?.abort();
      };
    }
    return () => {
      lastAbort.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFn, intervalMs, enabled]);

  return { data, error, loading, refetch: fetchFn };
}

export function useLatestDataDate(sessionKey: number) {
  const { data: laps } = useOpenF1<any[]>("laps", { session_key: sessionKey }, { intervalMs: 10_000 });
  return useMemo(() => {
    if (!laps?.length) return undefined;
    let max = "1970";
    for (const l of laps) {
      if (l.date_start && l.date_start > max) max = l.date_start;
    }
    return max;
  }, [laps]);
}