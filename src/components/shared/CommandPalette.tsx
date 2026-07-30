import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Activity, Gauge, Film, History, Home, Settings, ArrowRight, Search } from "lucide-react";

// ─── Command Definitions ────────────────────────────────────────────────────

type Command = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: "navigation" | "actions";
  to: string;
  color?: string;
  shortcut?: string;
};

const COMMANDS: Command[] = [
  {
    id: "home",
    label: "Home",
    description: "Mission control landing page",
    icon: <Home className="size-4" />,
    category: "navigation",
    to: "/",
    color: "#F5F5F5",
  },
  {
    id: "live",
    label: "Live",
    description: "Real-time timing, track position & team radio",
    icon: <Radio className="size-4" />,
    category: "navigation",
    to: "/live",
    color: "#E8002D",
    shortcut: "1",
  },
  {
    id: "telemetry",
    label: "Telemetry",
    description: "Per-driver car data & comparison charts",
    icon: <Activity className="size-4" />,
    category: "navigation",
    to: "/telemetry",
    color: "#00D2BE",
    shortcut: "2",
  },
  {
    id: "pitwall",
    label: "Pit Wall",
    description: "Fullscreen broadcast operations HUD",
    icon: <Gauge className="size-4" />,
    category: "navigation",
    to: "/pitwall",
    color: "#FFD700",
    shortcut: "3",
  },
  {
    id: "netflix",
    label: "Drive to Survive",
    description: "Cinematic race narrative & podium",
    icon: <Film className="size-4" />,
    category: "navigation",
    to: "/netflix",
    color: "#F5F5F5",
    shortcut: "4",
  },
  {
    id: "replay",
    label: "Replay",
    description: "Archive — 2026 season sessions",
    icon: <History className="size-4" />,
    category: "navigation",
    to: "/replay",
    color: "#888",
    shortcut: "5",
  },
  {
    id: "settings",
    label: "Settings",
    description: "App preferences",
    icon: <Settings className="size-4" />,
    category: "navigation",
    to: "/settings",
    color: "#555",
  },
];

// ─── Command Palette Component ───────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Reset state on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      // Defer focus to next frame so AnimatePresence has rendered the element
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  // Filtered + sorted commands
  const filtered = query.trim()
    ? COMMANDS.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase()),
      )
    : COMMANDS;

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[selected];
        if (cmd) activateCommand(cmd);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, selected]);

  // Reset selection when filtered list changes
  useEffect(() => {
    setSelected(0);
  }, [query]);

  function activateCommand(cmd: Command) {
    navigate({ to: cmd.to });
    onClose();
  }

  const navCmds = filtered.filter((c) => c.category === "navigation");

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed left-1/2 top-[15%] z-50 w-full max-w-xl -translate-x-1/2"
          >
            <div className="bg-[#0d0d0d] ring-1 ring-white/10 rounded-lg overflow-hidden shadow-2xl shadow-black/80">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
                <Search className="size-4 text-[#444] shrink-0" />
                <input
                  ref={inputRef}
                  id="command-palette-input"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search commands…"
                  className="flex-1 bg-transparent text-[#F5F5F5] font-jetbrains text-sm placeholder:text-[#333] outline-none"
                />
                <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-orbitron text-[#333] ring-1 ring-white/10">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="py-2 max-h-[380px] overflow-y-auto scrollbar-hide">
                {navCmds.length > 0 && (
                  <>
                    <p className="px-4 pb-1.5 pt-0.5 text-[9px] font-orbitron font-black uppercase tracking-[0.25em] text-[#333]">
                      Navigation
                    </p>
                    {navCmds.map((cmd, i) => {
                      const globalIdx = filtered.indexOf(cmd);
                      const isSelected = globalIdx === selected;
                      return (
                        <button
                          key={cmd.id}
                          id={`cmd-${cmd.id}`}
                          onMouseEnter={() => setSelected(globalIdx)}
                          onClick={() => activateCommand(cmd)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            isSelected
                              ? "bg-white/5"
                              : "hover:bg-white/3"
                          }`}
                        >
                          {/* Icon */}
                          <span
                            className="shrink-0 size-8 flex items-center justify-center rounded-md ring-1"
                            style={{
                              color: cmd.color ?? "#F5F5F5",
                              backgroundColor: `${cmd.color ?? "#F5F5F5"}12`,
                              borderColor: `${cmd.color ?? "#F5F5F5"}25`,
                            }}
                          >
                            {cmd.icon}
                          </span>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <p className="font-orbitron text-xs font-bold tracking-tight text-[#F5F5F5]">
                              {cmd.label}
                            </p>
                            <p className="text-[10px] font-jetbrains text-[#555] truncate">
                              {cmd.description}
                            </p>
                          </div>

                          {/* Shortcut */}
                          {cmd.shortcut && (
                            <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-orbitron text-[#444] ring-1 ring-white/8 ml-auto shrink-0">
                              {cmd.shortcut}
                            </kbd>
                          )}

                          {isSelected && (
                            <ArrowRight
                              className="size-3.5 shrink-0 ml-1"
                              style={{ color: cmd.color ?? "#F5F5F5" }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </>
                )}

                {filtered.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <p className="text-[#333] text-xs font-jetbrains">
                      No results for &ldquo;{query}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="px-4 py-2 border-t border-white/5 flex items-center gap-3 text-[9px] font-orbitron text-[#2a2a2a] uppercase tracking-widest">
                <span>↑↓ Navigate</span>
                <span>·</span>
                <span>Enter Select</span>
                <span>·</span>
                <span>Esc Dismiss</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
