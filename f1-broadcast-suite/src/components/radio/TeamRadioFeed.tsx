import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOpenF1 } from "@/hooks/useOpenF1";
import { type OF1Driver, type OF1Radio } from "@/lib/openf1";
import { Radio, Play, Pause, Volume2 } from "lucide-react";

export function TeamRadioFeed({ sessionKey }: { sessionKey: number }) {
  const { data: drivers, loading: driversLoading } = useOpenF1<OF1Driver[]>(
    "drivers",
    { session_key: sessionKey },
    { intervalMs: 60_000 },
  );
  const { data, loading: radioLoading } = useOpenF1<OF1Radio[]>(
    "team_radio",
    { session_key: sessionKey },
    { intervalMs: 8000 },
  );

  const driverMap = useMemo(() => {
    const m = new Map<number, OF1Driver>();
    for (const d of drivers || []) m.set(d.driver_number, d);
    return m;
  }, [drivers]);

  const sorted = useMemo(
    () => [...(data || [])].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 24),
    [data],
  );

  const loading = driversLoading || radioLoading;

  return (
    <div className="bg-[#0d0d0d] ring-1 ring-white/5 rounded-none md:rounded-md p-0 overflow-hidden">
      {/* Broadcast Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#111]">
        <div className="flex items-center gap-2.5">
          <Radio className="size-3.5 text-[#E8002D]" />
          <span className="font-orbitron text-[11px] font-bold uppercase tracking-[0.2em] text-white">
            Team Radio
          </span>
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#E8002D]/10 ring-1 ring-[#E8002D]/30 rounded-sm">
            <div className="size-1 rounded-full bg-[#E8002D] animate-pulse" />
            <span className="text-[8px] font-orbitron font-bold text-[#E8002D] tracking-widest">LIVE</span>
          </div>
        </div>
        <span className="text-[9px] text-[#555] font-orbitron uppercase tracking-widest">
          {sorted.length} transmissions
        </span>
      </div>

      {/* Radio messages grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y divide-white/5 max-h-[420px] overflow-y-auto scrollbar-hide">
        <AnimatePresence initial={false}>
          {sorted.map((r, i) => {
            const d = driverMap.get(r.driver_number);
            const teamColor = d?.team_colour ? `#${d.team_colour}` : "#666";
            const teamName = d?.team_name ?? "Unknown Team";
            const driverCode = d?.name_acronym ?? `#${r.driver_number}`;
            const driverFull = d?.full_name ?? `Driver ${r.driver_number}`;
            const time = new Date(r.date).toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

            return (
              <motion.div
                key={`${r.date}-${r.driver_number}-${i}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="flex gap-0 p-0 overflow-hidden"
              >
                {/* Team color stripe */}
                <div className="w-1 shrink-0" style={{ backgroundColor: teamColor }} />

                <div className="flex-1 p-4">
                  {/* Driver + team header */}
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      {/* Driver number badge */}
                      <div
                        className="size-8 rounded-sm flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${teamColor}20`, border: `1px solid ${teamColor}40` }}
                      >
                        <span className="font-orbitron text-xs font-black" style={{ color: teamColor }}>
                          {r.driver_number}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-orbitron text-[11px] font-black text-white tracking-tight">
                            {driverCode}
                          </span>
                          <span className="text-[9px] text-[#444] font-orbitron">·</span>
                          <span
                            className="text-[9px] font-orbitron font-bold uppercase tracking-wider"
                            style={{ color: teamColor }}
                          >
                            {teamName}
                          </span>
                        </div>
                        <p className="text-[9px] text-[#444] font-jetbrains mt-0.5">{driverFull}</p>
                      </div>
                    </div>
                    <span className="text-[9px] text-[#444] font-jetbrains shrink-0 mt-1">{time}</span>
                  </div>

                  {/* Audio player - broadcast style */}
                  <RadioPlayer src={r.recording_url} teamColor={teamColor} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {sorted.length === 0 && !loading && (
          <div className="col-span-full py-16 flex flex-col items-center gap-3 text-center">
            <Radio className="size-6 text-[#333]" />
            <div>
              <p className="text-[11px] text-[#555] font-orbitron uppercase tracking-widest">No radio transmissions</p>
              <p className="text-[9px] text-[#333] mt-1 font-jetbrains">Awaiting team-to-driver communications…</p>
            </div>
          </div>
        )}

        {loading && sorted.length === 0 && (
          <div className="col-span-full py-12 flex items-center justify-center gap-2">
            <div className="size-1.5 rounded-full bg-[#E8002D] animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="size-1.5 rounded-full bg-[#E8002D] animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="size-1.5 rounded-full bg-[#E8002D] animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        )}
      </div>
    </div>
  );
}

function RadioPlayer({ src, teamColor }: { src: string; teamColor: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  return (
    <div className="flex items-center gap-2.5 bg-[#0a0a0a] ring-1 ring-white/5 rounded-sm px-3 py-2">
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onTimeUpdate={() => {
          if (!audioRef.current) return;
          const d = audioRef.current.duration || 0;
          const c = audioRef.current.currentTime || 0;
          setProgress(d > 0 ? (c / d) * 100 : 0);
          setDuration(d);
        }}
        onEnded={() => { setPlaying(false); setProgress(0); }}
      />

      <button
        onClick={toggle}
        className="size-7 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-110 active:scale-95"
        style={{ backgroundColor: `${teamColor}20`, border: `1px solid ${teamColor}50` }}
        aria-label={playing ? "Pause radio" : "Play radio"}
      >
        {playing
          ? <Pause className="size-3" style={{ color: teamColor }} />
          : <Play className="size-3 ml-0.5" style={{ color: teamColor }} />
        }
      </button>

      {/* Progress bar */}
      <div className="flex-1 relative">
        <div className="h-0.5 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: teamColor }}
          />
        </div>
        {duration > 0 && (
          <span className="absolute -top-4 right-0 text-[8px] font-jetbrains text-[#444]">
            {Math.floor(duration)}s
          </span>
        )}
      </div>

      <Volume2 className="size-3 text-[#333] shrink-0" />
    </div>
  );
}