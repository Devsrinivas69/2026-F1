import { useEffect, useState } from "react";
import { openf1, type OF1Session } from "@/lib/openf1";

// LAST KNOWN RACE SESSION — Canada GP 2026
// Used as immediate fallback while fetching, and as the definitive fallback
// when there is no live session (between race weekends).
const FALLBACK_SESSION_KEY = 11291;

interface ActiveSessionResult {
  session: OF1Session | null;
  isLive: boolean;
  loading: boolean;
  error: Error | null;
}

// Cache the last fetched active session so all pages share it
let _cache: { session: OF1Session | null; ts: number } | null = null;
const CACHE_TTL_MS = 60_000;

export function useActiveSession(): ActiveSessionResult {
  const [session, setSession] = useState<OF1Session | null>(_cache?.session ?? null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(!_cache);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Use cache if fresh
      if (_cache && Date.now() - _cache.ts < CACHE_TTL_MS) {
        setSession(_cache.session);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 1. Try to get the "latest" session from OpenF1
        const latest = await openf1<OF1Session[]>("sessions", { session_key: "latest" });
        if (cancelled) return;

        const latestSession = Array.isArray(latest) && latest.length > 0 ? latest[0] : null;

        const now = new Date();
        const sessionIsLive =
          latestSession !== null &&
          new Date(latestSession.date_start) <= now &&
          new Date(latestSession.date_end) >= now;

        // 2. If latest session is in the future or has no data (ended but no race going on),
        //    fall back to the most recent completed race.
        let activeSession = latestSession;
        let live = sessionIsLive;

        if (!latestSession || !sessionIsLive) {
          // Fetch the most recent completed Race session
          try {
            const recent = await openf1<OF1Session[]>("sessions", {
              session_key: FALLBACK_SESSION_KEY,
            });
            if (!cancelled && Array.isArray(recent) && recent.length > 0) {
              activeSession = recent[0];
              live = false;
            }
          } catch {
            // Use built-in fallback if even that fails
          }
        }

        if (cancelled) return;
        _cache = { session: activeSession, ts: Date.now() };
        setSession(activeSession);
        setIsLive(live);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          // Try fallback directly
          try {
            const fb = await openf1<OF1Session[]>("sessions", {
              session_key: FALLBACK_SESSION_KEY,
            });
            if (!cancelled && Array.isArray(fb) && fb.length > 0) {
              setSession(fb[0]);
              setIsLive(false);
            }
          } catch {
            /* silent */
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    // Refresh every 60s
    const id = setInterval(load, 60_000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { session, isLive, loading, error };
}
