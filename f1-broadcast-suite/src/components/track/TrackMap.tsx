import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import * as d3 from "d3";
import { useOpenF1 } from "@/hooks/useOpenF1";
import { type OF1Driver, type OF1Location } from "@/lib/openf1";

const TrackMap3D = lazy(() => import("./TrackMap3D").then((m) => ({ default: m.TrackMap3D })));

interface Props {
  sessionKey: number;
}

export function TrackMap({ sessionKey }: Props) {
  const [mode, setMode] = useState<"2D" | "3D">("2D");
  const { data: drivers } = useOpenF1<OF1Driver[]>("drivers", { session_key: sessionKey }, { intervalMs: 30_000 });
  // OpenF1 /location is heavy — pull recent window only. For demo we just pull once every 3s.
  const { data: locations, loading, error } = useOpenF1<OF1Location[]>("location", { session_key: sessionKey }, { intervalMs: 3000 });

  return (
    <div className="aspect-video bg-[#111] ring-1 ring-white/5 rounded-md flex flex-col p-5 relative">
      <div className="flex justify-between items-center mb-4">
        <span className="font-orbitron text-xs font-semibold tracking-widest uppercase">Live Track</span>
        <div className="flex bg-[#0a0a0a] ring-1 ring-white/5 rounded-sm overflow-hidden">
          {(["2D", "3D"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 text-[10px] font-orbitron font-semibold ${
                mode === m ? "bg-[#E8002D] text-[#F5F5F5]" : "text-[#888]"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 relative">
        {error ? (
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-[10px] text-[#E8002D] font-orbitron uppercase tracking-widest text-center px-4">
              Track feed offline
            </span>
          </div>
        ) : loading && (!locations || locations.length === 0) ? (
          <LoadingHud label="Connecting to GPS stream…" />
        ) : mode === "2D" ? (
          <TrackMap2D drivers={drivers ?? []} locations={locations ?? []} />
        ) : (
          <Suspense fallback={<LoadingHud label="Loading 3D scene…" />}>
            <TrackMap3D drivers={drivers ?? []} locations={locations ?? []} />
          </Suspense>
        )}
      </div>
    </div>
  );
}

function LoadingHud({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <span className="text-[10px] text-[#888] font-orbitron uppercase tracking-widest">{label}</span>
    </div>
  );
}

function TrackMap2D({ drivers, locations }: { drivers: OF1Driver[]; locations: OF1Location[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Build latest position per driver.
  const points = useMemo(() => {
    const map = new Map<number, OF1Location>();
    for (const l of locations) {
      const prev = map.get(l.driver_number);
      if (!prev || (l.date && prev.date && l.date > prev.date)) map.set(l.driver_number, l);
    }
    return Array.from(map.values());
  }, [locations]);

  // Derive scale from observed bounds across all data (not just latest).
  const bounds = useMemo(() => {
    if (!locations.length) return null;
    const xs = locations.map((l) => l.x), ys = locations.map((l) => l.y);
    return { xMin: Math.min(...xs), xMax: Math.max(...xs), yMin: Math.min(...ys), yMax: Math.max(...ys) };
  }, [locations]);

  const driverMap = useMemo(() => {
    const m = new Map<number, OF1Driver>();
    for (const d of drivers) m.set(d.driver_number, d);
    return m;
  }, [drivers]);

  useEffect(() => {
    if (!svgRef.current || !bounds) return;
    const svg = d3.select(svgRef.current);
    const w = svgRef.current.clientWidth, h = svgRef.current.clientHeight;
    const pad = 24;
    const xScale = d3.scaleLinear().domain([bounds.xMin, bounds.xMax]).range([pad, w - pad]);
    const yScale = d3.scaleLinear().domain([bounds.yMin, bounds.yMax]).range([h - pad, pad]);

    // Track path = all unique positions of leader-ish car, smoothed; for simplicity use convex hull of all points.
    const sample = locations.slice(-2000);
    const trackPath = d3.line<OF1Location>().x((d) => xScale(d.x)).y((d) => yScale(d.y));
    svg.select<SVGPathElement>("path.track")
      .attr("d", trackPath(sample) || "")
      .attr("stroke", "#222").attr("fill", "none").attr("stroke-width", 4)
      .attr("opacity", 0.4);

    const sel = svg.select<SVGGElement>("g.cars").selectAll<SVGCircleElement, OF1Location>("circle")
      .data(points, (d) => String(d.driver_number));

    sel.enter().append("circle")
      .attr("r", 6)
      .attr("cx", (d) => xScale(d.x)).attr("cy", (d) => yScale(d.y))
      .attr("fill", (d) => {
        const c = driverMap.get(d.driver_number)?.team_colour;
        return c ? `#${c}` : "#888";
      })
      .attr("stroke", "#0a0a0a").attr("stroke-width", 2)
      .merge(sel)
      .transition().duration(1800).ease(d3.easeLinear)
      .attr("cx", (d) => xScale(d.x)).attr("cy", (d) => yScale(d.y))
      .attr("fill", (d) => {
        const c = driverMap.get(d.driver_number)?.team_colour;
        return c ? `#${c}` : "#888";
      });

    sel.exit().remove();

    // labels
    const lbl = svg.select<SVGGElement>("g.labels").selectAll<SVGTextElement, OF1Location>("text")
      .data(points, (d) => String(d.driver_number));
    lbl.enter().append("text")
      .attr("font-family", "Orbitron, sans-serif").attr("font-size", 9).attr("font-weight", 700)
      .attr("fill", "#F5F5F5")
      .merge(lbl)
      .text((d) => driverMap.get(d.driver_number)?.name_acronym ?? d.driver_number)
      .transition().duration(1800).ease(d3.easeLinear)
      .attr("x", (d) => xScale(d.x) + 8).attr("y", (d) => yScale(d.y) - 6);
    lbl.exit().remove();
  }, [points, bounds, locations, driverMap]);

  if (!bounds) {
    return <LoadingHud label="Awaiting location stream…" />;
  }
  return (
    <svg ref={svgRef} className="absolute inset-0 w-full h-full">
      <path className="track" />
      <g className="cars" />
      <g className="labels" />
    </svg>
  );
}