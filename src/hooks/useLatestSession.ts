import { useOpenF1 } from "./useOpenF1";
import { type OF1Session } from "@/lib/openf1";

// Returns the latest session — polls every 60s so we pick up new ones.
// OpenF1 returns an array even for session_key=latest, so we grab [0].
export function useLatestSession() {
  const { data, error, loading } = useOpenF1<OF1Session[]>(
    "sessions",
    { session_key: "latest" },
    { intervalMs: 60_000 },
  );
  // API returns an array; the first item is the latest session
  const session = Array.isArray(data) && data.length > 0 ? data[0] : null;
  return { session, error, loading };
}