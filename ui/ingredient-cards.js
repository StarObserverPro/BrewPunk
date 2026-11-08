import { supplementalShots } from "./packaging-art.js";

const subjects = {
  malt: ["p01-malt", "麦芽", "谷物决定麦汁的底色。"],
  hops: ["p02-hops", "酒花", "看看球果，再翻到这一锅的投花日程。"],
  yeast: ["p03-yeast", "酵母", "酒单里给发酵留出合适的温度。"],
  fruit: ["p04-fruit", "果香", "砧板上的樱桃与橙皮，给今天的增味留一个念头。"],
};
export function ingredientCard(kind, seed) {
  const [prefix, title, caption] = subjects[kind];
  const suffix = 1 + ((Number(seed) >>> 0) % 4);
  const { src } = supplementalShots[prefix + "-0" + suffix];
  return '<figure><img src="' + src + '" alt="' + title + '"><figcaption><b>' + title + '</b> · ' + caption + '</figcaption></figure>';
}
export function ingredientsPage(kinds, seed) {
  return '<div class="ingredient-cards">' + kinds.map(kind => ingredientCard(kind, seed)).join("") + '</div>';
}
