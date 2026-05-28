import { Link, useRouterState } from "@tanstack/react-router";
import { Radio, Activity, Film, History, Home, Gauge } from "lucide-react";
import { useEffect, useState } from "react";
import { CommandPalette } from "@/components/shared/CommandPalette";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/live", label: "Live", icon: Radio },
  { to: "/telemetry", label: "Telemetry", icon: Activity },
  { to: "/pitwall", label: "Pit Wall", icon: Gauge },
  { to: "/netflix", label: "Story", icon: Film },
  { to: "/replay", label: "Replay", icon: History },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPitWall = pathname.startsWith("/pitwall");
  const [time, setTime] = useState(new Date());
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Global Ctrl/Cmd+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#F5F5F5] font-jetbrains pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      {!isPitWall && (
        <header className="hidden md:flex sticky top-0 z-40 items-center justify-between px-8 py-0 border-b border-white/5 bg-[#0a0a0a]/95 backdrop-blur-md h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="size-2 rounded-full bg-[#E8002D] animate-pulse" />
              <div className="absolute inset-0 size-2 rounded-full bg-[#E8002D] blur-sm opacity-60 animate-pulse" />
            </div>
            <span className="font-orbitron text-sm font-black tracking-tighter">
              F1 <span className="text-[#E8002D]">COMMANDER</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex gap-0.5">
            {NAV.slice(1).map(({ to, label }) => {
              const active = pathname === to || pathname.startsWith(`${to}/`);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative px-4 py-[18px] text-[10px] font-orbitron font-bold tracking-[0.2em] uppercase transition-all ${
                    active
                      ? "text-[#F5F5F5]"
                      : "text-[#555] hover:text-[#888]"
                  }`}
                >
                  {active && (
                    <span className="absolute bottom-0 inset-x-4 h-[2px] bg-[#E8002D]" />
                  )}
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* ⌘K badge */}
          <button
            id="open-command-palette"
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/4 hover:bg-white/8 ring-1 ring-white/8 hover:ring-white/15 transition-all"
          >
            <span className="text-[9px] font-jetbrains text-[#444]">Search commands</span>
            <kbd className="flex items-center gap-0.5 text-[9px] font-orbitron text-[#333]">
              <span>⌘</span><span>K</span>
            </kbd>
          </button>

          {/* Status bar */}
          <div className="flex items-center gap-4 text-[9px] font-orbitron font-bold tracking-widest text-[#444]">
            <div className="flex items-center gap-1.5">
              <div className="size-1.5 rounded-full bg-[#00D2BE] shadow-[0_0_6px_#00D2BE]" />
              <span className="text-[#00D2BE]">UPLINK STABLE</span>
            </div>
            <span className="text-[#333] font-jetbrains">
              {time.toLocaleTimeString("en-GB", { hour12: false })} UTC+{(new Date().getTimezoneOffset() / -60).toString().padStart(2, "0")}
            </span>
            <span className="text-[#333]">2026 FIA F1 WORLD CHAMPIONSHIP</span>
          </div>
        </header>
      )}

      <main className="flex-1 flex flex-col relative">
        {children}
      </main>

      {!isPitWall && (
        <footer className="hidden md:flex border-t border-white/5 bg-[#050505] py-4 px-8 items-center justify-between z-40 shrink-0">
          <div className="flex items-center gap-4 text-[#555] text-[10px] font-orbitron uppercase tracking-widest">
            <span>© 2026 F1 Live Commander</span>
          </div>
          <Link to="/about" className="group flex items-center gap-3">
            <span className="text-[#555] text-[10px] font-orbitron uppercase tracking-widest group-hover:text-[#888] transition-colors">
              Engineered by
            </span>
            <div className="px-3 py-1 bg-[#111] ring-1 ring-white/10 rounded-sm group-hover:ring-[#E8002D]/50 group-hover:bg-[#E8002D]/10 transition-all">
              <span className="text-[#E8002D] text-[11px] font-orbitron font-bold uppercase tracking-widest drop-shadow-[0_0_8px_rgba(232,0,45,0.5)]">
                Srinivas Reddy K.H
              </span>
            </div>
          </Link>
        </footer>
      )}

      {!isPitWall && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0a0a0a]/97 backdrop-blur-md border-t border-white/5 grid grid-cols-6"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== "/" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center gap-1 py-3 text-[8px] font-orbitron font-bold uppercase tracking-tight transition-colors ${
                  active ? "text-[#E8002D]" : "text-[#444]"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Global Command Palette */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}