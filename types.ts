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
    legsWon: number;
    legsLost: number;
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

export interface LeagueData {
  players: Player[];
  schedule: Week[];
  currentWeek: number;
  leagueName?: string;
  leagueSubtitle?: string;
  groups?: LeagueGroup[];
  /** Highlight top N rows in group standings (e.g. 8 for play-offs) */
  playOffSpots?: number;
}

export enum Tab {
  STANDINGS = 'STANDINGS',
  SCHEDULE = 'SCHEDULE'
}
