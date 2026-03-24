
import { LeagueData, LeagueGroup, Match, Player, Week } from "../types";
import { DEFAULT_SEASON_ID, getSeasonById, SEASON_STORAGE_KEY } from "./seasons";

// Types defining the JSON structure
interface JsonPlayer {
    id: string;
    name: string;
}

interface JsonWeek {
    id: number;
    date: string;
    matches: (string | number)[][];
}

interface JsonData {
    leagueName: string;
    leagueSubtitle?: string;
    currentWeek: number;
    playOffSpots?: number;
    players: JsonPlayer[];
    weeks: JsonWeek[];
    groups?: { id: string; label: string; playerIds: string[] }[];
}

function parseWeeks(rawWeeks: JsonWeek[]): Week[] {
  return rawWeeks.map(w => ({
    id: w.id,
    name: `${w.id}. Hafta`,
    date: w.date || "Tarih Belirlenmedi",
    matches: w.matches.map((arr, index) => {
      const player1Id = arr[0] as string;
      const player2Id = arr[1] as string;

      let score1: number | null = null;
      let score2: number | null = null;
      let isCompleted = false;
      let isDefaultLoss = false;

      if (arr.length >= 4) {
        score1 = arr[2] as number;
        score2 = arr[3] as number;
        isCompleted = true;
      }

      if (arr.length >= 5) {
        const defaultFlag = (arr[4] as string | undefined)?.toString().toLowerCase();
        isDefaultLoss = defaultFlag === "d";
      }

      return {
        id: `w${w.id}_m${index}`,
        player1Id,
        player2Id,
        score1,
        score2,
        isCompleted,
        isDefaultLoss
      };
    })
  }));
}

function jsonToLeagueData(rawData: JsonData): LeagueData {
  const players: Player[] = rawData.players.map(p => ({
    id: p.id,
    name: p.name,
    stats: {
      played: 0,
      won: 0,
      lost: 0,
      legsWon: 0,
      legsLost: 0,
      points: 0
    }
  }));

  const groups: LeagueGroup[] | undefined = rawData.groups?.map(g => ({
    id: g.id,
    label: g.label,
    playerIds: g.playerIds
  }));

  return {
    players,
    schedule: parseWeeks(rawData.weeks),
    currentWeek: rawData.currentWeek || 0,
    leagueName: rawData.leagueName,
    leagueSubtitle: rawData.leagueSubtitle,
    groups,
    playOffSpots: rawData.playOffSpots
  };
}

export const loadLeagueData = async (seasonId: string = DEFAULT_SEASON_ID): Promise<LeagueData> => {
  try {
    const season = getSeasonById(seasonId) ?? getSeasonById(DEFAULT_SEASON_ID)!;
    const baseUrl = import.meta.env.BASE_URL;
    const dataUrl = baseUrl.endsWith("/")
      ? `${baseUrl}${season.dataFile}`
      : `${baseUrl}/${season.dataFile}`;

    const response = await fetch(dataUrl, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Failed to fetch league data: ${response.statusText}`);
    }
    const rawData = await response.json() as JsonData;
    return jsonToLeagueData(rawData);
  } catch (error) {
    console.error("Error loading league data:", error);
    return { players: [], schedule: [], currentWeek: 0 };
  }
};

export function getStoredSeasonId(): string {
  if (typeof window === "undefined") return DEFAULT_SEASON_ID;
  const stored = localStorage.getItem(SEASON_STORAGE_KEY);
  if (stored && getSeasonById(stored)) return stored;
  return DEFAULT_SEASON_ID;
}

export function storeSeasonId(id: string): void {
  localStorage.setItem(SEASON_STORAGE_KEY, id);
}

/** Apply completed matches to player stats (no sorting). */
export function applyMatchStats(data: LeagueData): Player[] {
  const newPlayers = data.players.map(p => ({
    ...p,
    stats: { played: 0, won: 0, lost: 0, legsWon: 0, legsLost: 0, points: 0 }
  }));

  data.schedule.forEach(week => {
    week.matches.forEach((match: Match) => {
      if (match.isCompleted && match.score1 !== null && match.score2 !== null) {
        const p1 = newPlayers.find(p => p.id === match.player1Id);
        const p2 = newPlayers.find(p => p.id === match.player2Id);

        if (p1 && p2) {
          p1.stats.played += 1;
          p2.stats.played += 1;
          p1.stats.legsWon += match.score1;
          p1.stats.legsLost += match.score2;
          p2.stats.legsWon += match.score2;
          p2.stats.legsLost += match.score1;

          const loserPoints = match.isDefaultLoss ? 0 : 1;
          const winnerPoints = 2;

          if (match.score1 > match.score2) {
            p1.stats.won += 1;
            p1.stats.points += winnerPoints;
            p2.stats.lost += 1;
            p2.stats.points += loserPoints;
          } else {
            p2.stats.won += 1;
            p2.stats.points += winnerPoints;
            p1.stats.lost += 1;
            p1.stats.points += loserPoints;
          }
        }
      }
    });
  });

  return newPlayers;
}

export function sortStandings(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
    const avA = a.stats.legsWon - a.stats.legsLost;
    const avB = b.stats.legsWon - b.stats.legsLost;
    if (avB !== avA) return avB - avA;
    if (b.stats.won !== a.stats.won) return b.stats.won - a.stats.won;
    return a.name.localeCompare(b.name, "tr");
  });
}

export const recalculateStandings = (data: LeagueData): Player[] => {
  return sortStandings(applyMatchStats(data));
};

export interface GroupStandings {
  groupId: string;
  label: string;
  players: Player[];
}

export function getStandingsByGroup(data: LeagueData): GroupStandings[] {
  const base = applyMatchStats(data);
  if (!data.groups?.length) {
    return [{ groupId: "all", label: "", players: sortStandings(base) }];
  }
  return data.groups.map(g => ({
    groupId: g.id,
    label: g.label,
    players: sortStandings(base.filter(p => g.playerIds.includes(p.id)))
  }));
}
