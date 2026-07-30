import { useMemo } from "react";

interface Props {
  compound: string;       // "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET"
  tyreAge: number;        // laps on current tyre
  speed: number;          // km/h (heat from speed)
  brake: number;          // 0-100 (rear + front wear)
  throttle: number;       // 0-100 (rear wear)
}

const COMPOUND_COLORS: Record<string, { base: string; name: string }> = {
  SOFT:         { base: "#E8002D", name: "S" },
  MEDIUM:       { base: "#FFD700", name: "M" },
  HARD:         { base: "#F5F5F5", name: "H" },
  INTERMEDIATE: { base: "#39B54A", name: "I" },
  WET:          { base: "#0067FF", name: "W" },
};

/**
 * Returns an HSL color from cool (blue) → nominal (green) → hot (yellow) → critical (red)
 * wear: 0.0 (new) → 1.0 (worn out)
 */
function wearColor(wear: number): string {
  if (wear < 0.25) return "#00D2BE"; // cool blue-teal
  if (wear < 0.5)  return "#00FF66"; // green
  if (wear < 0.75) return "#FFD700"; // yellow
  if (wear < 0.9)  return "#FF8C00"; // orange
  return "#E8002D";                  // red critical
}

/**
 * Tyre wear model (simplified F1-physics-based):
 * - Base degradation per lap: ~3% (soft), ~1.5% (medium), ~0.8% (hard)
 * - Speed amplifies outer edge wear
 * - Braking amplifies front + inner edge wear  
 * - Throttle amplifies rear wear
 */
function calcWear(compound: string, age: number, speed: number, brake: number, throttle: number) {
  const base = compound === "SOFT" ? 0.03 : compound === "MEDIUM" ? 0.015 : 0.008;
  const speedMult = 0.6 + (speed / 320) * 0.8;
  const brakeMult = 0.7 + (brake / 100) * 0.6;
  const throtMult = 0.7 + (throttle / 100) * 0.5;

  // Each tyre zone has different sensitivities
  const outer = Math.min(1, age * base * speedMult * 1.2);       // outer edge = most speed sensitive
  const inner = Math.min(1, age * base * brakeMult * 1.15);      // inner edge = brake sensitive
  const center = Math.min(1, age * base * ((speedMult + throtMult) / 2)); // center = balanced

  // Asymmetric FL/FR/RL/RR — just vary by position slightly
  return {
    fl: { inner: inner * 1.1, center: center * 0.95, outer: outer * 0.9 },
    fr: { inner: inner * 0.85, center: center * 1.0, outer: outer * 1.2 },
    rl: { inner: inner * 0.9,  center: center * 1.1, outer: outer * 0.85 },
    rr: { inner: inner * 0.8,  center: center * 1.05, outer: outer * 1.1 },
  };
}

interface TyreCircleProps {
  label: string;
  inner: number;
  center: number;
  outer: number;
  compound: string;
}

function TyreCircle({ label, inner, center, outer, compound }: TyreCircleProps) {
  const ci = wearColor(inner);
  const cc = wearColor(center);
  const co = wearColor(outer);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[8px] font-orbitron font-black uppercase tracking-widest text-[#555]">{label}</span>
      <svg viewBox="0 0 80 80" className="w-16 h-16">
        {/* Outer zone */}
        <circle cx={40} cy={40} r={36} fill={co} fillOpacity={0.6} stroke="#0d0d0d" strokeWidth={1} />
        {/* Center zone */}
        <circle cx={40} cy={40} r={24} fill={cc} fillOpacity={0.75} stroke="#0d0d0d" strokeWidth={1} />
        {/* Inner zone */}
        <circle cx={40} cy={40} r={12} fill={ci} fillOpacity={0.9} stroke="#0d0d0d" strokeWidth={1} />
        {/* Compound label */}
        <text x={40} y={44} textAnchor="middle" fill="#000" fontSize={10} fontWeight={900} fontFamily="Orbitron">
          {COMPOUND_COLORS[compound]?.name ?? "?"}
        </text>
      </svg>
      {/* Wear % */}
      <div className="grid grid-cols-3 gap-px w-full text-center">
        {[["I", inner], ["C", center], ["O", outer]].map(([z, w]) => (
          <div key={String(z)} className="bg-[#0a0a0a] rounded-sm py-0.5">
            <p className="text-[7px] text-[#444] font-orbitron">{z}</p>
            <p className="text-[8px] font-orbitron font-black" style={{ color: wearColor(Number(w)) }}>
              {Math.round(Number(w) * 100)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TyreHeatmap({ compound, tyreAge, speed, brake, throttle }: Props) {
  const wear = useMemo(() => calcWear(compound, tyreAge, speed, brake, throttle), [compound, tyreAge, speed, brake, throttle]);
  const cmpMeta = COMPOUND_COLORS[compound] ?? COMPOUND_COLORS["MEDIUM"];
  const avgWear = (
    (wear.fl.center + wear.fr.center + wear.rl.center + wear.rr.center) / 4
  );

  return (
    <div className="bg-[#0d0d0d] ring-1 ring-white/8 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-orbitron font-black uppercase tracking-[0.2em] text-[#888]">
          Tyre Heatmap
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-orbitron text-[#555]">Lap {tyreAge}</span>
          <span
            className="text-[10px] font-orbitron font-black px-2 py-0.5 rounded-sm"
            style={{ backgroundColor: `${cmpMeta.base}20`, color: cmpMeta.base, border: `1px solid ${cmpMeta.base}40` }}
          >
            {compound}
          </span>
        </div>
      </div>

      {/* Four tyre grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <TyreCircle label="FL" {...wear.fl} compound={compound} />
        <TyreCircle label="FR" {...wear.fr} compound={compound} />
        <TyreCircle label="RL" {...wear.rl} compound={compound} />
        <TyreCircle label="RR" {...wear.rr} compound={compound} />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {[
          { color: "#00D2BE", label: "New" },
          { color: "#00FF66", label: "Good" },
          { color: "#FFD700", label: "Worn" },
          { color: "#FF8C00", label: "Hot" },
          { color: "#E8002D", label: "Critical" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="size-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[7px] font-orbitron text-[#444]">{label}</span>
          </div>
        ))}
        <span className="ml-auto text-[8px] font-orbitron text-[#555]">
          Avg {Math.round(avgWear * 100)}%
        </span>
      </div>
    </div>
  );
}
