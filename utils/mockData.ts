
import { LeagueData, Match, Player, Week } from "../types";

// Types defining the JSON structure
interface JsonPlayer {
    id: string;
    name: string;
}

interface JsonWeek {
    id: number;
    date: string; // Add date to JSON interface
    // matches can be ["p1", "p2"] OR ["p1", "p2", score1, score2] OR ["p1", "p2", score1, score2, 'd']
    matches: (string | number)[][]; 
}

interface JsonData {
    leagueName: string;
    currentWeek: number;
    players: JsonPlayer[];
    weeks: JsonWeek[];
}

export const loadLeagueData = async (): Promise<LeagueData> => {
  // Fetch from JSON file - Single Source of Truth
  try {
      // Use import.meta.env.BASE_URL to ensure correct path in production
      const baseUrl = import.meta.env.BASE_URL;
      const DATA_VERSION = "v11"; // Update this when you change the filename
      const dataUrl = baseUrl.endsWith('/') ? `${baseUrl}league_data_${DATA_VERSION}.json` : `${baseUrl}/league_data_${DATA_VERSION}.json`;
      
      const response = await fetch(dataUrl, { cache: "no-cache" });
      if (!response.ok) {
          throw new Error(`Failed to fetch league data: ${response.statusText}`);
      }
      const rawData = await response.json() as JsonData;

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

      const schedule: Week[] = rawData.weeks.map(w => ({
        id: w.id,
        name: `${w.id}. Hafta`,
        date: w.date || "Tarih Belirlenmedi", // Load date
        matches: w.matches.map((arr, index) => {
          const player1Id = arr[0] as string;
          const player2Id = arr[1] as string;
          
          // Check if scores exist in the array (length > 2)
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
            isDefaultLoss = defaultFlag === 'd';
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

      return { 
        players, 
        schedule, 
        currentWeek: rawData.currentWeek || 0 
      };
  } catch (error) {
      console.error("Error loading league data:", error);
      // Return empty structure if fetch fails to avoid app crash
      return { players: [], schedule: [], currentWeek: 0 };
  }
};

// Recalculate Logic
export const recalculateStandings = (data: LeagueData): Player[] => {
  // Reset stats
  const newPlayers = data.players.map(p => ({
    ...p,
    stats: { played: 0, won: 0, lost: 0, legsWon: 0, legsLost: 0, points: 0 }
  }));

  data.schedule.forEach(week => {
    week.matches.forEach(match => {
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

  return newPlayers.sort((a, b) => {
    if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
    const avA = a.stats.legsWon - a.stats.legsLost;
    const avB = b.stats.legsWon - b.stats.legsLost;
    if (avB !== avA) return avB - avA;
    if (b.stats.won !== a.stats.won) return b.stats.won - a.stats.won;
    // Alphabetical fallback for ties
    return a.name.localeCompare(b.name, 'tr');
  });
};
