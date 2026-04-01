/**
 * Verifies Bahar JSON scores parse and standings math matches utils/mockData rules.
 * Run: node scripts/verify-bahar-scores.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseMatch(arr) {
  const player1Id = arr[0];
  const player2Id = arr[1];
  let score1 = null;
  let score2 = null;
  let isCompleted = false;
  let isDefaultLoss = false;
  if (arr.length >= 4) {
    score1 = arr[2];
    score2 = arr[3];
    isCompleted = true;
  }
  if (arr.length >= 5) {
    isDefaultLoss = String(arr[4]).toLowerCase() === "d";
  }
  return { player1Id, player2Id, score1, score2, isCompleted, isDefaultLoss };
}

function applyStats(playersById, schedule) {
  for (const week of schedule) {
    for (const raw of week.matches) {
      const m = parseMatch(raw);
      if (!m.isCompleted || m.score1 == null || m.score2 == null) continue;
      const p1 = playersById.get(m.player1Id);
      const p2 = playersById.get(m.player2Id);
      if (!p1 || !p2) {
        throw new Error(`Unknown player in match: ${m.player1Id} vs ${m.player2Id}`);
      }
      p1.played += 1;
      p2.played += 1;
      p1.legsWon += m.score1;
      p1.legsLost += m.score2;
      p2.legsWon += m.score2;
      p2.legsLost += m.score1;
      const loserPoints = m.isDefaultLoss ? 0 : 1;
      const winnerPoints = 2;
      const drawPoints = 1;
      if (m.score1 === 0 && m.score2 === 0) {
        p1.points += drawPoints;
        p2.points += drawPoints;
      } else if (m.score1 > m.score2) {
        p1.won += 1;
        p1.points += winnerPoints;
        p2.lost += 1;
        p2.points += loserPoints;
      } else if (m.score2 > m.score1) {
        p2.won += 1;
        p2.points += winnerPoints;
        p1.lost += 1;
        p1.points += loserPoints;
      } else {
        p1.points += drawPoints;
        p2.points += drawPoints;
      }
    }
  }
}

const path = join(__dirname, "..", "public", "league_data_2026_bahar.json");
const raw = JSON.parse(readFileSync(path, "utf8"));

const playersById = new Map(
  raw.players.map((p) => [
    p.id,
    { id: p.id, name: p.name, played: 0, won: 0, lost: 0, legsWon: 0, legsLost: 0, points: 0 },
  ])
);

applyStats(playersById, raw.weeks.filter((w) => w.id === 1));

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

// Spot-check: Grup A ve B hafta 1 tamam (24+24 maç)
const alper = playersById.get("b26a_p1");
const zeynep = playersById.get("b26a_p16");
const ali = playersById.get("b26b_p1");
const tuncay = playersById.get("b26b_p16");

assert(alper.points === 6 && alper.won === 3 && alper.played === 3, `Alper (A): ${JSON.stringify(alper)}`);
assert(zeynep.points === 3 && zeynep.lost === 3 && zeynep.legsWon === 1, `Zeynep (A): ${JSON.stringify(zeynep)}`);
assert(
  ali.points === 6 && ali.won === 3 && ali.played === 3 && ali.legsWon === 6 && ali.legsLost === 0,
  `Ali Ekber (B): ${JSON.stringify(ali)}`
);
assert(
  tuncay.points === 5 && tuncay.won === 2 && tuncay.lost === 1 && tuncay.played === 3,
  `Tuncay (B): ${JSON.stringify(tuncay)}`
);

let grupBPlayed = 0;
for (const id of raw.groups.find((g) => g.id === "b").playerIds) {
  grupBPlayed += playersById.get(id).played;
}
assert(grupBPlayed === 48, `Grup B hafta 1: 16 oyuncu × 3 maç = 48, got ${grupBPlayed}`);

console.log("verify-bahar-scores: OK (Grup A+B week 1 scores parse; standings rules apply).");
