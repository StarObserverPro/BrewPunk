import { buildExample, ferm, boilHop, step, fermStep, salts } from '../vendor/brewlab/recipes.js';

// One browsing home per recipe. These shelves are independent of judging categories.
export const RECIPE_FAMILIES = [
  ['hoppy', '酒花与淡艾尔'], ['lager', '拉格'], ['dark', '波特与世涛'],
  ['belgian', '比利时艾尔'], ['wheat', '小麦啤酒'], ['sour', '酸啤酒'],
].map(([id, name]) => ({id, name}));

export const RECIPE_CATALOG = [
  ['hazy-ipa','浑浊 IPA','hoppy','柔软酒体，热带果香'],
  ['west-coast-ipa','西海岸 IPA','hoppy','松脂、柑橘和干爽的苦尾'],
  ['house-pale-ale','美式淡艾尔','hoppy','柑橘酒花与浅烘麦芽'],
  ['czech-lager','捷克浅色拉格','lager','柔和麦香，草本酒花回苦'],
  ['imperial-stout','帝国世涛','dark','浓缩咖啡、黑巧与酒精暖感'],
  ['sour-ipa','酸 IPA','sour','果汁感酒花，明亮乳酸'],
  ['english-bitter','英式优选苦啤','hoppy','饼干麦香、英式花草香和利落的苦味'],
  ['marzen','三月拉格 Märzen','lager','铜色酒液里的烤面包皮香'],
  ['dry-stout','爱尔兰干世涛','dark','黑咖啡与短促干尾'],
  ['milk-stout','牛奶世涛','dark','烘焙麦香，乳糖留下圆润甜感'],
  ['saison','赛松','belgian','胡椒气息，收口很干'],
  ['dubbel','比利时双料','belgian','葡萄干、深色糖和麦香'],
  ['hefeweizen','巴伐利亚小麦','wheat','香蕉酯香和丁香气息'],
  ['witbier','比利时白啤','wheat','小麦、苦橙皮与芫荽籽香'],
  ['rauchbier','班贝格烟熏拉格','lager','山毛榉木烟香，底下是琥珀麦芽'],
  ['munich-helles','慕尼黑淡色拉格','lager','新鲜面包芯，柔和低苦'],
  ['gose','古斯 Gose','sour','轻快乳酸、微咸和芫荽籽'],
  ['english-porter','英式波特','dark','可可、太妃糖与柔和烘烤香'],
  ['tripel','比利时三料','belgian','浅金色、梨香和干爽酒精暖感'],
].map(([id, name, family, hint]) => ({id, name, family, hint}));

// House recipes below use a 20 L batch. Reuse upstream equipment and transfer settings.
const houseRecipes = {
  'munich-helles': {
    base: 'marzen',
    water: {profileId: 'soft-pilsner', saltDose: {calciumChloride: 2}, lacticAcidMl: 2},
    grist: [['pilsner', 3.95], ['munich-light', 0.22]],
    mashC: 65,
    hopping: [['hallertau-mf', 31, 60], ['tettnanger', 7, 10]],
    yeastId: 'german-lager', stages: [[10, 15], [15, 3]],
    conditioning: {days: 32, tempC: 3, co2Volumes: 2.45},
  },
  witbier: {
    base: 'hefeweizen',
    water: {profileId: 'soft-pilsner', saltDose: {calciumChloride: 2}, lacticAcidMl: 2},
    grist: [['pilsner', 2.25], ['flaked-wheat', 1.95], ['flaked-oats', 0.25]],
    mashC: 65,
    hopping: [['hallertau-mf', 23, 60]],
    yeastId: 'belgian-abbey', stages: [[19, 6], [21, 6]],
    conditioning: {days: 12, tempC: 6, co2Volumes: 2.7},
  },
  gose: {
    base: 'hefeweizen',
    water: {profileId: 'ro', saltDose: {calciumChloride: 2}, lacticAcidMl: 1},
    grist: [['wheat-malt', 2.05], ['pilsner', 1.9]],
    mashC: 65,
    hopping: [['spalt-select', 12, 60]],
    yeastId: 'kolsch', stages: [[17, 8], [19, 3]],
    conditioning: {days: 12, tempC: 5, co2Volumes: 2.8},
  },
  'english-porter': {
    base: 'english-bitter',
    water: {profileId: 'malt-forward', saltDose: {calciumChloride: 1}, lacticAcidMl: 1},
    grist: [['maris-otter', 3.75], ['crystal-medium', 0.35], ['pale-chocolate', 0.3], ['chocolate', 0.20]],
    mashC: 65,
    hopping: [['fuggle', 37, 60], ['ekg', 14, 15]],
    yeastId: 'english-ale', stages: [[18, 8], [20, 4]],
    conditioning: {days: 21, tempC: 9, co2Volumes: 2},
  },
  tripel: {
    base: 'dubbel',
    water: {profileId: 'soft-pilsner', saltDose: {gypsum: 2, calciumChloride: 1}, lacticAcidMl: 3},
    grist: [['pilsner', 5.9], ['munich-light', 0.2], ['brewing-sugar', 0.85]],
    mashC: 64,
    hopping: [['styrian-goldings', 43, 60], ['saaz', 18, 20]],
    yeastId: 'belgian-abbey', stages: [[18, 4], [22, 12]],
    conditioning: {days: 35, tempC: 10, co2Volumes: 2.9},
  },
};

export function buildCatalogRecipe(id) {
  const custom = houseRecipes[id];
  if (!custom) {
    const recipe = buildExample(id === 'sour-ipa' ? 'hazy-ipa' : id);
    if (id === 'rauchbier') recipe.fermentables.push(ferm('carafa-special',0.08));
    const grain = key => recipe.fermentables.find(f => f.fermentableId === key);
    if (id === 'milk-stout') {
      recipe.fermentables.push(ferm('black-malt',0.22));
      grain('lactose').weightKg = 0.33;
      recipe.mash.steps[0].tempC = 65;
    }
    if (id === 'saison') {
      grain('pilsner').weightKg = 3.49;
      grain('brewing-sugar').weightKg = 0.15;
      recipe.fermentables.push(ferm('aromatic',0.36));
      recipe.hops[0].grams = 11;
    }
    if (id === 'dubbel') {
      grain('special-b').weightKg = 0.105;
      grain('pilsner').weightKg = 4.55;
    }
    if (id === 'marzen') {
      grain('pilsner').weightKg = 0.32;
      grain('melanoidin').weightKg = 0.22;
    }
    return recipe;
  }
  const {base, water, grist, hopping, mashC, yeastId, stages, conditioning} = custom;
  const {profileId, saltDose, lacticAcidMl} = water;
  const r = buildExample(base);
  r.water = {profileId, salts:salts(saltDose), lacticAcidMl};
  r.fermentables = grist.map(([grain, kg]) => ferm(grain,kg));
  r.hops = hopping.map(([hop, grams, minutes]) => boilHop(hop,grams,minutes));
  r.mash.steps = [step('saccharification',mashC,60), step('mashout',76,10)];
  r.fermentation.yeastId = yeastId;
  r.fermentation.steps = stages.map(([c,d],i) => fermStep(i ? 'Finish' : 'Primary',c,d));
  r.chill.pitchTempC = stages[0][0];
  r.conditioning = {...r.conditioning, ...conditioning};
  r.notes = RECIPE_CATALOG.find(row => row.id === id).hint;
  if (id === 'gose') r.kettleSeasonings = [{id:'salt',gramsPerL:0.45},{id:'coriander',gramsPerL:0.55}];
  if (id === 'witbier') r.kettleSeasonings = [{id:'orange-peel',gramsPerL:0.65},{id:'coriander',gramsPerL:0.45}];
  return r;
}
