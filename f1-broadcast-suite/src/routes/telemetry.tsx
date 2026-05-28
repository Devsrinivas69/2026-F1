import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useActiveSession } from "@/hooks/useActiveSession";
import { useOpenF1 } from "@/hooks/useOpenF1";
import { TelemetryChart, type Frame } from "@/components/telemetry/TelemetryChart";
import { GForceVisualizer } from "@/components/telemetry/GForceVisualizer";
import { TyreHeatmap } from "@/components/telemetry/TyreHeatmap";
import { FuelGauge } from "@/components/telemetry/FuelGauge";
import { type OF1Driver, type OF1Stint, type OF1Lap } from "@/lib/openf1";
import { Activity, Gauge, Flame, Droplets } from "lucide-react";
import { TelemetrySkeleton } from "@/components/shared/Skeleton";

export const Route = createFileRoute("/telemetry")({ component: Telemetry });

/** Minimal hook to pull latest lap number from laps data */
function useDriverLap(sessionKey: number, driverNumber: number) {
  const { data } = useOpenF1<OF1Lap[]>(
    "laps",
    { session_key: sessionKey, driver_number: driverNumber },
    { intervalMs: 10_000, enabled: !!sessionKey && !!driverNumber },
  );
  if (!data?.length) return { currentLap: 1, totalLaps: 58 };
  const maxLap = Math.max(...data.map((l) => l.lap_number));
  return { currentLap: maxLap, totalLaps: 58 };
}

/** Pull current stint (compound + tyre age) */
function useDriverStint(sessionKey: number, driverNumber: number) {
  const { data } = useOpenF1<OF1Stint[]>(
    "stints",
    { session_key: sessionKey, driver_number: driverNumber },
    { intervalMs: 15_000, enabled: !!sessionKey && !!driverNumber },
  );
  if (!data?.length) return { compound: "MEDIUM", tyreAge: 1 };
  const latest = data.reduce((a, b) => (a.stint_number > b.stint_number ? a : b));
  return {
    compound: latest.compound?.toUpperCase() ?? "MEDIUM",
    tyreAge: latest.lap_end != null ? latest.lap_end - latest.lap_start : latest.tyre_age_at_start,
  };
}

interface DriverPanelProps {
  driver: OF1Driver;
  label: string;
  sessionKey: number;
}

function DriverPanel({ driver, label, sessionKey }: DriverPanelProps) {
  const color = `#${driver.team_colour || "F5F5F5"}`;
  const [liveFrame, setLiveFrame] = useState<Frame | null>(null);
  const { currentLap, totalLaps } = useDriverLap(sessionKey, driver.driver_number);
  const { compound, tyreAge } = useDriverStint(sessionKey, driver.driver_number);

  const handleFrame = useCallback((f: Frame) => setLiveFrame(f), []);

  return (
    <div className="space-y-5">
      {/* Driver header */}
      <div
        className="flex items-center gap-4 p-4 rounded-xl ring-1"
        style={{ borderColor: `${color}30`, background: `${color}06` }}
      >
        <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: color }} />
        <div
          className="size-10 rounded-md flex items-center justify-center font-orbitron text-xs font-black shrink-0"
          style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
        >
          {label}
        </div>
        {driver.headshot_url && (
          <img
            src={driver.headshot_url}
            alt={driver.full_name}
            className="size-10 object-cover rounded-md opacity-80"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-orbitron text-base font-black">#{driver.driver_number}</span>
            <span className="font-orbitron text-base font-black">{driver.name_acronym}</span>
            <span className="text-[#555] text-xs font-jetbrains">/ {driver.full_name}</span>
          </div>
          <p className="text-[10px] font-orbitron font-bold mt-0.5" style={{ color }}>{driver.team_name}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="size-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
          <span className="text-[9px] font-orbitron uppercase tracking-widest" style={{ color }}>Live</span>
        </div>
      </div>

      {/* Telemetry Charts + Audio */}
      <TelemetryChart
        sessionKey={sessionKey}
        driverNumber={driver.driver_number}
        color={color}
        onFrame={handleFrame}
      />

      {/* Advanced Panels Row */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-[8px] font-orbitron uppercase tracking-[0.25em] text-[#333]">
            Advanced Analytics
          </span>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* G-Force */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Gauge className="size-3 text-[#888]" />
              <span className="text-[8px] font-orbitron uppercase tracking-[0.2em] text-[#555]">G-Force Diagram</span>
            </div>
            <GForceVisualizer
              speed={liveFrame?.speed ?? 0}
              brake={liveFrame?.brake ?? 0}
              throttle={liveFrame?.throttle ?? 0}
              rpm={liveFrame?.rpm ?? 0}
            />
          </div>

          {/* Tyre Heatmap */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Flame className="size-3 text-[#888]" />
              <span className="text-[8px] font-orbitron uppercase tracking-[0.2em] text-[#555]">Tyre Heatmap</span>
            </div>
            <TyreHeatmap
              compound={compound}
              tyreAge={tyreAge}
              speed={liveFrame?.speed ?? 200}
              brake={liveFrame?.brake ?? 30}
              throttle={liveFrame?.throttle ?? 60}
            />
          </div>

          {/* Fuel Gauge */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Droplets className="size-3 text-[#888]" />
              <span className="text-[8px] font-orbitron uppercase tracking-[0.2em] text-[#555]">Fuel Estimator</span>
            </div>
            <FuelGauge
              currentLap={currentLap}
              totalLaps={totalLaps}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Telemetry() {
  const { session, loading: sessionLoading } = useActiveSession();
  const { data: drivers, loading: driversLoading } = useOpenF1<OF1Driver[]>(
    "drivers",
    { session_key: session?.session_key },
    { intervalMs: 0, enabled: !!session },
  );
  const [a, setA] = useState<number | null>(null);
  const [b, setB] = useState<number | null>(null);

  if (sessionLoading && !session) {
    return <TelemetrySkeleton />;
  }
  if (!session) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-[#050505] flex items-center justify-center">
        <p className="text-[#555] font-orbitron text-xs uppercase tracking-widest">No active session</p>
      </div>
    );
  }

  const sortedDrivers = (drivers || []).slice().sort((x, y) => x.driver_number - y.driver_number);
  const aDriver = a !== null ? sortedDrivers.find((d) => d.driver_number === a) : sortedDrivers[0];
  const bDriver = b !== null ? sortedDrivers.find((d) => d.driver_number === b) : undefined;

  return (
    <section className="bg-[#050505] min-h-[calc(100vh-56px)]">
      {/* Header bar */}
      <div className="bg-[#0a0a0a] border-b border-white/5 px-6 lg:px-12 py-3 flex items-center gap-4">
        <Activity className="size-4 text-[#00D2BE]" />
        <span className="font-orbitron text-[10px] font-black uppercase tracking-[0.2em] text-[#00D2BE]">
          Telemetry
        </span>
        <div className="w-px h-4 bg-white/10" />
        <span className="text-[10px] text-[#888] font-orbitron uppercase tracking-wider">
          {session.circuit_short_name} · {session.country_name}
        </span>
        <div className="ml-auto flex items-center gap-3 text-[8px] font-orbitron text-[#333] uppercase tracking-widest">
          <span>2s polling</span>
          <span className="text-[#1a1a1a]">·</span>
          <span>G-Force</span>
          <span className="text-[#1a1a1a]">·</span>
          <span>Tyre Heatmap</span>
          <span className="text-[#1a1a1a]">·</span>
          <span>Fuel Estimate</span>
        </div>
      </div>

      <div className="px-4 lg:px-12 py-8 max-w-[1600px] mx-auto">
        {/* Driver selectors */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <DriverPicker
            label="Driver A"
            drivers={sortedDrivers}
            loading={driversLoading}
            value={aDriver?.driver_number ?? null}
            onChange={setA}
          />
          <DriverPicker
            label="Driver B — Compare"
            drivers={sortedDrivers}
            loading={driversLoading}
            value={b}
            onChange={setB}
            allowNone
          />
        </div>

        {/* Driver A panel */}
        {aDriver && (
          <div className="mb-12">
            <DriverPanel driver={aDriver} label="A" sessionKey={session.session_key} />
          </div>
        )}

        {/* Divider */}
        {bDriver && (
          <div className="flex items-center gap-3 my-8">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-[9px] font-orbitron uppercase tracking-[0.3em] text-[#333]">Comparison — Driver B</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>
        )}

        {/* Driver B panel */}
        {bDriver && (
          <div className="mb-8">
            <DriverPanel driver={bDriver} label="B" sessionKey={session.session_key} />
          </div>
        )}

        {!aDriver && !driversLoading && (
          <div className="min-h-[40vh] grid place-items-center">
            <p className="text-[#444] font-orbitron text-xs uppercase tracking-widest">
              Select a driver to view telemetry
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function DriverPicker({
  label, drivers, loading, value, onChange, allowNone,
}: {
  label: string;
  drivers: OF1Driver[];
  loading: boolean;
  value: number | null;
  onChange: (n: number | null) => void;
  allowNone?: boolean;
}) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.25em] text-[#555] font-orbitron font-bold mb-2">{label}</p>
      <div className="relative">
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          disabled={loading}
          className="w-full bg-[#0d0d0d] ring-1 ring-white/8 hover:ring-white/15 rounded-md px-4 py-3 text-sm font-jetbrains text-[#F5F5F5] appearance-none cursor-pointer transition-all disabled:opacity-50"
        >
          {allowNone && <option value="">— No comparison —</option>}
          {loading && <option disabled>Loading drivers…</option>}
          {drivers.map((d) => (
            <option key={d.driver_number} value={d.driver_number}>
              #{d.driver_number} {d.name_acronym} · {d.full_name} ({d.team_name})
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="size-3 text-[#444]" fill="none" viewBox="0 0 16 16">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}