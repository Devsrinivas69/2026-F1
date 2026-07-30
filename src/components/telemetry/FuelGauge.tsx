import { useMemo } from "react";
import { Fuel } from "lucide-react";

interface Props {
  currentLap: number;     // current lap number
  totalLaps: number;      // total race laps
  circuitLength?: number; // km per lap (default 5.2 average)
}

/**
 * Fuel Load Estimator
 * F1 cars start with up to 105kg of fuel.
 * Average consumption: ~2.2kg per lap (varies by circuit length)
 * Formula: fuelRemaining = startFuel - (lapsDone × fuelPerLap)
 * 
 * Circuit consumption estimates:
 * - Short circuits (~4km): ~1.8kg/lap
 * - Average circuits (~5.2km): ~2.2kg/lap  
 * - Long circuits (~7km): ~3.0kg/lap
 */
export function FuelGauge({ currentLap, totalLaps, circuitLength = 5.2 }: Props) {
  const { fuelKg, fuelPct, lapsRemaining, fuelPerLap, status } = useMemo(() => {
    // Fuel per lap scales with circuit length
    const fuelPerLap = Math.max(1.5, Math.min(3.5, circuitLength * 0.42));
    const startFuel = Math.min(105, totalLaps * fuelPerLap + 3); // +3kg buffer
    const consumed = (currentLap - 1) * fuelPerLap;
    const fuelKg = Math.max(0, startFuel - consumed);
    const fuelPct = (fuelKg / startFuel) * 100;
    const lapsRemaining = Math.floor(fuelKg / fuelPerLap);
    
    const status = fuelPct > 50 ? "nominal" : fuelPct > 20 ? "watch" : "critical";
    return { fuelKg, fuelPct, lapsRemaining, fuelPerLap, status };
  }, [currentLap, totalLaps, circuitLength]);

  const statusColor = status === "nominal" ? "#00FF66" : status === "watch" ? "#FFD700" : "#E8002D";
  const statusLabel = status === "nominal" ? "NOMINAL" : status === "watch" ? "WATCH" : "CRITICAL";

  // Bar height as percentage
  const barH = Math.max(2, Math.round(fuelPct));

  return (
    <div className="bg-[#0d0d0d] ring-1 ring-white/8 rounded-xl p-4 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-orbitron font-black uppercase tracking-[0.2em] text-[#888]">
          Fuel Load
        </span>
        <span
          className="text-[8px] font-orbitron font-black px-2 py-0.5 rounded-sm"
          style={{ backgroundColor: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}
        >
          {statusLabel}
        </span>
      </div>

      <div className="flex items-end gap-4 flex-1">
        {/* Vertical fuel tank */}
        <div className="flex flex-col items-center gap-1 h-full">
          {/* Tank outline */}
          <div className="relative w-8 flex-1 rounded-md overflow-hidden bg-[#0a0a0a] ring-1 ring-white/10" style={{ minHeight: 120 }}>
            {/* Fill bar from bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 rounded-b-md transition-all duration-1000"
              style={{
                height: `${barH}%`,
                background: `linear-gradient(to top, ${statusColor}, ${statusColor}88)`,
                boxShadow: `0 0 12px ${statusColor}55`,
              }}
            />
            {/* Tick marks */}
            {[25, 50, 75].map((pct) => (
              <div
                key={pct}
                className="absolute left-0 right-0 border-t border-white/10"
                style={{ bottom: `${pct}%` }}
              />
            ))}
          </div>
          <Fuel className="size-3.5 mt-1" style={{ color: statusColor }} />
        </div>

        {/* Readouts */}
        <div className="flex flex-col gap-2 flex-1">
          {/* Main kg display */}
          <div>
            <p className="text-[8px] font-orbitron text-[#555] uppercase tracking-widest mb-0.5">Remaining</p>
            <p className="text-2xl font-orbitron font-black tabular-nums" style={{ color: statusColor }}>
              {fuelKg.toFixed(1)}
              <span className="text-[11px] text-[#555] ml-1">kg</span>
            </p>
          </div>

          <div className="h-px bg-white/5" />

          {/* Stats grid */}
          <div className="grid grid-cols-1 gap-1.5">
            <StatRow label="Lap Consumption" value={`${fuelPerLap.toFixed(2)} kg`} />
            <StatRow label="Laps Remaining" value={`${lapsRemaining}`} color={lapsRemaining < 5 ? "#E8002D" : "#F5F5F5"} />
            <StatRow label="Race Progress" value={`L${currentLap} / ${totalLaps}`} />
            <StatRow label="Fuel %" value={`${fuelPct.toFixed(1)}%`} color={statusColor} />
          </div>

          {/* Progress bar */}
          <div className="mt-1">
            <p className="text-[7px] font-orbitron text-[#444] uppercase tracking-widest mb-1">Lap Progress</p>
            <div className="h-1 bg-[#111] rounded-full overflow-hidden ring-1 ring-white/5">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min(100, ((currentLap - 1) / totalLaps) * 100)}%`,
                  backgroundColor: "#E8002D",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, color = "#F5F5F5" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[8px] font-orbitron text-[#444] uppercase tracking-widest">{label}</span>
      <span className="text-[9px] font-orbitron font-black tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}
