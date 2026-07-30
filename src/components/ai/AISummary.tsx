import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";

const NARRATIVE_TEMPLATES = [
  (ctx: Record<string, unknown>) =>
    `${ctx.country ?? "The circuit"}, ${ctx.year ?? "2026"} — ${ctx.circuit ?? "an iconic venue"} in all its brutal glory. ${ctx.session ?? "The race"} delivered exactly what Formula One demands: cold strategy married to raw speed. ${ctx.podium ? `The finish order — ${ctx.podium} — tells only half the story.` : "Every overtake, every pit call, every sector time was a battle of attrition."} Tyre management became the invisible hand that shaped the afternoon, as engineers whispered numbers that meant the difference between triumph and heartbreak. This is what separates Formula One from everything else on earth.`,

  (ctx: Record<string, unknown>) =>
    `Somewhere on the ${ctx.circuit ?? "circuit"}, physics collided with human will and produced something extraordinary. The ${ctx.year ?? "2026"} ${ctx.country ?? ""} Grand Prix was not a race — it was a negotiation between ambition and mechanical limitation, played out at 300 km/h. ${ctx.fastestLap ? `The fastest lap — ${ctx.fastestLap} — stood as a monument to what modern F1 machinery can achieve.` : "Each lap a masterclass in controlled aggression."} Drive to Survive cannot capture what it feels like to be inside these machines. The numbers never lie, but they never tell the whole truth either.`,

  (ctx: Record<string, unknown>) =>
    `The ${ctx.circuit ?? "circuit"} baked under the ${ctx.country ?? ""} sun and gave nothing away for free. ${ctx.session ?? "Race day"} ${ctx.year ?? ""} was a lesson in patience — until it wasn't. The undercut loomed over every strategy call like a guillotine. Teams gambled, hedged, and occasionally lost everything on a single lap's margin. ${ctx.podium ? `${ctx.podium} — three names on a podium that required very different journeys to reach.` : "The timing screens flickered with stories that no camera could follow."} Formula One is not a sport of speed alone. It is a sport of information, and today, information was the most precious commodity on the grid.`,

  (ctx: Record<string, unknown>) =>
    `In the broadcast trucks behind the ${ctx.circuit ?? "pit lane"} wall, engineers watched data streams that told a different race to the one visible on screen. The ${ctx.year ?? "2026"} ${ctx.country ?? ""} ${ctx.session ?? "Grand Prix"} was a masterclass in the invisible — tyre degradation curves, fuel loads, DRS activation windows. What you saw was spectacle. What they saw was science. ${ctx.fastestLap ? `When ${ctx.fastestLap} appeared on the timing board, the pit wall exhaled.` : "The fastest laps arrived like punctuation marks in a story that had been building all afternoon."} This is why Formula One commands the world's attention. Not the speed. The complexity.`,
];

export function AISummary({ context }: { context: Record<string, unknown> }) {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
      const template = NARRATIVE_TEMPLATES[Math.floor(Math.random() * NARRATIVE_TEMPLATES.length)];
      setSummary(template(context));
    } catch (e) {
      setError((e as Error).message ?? "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const words = summary.split(" ").filter(Boolean);

  return (
    <div className="bg-[#0d0d0d] ring-1 ring-white/5 rounded-md p-5 relative overflow-hidden">
      {/* Subtle gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/30 to-transparent" />

      <div className="flex justify-between items-center mb-4">
        <span className="font-orbitron text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
          <Sparkles className="size-3.5 text-[#FFD700]" />
          <span className="text-white">Race Narrative</span>
          <span className="text-[#333] text-[8px] font-jetbrains normal-case tracking-normal">
            · Drive to Survive style
          </span>
        </span>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 text-[9px] font-orbitron font-black uppercase tracking-wider px-3 py-1.5 bg-[#E8002D] hover:bg-[#c0001f] text-white rounded-sm disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <RefreshCw className="size-3 animate-spin" />
              Generating
            </>
          ) : summary ? (
            <>
              <RefreshCw className="size-3" />
              Regenerate
            </>
          ) : (
            <>
              <Sparkles className="size-3" />
              Generate
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs text-[#E8002D] font-jetbrains mb-3">{error}</p>
      )}

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 py-4"
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="h-1 flex-1 rounded-full bg-[#222]"
                animate={{ backgroundColor: ["#222", "#E8002D40", "#222"] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </motion.div>
        ) : summary ? (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="leading-relaxed"
          >
            {words.map((w, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.015, duration: 0.3 }}
                className="text-sm text-[#C8C8C8] font-jetbrains"
              >
                {w}{" "}
              </motion.span>
            ))}
          </motion.div>
        ) : (
          <motion.p
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-[#333] italic font-jetbrains py-2"
          >
            Generate a cinematic Drive-to-Survive style narrative for this session.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}