import { getYeast } from '../vendor/brewlab/ingredients.js';
import { rng } from './random.js';

// IDs point to independently inspectable brewing records in docs/brewing-references.md.
export const BASELINE_REFERENCES = {
  'house-pale-ale': ['sn-pale'],
  'west-coast-ipa': ['sn-torpedo', 'punk-ipa'],
  'hazy-ipa': ['hanella', 'jabba'],
  'czech-lager': ['pilz'],
  'imperial-stout': ['star-maker'],
  'sour-ipa': ['hanella', 'lal-souring'],
};

// Facts come from the named brewer or supplier. Ranges describe that source only.
const REFERENCES = {
  'sn-pale': {
    scope: 'recipe', source: 'https://sierranevada.com/blog/our-beer/pale-ale-homebrew-recipe',
    use: '对照经典美式淡艾尔的酒色与焦糖麦芽占比',
    facts: { colorSRM: [10, 12], caramelMaltPctGrist: 8 },
  },
  'sn-torpedo': {
    scope: 'recipe', source: 'https://sierranevada.com/blog/our-beer/torpedo-ipa-homebrew-recipe',
    use: '对照使用 Chico 酵母时的接种温度',
    facts: { yeast: 'Chico', pitchC: 20 },
  },
  'punk-ipa': {
    scope: 'recipe', source: 'https://d1fnkk8n0t8a0e.cloudfront.net/docs/DIY_DOG_Combined_LR.pdf',
    use: '对照 DIY Dog 第 2 号历史配方的发酵温度',
    facts: { batchL: 20, fermentationC: 19 },
  },
  hanella: {
    scope: 'recipe', source: 'https://homebrewersassociation.org/homebrew-recipe/hanella-hazy-ipa/',
    use: '对照浑浊 IPA 的起始比重和终点比重',
    facts: { originalGravitySG: 1.061, finalGravitySG: 1.012 },
  },
  jabba: {
    scope: 'recipe', source: 'https://homebrewersassociation.org/wp-content/uploads/2024/04/AHA-BigBrew24-Homebrew-Recipe_Jabba-Juice-Hazy-IPA.pdf',
    use: '对照 20°C 主发酵期间的干投时点和接触时间',
    facts: { fermentationC: 20, dryHopDayOfPrimary: 3, dryHopContactDaysApprox: 5 },
  },
  pilz: {
    scope: 'recipe', source: 'https://homebrewersassociation.org/homebrew-recipe/pilz-czech-pale-lager/',
    use: '浅色拉格的苦度与色度对照',
    facts: { bitternessIBU: 40, colorSRM: 3.3, finalGravitySG: 1.009 },
  },
  'star-maker': {
    scope: 'recipe', source: 'https://homebrewersassociation.org/homebrew-recipe/star-maker-imperial-stout/',
    use: '对照高起始比重世涛中的残余比重和苦度',
    facts: { originalGravitySG: 1.144, finalGravitySG: 1.033, bitternessIBU: 72 },
  },
  'lal-souring': {
    scope: 'supplier-guide', source: 'https://admin.lallemandbrewing.com/wp-content/uploads/2023/10/Bacteria-Souring-Methods-Best-Practices-A4.pdf',
    use: '区分投酵母之前的锅内酸化，与乳酸菌、酵母共同接种',
    facts: { kettleSourIncubationHours: [24, 48], sourPitchWithVossCoFermentC: [30, 35] },
  },
  'allagash-wit': {
    scope: 'brewer-guide', source: 'https://homebrewersassociation.org/how-to-brew/5-tips-brew-better-witbier-allagash-brewing-co/',
    use: '对照白啤酒碎芫荽籽的剂量以及苦橙和甜橙的区别',
    facts: { crushedCorianderGPerUSGal: [1, 2], orangePeel: 'bitter-curacao' },
  },
  'epic-coffee': {
    scope: 'recipe', source: 'https://www.beerandbrewing.com/chocolate-coffee-stout-recipe',
    use: '对照咖啡与可可在移除酵母后的冷泡萃取',
    facts: { coffeeCacaoSteepC: [0, 4], coffeeCacaoSteepDays: [3, 5] },
  },
  'craisin-saison': {
    scope: 'recipe', source: 'https://homebrewersassociation.org/homebrew-recipe/saison-de-craisin/',
    use: '对照含蔓越莓干、蜂蜜的 Saison 单锅投料量与主发酵温度',
    facts: { batchL: 19, driedCranberryOz: [4, 6], cranberryHoneyOz: 16, fermentationC: 24 },
  },
  'smokeska-porter': {
    scope: 'recipe', source: 'https://homebrewersassociation.org/homebrew-recipe/smokeska-porter/',
    use: '对照烟熏麦芽随糖化投料的用量和批量',
    facts: { smokedMaltKg: 3.4, batchL: 22.7, mashC: 67 },
  },
};

const ADJUNCT_REFERENCES = [
  [/芫荽|香菜籽|胡荽|橘皮|橙皮|陈皮|coriander|orange peel/i, 'allagash-wit'],
  [/咖啡|可可|巧克力|coffee|cacao|cocoa|chocolate/i, 'epic-coffee'],
  [/蔓越莓|小红莓|蜂蜜|cranberr|craisin|honey/i, 'craisin-saison'],
  [/烟熏麦芽|煙燻麥芽|smoked malt|rauchmalz/i, 'smokeska-porter'],
];

/** Return source facts in request order, adding ingredient-specific analogues only when relevant. */
export function referencePoints(ids, materialName = '') {
  const selected = new Set(ids);
  for (const [pattern, id] of ADJUNCT_REFERENCES) {
    if (pattern.test(materialName)) selected.add(id);
  }
  return [...selected]
    .filter(id => Object.hasOwn(REFERENCES, id))
    .map(id => ({ id, ...structuredClone(REFERENCES[id]) }));
}

/** Small, reproducible activity variation, sampled once per batch before adjuncts. */
export function referenceBaseline(recipe, seed) {
  const { yeastId, steps } = recipe.fermentation;
  const yeast = getYeast(yeastId);
  if (!yeast) throw new RangeError(`未知酵母 ${yeastId}`);
  const pitchC = steps[0].tempC;
  const outsideC = Math.max(0, yeast.tempMinC - pitchC, pitchC - yeast.tempMaxC);
  // House balancing constants, not measured batch-to-batch variance.
  const spread = Math.min(0.16, 0.04 + outsideC * 0.015);
  const random = rng(seed, 'baseline:yeast-lot:v1');
  const rateFactor = 1 + (random() - random()) * spread;
  return { yeastId, pitchC, outsideC, spread, rateFactor,
    referenceIds: [...(BASELINE_REFERENCES[recipe.presetId] ?? [])] };
}
