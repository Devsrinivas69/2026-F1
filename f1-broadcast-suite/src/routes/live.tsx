import { createFileRoute } from "@tanstack/react-router";
import { useActiveSession } from "@/hooks/useActiveSession";
import { useOpenF1 } from "@/hooks/useOpenF1";
import { TimingTower } from "@/components/timing/TimingTower";
import { TrackMap } from "@/components/track/TrackMap";
import { RaceControlFeed } from "@/components/racecontrol/RaceControlFeed";
import { TeamRadioFeed } from "@/components/radio/TeamRadioFeed";
import { AISummary } from "@/components/ai/AISummary";
import { type OF1Weather } from "@/lib/openf1";
import { Wifi, Clock, Thermometer, Droplets, Wind } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/live")({ component: Live });

function Live() {
  const { session, isLive, loading, error } = useActiveSession();
  const [clock, setClock] = useState(new Date());

  const { data: weather } = useOpenF1<OF1Weather[]>(
    "weather",
    { session_key: session?.session_key },
    { intervalMs: 30_000, enabled: !!session },
  );

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const w = weather?.[weather.length - 1];

  if (loading && !session) return <LoadingScreen />;
  if (error && !session) return <ErrorScreen message={error.message} />;
  if (!session) return <NoSession />;

  return (
    <section className="bg-[#050505] min-h-[calc(100vh-56px)]">
      {/* Broadcast top bar */}
      <div className="bg-[#0a0a0a] border-b border-white/5 px-4 lg:px-10 py-2 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 text-[9px]">
          {/* Live / Archive badge */}
          <div className="flex items-center gap-1.5">
            <div className={`size-1.5 rounded-full ${
              isLive ? "bg-[#E8002D] animate-pulse shadow-[0_0_6px_#E8002D]" : "bg-[#555]"
            }`} />
            <span className={`font-orbitron font-black uppercase tracking-[0.2em] ${isLive ? "text-[#E8002D]" : "text-[#555]"}`}>
              {isLive ? "LIVE" : "LAST RACE"}
            </span>
          </div>
          <div className="w-px h-3.5 bg-white/10" />
          <span className="font-orbitron font-bold text-[#E8002D] uppercase tracking-widest">
            {session.country_name}
          </span>
          <span className="font-orbitron text-[#666] uppercase">
            {session.session_name} · {session.circuit_short_name}
          </span>
          <span className="text-[#333] font-jetbrains">KEY {session.session_key}</span>
        </div>

        {/* Weather + clock */}
        <div className="flex items-center gap-4 text-[9px] font-jetbrains text-[#666]">
          {w && (
            <>
              <div className="flex items-center gap-1">
                <Thermometer className="size-3 text-[#FF6D00]" />
                <span>{w.air_temperature.toFixed(1)}°C air</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#FF6D00]">▲</span>
                <span>{w.track_temperature.toFixed(1)}°C track</span>
              </div>
              <div className="flex items-center gap-1">
                <Droplets className="size-3 text-[#00D2BE]" />
                <span>{w.humidity}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind className="size-3" />
                <span>{w.wind_speed.toFixed(1)} m/s</span>
              </div>
              {w.rainfall > 0 && (
                <span className="font-orbitron font-bold text-[#00D2BE] uppercase tracking-widest text-[8px]">WET</span>
              )}
            </>
          )}
          <div className="flex items-center gap-1 text-[#333]">
            <Clock className="size-3" />
            <span>{clock.toLocaleTimeString("en-GB", { hour12: false })}</span>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="py-5 px-4 lg:px-8 max-w-[1760px] mx-auto">
        <div className="flex flex-col xl:flex-row gap-5 items-start">
          {/* Timing tower */}
          <div className="w-full xl:w-96 shrink-0">
            <TimingTower sessionKey={session.session_key} />
          </div>

          {/* Right panels */}
          <div className="flex-1 flex flex-col gap-5 w-full min-w-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <TrackMap sessionKey={session.session_key} />
              <RaceControlFeed sessionKey={session.session_key} />
            </div>
            <TeamRadioFeed sessionKey={session.session_key} />
            <AISummary context={{
              session: session.session_name,
              circuit: session.circuit_short_name,
              country: session.country_name,
              year: session.year,
            }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#050505] flex flex-col items-center justify-center gap-4">
      <Wifi className="size-6 text-[#E8002D] animate-pulse" />
      <div className="flex gap-1.5">
        {[0, 150, 300].map((d) => (
          <div key={d} className="size-1.5 rounded-full bg-[#E8002D] animate-bounce" style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
      <p className="text-[#333] text-[10px] font-jetbrains">Connecting to OpenF1…</p>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#050505] flex flex-col items-center justify-center gap-3 px-6">
      <Wifi className="size-5 text-[#E8002D]" />
      <p className="font-orbitron text-xs font-bold uppercase tracking-widest text-[#E8002D]">Signal Lost</p>
      <p className="text-[#555] text-[10px] font-jetbrains max-w-xs text-center">{message}</p>
    </div>
  );
}

function NoSession() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#050505] flex flex-col items-center justify-center gap-3">
      <Wifi className="size-5 text-[#555]" />
      <p className="font-orbitron text-[10px] font-bold uppercase tracking-widest text-[#555]">No session available</p>
    </div>
  );
}