import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useActiveSession } from "@/hooks/useActiveSession";
import { useOpenF1 } from "@/hooks/useOpenF1";
import { TelemetryChart } from "@/components/telemetry/TelemetryChart";
import { type OF1Driver } from "@/lib/openf1";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/telemetry")({ component: Telemetry });

function Telemetry() {
  const { session, loading: sessionLoading } = useActiveSession();
  const { data: drivers, loading: driversLoading } = useOpenF1<OF1Driver[]>(
    "drivers",
    { session_key: session?.session_key },
    { intervalMs: 60_000, enabled: !!session },
  );
  const [a, setA] = useState<number | null>(null);
  const [b, setB] = useState<number | null>(null);

  if (sessionLoading && !session) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-[#050505] flex items-center justify-center">
        <div className="flex gap-2">
          {[0, 150, 300].map((d) => (
            <div key={d} className="size-1.5 rounded-full bg-[#E8002D] animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    );
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
      {/* Header */}
      <div className="bg-[#0a0a0a] border-b border-white/5 px-6 lg:px-12 py-3 flex items-center gap-4">
        <Activity className="size-4 text-[#00D2BE]" />
        <span className="font-orbitron text-[10px] font-black uppercase tracking-[0.2em] text-[#00D2BE]">
          Telemetry
        </span>
        <div className="w-px h-4 bg-white/10" />
        <span className="text-[10px] text-[#888] font-orbitron uppercase tracking-wider">
          {session.circuit_short_name} · {session.country_name}
        </span>
        <div className="ml-auto text-[9px] text-[#333] font-jetbrains">
          2s polling · Car data feed
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

        {/* Charts */}
        {aDriver && (
          <div className="mb-8">
            <DriverHeader d={aDriver} label="A" />
            <TelemetryChart
              sessionKey={session.session_key}
              driverNumber={aDriver.driver_number}
              color={`#${aDriver.team_colour || "F5F5F5"}`}
            />
          </div>
        )}

        {bDriver && (
          <div className="mb-8">
            <DriverHeader d={bDriver} label="B" />
            <TelemetryChart
              sessionKey={session.session_key}
              driverNumber={bDriver.driver_number}
              color={`#${bDriver.team_colour || "F5F5F5"}`}
            />
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
          className="w-full bg-[#0d0d0d] ring-1 ring-white/8 hover:ring-white/15 rounded-sm px-4 py-3 text-sm font-jetbrains text-[#F5F5F5] appearance-none cursor-pointer transition-all disabled:opacity-50"
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

function DriverHeader({ d, label }: { d: OF1Driver; label: string }) {
  const color = `#${d.team_colour || "F5F5F5"}`;
  return (
    <div
      className="flex items-center gap-4 mb-4 p-4 rounded-md ring-1"
      style={{ borderColor: `${color}30`, background: `${color}08` }}
    >
      <div
        className="size-1 w-1 self-stretch rounded-full shrink-0"
        style={{ backgroundColor: color, minWidth: 3 }}
      />
      <div
        className="size-10 rounded-sm flex items-center justify-center shrink-0 font-orbitron text-xs font-black"
        style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
      >
        {label}
      </div>
      {d.headshot_url && (
        <img
          src={d.headshot_url}
          alt={d.full_name}
          className="size-10 object-cover rounded-sm opacity-80"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}
      <div>
        <div className="flex items-center gap-2">
          <span className="font-orbitron text-base font-black">#{d.driver_number}</span>
          <span className="font-orbitron text-base font-black">{d.name_acronym}</span>
          <span className="text-[#555] text-xs font-jetbrains">/ {d.full_name}</span>
        </div>
        <p className="text-[10px] font-orbitron font-bold mt-0.5" style={{ color }}>{d.team_name}</p>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <div className="size-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
        <span className="text-[9px] font-orbitron uppercase tracking-widest" style={{ color }}>
          Live Data
        </span>
      </div>
    </div>
  );
}