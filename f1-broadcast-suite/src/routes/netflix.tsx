import { createFileRoute } from "@tanstack/react-router";
import { useRef, useMemo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useActiveSession } from "@/hooks/useActiveSession";
import { useOpenF1 } from "@/hooks/useOpenF1";
import { AISummary } from "@/components/ai/AISummary";
import { type OF1Driver, type OF1Position, type OF1Lap, fmtLap } from "@/lib/openf1";

export const Route = createFileRoute("/netflix")({ component: NetflixMode });

function NetflixMode() {
  const { session, loading } = useActiveSession();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref });
  const bgOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.2, 0.08, 0.02]);

  const { data: drivers } = useOpenF1<OF1Driver[]>(
    "drivers",
    { session_key: session?.session_key },
    { enabled: !!session },
  );
  const { data: laps } = useOpenF1<OF1Lap[]>(
    "laps",
    { session_key: session?.session_key },
    { enabled: !!session },
  );

  // Compute podium — top 3 by lap count
  const podium = useMemo(() => {
    if (!drivers || !laps || laps.length === 0) return [];
    
    const maxLaps = new Map<number, number>();
    for (const l of laps) {
      maxLaps.set(l.driver_number, Math.max(maxLaps.get(l.driver_number) || 0, l.lap_number));
    }
    
    return drivers
      .map((d) => ({
        driver: d,
        laps: maxLaps.get(d.driver_number) || 0,
      }))
      .sort((a, b) => b.laps - a.laps)
      .slice(0, 3)
      .map((d, idx) => ({ driver: d.driver, position: idx + 1 }));
  }, [drivers, laps]);

  // Best lap of race
  const fastestLap = useMemo(() => {
    if (!laps || !drivers) return null;
    let best: { lap: OF1Lap; driver: OF1Driver } | null = null;
    for (const l of laps) {
      if (l.lap_duration && (!best || l.lap_duration < best.lap.lap_duration!)) {
        const driver = drivers.find((d) => d.driver_number === l.driver_number);
        if (driver) best = { lap: l, driver };
      }
    }
    return best;
  }, [laps, drivers]);

  // Total laps
  const totalLaps = useMemo(() => {
    if (!laps) return 0;
    return laps.reduce((m, l) => Math.max(m, l.lap_number), 0);
  }, [laps]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="size-1.5 rounded-full bg-[#E8002D] animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="size-1.5 rounded-full bg-[#E8002D] animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="size-1.5 rounded-full bg-[#E8002D] animate-bounce" style={{ animationDelay: "300ms" }} />
          <span className="text-[#555] font-orbitron text-xs uppercase tracking-widest ml-2">Acquiring feed…</span>
        </div>
      </div>
    );
  }

  const title = session?.session_name?.toUpperCase() ?? "THE RACE";
  const where = session ? `${session.circuit_short_name.toUpperCase()} · ${session.country_name.toUpperCase()}` : "—";
  const year = session?.year ?? new Date().getFullYear();
  const circuit = session?.circuit_short_name ?? "Circuit";
  const country = session?.country_name ?? "";

  return (
    <div ref={ref} className="relative bg-[#050505] overflow-hidden">
      {/* Ambient background */}
      <motion.div
        className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_20%,#E8002D22_0%,transparent_55%)]"
        style={{ opacity: bgOpacity }}
      />

      {/* ── CHAPTER 01: TITLE CARD ── */}
      <Section>
        <p className="text-[9px] tracking-[0.5em] text-[#E8002D] font-orbitron font-black mb-6">
          CHAPTER 01 · THE TITLE CARD
        </p>
        <div className="overflow-hidden">
          <motion.h1
            initial={{ y: 80, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="font-orbitron text-[clamp(3rem,12vw,10rem)] font-black tracking-tighter leading-none"
          >
            {title}
          </motion.h1>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="font-orbitron text-sm tracking-[0.3em] text-[#555] mt-6"
        >
          {where}
        </motion.p>
        {session && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex items-center gap-8 mt-12"
          >
            <Stat label="Season" value={String(year)} />
            <div className="w-px h-8 bg-white/10" />
            <Stat label="Laps" value={totalLaps > 0 ? String(totalLaps) : "—"} />
            <div className="w-px h-8 bg-white/10" />
            <Stat label="Drivers" value={drivers ? String(drivers.length) : "—"} />
          </motion.div>
        )}
      </Section>

      {/* ── CHAPTER 02: THE PODIUM ── */}
      <Section>
        <p className="text-[9px] tracking-[0.5em] text-[#FFD700] font-orbitron font-black mb-6">
          CHAPTER 02 · THE PODIUM
        </p>
        <h2 className="font-orbitron text-[clamp(2rem,6vw,5rem)] font-black tracking-tighter mb-10">
          {podium.length > 0 ? "The Finishers" : "Race Standings"}
        </h2>
        {podium.length > 0 ? (
          <div className="flex flex-col md:flex-row gap-4">
            {podium.map(({ driver: d, position }, idx) => {
              const color = d.team_colour ? `#${d.team_colour}` : "#888";
              const podiumColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
              return (
                <motion.div
                  key={d.driver_number}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.7 }}
                  className="flex-1 p-6 bg-[#0d0d0d] ring-1 rounded-md relative overflow-hidden"
                  style={{ borderColor: `${color}30` }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: podiumColors[idx] ?? color }}
                  />
                  <div className="text-[48px] font-orbitron font-black leading-none" style={{ color: podiumColors[idx] ?? color }}>
                    P{position}
                  </div>
                  <div className="mt-3">
                    <p className="font-orbitron text-xl font-black tracking-tight">{d.name_acronym}</p>
                    <p className="text-xs text-[#888] font-jetbrains mt-0.5">{d.full_name}</p>
                    <p className="text-[10px] font-orbitron font-bold mt-2" style={{ color }}>{d.team_name}</p>
                  </div>
                  <img
                    src={d.headshot_url}
                    alt={d.full_name}
                    className="absolute bottom-0 right-0 h-28 object-contain opacity-60"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-[#444] font-jetbrains text-sm">
            {session ? "Loading race standings…" : "No session data available."}
          </p>
        )}
      </Section>

      {/* ── CHAPTER 03: FASTEST LAP ── */}
      <Section>
        <p className="text-[9px] tracking-[0.5em] text-[#B026FF] font-orbitron font-black mb-6">
          CHAPTER 03 · THE FLASHPOINT
        </p>
        <h2 className="font-orbitron text-[clamp(2rem,6vw,5rem)] font-black tracking-tighter mb-8">
          Fastest Lap
        </h2>
        {fastestLap ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col md:flex-row items-start md:items-center gap-8 p-8 bg-[#0d0d0d] ring-1 ring-[#B026FF]/30 rounded-md relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_50%,#B026FF10,transparent_60%)]" />
            <div className="relative">
              <p className="text-[9px] text-[#B026FF] font-orbitron uppercase tracking-widest mb-1">Lap {fastestLap.lap.lap_number}</p>
              <p className="font-orbitron text-[clamp(2rem,8vw,5rem)] font-black text-[#B026FF] tracking-tighter leading-none">
                {fmtLap(fastestLap.lap.lap_duration)}
              </p>
            </div>
            <div className="w-px h-16 bg-white/10 hidden md:block" />
            <div className="relative">
              <p className="font-orbitron text-2xl font-black">{fastestLap.driver.name_acronym}</p>
              <p className="text-sm text-[#888] font-jetbrains">{fastestLap.driver.full_name}</p>
              <p
                className="text-[10px] font-orbitron font-bold mt-1"
                style={{ color: fastestLap.driver.team_colour ? `#${fastestLap.driver.team_colour}` : "#888" }}
              >
                {fastestLap.driver.team_name}
              </p>
            </div>
            {fastestLap.lap.duration_sector_1 && (
              <div className="relative flex gap-6 ml-auto">
                {[
                  { label: "S1", val: fastestLap.lap.duration_sector_1 },
                  { label: "S2", val: fastestLap.lap.duration_sector_2 },
                  { label: "S3", val: fastestLap.lap.duration_sector_3 },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-[9px] text-[#555] font-orbitron uppercase tracking-widest mb-1">{s.label}</p>
                    <p className="font-jetbrains text-sm text-[#B026FF]">{s.val?.toFixed(3) ?? "—"}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <p className="text-[#444] font-jetbrains text-sm">
            {session ? "Computing fastest lap…" : "No lap data available."}
          </p>
        )}
      </Section>

      {/* ── CHAPTER 04: AI RACE NARRATIVE ── */}
      <Section>
        <p className="text-[9px] tracking-[0.5em] text-[#00D2BE] font-orbitron font-black mb-6">
          CHAPTER 04 · THE NARRATIVE
        </p>
        <h2 className="font-orbitron text-[clamp(2rem,6vw,5rem)] font-black tracking-tighter mb-8">
          Drive to Survive
        </h2>
        {session ? (
          <AISummary context={{
            session: session.session_name,
            circuit,
            country,
            year,
            mode: "drive-to-survive",
            podium: podium.map((p) => `P${p.position} ${p.driver.name_acronym}`).join(", "),
            fastestLap: fastestLap ? `${fastestLap.driver.name_acronym} ${fmtLap(fastestLap.lap.lap_duration)}` : undefined,
          }}
          />
        ) : (
          <p className="text-[#444]">No session loaded.</p>
        )}
      </Section>

      {/* ── CHAPTER 05: CHEQUERED FLAG ── */}
      <Section center>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/20" />
            <p className="text-[9px] tracking-[0.5em] text-[#444] font-orbitron font-black uppercase">
              End of Broadcast
            </p>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/20" />
          </div>
          <p className="font-orbitron text-[clamp(2.5rem,10vw,8rem)] font-black tracking-tighter text-[#E8002D] text-glow-red">
            CHEQUERED FLAG.
          </p>
          <p className="text-[#333] mt-4 text-xs uppercase tracking-[0.4em] font-orbitron">
            {circuit} Grand Prix · {year} FIA Formula One World Championship
          </p>
        </motion.div>
      </Section>
    </div>
  );
}

function Section({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-15%" }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      className={`relative min-h-screen flex flex-col ${center ? "items-center justify-center text-center" : "justify-center"} px-8 md:px-16 max-w-[1400px] mx-auto`}
    >
      {children}
    </motion.section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-orbitron font-bold uppercase tracking-widest text-[#444] mb-1">{label}</p>
      <p className="font-orbitron text-xl font-black text-white">{value}</p>
    </div>
  );
}