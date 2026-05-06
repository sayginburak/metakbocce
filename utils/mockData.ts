
import { FinalsData, FinalsMatch, FinalsRound, LeagueData, LeagueGroup, Match, Player, Week } from "../types";
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

interface JsonFinalsMatch {
    player1?: string | null;
    player2?: string | null;
    player1Label?: string;
    player2Label?: string;
    score1?: number | null;
    score2?: number | null;
}

interface JsonFinalsRound {
    id?: string;
    name: string;
    matches?: (JsonFinalsMatch | (string | number | null)[])[];
}

interface JsonFinals {
    title?: string;
    subtitle?: string;
    rounds?: JsonFinalsRound[];
}

interface JsonData {
    leagueName: string;
    leagueSubtitle?: string;
    currentWeek: number;
    playOffSpots?: number;
    showFinals?: boolean;
    finalsExcludedPlayerIds?: string[];
    players: JsonPlayer[];
    weeks: JsonWeek[];
    groups?: { id: string; label: string; playerIds: string[] }[];
    finals?: JsonFinals;
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

function parseFinalsMatch(raw: JsonFinalsMatch | (string | number | null)[], roundId: string, index: number): FinalsMatch {
  const id = `${roundId}_m${index}`;
  if (Array.isArray(raw)) {
    const player1Id = (raw[0] as string | null) ?? null;
    const player2Id = (raw[1] as string | null) ?? null;
    const score1 = raw.length >= 4 ? (raw[2] as number | null) ?? null : null;
    const score2 = raw.length >= 4 ? (raw[3] as number | null) ?? null : null;
    return {
      id,
      player1Id,
      player2Id,
      score1,
      score2,
      isCompleted: score1 !== null && score2 !== null,
    };
  }
  const score1 = raw.score1 ?? null;
  const score2 = raw.score2 ?? null;
  return {
    id,
    player1Id: raw.player1 ?? null,
    player2Id: raw.player2 ?? null,
    player1Label: raw.player1Label,
    player2Label: raw.player2Label,
    score1,
    score2,
    isCompleted: score1 !== null && score2 !== null,
  };
}

function parseFinals(raw: JsonFinals | undefined): FinalsData | undefined {
  if (!raw) return undefined;
  const rounds: FinalsRound[] = (raw.rounds ?? []).map((r, idx) => {
    const roundId = r.id ?? `r${idx}`;
    return {
      id: roundId,
      name: r.name,
      matches: (r.matches ?? []).map((m, i) => parseFinalsMatch(m, roundId, i)),
    };
  });
  return {
    title: raw.title,
    subtitle: raw.subtitle,
    rounds,
  };
}

function jsonToLeagueData(rawData: JsonData): LeagueData {
  const players: Player[] = rawData.players.map(p => ({
    id: p.id,
    name: p.name,
    stats: {
      played: 0,
      won: 0,
      lost: 0,
      pointsFor: 0,
      pointsAgainst: 0,
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
    playOffSpots: rawData.playOffSpots,
    showFinals: rawData.showFinals ?? false,
    finalsExcludedPlayerIds: rawData.finalsExcludedPlayerIds,
    finals: parseFinals(rawData.finals)
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

/** Petanque target score; bye/walkover wins are recorded as this-to-zero. */
const PETANQUE_WIN_SCORE = 13;

/**
 * Apply completed matches to player stats (no sorting).
 *
 * In odd-sized groups every sub-round has exactly one team sitting out (bye).
 * A bye is treated as a default win for that team: +1 G, +2 P, score 13–0.
 * Byes are only credited once the corresponding sub-round has at least one
 * completed match, so future weeks don't pre-award points.
 */
export function applyMatchStats(data: LeagueData): Player[] {
  const newPlayers = data.players.map(p => ({
    ...p,
    stats: { played: 0, won: 0, lost: 0, pointsFor: 0, pointsAgainst: 0, points: 0 }
  }));

  data.schedule.forEach(week => {
    week.matches.forEach((match: Match) => {
      if (match.isCompleted && match.score1 !== null && match.score2 !== null) {
        const p1 = newPlayers.find(p => p.id === match.player1Id);
        const p2 = newPlayers.find(p => p.id === match.player2Id);

        if (p1 && p2) {
          p1.stats.played += 1;
          p2.stats.played += 1;
          p1.stats.pointsFor += match.score1;
          p1.stats.pointsAgainst += match.score2;
          p2.stats.pointsFor += match.score2;
          p2.stats.pointsAgainst += match.score1;

          const loserPoints = match.isDefaultLoss ? 0 : 1;
          const winnerPoints = 2;
          const drawPoints = 1;

          if (match.score1 === 0 && match.score2 === 0) {
            p1.stats.points += drawPoints;
            p2.stats.points += drawPoints;
          } else if (match.score1 > match.score2) {
            p1.stats.won += 1;
            p1.stats.points += winnerPoints;
            p2.stats.lost += 1;
            p2.stats.points += loserPoints;
          } else if (match.score2 > match.score1) {
            p2.stats.won += 1;
            p2.stats.points += winnerPoints;
            p1.stats.lost += 1;
            p1.stats.points += loserPoints;
          } else {
            p1.stats.points += drawPoints;
            p2.stats.points += drawPoints;
          }
        }
      }
    });
  });

  // Credit byes as default wins (only for groups that need a bye each round).
  if (data.groups?.length) {
    for (const group of data.groups) {
      if (group.playerIds.length % 2 === 0) continue;
      const byes = computeGroupByes(group, data.schedule);
      for (const byeId of byes) {
        const player = newPlayers.find(p => p.id === byeId);
        if (!player) continue;
        player.stats.played += 1;
        player.stats.won += 1;
        player.stats.points += 2;
        player.stats.pointsFor += PETANQUE_WIN_SCORE;
      }
    }
  }

  return newPlayers;
}

/**
 * Compute byes that should be credited for an odd-sized group.
 * Returns a flat list of player IDs (one entry per credited bye); a player
 * who byes twice would appear twice. A bye is only credited if at least one
 * match in that sub-round has been completed.
 */
function computeGroupByes(group: LeagueGroup, schedule: Week[]): string[] {
  const result: string[] = [];
  const groupSize = group.playerIds.length;
  const subRoundSize = Math.floor(groupSize / 2);
  if (subRoundSize === 0) return result;
  const memberSet = new Set(group.playerIds);

  for (const week of schedule) {
    const groupMatches = week.matches.filter(
      m => memberSet.has(m.player1Id) && memberSet.has(m.player2Id)
    );
    for (let i = 0; i < groupMatches.length; i += subRoundSize) {
      const subRound = groupMatches.slice(i, i + subRoundSize);
      const anyPlayed = subRound.some(m => m.isCompleted);
      if (!anyPlayed) continue;
      const playing = new Set<string>();
      subRound.forEach(m => {
        playing.add(m.player1Id);
        playing.add(m.player2Id);
      });
      for (const id of group.playerIds) {
        if (!playing.has(id)) result.push(id);
      }
    }
  }
  return result;
}

export function sortStandings(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
    const avA = a.stats.pointsFor - a.stats.pointsAgainst;
    const avB = b.stats.pointsFor - b.stats.pointsAgainst;
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

export interface BracketMatch {
  id: string;
  code: string;
  player1Id: string | null;
  player2Id: string | null;
  player1Label: string;
  player2Label: string;
  score1: number | null;
  score2: number | null;
  isCompleted: boolean;
  winnerId: string | null;
}

export interface BracketRound {
  id: string;
  name: string;
  matches: BracketMatch[];
}

function winnerOf(m: { player1Id: string | null; player2Id: string | null; score1: number | null; score2: number | null; isCompleted: boolean }): string | null {
  if (!m.isCompleted || m.score1 == null || m.score2 == null) return null;
  if (m.score1 > m.score2) return m.player1Id;
  if (m.score2 > m.score1) return m.player2Id;
  return null;
}

/**
 * Single-letter prefix for a round's match codes.
 * Used to build match IDs like s1..s8, ç1..ç4, y1..y2, f1.
 */
export function getRoundMatchPrefix(roundName: string): string {
  if (roundName.startsWith("Son ")) return "s";
  if (roundName === "Çeyrek Final") return "ç";
  if (roundName === "Yarı Final") return "y";
  if (roundName === "Final") return "f";
  return "m";
}

/** Build a user-facing match code like "s1", "ç3", "y2", "f1" from round name + index. */
export function getMatchCode(roundName: string, matchIdx: number): string {
  return `${getRoundMatchPrefix(roundName)}${matchIdx + 1}`;
}

/**
 * Build the finals bracket.
 *
 * Round 1 (Son 16) pairings are seeded from current group standings:
 *   s1: 1A vs 8B, s2: 2A vs 7B, s3: 3A vs 6B, s4: 4A vs 5B,
 *   s5: 5A vs 4B, s6: 6A vs 3B, s7: 7A vs 2B, s8: 8A vs 1B.
 *
 * Later rounds use a "top-half vs bottom-half" pairing so the strongest
 * league-phase performers keep facing the weakest remaining opponents until
 * the final. For n matches in the previous round, new match i pairs
 * prev[i] with prev[i + n/2]:
 *   Çeyrek Final: ç1 = s1 & s5, ç2 = s2 & s6, ç3 = s3 & s7, ç4 = s4 & s8.
 *   Yarı Final:   y1 = ç1 & ç3, y2 = ç2 & ç4.
 *   Final:        f1 = y1 & y2.
 *
 * Any results provided in data.finals.rounds[i].matches override the auto-derivation.
 */
export function getFinalsBracket(data: LeagueData, spots: number = 8): BracketRound[] {
  const groupStandings = getStandingsByGroup(data);
  const excluded = new Set(data.finalsExcludedPlayerIds ?? []);
  const groupA = (groupStandings[0]?.players ?? []).filter(p => !excluded.has(p.id));
  const groupB = (groupStandings[1]?.players ?? []).filter(p => !excluded.has(p.id));

  const seedsA = groupA.slice(0, spots);
  const seedsB = groupB.slice(0, spots);

  const round1Name = spots === 8 ? 'Son 16' : `Son ${spots * 2}`;
  const defaultRoundNames = [round1Name, 'Çeyrek Final', 'Yarı Final', 'Final'];

  const totalRounds = Math.max(1, Math.ceil(Math.log2(spots * 2)));
  const overrideRounds = data.finals?.rounds ?? [];

  const rounds: BracketRound[] = [];

  for (let r = 0; r < totalRounds; r++) {
    const roundMatchCount = Math.pow(2, totalRounds - r - 1);
    const override = overrideRounds[r];
    const name = override?.name ?? defaultRoundNames[r] ?? `${r + 1}. Tur`;
    const id = override?.id ?? `r${r + 1}`;

    const matches: BracketRound['matches'] = [];
    for (let i = 0; i < roundMatchCount; i++) {
      let player1Id: string | null = null;
      let player2Id: string | null = null;
      let player1Label = '';
      let player2Label = '';
      let score1: number | null = null;
      let score2: number | null = null;
      let isCompleted = false;

      if (r === 0) {
        const aSeed = seedsA[i];
        const bSeed = seedsB[spots - 1 - i];
        player1Id = aSeed?.id ?? null;
        player2Id = bSeed?.id ?? null;
        player1Label = `${i + 1}A`;
        player2Label = `${spots - i}B`;
      } else {
        // Top-half vs bottom-half pairing: match i of this round pulls
        // prev[i] and prev[i + n/2], so seed #1 stays away from seed #2
        // (and group A's #1 from group B's #1) as long as possible.
        const prev = rounds[r - 1];
        const prevHalf = prev.matches.length / 2;
        const m1Idx = i;
        const m2Idx = i + prevHalf;
        const m1 = prev.matches[m1Idx];
        const m2 = prev.matches[m2Idx];
        player1Id = m1?.winnerId ?? null;
        player2Id = m2?.winnerId ?? null;
        player1Label = `${getMatchCode(prev.name, m1Idx)} Galibi`;
        player2Label = `${getMatchCode(prev.name, m2Idx)} Galibi`;
      }

      const overrideMatch = override?.matches?.[i];
      if (overrideMatch) {
        if (overrideMatch.player1Id != null) player1Id = overrideMatch.player1Id;
        if (overrideMatch.player2Id != null) player2Id = overrideMatch.player2Id;
        if (overrideMatch.player1Label) player1Label = overrideMatch.player1Label;
        if (overrideMatch.player2Label) player2Label = overrideMatch.player2Label;
        score1 = overrideMatch.score1;
        score2 = overrideMatch.score2;
        isCompleted = overrideMatch.isCompleted;
      }

      const matchEntry: BracketMatch = {
        id: overrideMatch?.id ?? `${id}_m${i}`,
        code: getMatchCode(name, i),
        player1Id,
        player2Id,
        player1Label,
        player2Label,
        score1,
        score2,
        isCompleted,
        winnerId: null,
      };
      matchEntry.winnerId = winnerOf(matchEntry);
      matches.push(matchEntry);
    }

    rounds.push({ id, name, matches });
  }

  return reorderRoundsForBracketDisplay(rounds);
}

/**
 * Reorder matches within each round so that the two matches feeding the same
 * next-round match are adjacent in the display. Generation order is kept
 * logical (seed-based), but rendering walks the bracket top-to-bottom.
 *
 * Example for 8 → 4 → 2 → 1 with top-half-vs-bottom-half pairing:
 *   R16: s1, s5, s3, s7, s2, s6, s4, s8
 *   QF:  ç1, ç3, ç2, ç4
 *   SF:  y1, y2
 *   F:   f1
 */
function reorderRoundsForBracketDisplay(rounds: BracketRound[]): BracketRound[] {
  const n = rounds.length;
  if (n === 0) return rounds;

  const displayOrders: number[][] = new Array(n);
  displayOrders[n - 1] = rounds[n - 1].matches.map((_, i) => i);

  for (let r = n - 2; r >= 0; r--) {
    const nextDisplay = displayOrders[r + 1];
    const nextMatchCount = rounds[r + 1].matches.length;
    const current: number[] = [];
    for (const j of nextDisplay) {
      current.push(j);
      current.push(j + nextMatchCount);
    }
    displayOrders[r] = current;
  }

  return rounds.map((round, r) => ({
    ...round,
    matches: displayOrders[r]
      .map(idx => round.matches[idx])
      .filter((m): m is BracketMatch => m != null),
  }));
}
