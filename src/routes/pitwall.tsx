import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useActiveSession } from "@/hooks/useActiveSession";
import { TimingTower } from "@/components/timing/TimingTower";
import { TrackMap } from "@/components/track/TrackMap";
import { RaceControlFeed } from "@/components/racecontrol/RaceControlFeed";
import { useOpenF1 } from "@/hooks/useOpenF1";
import { type OF1RaceControl, type OF1Weather } from "@/lib/openf1";
import { Link } from "@tanstack/react-router";
import { Wind, Droplets, Thermometer, ArrowLeft } from "lucide-react";
import { PitWallSkeleton } from "@/components/shared/Skeleton";

export const Route = createFileRoute("/pitwall")({ component: PitWall });

function PitWall() {
  const { session, isLive, loading } = useActiveSession();
  const [clock, setClock] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: rc } = useOpenF1<OF1RaceControl[]>(
    "race_control",
    { session_key: session?.session_key },
    { intervalMs: 3000, enabled: !!session },
  );
  const { data: weather } = useOpenF1<OF1Weather[]>(
    "weather",
    { session_key: session?.session_key },
    { intervalMs: 30_000, enabled: !!session },
  );

  const scActive = (rc || []).slice(-10).some((m) => /SAFETY CAR|SC DEPLOY/i.test(m.message));
  const vscActive = (rc || []).slice(-10).some((m) => /VIRTUAL SAFETY|VSC/i.test(m.message));
  const redFlag = (rc || []).slice(-5).some((m) => /RED FLAG/i.test(m.message) || m.flag === "RED");
  const w = weather?.[weather.length - 1];

  if (loading && !session) {
    return <PitWallSkeleton />;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-3">
        <p className="text-[#555] font-orbitron text-[10px] uppercase tracking-widest">No Session</p>
        <Link to="/" className="text-[9px] font-orbitron text-[#333] hover:text-white transition-colors uppercase tracking-widest">← Return Home</Link>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-[#050505] text-[#F5F5F5] flex flex-col transition-all duration-500 ${
        redFlag ? "outline outline-2 outline-[#E8002D]" : scActive ? "outline outline-2 outline-[#FFA500]" : ""
      }`}
      style={redFlag ? { animation: "sc-flash 1s ease-in-out infinite" } : undefined}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0a0a0a] border-b border-white/5 shrink-0 h-10">
        <Link to="/" className="flex items-center gap-1 text-[9px] font-orbitron font-bold uppercase tracking-widest text-[#444] hover:text-white transition-colors">
          <ArrowLeft className="size-3" /> EXIT
        </Link>

        <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
          <div className={`size-1.5 rounded-full ${isLive ? "bg-[#E8002D] animate-pulse" : "bg-[#555]"}`} />
          <span className="font-orbitron text-[9px] font-black uppercase tracking-[0.2em] text-[#E8002D]">
            {isLive ? "LIVE" : "LAST RACE"} · {session.session_name}
          </span>
          <span className="font-orbitron text-[9px] font-bold text-white/60 uppercase">{session.circuit_short_name}</span>
          {redFlag && <StatusBadge label="RED FLAG" color="#E8002D" animate />}
          {scActive && !redFlag && <StatusBadge label="SAFETY CAR" color="#FFA500" animate />}
          {vscActive && !scActive && !redFlag && <StatusBadge label="VSC" color="#FFA500" />}
        </div>

        <div className="font-jetbrains text-[10px] text-[#666]">
          {clock.toLocaleTimeString("en-GB", { hour12: false })}
        </div>
      </div>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-12 grid-rows-6 gap-1.5 p-1.5 min-h-0">
        {/* Timing tower */}
        <div className="col-span-3 row-span-6 overflow-hidden min-h-0">
          <TimingTower sessionKey={session.session_key} compact />
        </div>

        {/* Track map */}
        <div className="col-span-6 row-span-4 overflow-hidden">
          <TrackMap sessionKey={session.session_key} />
        </div>

        {/* Weather */}
        <div className="col-span-3 row-span-2 bg-[#0d0d0d] ring-1 ring-white/5 rounded-sm p-3 flex flex-col gap-2">
          <span className="font-orbitron text-[8px] font-black uppercase tracking-[0.2em] text-[#00D2BE]">Weather</span>
          <div className="space-y-1.5 text-[10px] font-jetbrains">
            <WRow icon={<Thermometer className="size-2.5 text-[#FF6D00]" />} label="Air" v={w ? `${w.air_temperature.toFixed(1)}°C` : "—"} />
            <WRow icon={<Thermometer className="size-2.5 text-[#FFD700]" />} label="Track" v={w ? `${w.track_temperature.toFixed(1)}°C` : "—"} />
            <WRow icon={<Droplets className="size-2.5 text-[#00D2BE]" />} label="Humid" v={w ? `${w.humidity}%` : "—"} />
            <WRow icon={<Wind className="size-2.5 text-[#888]" />} label="Wind" v={w ? `${w.wind_speed.toFixed(1)} m/s` : "—"} />
            <WRow label="Rain" v={w ? (w.rainfall > 0 ? "WET" : "DRY") : "—"} c={w?.rainfall ? "#00D2BE" : "#555"} />
          </div>
        </div>

        {/* Status */}
        <div className="col-span-3 row-span-2 bg-[#0d0d0d] ring-1 ring-white/5 rounded-sm p-3">
          <span className="font-orbitron text-[8px] font-black uppercase tracking-[0.2em] text-[#555]">Status</span>
          <div className="mt-2 space-y-1.5">
            <SRow label="DRS" active={(rc || []).slice(-5).some((m) => m.message?.includes("DRS ENABLED"))} activeLabel="ENABLED" inactiveLabel="DISABLED" activeColor="#00D2BE" />
            <SRow label="Safety Car" active={scActive} activeLabel="DEPLOYED" inactiveLabel="CLEAR" activeColor="#FFA500" />
            <SRow label="VSC" active={vscActive && !scActive} activeLabel="ACTIVE" inactiveLabel="CLEAR" activeColor="#FFA500" />
            <SRow label="Red Flag" active={redFlag} activeLabel="ACTIVE" inactiveLabel="CLEAR" activeColor="#E8002D" />
          </div>
        </div>

        {/* Race control */}
        <div className="col-span-9 row-span-2 overflow-hidden">
          <RaceControlFeed sessionKey={session.session_key} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ label, color, animate }: { label: string; color: string; animate?: boolean }) {
  return (
    <span
      className={`px-2 py-0.5 font-orbitron text-[8px] font-black uppercase tracking-widest text-black ${animate ? "animate-pulse" : ""}`}
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}

function WRow({ icon, label, v, c }: { icon?: React.ReactNode; label: string; v: string; c?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">{icon}<span className="text-[#444] uppercase text-[8px] font-orbitron">{label}</span></div>
      <span className="font-orbitron font-black text-[10px]" style={{ color: c ?? "#F5F5F5" }}>{v}</span>
    </div>
  );
}

function SRow({ label, active, activeLabel, inactiveLabel, activeColor }: {
  label: string; active: boolean; activeLabel: string; inactiveLabel: string; activeColor: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[8px] font-orbitron uppercase tracking-widest text-[#333]">{label}</span>
      <span
        className="text-[8px] font-orbitron font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm"
        style={active
          ? { color: activeColor, background: `${activeColor}20`, border: `1px solid ${activeColor}40` }
          : { color: "#2a2a2a" }
        }
      >
        {active ? activeLabel : inactiveLabel}
      </span>
    </div>
  );
}