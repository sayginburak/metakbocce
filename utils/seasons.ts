export interface SeasonInfo {
  id: string;
  label: string;
  dataFile: string;
}

export const SEASONS: SeasonInfo[] = [
  { id: "2026-bahar", label: "2026 Bahar Petank", dataFile: "league_data_2026_bahar.json" },
];

export const DEFAULT_SEASON_ID = "2026-bahar";

export const SEASON_STORAGE_KEY = "metak_season_id";

export function getSeasonById(id: string): SeasonInfo | undefined {
  return SEASONS.find((s) => s.id === id);
}
