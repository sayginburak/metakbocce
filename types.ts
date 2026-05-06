export interface LeagueGroup {
  id: string;
  label: string;
  playerIds: string[];
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  stats: {
    played: number;
    won: number;
    lost: number;
    pointsFor: number;
    pointsAgainst: number;
    points: number;
  };
}

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  score1: number | null;
  score2: number | null;
  isCompleted: boolean;
  isDefaultLoss?: boolean;
}

export interface Week {
  id: number;
  name: string; // "1. Hafta"
  date: string; // "27 Kasım 2025"
  matches: Match[];
}

export interface FinalsMatch {
  id: string;
  /** Display label for an unknown participant, e.g. "1A" or "QF1 Winner" */
  player1Label?: string;
  player2Label?: string;
  player1Id: string | null;
  player2Id: string | null;
  score1: number | null;
  score2: number | null;
  isCompleted: boolean;
}

export interface FinalsRound {
  id: string;
  name: string;
  matches: FinalsMatch[];
}

export interface FinalsData {
  title?: string;
  subtitle?: string;
  rounds: FinalsRound[];
}

export interface LeagueData {
  players: Player[];
  schedule: Week[];
  currentWeek: number;
  leagueName?: string;
  leagueSubtitle?: string;
  groups?: LeagueGroup[];
  /** Highlight top N rows in group standings (e.g. 8 for play-offs) */
  playOffSpots?: number;
  /** When true, show the finals bracket view */
  showFinals?: boolean;
  /**
   * Player ids to skip when seeding the finals bracket. The next-ranked
   * eligible player in each group fills the vacated slot (e.g. 9th moves up
   * to 8th if the original 8th is excluded).
   */
  finalsExcludedPlayerIds?: string[];
  /** Optional finals data. If omitted, the bracket is derived from current standings */
  finals?: FinalsData;
}

export enum Tab {
  STANDINGS = 'STANDINGS',
  SCHEDULE = 'SCHEDULE',
  FINALS = 'FINALS'
}
