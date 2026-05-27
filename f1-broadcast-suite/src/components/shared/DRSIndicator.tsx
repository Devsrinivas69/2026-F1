export function DRSIndicator({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span className="text-[8px] font-bold text-[#00D2BE] ring-1 ring-[#00D2BE]/40 px-1 rounded-sm glow-teal animate-pulse">
      DRS
    </span>
  );
}