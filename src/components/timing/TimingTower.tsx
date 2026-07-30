import { useMemo, useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOpenF1, useLatestDataDate } from "@/hooks/useOpenF1";
import {
  fmtInterval,
  type OF1Driver,
  type OF1Interval,
  type OF1Lap,
  type OF1Position,
  type OF1Stint,
  type OF1CarData,
  type OF1Pit,
} from "@/lib/openf1";
import { tireColor, tireLetter } from "@/lib/teams";

const TireCompound3D = lazy(() =>
  import("@/components/three/TireCompound3D").then((m) => ({ default: m.TireCompound3D })),
);

function latestPerDriver<T extends { driver_number: number; date?: string }>(arr: T[] | null): Map<number, T> {
  const out = new Map<number, T>();
  if (!arr) return out;
  for (const item of arr) {
    const prev = out.get(item.driver_number);
    if (!prev || (item.date && prev.date && item.date > prev.date)) {
      out.set(item.driver_number, item);
    }
  }
  return out;
}

interface Props {
  sessionKey: number;
  compact?: boolean;
}

export function TimingTower({ sessionKey, compact }: Props) {
  const [tireModal, setTireModal] = useState<{ compound?: string; laps?: number; code: string } | null>(null);
  const { data: drivers } = useOpenF1<OF1Driver[]>("drivers", { session_key: sessionKey }, { intervalMs: 30_000 });
  const { data: positions } = useOpenF1<OF1Position[]>("position", { session_key: sessionKey }, { intervalMs: 2000 });
  const { data: intervals } = useOpenF1<OF1Interval[]>("intervals", { session_key: sessionKey }, { intervalMs: 2000 });
  const { data: laps } = useOpenF1<OF1Lap[]>("laps", { session_key: sessionKey }, { intervalMs: 5000 });
  const { data: stints } = useOpenF1<OF1Stint[]>("stints", { session_key: sessionKey }, { intervalMs: 15_000 });
  const latestDate = useLatestDataDate(sessionKey);
  const { data: carData } = useOpenF1<OF1CarData[]>(
    "car_data", 
    { session_key: sessionKey, ...(latestDate ? { "date>": latestDate } : {}) }, 
    { intervalMs: 3000, enabled: !!latestDate }
  );
  const { data: pits } = useOpenF1<OF1Pit[]>("pit", { session_key: sessionKey }, { intervalMs: 5000 });

  const rows = useMemo(() => {
    if (!drivers) return [];
    const posMap = latestPerDriver(positions);
    const intMap = latestPerDriver(intervals);
    const carMap = latestPerDriver(carData);

    // latest lap per driver
    const lapMap = new Map<number, OF1Lap>();
    for (const l of laps || []) {
      const prev = lapMap.get(l.driver_number);
      if (!prev || l.lap_number > prev.lap_number) lapMap.set(l.driver_number, l);
    }

    // current stint
    const stintMap = new Map<number, OF1Stint>();
    for (const s of stints || []) {
      const prev = stintMap.get(s.driver_number);
      if (!prev || s.stint_number > prev.stint_number) stintMap.set(s.driver_number, s);
    }

    // pit count
    const pitCount = new Map<number, number>();
    for (const p of pits || []) pitCount.set(p.driver_number, (pitCount.get(p.driver_number) || 0) + 1);

    // fastest sector + lap globally
    let bestS1 = Infinity, bestS2 = Infinity, bestS3 = Infinity;
    for (const l of laps || []) {
      if (l.duration_sector_1 && l.duration_sector_1 < bestS1) bestS1 = l.duration_sector_1;
      if (l.duration_sector_2 && l.duration_sector_2 < bestS2) bestS2 = l.duration_sector_2;
      if (l.duration_sector_3 && l.duration_sector_3 < bestS3) bestS3 = l.duration_sector_3;
    }

    // personal best per driver per sector
    const pbS1 = new Map<number, number>();
    const pbS2 = new Map<number, number>();
    const pbS3 = new Map<number, number>();
    for (const l of laps || []) {
      if (l.duration_sector_1) pbS1.set(l.driver_number, Math.min(pbS1.get(l.driver_number) ?? Infinity, l.duration_sector_1));
      if (l.duration_sector_2) pbS2.set(l.driver_number, Math.min(pbS2.get(l.driver_number) ?? Infinity, l.duration_sector_2));
      if (l.duration_sector_3) pbS3.set(l.driver_number, Math.min(pbS3.get(l.driver_number) ?? Infinity, l.duration_sector_3));
    }

    const sectorColor = (val: number | null | undefined, best: number, pb: number) => {
      if (!val) return "#444";
      if (val <= best + 0.0005) return "#B026FF"; // purple
      if (val <= pb + 0.0005) return "#00FF66"; // green
      return "#FFD700"; // yellow
    };

    return drivers
      .map((d) => {
        const pos = posMap.get(d.driver_number)?.position ?? 99;
        const iv = intMap.get(d.driver_number);
        const car = carMap.get(d.driver_number);
        const lap = lapMap.get(d.driver_number);
        const stint = stintMap.get(d.driver_number);
        const teamColor = d.team_colour ? `#${d.team_colour}` : "#888";
        const stintLaps = lap && stint ? Math.max(1, lap.lap_number - stint.lap_start + 1) : stint?.tyre_age_at_start;
        const inPit = Boolean(lap?.is_pit_out_lap === false && car && car.speed < 20 && car.throttle < 5);
        return {
          driverNumber: d.driver_number,
          code: d.name_acronym,
          team: d.team_name,
          teamColor,
          position: pos,
          interval: iv ? fmtInterval(iv.interval ?? iv.gap_to_leader) : "—",
          drs: car ? car.drs >= 10 : false,
          inPit,
          compound: stint?.compound,
          stintLaps,
          s1: lap?.duration_sector_1 ?? null,
          s2: lap?.duration_sector_2 ?? null,
          s3: lap?.duration_sector_3 ?? null,
          s1Color: sectorColor(lap?.duration_sector_1, bestS1, pbS1.get(d.driver_number) ?? Infinity),
          s2Color: sectorColor(lap?.duration_sector_2, bestS2, pbS2.get(d.driver_number) ?? Infinity),
          s3Color: sectorColor(lap?.duration_sector_3, bestS3, pbS3.get(d.driver_number) ?? Infinity),
          pits: pitCount.get(d.driver_number) ?? 0,
        };
      })
      .sort((a, b) => a.position - b.position);
  }, [drivers, positions, intervals, laps, stints, carData, pits]);

  const latestLap = useMemo(() => {
    if (!laps?.length) return null;
    return laps.reduce((m, l) => Math.max(m, l.lap_number), 0);
  }, [laps]);

  return (
    <aside className={`w-full ${compact ? "" : "xl:w-96"} bg-[#111] ring-1 ring-white/5 p-4 rounded-md`}>
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
        <span className="font-orbitron text-xs font-semibold tracking-widest text-[#888] uppercase">
          Live Timing {latestLap ? `· Lap ${latestLap}` : ""}
        </span>
        <div className="size-1.5 rounded-full bg-[#E8002D] animate-pulse" />
      </div>
      <div className="grid grid-cols-[3ch_4ch_1fr_3ch] gap-2 px-2 text-[9px] font-semibold text-[#888] uppercase mb-2">
        <span>Pos</span><span>Drv</span><span className="text-right">Gap / S1·S2·S3</span><span className="text-right">Tire</span>
      </div>
      <div className="space-y-1 max-h-[60vh] xl:max-h-[70vh] overflow-y-auto scrollbar-hide">
        <AnimatePresence>
          {rows.map((r) => (
            <motion.div
              layout
              layoutId={`row-${r.driverNumber}`}
              key={r.driverNumber}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className={`grid grid-cols-[3ch_4ch_1fr_3ch] gap-2 items-center p-2 rounded-sm ${
                r.position === 1
                  ? "bg-[#E8002D]/5 ring-1 ring-[#E8002D]/20"
                  : r.inPit
                  ? "bg-white/5"
                  : "hover:bg-white/5"
              }`}
            >
              <span className="font-orbitron font-semibold text-xs">{r.position}</span>
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 shrink-0" style={{ backgroundColor: r.teamColor }} />
                <span className="font-orbitron font-semibold text-[11px]">{r.code}</span>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1.5">
                  {r.drs && (
                    <span className="text-[8px] font-bold text-[#00D2BE] ring-1 ring-[#00D2BE]/40 px-1 rounded-sm">
                      DRS
                    </span>
                  )}
                  {r.inPit ? (
                    <span className="text-[9px] bg-[#F5F5F5] text-black px-1 font-bold">PIT</span>
                  ) : (
                    <span className="text-[11px]">{r.interval}</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <div className="size-1.5" style={{ backgroundColor: r.s1Color }} title={r.s1?.toFixed(3)} />
                  <div className="size-1.5" style={{ backgroundColor: r.s2Color }} title={r.s2?.toFixed(3)} />
                  <div className="size-1.5" style={{ backgroundColor: r.s3Color }} title={r.s3?.toFixed(3)} />
                </div>
              </div>
              <button
                onClick={() => setTireModal({ compound: r.compound, laps: r.stintLaps ?? undefined, code: r.code })}
                className="flex flex-col items-end leading-none cursor-pointer hover:scale-110 transition-transform"
                aria-label={`Inspect ${r.code} tire`}
              >
                <span className="font-orbitron text-[11px] font-bold" style={{ color: tireColor(r.compound) }}>
                  {tireLetter(r.compound)}
                </span>
                {r.stintLaps != null && (
                  <span className="text-[8px] text-[#888]">{r.stintLaps}L</span>
                )}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {rows.length === 0 && (
          <div className="text-center text-[10px] text-[#888] py-12">Awaiting session data…</div>
        )}
      </div>
      {tireModal && (
        <Suspense fallback={null}>
          <TireCompound3D
            compound={tireModal.compound}
            laps={tireModal.laps}
            driverCode={tireModal.code}
            onClose={() => setTireModal(null)}
          />
        </Suspense>
      )}
    </aside>
  );
}