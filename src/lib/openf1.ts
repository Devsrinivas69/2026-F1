// Direct OpenF1 API client — calls api.openf1.org/v1 without any proxy.
// The OpenF1 API is public and does not require authentication.

const OPENF1_BASE = "https://api.openf1.org/v1";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function openf1<T = unknown>(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
  signal?: AbortSignal,
  retries = 3,
): Promise<T> {
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v) !== "") {
      clean[k] = String(v);
    }
  }

  const qs = new URLSearchParams(clean).toString();
  const url = `${OPENF1_BASE}/${endpoint}${qs ? `?${qs}` : ""}`;

  let attempt = 0;
  while (attempt <= retries) {
    try {
      const res = await fetch(url, { signal });
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      if (!res.ok) {
        throw new Error(`OpenF1 API error: ${res.status} ${res.statusText} (${url})`);
      }
      return res.json() as Promise<T>;
    } catch (err: any) {
      if (err.name === "AbortError" || signal?.aborted) {
        throw err;
      }
      attempt++;
      if (attempt > retries) {
        // Only log error on final failed attempt
        console.warn(`[OpenF1] Failed to fetch ${endpoint} after ${retries} retries:`, err.message);
        throw err;
      }
      // Exponential backoff: 500ms, 1000ms, 2000ms
      await delay(Math.pow(2, attempt - 1) * 500);
    }
  }
  
  throw new Error("Unexpected end of retry loop");
}

// --- OpenF1 typed shapes (partial, only what we use) ---

export interface OF1Session {
  session_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  meeting_key: number;
  location: string;
  country_name: string;
  circuit_short_name: string;
  year: number;
  is_cancelled?: boolean;
}

export interface OF1Driver {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string; // hex without '#'
  first_name: string;
  last_name: string;
  headshot_url?: string;
}

export interface OF1Position {
  session_key: number;
  driver_number: number;
  date: string;
  position: number;
}

export interface OF1Interval {
  session_key: number;
  driver_number: number;
  date: string;
  gap_to_leader: number | string | null;
  interval: number | string | null;
}

export interface OF1Lap {
  session_key: number;
  driver_number: number;
  lap_number: number;
  date_start: string;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  lap_duration: number | null;
  is_pit_out_lap: boolean;
  st_speed: number | null;
  i1_speed: number | null;
  i2_speed: number | null;
}

export interface OF1CarData {
  session_key: number;
  driver_number: number;
  date: string;
  speed: number;
  throttle: number;
  brake: number;
  n_gear: number;
  rpm: number;
  drs: number;
}

export interface OF1Radio {
  session_key: number;
  driver_number: number;
  date: string;
  recording_url: string;
}

export interface OF1RaceControl {
  session_key: number;
  date: string;
  category: string;
  flag?: string;
  scope?: string;
  sector?: number;
  driver_number?: number;
  message: string;
}

export interface OF1Pit {
  session_key: number;
  driver_number: number;
  date: string;
  pit_duration: number;
  lap_number: number;
}

export interface OF1Stint {
  session_key: number;
  driver_number: number;
  stint_number: number;
  lap_start: number;
  lap_end: number;
  compound: string;
  tyre_age_at_start: number;
}

export interface OF1Weather {
  session_key: number;
  date: string;
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  wind_speed: number;
  rainfall: number;
}

export interface OF1Location {
  session_key: number;
  driver_number: number;
  date: string;
  x: number;
  y: number;
  z: number;
}

export const fmtInterval = (v: number | string | null | undefined): string => {
  if (v == null) return "—";
  if (typeof v === "string") return v;
  if (v === 0) return "INTERVAL";
  if (v < 60) return `+${v.toFixed(3)}`;
  const m = Math.floor(v / 60);
  const s = (v - m * 60).toFixed(3);
  return `+${m}:${s.padStart(6, "0")}`;
};

export const fmtLap = (s: number | null | undefined): string => {
  if (s == null) return "—";
  if (s < 60) return s.toFixed(3);
  const m = Math.floor(s / 60);
  const r = (s - m * 60).toFixed(3);
  return `${m}:${r.padStart(6, "0")}`;
};