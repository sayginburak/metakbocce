/**
 * Generates public/league_data_2026_bahar.json — round-robin for two groups of 16,
 * 5 weeks (3 rounds per week = 24 matches per group per week).
 */
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function roundRobin(ids) {
  const n = ids.length;
  const list = [...ids];
  const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const round = [];
    for (let i = 0; i < n / 2; i++) {
      round.push([list[i], list[n - 1 - i]]);
    }
    rounds.push(round);
    const last = list.pop();
    list.splice(1, 0, last);
  }
  return rounds;
}

const groupAIds = Array.from({ length: 16 }, (_, i) => `b26a_p${i + 1}`);
const groupBIds = Array.from({ length: 16 }, (_, i) => `b26b_p${i + 1}`);

const namesA = [
  "Alper Özdemir",
  "Batuhan Taş",
  "Derya Zünbülcan",
  "Didem Aydın",
  "Dursun Samet Teke",
  "Emrah Ulusoy",
  "Engin Öztürk",
  "Fatih Bakıcı",
  "Hüseyin Zünbülcan",
  "İsa Yaldız",
  "İsmail Torunlar",
  "Lütfü Berkay Kocaman",
  "Özge Taş",
  "Süleyman Sevinç",
  "Turhan Pehlivanoğlu",
  "Zeynep Ulusoy",
];

const namesB = [
  "Ali Ekber Sakıcı",
  "Asu Sakıcı",
  "Azad Sinan Yılmaz",
  "Duygu Alp Demircioğlu",
  "Engin Korkmaz",
  "Esin Özcan",
  "Gürkan Çakıroğlu",
  "İrfan Çavdar",
  "Murat Gündüz",
  "Nurgül Korkmaz",
  "Özlem Karasu",
  "Sabri Güler",
  "Sedat Yücel",
  "Şefika Yeler",
  "Tansu Karasu",
  "Tuncay Çetin",
];

const roundsA = roundRobin(groupAIds);
const roundsB = roundRobin(groupBIds);

/** Week labels: Grup A Çarşamba / Grup B Perşembe — first week 25–26 Mart 2026, then +1 week each. */
const WEEK_DATES = [
  "25 Mart – 26 Mart 2026",
  "1 Nisan – 2 Nisan 2026",
  "8 Nisan – 9 Nisan 2026",
  "15 Nisan – 16 Nisan 2026",
  "22 Nisan – 23 Nisan 2026",
];

const weeks = [];
for (let w = 0; w < 5; w++) {
  const startRound = w * 3;
  const matches = [];
  for (let r = startRound; r < startRound + 3; r++) {
    for (const [a, b] of roundsA[r]) {
      matches.push([a, b]);
    }
  }
  for (let r = startRound; r < startRound + 3; r++) {
    for (const [a, b] of roundsB[r]) {
      matches.push([a, b]);
    }
  }
  weeks.push({
    id: w + 1,
    date: WEEK_DATES[w] ?? "Tarih Belirlenmedi",
    matches,
  });
}

const players = [
  ...groupAIds.map((id, i) => ({ id, name: namesA[i] })),
  ...groupBIds.map((id, i) => ({ id, name: namesB[i] })),
];

const out = {
  leagueName: "Metak 2026",
  leagueSubtitle: "Bahar Dart Ligi",
  currentWeek: 0,
  playOffSpots: 8,
  groups: [
    { id: "a", label: "Grup A — Çarşamba", playerIds: groupAIds },
    { id: "b", label: "Grup B — Perşembe", playerIds: groupBIds },
  ],
  players,
  weeks,
};

const dest = join(__dirname, "..", "public", "league_data_2026_bahar.json");
writeFileSync(dest, JSON.stringify(out, null, 2), "utf8");
console.log("Wrote", dest, "weeks:", weeks.length, "matches week1:", weeks[0].matches.length);
