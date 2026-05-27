import { useEffect } from "react";
import { Volume2, VolumeX, Activity } from "lucide-react";
import { useEngineAudio } from "@/hooks/useEngineAudio";

interface Props {
  rpm: number;
  throttle: number;
  color?: string;
}

export function EngineAudioPlayer({ rpm, throttle, color = "#E8002D" }: Props) {
  const { isPlaying, initAudio, stopAudio, updateEngineState } = useEngineAudio();

  useEffect(() => {
    if (isPlaying) {
      updateEngineState(rpm, throttle);
    }
  }, [rpm, throttle, isPlaying, updateEngineState]);

  return (
    <div className="flex items-center gap-3 ml-auto shrink-0">
      {isPlaying && (
        <div className="flex items-end gap-0.5 h-4 opacity-80" title="Audio streaming">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-1 rounded-t-[1px] animate-pulse"
              style={{
                backgroundColor: color,
                height: `${Math.max(20, Math.min(100, (rpm / 15000) * 100 * Math.random()))}%`,
                animationDelay: `${i * 100}ms`,
                animationDuration: '300ms'
              }}
            />
          ))}
        </div>
      )}

      <button
        onClick={isPlaying ? stopAudio : initAudio}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-sm ring-1 transition-all ${
          isPlaying 
            ? "bg-[#1a1a1a] ring-white/20 hover:ring-white/40 text-white"
            : "bg-[#0a0a0a] ring-white/10 hover:ring-white/30 text-[#888] hover:text-white"
        }`}
      >
        {isPlaying ? (
          <>
            <Volume2 className="size-3.5" style={{ color }} />
            <span className="text-[9px] font-orbitron font-bold uppercase tracking-widest">
              Live Audio
            </span>
          </>
        ) : (
          <>
            <VolumeX className="size-3.5" />
            <span className="text-[9px] font-orbitron font-bold uppercase tracking-widest">
              Engage Audio
            </span>
          </>
        )}
      </button>
    </div>
  );
}
