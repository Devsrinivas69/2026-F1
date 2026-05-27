interface Props {
  number: number | string;
  code?: string;
  teamColor?: string;
  size?: "sm" | "md" | "lg";
}

export function DriverBadge({ number, code, teamColor = "#888888", size = "md" }: Props) {
  const sizes = {
    sm: "size-8 text-[10px]",
    md: "size-12 text-sm",
    lg: "size-16 text-lg",
  } as const;
  return (
    <div
      className={`${sizes[size]} relative grid place-items-center rounded-full bg-[#0a0a0a] ring-2 shrink-0`}
      style={{ boxShadow: `0 0 0 1px ${teamColor}`, borderColor: teamColor }}
    >
      <span className="font-orbitron font-bold" style={{ color: teamColor }}>
        {number}
      </span>
      {code && (
        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] font-orbitron font-semibold text-[#F5F5F5] bg-[#0a0a0a] px-1 rounded-sm">
          {code}
        </span>
      )}
    </div>
  );
}