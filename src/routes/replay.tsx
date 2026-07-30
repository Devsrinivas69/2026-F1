import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { TimingTower } from "@/components/timing/TimingTower";
import { TrackMap } from "@/components/track/TrackMap";
import { RaceControlFeed } from "@/components/racecontrol/RaceControlFeed";
import { AISummary } from "@/components/ai/AISummary";
import { openf1, type OF1Session } from "@/lib/openf1";
import {
  Play, Pause, ChevronRight, Trophy, Loader2, AlertCircle, Calendar, Flag
} from "lucide-react";

export const Route = createFileRoute("/replay")({ component: ReplayIndex });

const NOW = new Date().toISOString();

function ReplayIndex() {
  const [sessions, setSessions] = useState<OF1Session[]>([]);
  const [fetchState, setFetchState] = useState<"loading" | "done" | "error">("loading");
  const [selected, setSelected] = useState<OF1Session | null>(null);
  const [speed, setSpeed] = useState<number>(1);
  const [playing, setPlaying] = useState(false);
  const [lap, setLap] = useState(1);

  const loadSessions = useCallback(async () => {
    setFetchState("loading");
    try {
      // Fetch 2026 AND 2025 races, filter to only completed ones (date_end < now)
      const [r2026, r2025] = await Promise.all([
        openf1<OF1Session[]>("sessions", { session_type: "Race", year: 2026 }),
        openf1<OF1Session[]>("sessions", { session_type: "Race", year: 2025 }),
      ]);

      const allRaces = [...r2026, ...r2025].filter(
        (s) =>
          s.session_name === "Race" &&
          !s.is_cancelled &&
          new Date(s.date_end) < new Date()
      );

      // Sort newest first
      const sorted = allRaces.sort(
        (a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
      );

      setSessions(sorted.slice(0, 12)); // Show last 12 completed races
      if (sorted.length > 0) {
        setSelected(sorted[0]); // Default to most recent
        setPlaying(true);
      }
      setFetchState("done");
    } catch (err) {
      console.error("[Replay] Failed to load sessions", err);
      setFetchState("error");
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Playback lap counter
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setLap((l) => (l >= 70 ? 70 : l + 1)), 4000 / speed);
    return () => clearInterval(id);
  }, [playing, speed]);

  return (
    <section className="bg-[#050505] min-h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="bg-[#0a0a0a] border-b border-white/5 px-6 lg:px-12 py-3 flex items-center gap-3">
        <Flag className="size-3.5 text-[#E8002D]" />
        <span className="font-orbitron text-[10px] font-black uppercase tracking-[0.2em] text-white">
          Archive Replay
        </span>
        <div className="w-px h-4 bg-white/10" />
        <span className="text-[9px] text-[#555] font-jetbrains">
          Completed race sessions · Live timing & track data
        </span>
        <div className="ml-auto flex items-center gap-1.5 text-[9px] font-orbitron text-[#555]">
          <Calendar className="size-3" />
          {sessions.length} races available
        </div>
      </div>

      <div className="px-4 lg:px-10 py-6 max-w-[1760px] mx-auto">
        {/* Session Grid */}
        {fetchState === "loading" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 bg-[#0d0d0d] ring-1 ring-white/5 rounded-md animate-pulse" />
            ))}
          </div>
        )}

        {fetchState === "error" && (
          <div className="mb-6 p-4 bg-[#E8002D]/5 ring-1 ring-[#E8002D]/20 rounded-md flex items-center gap-3">
            <AlertCircle className="size-4 text-[#E8002D]" />
            <div>
              <p className="text-xs font-orbitron font-bold text-[#E8002D]">Failed to load sessions</p>
              <p className="text-[10px] text-[#888] font-jetbrains mt-0.5">Check network connection to api.openf1.org</p>
            </div>
            <button
              onClick={loadSessions}
              className="ml-auto text-[9px] font-orbitron font-bold text-[#E8002D] uppercase tracking-widest hover:text-white transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {fetchState === "done" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
            {sessions.map((s) => {
              const isSelected = selected?.session_key === s.session_key;
              const raceDate = new Date(s.date_start).toLocaleDateString("en-GB", {
                day: "numeric", month: "short", year: "numeric",
              });
              return (
                <button
                  key={s.session_key}
                  onClick={() => { setSelected(s); setLap(1); setPlaying(true); }}
                  className={`p-4 text-left rounded-md transition-all border relative overflow-hidden ${
                    isSelected
                      ? "bg-[#E8002D]/8 border-[#E8002D]/50"
                      : "bg-[#0d0d0d] border-white/5 hover:border-white/15 hover:bg-[#111]"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#E8002D]" />
                  )}
                  <p className="text-[8px] font-orbitron font-black uppercase tracking-[0.2em] text-[#E8002D] mb-1">
                    {s.country_name}
                  </p>
                  <p className="font-orbitron text-[11px] font-black text-white leading-tight">
                    {s.circuit_short_name}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[8px] font-jetbrains text-[#444]">{raceDate}</span>
                    {isSelected && <ChevronRight className="size-3 text-[#E8002D]" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Playback bar */}
        {selected && (
          <>
            <div className="bg-[#0d0d0d] ring-1 ring-white/5 rounded-md px-5 py-3 mb-5 flex items-center gap-4 flex-wrap">
              {/* Play/Pause */}
              <button
                onClick={() => setPlaying((p) => !p)}
                className="flex items-center gap-2 px-4 py-1.5 bg-[#E8002D] hover:bg-[#c0001f] text-white text-[9px] font-orbitron font-black uppercase tracking-widest rounded-sm transition-colors"
              >
                {playing ? <Pause className="size-3" /> : <Play className="size-3" />}
                {playing ? "PAUSE" : "PLAY"}
              </button>

              {/* Speed */}
              <div className="flex items-center gap-0.5 bg-[#111] ring-1 ring-white/5 rounded-sm overflow-hidden">
                {[1, 5, 20, 60].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-3 py-1.5 text-[9px] font-orbitron font-black transition-colors ${
                      speed === s ? "bg-[#FFD700] text-black" : "text-[#444] hover:text-white"
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>

              {/* Lap slider */}
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Trophy className="size-3.5 text-[#FFD700] shrink-0" />
                <input
                  type="range"
                  min={1}
                  max={70}
                  value={lap}
                  onChange={(e) => { setLap(Number(e.target.value)); setPlaying(false); }}
                  className="flex-1 accent-[#E8002D] h-1 cursor-pointer"
                />
                <span className="font-orbitron text-sm font-black text-white min-w-[3ch]">
                  L{String(lap).padStart(2, "0")}
                </span>
              </div>

              {/* Session info */}
              <div className="text-right">
                <p className="text-[9px] font-orbitron font-black text-[#E8002D] uppercase tracking-widest">
                  {selected.circuit_short_name}
                </p>
                <p className="text-[8px] font-jetbrains text-[#444]">
                  {selected.country_name} · {selected.year}
                </p>
              </div>
            </div>

            {/* Main replay data — full width broadcast layout */}
            <ReplayContent session={selected} />
          </>
        )}

        {fetchState === "done" && sessions.length === 0 && (
          <div className="min-h-[40vh] grid place-items-center">
            <div className="text-center">
              <Flag className="size-8 text-[#333] mx-auto mb-3" />
              <p className="text-[#555] font-orbitron text-xs uppercase tracking-widest">
                No completed race sessions found
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** Separate component so it re-mounts cleanly on session change */
function ReplayContent({ session }: { session: OF1Session }) {
  return (
    <div className="space-y-5">
      {/* Row 1: Timing tower + Track map side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5 items-start">
        {/* Live Timing */}
        <div>
          <SectionLabel>Live Timing</SectionLabel>
          <TimingTower sessionKey={session.session_key} />
        </div>

        {/* Track Map */}
        <div>
          <SectionLabel>Live Track · 2D / 3D</SectionLabel>
          <TrackMap sessionKey={session.session_key} />
        </div>
      </div>

      {/* Row 2: Race Control full width */}
      <div>
        <SectionLabel>Race Control</SectionLabel>
        <RaceControlFeed sessionKey={session.session_key} />
      </div>

      {/* Row 3: AI Narrative */}
      <AISummary
        context={{
          session: session.session_name,
          circuit: session.circuit_short_name,
          country: session.country_name,
          year: session.year,
          mode: "replay",
        }}
      />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-orbitron font-black uppercase tracking-[0.2em] text-[#555] mb-2 flex items-center gap-1.5">
      <span className="size-1 rounded-full bg-[#E8002D] inline-block" />
      {children}
    </p>
  );
}