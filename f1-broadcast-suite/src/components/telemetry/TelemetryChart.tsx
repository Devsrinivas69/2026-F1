import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useOpenF1, useLatestDataDate } from "@/hooks/useOpenF1";
import { type OF1CarData } from "@/lib/openf1";
import { EngineAudioPlayer } from "./EngineAudioPlayer";

interface Props {
  sessionKey: number;
  driverNumber: number;
  color: string;
}

interface Frame { t: number; speed: number; throttle: number; brake: number; gear: number; rpm: number; drs: number; }

export function TelemetryChart({ sessionKey, driverNumber, color }: Props) {
  const latestDate = useLatestDataDate(sessionKey);
  const { data, loading, error } = useOpenF1<OF1CarData[]>(
    "car_data",
    { session_key: sessionKey, driver_number: driverNumber, ...(latestDate ? { "date>": latestDate } : {}) },
    { intervalMs: 2000, enabled: !!latestDate },
  );

  const [frames, setFrames] = useState<Frame[]>([]);
  useEffect(() => {
    if (!data?.length) return;
    // Take recent samples sorted by date.
    const sorted = [...data].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    const next: Frame[] = sorted.slice(-60).map((d) => ({
      t: new Date(d.date).getTime(),
      speed: d.speed,
      throttle: d.throttle,
      brake: d.brake,
      gear: d.n_gear,
      rpm: d.rpm,
      drs: d.drs >= 10 ? 1 : 0,
    }));
    setFrames(next);
  }, [data]);

  const charts = useMemo(() => [
    { key: "speed" as const, label: "Speed (km/h)", color: "#F5F5F5", domain: [0, 380] as [number, number], type: "line" as const },
    { key: "throttle" as const, label: "Throttle %", color: "#00FF66", domain: [0, 100] as [number, number], type: "area" as const },
    { key: "brake" as const, label: "Brake %", color: "#E8002D", domain: [0, 100] as [number, number], type: "area" as const },
    { key: "gear" as const, label: "Gear", color: "#FFD700", domain: [0, 8] as [number, number], type: "line" as const },
    { key: "rpm" as const, label: "RPM", color: "#3671C6", domain: [0, 15000] as [number, number], type: "line" as const },
    { key: "drs" as const, label: "DRS", color: "#00D2BE", domain: [0, 1] as [number, number], type: "area" as const },
  ], []);

  if (error) {
    return (
      <div className="h-44 bg-[#111] ring-1 ring-white/5 rounded-md flex items-center justify-center">
        <span className="text-[10px] text-[#E8002D] font-orbitron uppercase tracking-widest px-4 text-center">
          Telemetry offline
        </span>
      </div>
    );
  }

  if (loading && frames.length === 0) {
    return (
      <div className="h-44 bg-[#111] ring-1 ring-white/5 rounded-md flex items-center justify-center">
        <span className="text-[10px] text-[#888] font-orbitron uppercase tracking-widest animate-pulse">
          Connecting to car data…
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end px-1">
        <EngineAudioPlayer 
          rpm={frames.length ? (frames[frames.length - 1]?.rpm as number) || 0 : 0} 
          throttle={frames.length ? (frames[frames.length - 1]?.throttle as number) || 0 : 0} 
          color={color} 
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {charts.map((c) => (
        <div key={c.key} className="bg-[#111] ring-1 ring-white/5 rounded-md p-4 h-44">
          <div className="flex justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-[#888] font-orbitron font-semibold">{c.label}</span>
            <span className="text-[10px] font-jetbrains" style={{ color: c.color }}>
              {frames.length ? Math.round((frames[frames.length - 1]?.[c.key] as number) || 0) : "—"}
            </span>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            {c.type === "area" ? (
              <AreaChart data={frames} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="t" hide />
                <YAxis hide domain={c.domain} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #222", fontSize: 10 }} labelFormatter={() => ""} />
                <Area type="monotone" dataKey={c.key} stroke={c.color} fill={c.color} fillOpacity={0.25} isAnimationActive={false} connectNulls />
              </AreaChart>
            ) : (
              <LineChart data={frames} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="t" hide />
                <YAxis hide domain={c.domain} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #222", fontSize: 10 }} labelFormatter={() => ""} />
                <Line type="monotone" dataKey={c.key} stroke={c.color} dot={false} isAnimationActive={false} strokeWidth={1.5} connectNulls />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      ))}
    </div>
    </div>
  );
}