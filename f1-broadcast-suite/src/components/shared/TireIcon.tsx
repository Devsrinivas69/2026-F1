import { tireColor, tireLetter } from "@/lib/teams";

export function TireIcon({ compound, laps }: { compound?: string | null; laps?: number }) {
  const color = tireColor(compound);
  return (
    <div className="flex flex-col items-end leading-none">
      <span className="font-orbitron text-[11px] font-bold" style={{ color }}>
        {tireLetter(compound)}
      </span>
      {laps != null && <span className="text-[8px] text-[#888]">{laps}L</span>}
    </div>
  );
}