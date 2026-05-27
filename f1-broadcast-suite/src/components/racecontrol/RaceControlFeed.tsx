import { useMemo } from "react";
import { useOpenF1 } from "@/hooks/useOpenF1";
import { type OF1RaceControl } from "@/lib/openf1";

function categorize(msg: OF1RaceControl): { color: string; icon: string; weight?: string } {
  const m = (msg.message || "").toUpperCase();
  const f = (msg.flag || "").toUpperCase();
  if (f === "RED" || m.includes("RED FLAG")) return { color: "#E8002D", icon: "■", weight: "bold" };
  if (f === "YELLOW" || m.includes("YELLOW")) return { color: "#FFD700", icon: "▲" };
  if (m.includes("SAFETY CAR") && !m.includes("VIRTUAL")) return { color: "#FFA500", icon: "SC" };
  if (m.includes("VIRTUAL SAFETY CAR") || m.includes("VSC")) return { color: "#FFA500", icon: "VSC" };
  if (m.includes("DRS ENABLED")) return { color: "#00D2BE", icon: "↑" };
  if (m.includes("DRS DISABLED")) return { color: "#888888", icon: "↓" };
  if (m.includes("INVESTIGAT")) return { color: "#888888", icon: "?" };
  if (m.includes("PENALTY") || m.includes("TIME PENALTY")) return { color: "#FF6B6B", icon: "⚖" };
  if (m.includes("CHEQUERED")) return { color: "#F5F5F5", icon: "▦", weight: "bold" };
  return { color: "#F5F5F5", icon: "·" };
}

const fmtTime = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", { hour12: false });
  } catch { return ""; }
};

export function RaceControlFeed({ sessionKey }: { sessionKey: number }) {
  const { data } = useOpenF1<OF1RaceControl[]>("race_control", { session_key: sessionKey }, { intervalMs: 3000 });
  const sorted = useMemo(
    () => [...(data || [])].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 50),
    [data],
  );
  return (
    <div className="bg-[#111] ring-1 ring-white/5 rounded-md flex flex-col p-5 h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <div className="size-2 bg-[#E8002D] rounded-full animate-pulse" />
        <span className="font-orbitron text-xs font-semibold uppercase tracking-widest">Race Control</span>
      </div>
      <div className="flex-1 space-y-3 text-[11px] overflow-y-auto scrollbar-hide pr-2">
        {sorted.map((m, i) => {
          const cat = categorize(m);
          return (
            <div key={`${m.date}-${i}`} className="flex gap-3 items-start">
              <span className="text-[#888] shrink-0 font-jetbrains">{fmtTime(m.date)}</span>
              <span className="shrink-0 w-6 text-center font-orbitron text-[10px]" style={{ color: cat.color }}>{cat.icon}</span>
              <p className="text-[#F5F5F5]" style={{ color: cat.color, fontWeight: cat.weight as never }}>
                {m.message}
              </p>
            </div>
          );
        })}
        <div className="flex gap-2 items-center pt-1">
          <span className="text-[#888] shrink-0">{new Date().toLocaleTimeString("en-GB", { hour12: false })}</span>
          <span className="inline-block w-2 h-4 bg-[#F5F5F5]" style={{ animation: "blink-caret 1s steps(1) infinite" }} />
        </div>
        {sorted.length === 0 && (
          <div className="text-center text-[10px] text-[#888] py-8">No race control messages yet.</div>
        )}
      </div>
    </div>
  );
}