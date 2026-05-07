const fs = require('fs');
const file = '/Users/saygin/Downloads/metakbocce/public/league_data_2026_bahar.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

data.currentWeek = 1;

const week1 = data.weeks.find(w => w.id === 1);

const scores = {
  // Group A - 1. MAÇLAR
  "a26a_p1-a26a_p12": [13, 4],
  "a26a_p2-a26a_p11": [13, 4],
  "a26a_p3-a26a_p10": [8, 13],
  "a26a_p4-a26a_p9": [7, 11],
  "a26a_p5-a26a_p8": [9, 8],
  "a26a_p6-a26a_p7": [6, 10],

  // Group A - 2. MAÇLAR
  "a26a_p1-a26a_p11": [3, 13],
  "a26a_p12-a26a_p10": [6, 13],
  "a26a_p2-a26a_p9": [13, 11],
  "a26a_p3-a26a_p8": [6, 13],
  "a26a_p4-a26a_p7": [13, 7],
  "a26a_p5-a26a_p6": [5, 11],

  // Group B - 1. MAÇLAR
  "a26b_p2-a26b_p13": [12, 8],
  "a26b_p3-a26b_p12": [8, 13],
  "a26b_p4-a26b_p11": [13, 3],
  "a26b_p5-a26b_p10": [9, 8],
  "a26b_p6-a26b_p9": [9, 13],
  "a26b_p7-a26b_p8": [0, 13],

  // Group B - 2. MAÇLAR
  "a26b_p1-a26b_p13": [7, 13],
  "a26b_p2-a26b_p11": [6, 7],
  "a26b_p3-a26b_p10": [4, 13],
  "a26b_p4-a26b_p9": [11, 13],
  "a26b_p5-a26b_p8": [7, 13],
  "a26b_p6-a26b_p7": [11, 10]
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
