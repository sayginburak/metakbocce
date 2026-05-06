/**
 * Generates public/league_data_2026_bahar.json for Metak 2026 Bahar Petank Ligi.
 *
 * Two groups, full round-robin in both, no scores yet (league starts 07.05.2026):
 *   Group A: 12 teams → 11 sub-rounds (6 matches each) distributed 2/2/2/2/3 over weeks
 *   Group B: 13 teams → 13 sub-rounds (6 matches each, 1 bye per round) distributed 2/2/3/3/3
 *
 * Each "match" row is [team1Id, team2Id] (no score yet). Score columns will be filled
 * in by hand later. Schema is otherwise the same shape as previous seasons so the
 * existing parser in utils/mockData.ts handles it unchanged.
 */
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Standard circle method round-robin for an even number of teams.
 * Returns n-1 rounds, each containing n/2 pairs.
 */
function roundRobinEven(ids) {
  const n = ids.length;
  if (n % 2 !== 0) throw new Error("roundRobinEven requires even n");
  const list = [...ids];
  const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const round = [];
    for (let i = 0; i < n / 2; i++) {
      round.push([list[i], list[n - 1 - i]]);
    }
    rounds.push(round);
    // Rotate everything except the first slot.
    const last = list.pop();
    list.splice(1, 0, last);
  }
  return rounds;
}

/**
 * Round-robin for an odd number of teams using a ghost slot.
 * Produces n rounds; in each round the team paired with the ghost is the bye.
 * Returns rounds containing only real pairings (length (n-1)/2 per round).
 */
function roundRobinOdd(ids) {
  const n = ids.length;
  if (n % 2 !== 1) throw new Error("roundRobinOdd requires odd n");
  const GHOST = "__BYE__";
  const padded = [...ids, GHOST];
  const allRounds = roundRobinEven(padded);
  return allRounds.map(round =>
    round.filter(([a, b]) => a !== GHOST && b !== GHOST)
  );
}

const groupAIds = Array.from({ length: 12 }, (_, i) => `a26a_p${i + 1}`);
const groupBIds = Array.from({ length: 13 }, (_, i) => `a26b_p${i + 1}`);

const namesA = [
  "Mechanics",
  "Rütbemiz Albay",
  "SPİL",
  "Bocce Storm",
  "Salçalı Makarna",
  "Duran Duran",
  "Guardian",
  "Gülle Gücü",
  "Sisters",
  "Bacanaks",
  "MK Strike",
  "Gülle Duo",
];

const namesB = [
  "A Takımı",
  "Ay Tozu",
  "Kork-Sa",
  "MANU",
  "Öz Kork-Sa",
  "Taş Devri",
  "Baget Warriors",
  "Simurg",
  "Asenalar",
  "Yuvarla Gitsin",
  "Kopcaz",
  "İDA",
  "Si-Tan",
];

const roundsA = roundRobinEven(groupAIds);
const roundsB = roundRobinOdd(groupBIds);

if (roundsA.length !== 11) throw new Error(`Expected 11 A rounds, got ${roundsA.length}`);
if (roundsB.length !== 13) throw new Error(`Expected 13 B rounds, got ${roundsB.length}`);

/** Sub-rounds per week, per group (must sum to 11 for A and 13 for B). */
const A_SUBROUNDS_PER_WEEK = [2, 2, 2, 2, 3];
const B_SUBROUNDS_PER_WEEK = [2, 2, 3, 3, 3];

const sumA = A_SUBROUNDS_PER_WEEK.reduce((s, x) => s + x, 0);
const sumB = B_SUBROUNDS_PER_WEEK.reduce((s, x) => s + x, 0);
if (sumA !== 11) throw new Error(`A sub-rounds sum to ${sumA}, expected 11`);
if (sumB !== 13) throw new Error(`B sub-rounds sum to ${sumB}, expected 13`);

const WEEK_DATES = [
  "7 Mayıs 2026",
  "14 Mayıs 2026",
  "21 Mayıs 2026",
  "4 Haziran 2026",
  "11 Haziran 2026",
];

function takeRounds(allRounds, perWeek) {
  const out = [];
  let cursor = 0;
  for (const count of perWeek) {
    out.push(allRounds.slice(cursor, cursor + count));
    cursor += count;
  }
  return out;
}

const weekRoundsA = takeRounds(roundsA, A_SUBROUNDS_PER_WEEK);
const weekRoundsB = takeRounds(roundsB, B_SUBROUNDS_PER_WEEK);

const weeks = [];
for (let w = 0; w < WEEK_DATES.length; w++) {
  const matches = [];
  for (const round of weekRoundsA[w]) {
    for (const [a, b] of round) matches.push([a, b]);
  }
  for (const round of weekRoundsB[w]) {
    for (const [a, b] of round) matches.push([a, b]);
  }
  weeks.push({
    id: w + 1,
    date: WEEK_DATES[w],
    matches,
  });
}

const players = [
  ...groupAIds.map((id, i) => ({ id, name: namesA[i] })),
  ...groupBIds.map((id, i) => ({ id, name: namesB[i] })),
];

const out = {
  leagueName: "Metak 2026",
  leagueSubtitle: "Bahar Petank Ligi",
  currentWeek: 0,
  playOffSpots: 8,
  showFinals: false,
  groups: [
    { id: "a", label: "Grup A", playerIds: groupAIds },
    { id: "b", label: "Grup B", playerIds: groupBIds },
  ],
  players,
  weeks,
};

const dest = join(__dirname, "..", "public", "league_data_2026_bahar.json");
writeFileSync(dest, JSON.stringify(out, null, 2), "utf8");

// Sanity report.
function countGames(ids, allRounds) {
  const games = Object.fromEntries(ids.map(id => [id, 0]));
  for (const round of allRounds) {
    for (const [a, b] of round) {
      games[a] += 1;
      games[b] += 1;
    }
  }
  return games;
}

const aGames = countGames(groupAIds, roundsA);
const bGames = countGames(groupBIds, roundsB);
const aMin = Math.min(...Object.values(aGames));
const aMax = Math.max(...Object.values(aGames));
const bMin = Math.min(...Object.values(bGames));
const bMax = Math.max(...Object.values(bGames));

const matchesPerWeek = weeks.map(w => w.matches.length);
console.log("Wrote", dest);
console.log("Weeks:", weeks.length, "matches per week:", matchesPerWeek);
console.log(`Group A games per team: min=${aMin} max=${aMax} (expected 11)`);
console.log(`Group B games per team: min=${bMin} max=${bMax} (expected 12)`);
