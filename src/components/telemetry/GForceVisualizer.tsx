import { useMemo } from "react";

interface Props {
  speed: number;        // km/h
  brake: number;        // 0-100
  throttle: number;     // 0-100
  rpm: number;
  prevSpeed?: number;   // previous frame speed for delta
}

/**
 * G-Force Visualizer
 * Derives lateral G from brake/throttle balance (braking=longitudinal -G, acceleration=+G)
 * and estimates lateral G from speed/brake combination (cornering proxy).
 */
export function GForceVisualizer({ speed, brake, throttle, prevSpeed = 0 }: Props) {
  const { gLat, gLon, totalG } = useMemo(() => {
    // Longitudinal G: braking = negative, acceleration = positive
    // F1 cars: max braking ~5G, max acceleration ~1.5G
    const brakeFraction = brake / 100;
    const throttleFraction = throttle / 100;
    const gLon = throttleFraction * 1.4 - brakeFraction * 4.8;

    // Lateral G proxy: high speed + braking = cornering
    // F1 cars can pull ~5G lateral in fast corners
    const speedFactor = Math.min(speed / 320, 1);
    const corneringIntensity = speedFactor * brakeFraction * 0.6 + speedFactor * (1 - throttleFraction) * 0.4;
    // Alternate left/right based on brake + speed combination (simplified)
    const side = ((Math.floor(speed / 30) % 2 === 0) ? 1 : -1);
    const gLat = side * corneringIntensity * 4.5;

    const totalG = Math.sqrt(gLat * gLat + gLon * gLon);
    return { gLat, gLon, totalG };
  }, [speed, brake, throttle, prevSpeed]);

  // Map G forces to position in SVG circle (radius 80px, center 100,100)
  const RADIUS = 72;
  const MAX_G = 5;
  const cx = 100 + (gLat / MAX_G) * RADIUS;
  const cy = 100 - (gLon / MAX_G) * RADIUS; // flip Y so acceleration=up

  // Bubble color based on total G
  const bubbleColor = totalG < 1.5 ? "#00FF66"
    : totalG < 3.0 ? "#FFD700"
    : totalG < 4.5 ? "#FF8C00"
    : "#E8002D";

  const rings = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="bg-[#0d0d0d] ring-1 ring-white/8 rounded-xl p-4 flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full">
        <span className="text-[9px] font-orbitron font-black uppercase tracking-[0.2em] text-[#888]">
          G-Force
        </span>
        <span
          className="text-[11px] font-orbitron font-black tabular-nums"
          style={{ color: bubbleColor }}
        >
          {totalG.toFixed(2)}G
        </span>
      </div>

      <svg viewBox="0 0 200 200" className="w-full max-w-[160px]">
        {/* Background rings */}
        {rings.map((r, i) => (
          <circle
            key={i}
            cx={100}
            cy={100}
            r={RADIUS * r}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth={1}
          />
        ))}

        {/* Crosshairs */}
        <line x1={100} y1={28} x2={100} y2={172} stroke="#1a1a1a" strokeWidth={1} />
        <line x1={28} y1={100} x2={172} y2={100} stroke="#1a1a1a" strokeWidth={1} />

        {/* Direction labels */}
        <text x={100} y={20} textAnchor="middle" fill="#333" fontSize={8} fontFamily="Orbitron">ACC</text>
        <text x={100} y={188} textAnchor="middle" fill="#333" fontSize={8} fontFamily="Orbitron">BRK</text>
        <text x={12} y={103} textAnchor="middle" fill="#333" fontSize={8} fontFamily="Orbitron">L</text>
        <text x={188} y={103} textAnchor="middle" fill="#333" fontSize={8} fontFamily="Orbitron">R</text>

        {/* Outer circle boundary */}
        <circle cx={100} cy={100} r={RADIUS} fill="none" stroke="#2a2a2a" strokeWidth={1.5} />

        {/* Trail line from center to bubble */}
        <line
          x1={100}
          y1={100}
          x2={cx}
          y2={cy}
          stroke={bubbleColor}
          strokeWidth={1.5}
          strokeOpacity={0.4}
        />

        {/* G-force bubble */}
        <circle
          cx={cx}
          cy={cy}
          r={10}
          fill={bubbleColor}
          fillOpacity={0.85}
          style={{
            filter: `drop-shadow(0 0 6px ${bubbleColor})`,
            transition: "cx 0.3s ease, cy 0.3s ease",
          }}
        />

        {/* Center dot */}
        <circle cx={100} cy={100} r={3} fill="#333" />
      </svg>

      {/* Numeric readouts */}
      <div className="grid grid-cols-2 w-full gap-2 text-center">
        <div className="bg-[#0a0a0a] ring-1 ring-white/5 rounded-md py-1.5">
          <p className="text-[8px] font-orbitron uppercase tracking-widest text-[#555]">Lateral</p>
          <p className="text-[11px] font-orbitron font-black" style={{ color: Math.abs(gLat) > 3 ? "#E8002D" : "#F5F5F5" }}>
            {gLat >= 0 ? "→" : "←"} {Math.abs(gLat).toFixed(2)}G
          </p>
        </div>
        <div className="bg-[#0a0a0a] ring-1 ring-white/5 rounded-md py-1.5">
          <p className="text-[8px] font-orbitron uppercase tracking-widest text-[#555]">Long.</p>
          <p className="text-[11px] font-orbitron font-black" style={{ color: gLon < -2 ? "#E8002D" : gLon > 0.5 ? "#00FF66" : "#F5F5F5" }}>
            {gLon >= 0 ? "↑" : "↓"} {Math.abs(gLon).toFixed(2)}G
          </p>
        </div>
      </div>
    </div>
  );
}
