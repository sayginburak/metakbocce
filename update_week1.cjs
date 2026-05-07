const fs = require('fs');
const file = '/Users/saygin/Downloads/metakbocce/public/league_data_2026_bahar.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

data.currentWeek = 1;

const week1 = data.weeks.find(w => w.id === 1);

const scores = {
  // Group A - 1. MAÇLAR
  "a26a_p1-a26a_p12": [13, 4],   // Mechanics 13 - 4 Gülle Duo
  "a26a_p2-a26a_p11": [13, 4],   // Rütbemiz Albay 13 - 4 MK Strike
  "a26a_p3-a26a_p10": [8, 13],   // SPİL 8 - 13 Bacanaks
  "a26a_p4-a26a_p9": [7, 11],    // Bocce Storm 7 - 11 Sisters
  "a26a_p5-a26a_p8": [9, 8],     // Salçalı Makarna 9 - 8 Gülle Gücü
  "a26a_p6-a26a_p7": [6, 10],    // Duran Duran 6 - 10 Guardian

  // Group A - 2. MAÇLAR
  "a26a_p1-a26a_p11": [3, 13],   // Mechanics 3 - 13 MK Strike
  "a26a_p12-a26a_p10": [6, 13],  // Gülle Duo 6 - 13 Bacanaks
  "a26a_p2-a26a_p9": [13, 11],   // Rütbemiz Albay 13 - 11 Sisters
  "a26a_p3-a26a_p8": [6, 13],    // SPİL 6 - 13 Gülle Gücü
  "a26a_p4-a26a_p7": [13, 7],    // Bocce Storm 13 - 7 Guardian
  "a26a_p5-a26a_p6": [5, 11],    // Salçalı Makarna 5 - 11 Duran Duran

  // Group B - 1. MAÇLAR
  "a26b_p2-a26b_p13": [12, 8],   // Ay Tozu 12 - 8 Si-Tan
  "a26b_p3-a26b_p12": [5, 13],   // Kork-Sa 5 - 13 İDA
  "a26b_p4-a26b_p11": [13, 3],   // MANU 13 - 3 Kopcaz
  "a26b_p5-a26b_p10": [9, 8],    // Öz Kork-Sa 9 - 8 Yuvarla Gitsin
  "a26b_p6-a26b_p9": [9, 13],    // Taş Devri 9 - 13 Asenalar
  "a26b_p7-a26b_p8": [0, 13],    // Baget Warriors 0 - 13 Simurg

  // Group B - 2. MAÇLAR
  "a26b_p1-a26b_p13": [7, 13],   // A Takımı 7 - 13 Si-Tan
  "a26b_p2-a26b_p11": [6, 7],    // Ay Tozu 6 - 7 Kopcaz
  "a26b_p3-a26b_p10": [4, 13],   // Kork-Sa 4 - 13 Yuvarla Gitsin
  "a26b_p4-a26b_p9": [11, 13],   // MANU 11 - 13 Asenalar
  "a26b_p5-a26b_p8": [7, 13],    // Öz Kork-Sa 7 - 13 Simurg
  "a26b_p6-a26b_p7": [11, 10]    // Taş Devri 11 - 10 Baget Warriors
};

week1.matches = week1.matches.map(match => {
  const key = `${match[0]}-${match[1]}`;
  const reverseKey = `${match[1]}-${match[0]}`;
  if (scores[key]) {
    return [match[0], match[1], scores[key][0], scores[key][1]];
  } else if (scores[reverseKey]) {
    return [match[0], match[1], scores[reverseKey][1], scores[reverseKey][0]];
  }
  return match;
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log("Updated matches for week 1");
