// Team colors keyed by OpenF1 team_name. Updated for the 2026 F1 grid.
export const TEAM_COLORS: Record<string, string> = {
  // 2026 Teams
  "McLaren": "#F47600",
  "Red Bull Racing": "#4781D7",
  "Ferrari": "#ED1131",
  "Mercedes": "#00D7B6",
  "Aston Martin": "#229971",
  "Alpine": "#00A1E8",
  "Williams": "#1868DB",
  "Racing Bulls": "#6C98FF",
  "Haas F1 Team": "#9C9FA2",
  "Audi": "#F50537",
  "Cadillac": "#909090",
  // Legacy (2024-2025)
  "RB": "#6692FF",
  "Kick Sauber": "#52E252",
  "AlphaTauri": "#5E8FAA",
  "Alfa Romeo": "#900000",
};

export const teamColor = (team?: string | null, fallback = "#888888") =>
  (team && TEAM_COLORS[team]) || fallback;

export type TireCompound = "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET" | "UNKNOWN";

export const tireColor = (c: TireCompound | string | null | undefined): string => {
  switch ((c || "").toUpperCase()) {
    case "SOFT": return "#E8002D";
    case "MEDIUM": return "#FFD700";
    case "HARD": return "#F5F5F5";
    case "INTERMEDIATE": return "#00FF66";
    case "WET": return "#00D2BE";
    default: return "#666666";
  }
};

export const tireLetter = (c?: string | null) => {
  switch ((c || "").toUpperCase()) {
    case "SOFT": return "S";
    case "MEDIUM": return "M";
    case "HARD": return "H";
    case "INTERMEDIATE": return "I";
    case "WET": return "W";
    default: return "—";
  }
};

// 2026 Season races with actual OpenF1 session keys
export const ICONIC_RACES = [
  {
    id: "canada-2026",
    sessionKey: 11291,
    name: "Canadian GP 2026",
    description: "Montreal circuit drama",
    circuit: "Montreal",
    year: 2026,
  },
  {
    id: "monaco-2026",
    sessionKey: 11267,
    name: "Monaco GP 2026",
    description: "Streets of the Principality",
    circuit: "Monte Carlo",
    year: 2026,
  },
  {
    id: "spain-2026",
    sessionKey: 11243,
    name: "Spanish GP 2026",
    description: "Barcelona tyre strategies",
    circuit: "Barcelona",
    year: 2026,
  },
];