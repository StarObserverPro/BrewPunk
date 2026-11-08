export const pictures = {
  empty: "assets/taproom/empty.jpg",
  stout: "assets/taproom/stout.jpg",
  sour: "assets/taproom/sour.jpg",
  pair: "assets/taproom/pair.jpg",
  flight: "assets/taproom/flight.jpg",
  "ext-01-2": "assets/taproom/ext-01-2.jpg",
  "ext-02-1": "assets/taproom/ext-02-1.jpg",
  "ext-03-2": "assets/taproom/ext-03-2.jpg",
  "ext-05-3": "assets/taproom/ext-05-3.jpg",
  "ext-06-2": "assets/taproom/ext-06-2.jpg",
  "ext-08-3": "assets/taproom/ext-08-3.jpg",
  "ext-09-1": "assets/taproom/ext-09-1.jpg",
  "ext-09-4": "assets/taproom/ext-09-4.jpg",
  "ext-12-4": "assets/taproom/ext-12-4.jpg",
};
const extensions = Object.keys(pictures).filter(key => key.startsWith("ext-"));

export function taproomShot({ servings = [], shown = 1, evening = 1, batchSeed = 0, srm = 7, sour = false } = {}) {
  if (!servings.length) return "flight";
  // Return to the counter between short glimpses of the rest of the room.
  if (shown >= 4 && shown % 4 === 0) {
    return extensions[((Number(batchSeed) >>> 0) + evening - 1 + Math.floor(shown / 4) - 1) % extensions.length];
  }
  if (sour) return "sour";
  if (srm >= 25) return "stout";
  const guests = new Set(servings.slice(0, Math.max(1, shown)).map(s => s.guest));
  return guests.size > 1 ? "pair" : "flight";
}

export function taproomPlate(shot = "empty") {
  return '<img class="taproom-photo" src="' + (pictures[shot] || pictures.empty) +
    '" alt="' + (shot === "empty" ? "夜间六酒头空吧台" : "酒房营业场景") + '" decoding="async">';
}
