// OpenF1 REST proxy with CORS + lightweight in-memory cache.
// Body: { endpoint: string, params?: Record<string,string> }
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const BASE = "https://api.openf1.org/v1";
const CACHE = new Map<string, { at: number; body: unknown }>();
const TTL_MS = 1500;

const ALLOWED = new Set([
  "sessions", "drivers", "position", "intervals", "laps", "car_data",
  "team_radio", "race_control", "pit", "stints", "weather", "location", "meetings",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { endpoint, params = {} } = await req.json();
    if (!endpoint || !ALLOWED.has(endpoint)) {
      return new Response(JSON.stringify({ error: "invalid endpoint" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const qs = new URLSearchParams(params).toString();
    const url = `${BASE}/${endpoint}${qs ? `?${qs}` : ""}`;

    const cached = CACHE.get(url);
    const now = Date.now();
    if (cached && now - cached.at < TTL_MS) {
      return new Response(JSON.stringify(cached.body), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
      });
    }

    const r = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!r.ok) {
      const txt = await r.text();
      return new Response(JSON.stringify({ error: "upstream", status: r.status, body: txt }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = await r.json();
    CACHE.set(url, { at: now, body });
    // simple cache pruning
    if (CACHE.size > 200) {
      const oldestKey = [...CACHE.entries()].sort((a, b) => a[1].at - b[1].at)[0]?.[0];
      if (oldestKey) CACHE.delete(oldestKey);
    }
    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});