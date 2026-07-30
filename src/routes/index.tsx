import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { lazy, Suspense } from "@/lib/lazy-shim";
import { useActiveSession } from "@/hooks/useActiveSession";
import { Signal, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

const CircuitScene = lazy(() =>
  import("@/components/three/CircuitScene").then((m) => ({ default: m.CircuitScene })),
);

const MODES = [
  {
    to: "/live",
    label: "LIVE",
    n: "01",
    color: "#E8002D",
    desc: "Real-time timing, track position, radio",
    live: true,
  },
  {
    to: "/pitwall",
    label: "PIT WALL",
    n: "02",
    color: "#FFD700",
    desc: "Fullscreen broadcast operations HUD",
    live: false,
  },
  {
    to: "/telemetry",
    label: "TELEMETRY",
    n: "03",
    color: "#00D2BE",
    desc: "Per-driver car data & comparison",
    live: false,
  },
  {
    to: "/netflix",
    label: "DRIVE TO SURVIVE",
    n: "04",
    color: "#F5F5F5",
    desc: "Cinematic race narrative & podium",
    live: false,
  },
  {
    to: "/replay",
    label: "REPLAY",
    n: "05",
    color: "#888",
    desc: "Archive — 2026 season sessions",
    live: false,
  },
] as const;

function Landing() {
  const { session, isLive } = useActiveSession();

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[88vh] min-h-[640px] flex flex-col justify-end pb-16 px-6 lg:px-14 overflow-hidden">
        {/* 3D Background */}
        <div className="absolute inset-0 z-0">
          <Suspense fallback={null}>
            <CircuitScene />
          </Suspense>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,#E8002D1A_0%,transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,#00D2BE0D_0%,transparent_50%)]" />
          <div className="absolute bottom-0 inset-x-0 h-2/3 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-[1440px] mx-auto w-full">
          {/* Live session badge */}
          {session && (
            <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 bg-[#E8002D]/10 ring-1 ring-[#E8002D]/30 rounded-sm">
              <div className={`size-1.5 rounded-full ${isLive ? "animate-pulse shadow-[0_0_6px_#E8002D]" : ""} bg-[#E8002D]`} />
              <span className="text-[9px] font-orbitron font-black uppercase tracking-[0.2em] text-[#E8002D]">
                {isLive ? "LIVE" : "LAST RACE"} · {session.session_name} · {session.circuit_short_name} · {session.country_name}
              </span>
            </div>
          )}

          <header className="mb-10">
            <p className="text-[9px] font-orbitron font-black uppercase tracking-[0.4em] text-[#444] mb-3">
              2026 FIA Formula One World Championship
            </p>
            <h1 className="font-orbitron font-black text-[clamp(3rem,9vw,8rem)] tracking-tighter leading-[0.9] mb-5">
              F1 LIVE{" "}
              <span className="text-[#E8002D]" style={{ textShadow: "0 0 40px #E8002D50" }}>
                COMMANDER
              </span>
            </h1>
            <p className="text-[#555] text-sm max-w-[44ch] leading-relaxed font-jetbrains">
              Broadcast-grade race operations. Real-time timing, telemetry, team radio, and pit wall strategy — live from every circuit on earth.
            </p>
          </header>

          {/* Mode cards */}
          <nav className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
            {MODES.map((m) => (
              <Link
                key={m.to}
                to={m.to}
                className="group relative flex flex-col p-4 bg-[#0d0d0d] ring-1 ring-white/5 hover:ring-white/15 rounded-md text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg overflow-hidden"
              >
                {/* Hover color accent */}
                <div
                  className="absolute inset-x-0 top-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: m.color }}
                />

                <div className="flex items-center justify-between mb-3">
                  <span
                    className="font-orbitron text-[9px] font-black uppercase tracking-[0.2em]"
                    style={{ color: m.color }}
                  >
                    {m.n}
                  </span>
                  {m.live && (
                    <div className="flex items-center gap-1">
                      <Signal className="size-2.5 text-[#E8002D]" />
                      <span className="text-[8px] font-orbitron font-bold text-[#E8002D] uppercase tracking-widest">
                        Live
                      </span>
                    </div>
                  )}
                </div>

                <span className="font-orbitron text-sm font-black tracking-tight text-white mb-1.5">
                  {m.label}
                </span>
                <span className="text-[9px] text-[#444] font-jetbrains leading-relaxed flex-1">
                  {m.desc}
                </span>

                <div className="mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] font-orbitron font-bold uppercase tracking-wider" style={{ color: m.color }}>
                    Enter
                  </span>
                  <ChevronRight className="size-3" style={{ color: m.color }} />
                </div>
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {/* Bottom info bar */}
      <div className="px-6 lg:px-14 py-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[9px] font-jetbrains text-[#333]">
          <span>Powered by OpenF1 API</span>
          <span className="text-[#222]">·</span>
          <span>Firebase Realtime</span>
          <span className="text-[#222]">·</span>
          <span>2026 Season Data</span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-orbitron text-[#00D2BE]">
          <div className="size-1.5 rounded-full bg-[#00D2BE]" />
          UPLINK STABLE
        </div>
      </div>
    </div>
  );
}
