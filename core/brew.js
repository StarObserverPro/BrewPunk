import { normalizeAdjunct, resolveAdjunct, finishAdjunct } from "./adjuncts.js";
import { referenceBaseline } from "./baseline.js";
import { RECIPE_CATALOG, buildCatalogRecipe } from "./recipes-catalog.js";
import { buildContext, recipeSrm } from "../vendor/brewlab/simulate.js";
import { computeHopLoad, computeSensory } from "../vendor/brewlab/sensory.js";
import {
  getHop,
  getYeast,
  getFermentable,
} from "../vendor/brewlab/ingredients.js";
import { WATER_PROFILE_BY_ID } from "../vendor/brewlab/water.js";
import { clamp } from "../vendor/brewlab/calculations.js";
import { processEvents } from "./accidents.js";
import { applyProcessChanges, saccharificationRest } from "./process.js";
import { rng } from "./random.js";

export const PRESETS = RECIPE_CATALOG;

function numberIn(number, min, max, label) {
  if (!Number.isFinite(number) || number < min || number > max)
    throw new RangeError(`${label} 须在 ${min}–${max} 范围内`);
  return number;
}
function member(value, valid, label) {
  if (!valid) throw new RangeError(`未知${label} ${value}`);
  return value;
}
export function makeRecipe(id, o = {}) {
  const preset = PRESETS.find((p) => p.id === id);
  member(id, preset, "配方");
  const sour = id === "sour-ipa";
  const r = buildCatalogRecipe(id);
  const volume = numberIn(o.volumeL ?? 25, 5, 50, "容量 L");
  const scale = volume / r.batchVolumeL;
  r.preBoilVolumeL *= scale;
  r.batchVolumeL = volume;
  r.water.lacticAcidMl *= scale;
  for (const salt of Object.keys(r.water.salts)) r.water.salts[salt] *= scale;
  for (const f of r.fermentables) f.weightKg *= scale;
  for (const h of r.hops)
    h.grams *= scale * (sour && h.use === "boil" ? 0.25 : 1);
  if (o.maltId)
    r.fermentables[0].fermentableId = member(
      o.maltId,
      getFermentable(o.maltId),
      "麦芽",
    );
  if (o.specialtyMaltId) {
    member(o.specialtyMaltId, getFermentable(o.specialtyMaltId), "拼配麦芽");
    const total = r.fermentables.reduce((sum, malt) => sum + malt.weightKg, 0);
    const kg =
      (total * numberIn(o.specialtyPct ?? 5, 0, 30, "拼配占总投料百分比")) /
      100;
    if (kg > r.fermentables[0].weightKg)
      throw new RangeError("拼配用量超出可置换的基础麦芽");
    r.fermentables[0].weightKg -= kg;
    if (kg)
      r.fermentables.push({ fermentableId: o.specialtyMaltId, weightKg: kg });
  }
  if (o.yeastId)
    r.fermentation.yeastId = member(o.yeastId, getYeast(o.yeastId), "酵母");
  if (o.waterId)
    r.water.profileId = member(
      o.waterId,
      WATER_PROFILE_BY_ID.has(o.waterId),
      "水型",
    );
  if (o.hopId) {
    member(o.hopId, getHop(o.hopId), "酒花");
    // Replace late additions preferentially; preserve bittering varieties in mixed recipes.
    const late = r.hops.filter((h) => h.use !== "boil" || h.time <= 15);
    for (const h of late.length ? late : r.hops) h.hopId = o.hopId;
  }
  if (o.mashC != null) {
    saccharificationRest(r).tempC = numberIn(o.mashC, 55, 75, "糖化温度");
  }
  if (o.fermentC != null) {
    r.fermentation.steps[0].tempC = numberIn(o.fermentC, 5, 40, "发酵温度");
    r.chill.pitchTempC = o.fermentC;
  }
  if (o.dryHopGrams != null || o.dryHopDay != null) {
    const dry = r.hops.filter((h) => h.use === "dryHop");
    const total = dry.reduce((a, h) => a + h.grams, 0);
    const grams = numberIn(o.dryHopGrams ?? total, 0, volume * 30, "干投克数");
    if (o.dryHopDay != null) numberIn(o.dryHopDay, 0, 60, "干投日");
    if (total)
      for (const h of dry) {
        h.grams *= grams / total;
        h.day = o.dryHopDay ?? h.day;
      }
    if (!total && grams)
      r.hops.push({
        use: "dryHop",
        hopId: o.hopId ?? r.hops.at(-1).hopId,
        grams,
        time: 3,
        day: o.dryHopDay ?? 5,
      });
  }
  if (o.extraHopId) {
    const hopId = member(o.extraHopId, getHop(o.extraHopId), "拼配酒花");
    const use = o.extraHopUse ?? "whirlpool";
    member(use, ["boil", "whirlpool", "dryHop"].includes(use), "投花阶段");
    const grams = numberIn(
      o.extraHopGrams ?? 20,
      0,
      volume * 30,
      "拼配酒花克数",
    );
    const time = numberIn(
      o.extraHopTime ?? (use === "dryHop" ? 3 : 15),
      0,
      use === "dryHop" ? 21 : 120,
      "接触时长",
    );
    const h = { hopId, use, grams, time };
    if (use === "dryHop") h.day = numberIn(o.extraHopDay ?? 5, 0, 60, "干投日");
    if (use === "whirlpool") h.tempC = 80;
    if (grams) r.hops.push(h);
  }
  let totalDays = r.fermentation.steps.reduce((a, s) => a + s.days, 0);
  for (const h of r.hops.filter((h) => h.use === "dryHop" && h.grams > 0)) {
    const end = h.day + h.time;
    if (end > totalDays) {
      r.fermentation.steps.at(-1).days += end - totalDays;
      totalDays = end;
    }
  }
  for (const [prefix, items] of Object.entries({
    malt: r.fermentables,
    hop: r.hops,
    mash: r.mash.steps,
    ferment: r.fermentation.steps,
  })) {
    items.forEach((item, i) => {
      item.id = `${prefix}-${i + 1}`;
    });
  }
  const packaging = o.packaging ?? "keg";
  const adjunct = o.adjunct ?? "none";
  return Object.assign(r, {
    ...(o.baselineVersion === 1 ? { baselineVersion: 1 } : {}),
    ...(o.previousAdditions?.length ? {previousAdditions:o.previousAdditions.map(normalizeAdjunct)} : {}),
    ...(o.customAdjunct ? { customAdjunct: normalizeAdjunct(o.customAdjunct) } : {}),
    processVersion: o.processVersion ?? 1,
    name: preset.name,
    presetId: id,
    styleId: id,
    kettleSoured: sour || id === "gose",
    packaging: member(
      packaging,
      ["keg", "bottle", "can"].includes(packaging),
      "包装",
    ),
    adjunct: member(
      adjunct,
      [
        "none",
        "coffee",
        "cocoa",
        "cherry",
        "chili",
        "coconut",
        "pretzel",
      ].includes(adjunct) || (adjunct === "custom" && Boolean(o.customAdjunct)),
      "增味",
    ),
    ageDays: numberIn(o.ageDays ?? r.conditioning.days, 0, 1460, "包装后日龄"),
    storageC: numberIn(o.storageC ?? r.conditioning.tempC, -2, 35, "储藏温度"),
    barrelDays: numberIn(o.barrelDays ?? 0, 0, 730, "桶陈天数"),
  });
}

// Integral of daily gravity consumption over the hop contact window. Rates >= 6 points/day
// saturate the game activity index. Partial days use linear interpolation within each sample.
function activityIn(curve, start, days) {
  let active = 0;
  for (let i = 1; i < curve.length; i++) {
    const a = curve[i - 1],
      b = curve[i];
    const overlap = Math.max(
      0,
      Math.min(b.day, start + days) - Math.max(a.day, start),
    );
    if (overlap && b.day > a.day)
      active +=
        overlap * clamp((a.points - b.points) / (b.day - a.day) / 6, 0, 1);
  }
  return days > 0 ? active / days : 0;
}
export function brew(recipe, seed = 1, choices = {}) {
  const r = structuredClone(recipe);
  r.conditioning.days = 0;
  const events = processEvents(r, seed, choices);
  const magnitude = (id) => events.find((e) => e.id === id)?.magnitude ?? 0;
  const process = applyProcessChanges(r, events, choices);
  const warmNight = events.find((e) => e.id === "warm-night");
  if (warmNight) {
    const heat = warmNight.magnitude;
    warmNight.secondDayDeltaC = choices.rescueWarm ? heat * 0.25 : heat;
    if (choices.rescueWarm) {
      warmNight.text = `第一晚酒液比设定高 ${heat.toFixed(1)} °C。换好冰袋后，第二天的温差收窄到 ${warmNight.secondDayDeltaC.toFixed(1)} °C。`;
    }
    const deviations = [heat, warmNight.secondDayDeltaC];
    let day = 0;
    r.fermentation.steps = r.fermentation.steps.flatMap((step) => {
      let daysLeft = step.days;
      const segments = [];
      while (day < deviations.length && daysLeft >= 1) {
        segments.push({
          ...step,
          days: 1,
          tempC: step.tempC + deviations[day],
          id: `${step.id}-day-${day + 1}`,
        });
        daysLeft--;
        day++;
      }
      if (daysLeft > 0) segments.push({ ...step, days: daysLeft });
      return segments;
    });
  }
  const baseline = recipe.baselineVersion === 1 ? referenceBaseline(recipe, seed) : null;
  const charges=[...(r.previousAdditions||[]),...(r.customAdjunct?[r.customAdjunct]:[])].map(a=>resolveAdjunct(a,r.batchVolumeL));
  if(baseline || charges.length){
    let day=0;
    r.fermentation.steps=r.fermentation.steps.flatMap(step=>{
      const end=day+step.days;
      const cuts=[...new Set(charges.map(a=>a.startDay).filter(t=>t>day && t<end))].sort((a,b)=>a-b);
      return [...cuts,end].map(t=>{const days=t-day,rateFactor=charges.filter(a=>a.startDay<=day).reduce((n,a)=>n*a.rateMultiplier,baseline?.rateFactor??1);day=t;return {...step,days,rateFactor};});
    });
  }
  const ctx = buildContext(r);
  const curve = ctx.attenuation.kinetics.curve;
  const additions=charges.map(a=>finishAdjunct(a,curve,{boilTimeMin:r.boilTimeMin,conditioningDays:process.barrelDays}));
  const customAdjunct=additions.at(-1);
  const dryHopActivity = [];
  const hopLotFactors = {};
  const effectiveHops = r.hops.map((h) => {
    if (!h.grams) return h;
    // Game prior on aromatic yield only. Multiple additions of one lot share the multiplier.
    const lot = (hopLotFactors[h.hopId] ??=
      0.88 + 0.24 * rng(seed, `hop-lot/${h.hopId}`)());
    if (h.use !== "dryHop") return { ...h, grams: h.grams * lot };
    const activity = activityIn(curve, h.day ?? 5, h.time);
    dryHopActivity.push({
      id: h.id,
      hopId: h.hopId,
      day: h.day,
      grams: h.grams,
      activity,
    });
    // Suppress vendor's calendar-day switch; CO₂ stripping scales with yeast activity.
    return { ...h, day: 5, grams: h.grams * lot * (1 - 0.18 * activity) };
  });
  const aroma = computeHopLoad({ ...r, hops: effectiveHops });
  ctx.hopLoad = {
    ...ctx.hopLoad,
    aromaUnits: aroma.aromaUnits,
    flavourUnits: aroma.flavourUnits,
    dryHopDuringFermentation: false,
  };
  // The upstream sensory coefficient assumes a 20 L batch and applies a nonlinear
  // response to each malt. Normalize the acid dose and aggregate repeated malt entries.
  const grist = new Map();
  for (const f of r.fermentables)
    grist.set(f.fermentableId, (grist.get(f.fermentableId) ?? 0) + f.weightKg);
  const sensoryRecipe = {
    ...r,
    water: {
      ...r.water,
      lacticAcidMl: (r.water.lacticAcidMl * 20) / r.batchVolumeL,
    },
    fermentables: [...grist].map(([fermentableId, weightKg]) => ({
      fermentableId,
      weightKg,
    })),
  };
  const sensory = computeSensory({ ...ctx, recipe: sensoryRecipe });
  const activeLoad =
    dryHopActivity.reduce((sum, h) => sum + h.activity * h.grams, 0) /
    r.batchVolumeL;
  sensory.fruitEsters += Math.min(1.2, 0.12 * activeLoad);
  sensory.acidity += (r.kettleSoured ? 4.2 : 0) + magnitude("wild-acid");
  const descriptors = [...(r.kettleSeasonings ?? []).filter(s => s.gramsPerL > 0).map(s => s.id), ...aroma.descriptors];
  if (!["none", "custom"].includes(r.adjunct)) descriptors.unshift(r.adjunct);
  if (r.adjunct === "coffee") sensory.roast += 1.7;
  if (r.adjunct === "cocoa") sensory.roast += 1;
  if (r.adjunct === "cherry") {
    sensory.fruitEsters += 1.1;
    sensory.acidity += 0.7;
  }
  if (r.barrelDays) {
    const extract = 1 - Math.exp(-r.barrelDays / 180);
    if (extract > 0.18) descriptors.unshift("oak");
    if (extract > 0.5) descriptors.unshift("vanilla");
    sensory.hopAroma *= Math.exp(-r.barrelDays / 160);
    sensory.hopFlavour *= Math.exp(-r.barrelDays / 350);
    sensory.alcoholWarmth *= 1 - 0.12 * extract;
  }
  // Retain the unsaturated base so each later glass can apply its own constituent weights.
  const sensoryBeforeAdjunct = customAdjunct ? { ...sensory } : null;
  for(const a of additions) for (const [axis, weight] of Object.entries(a.axisWeights)) {
    sensory[axis] += weight;
  }
  for (const k of Object.keys(sensory)) sensory[k] = clamp(sensory[k], 0, 10);
  const base = { keg: 0.025, can: 0.045, bottle: 0.07 }[r.packaging];
  return {
    seed,
    ...(baseline ? { baseline } : {}),
    ...(customAdjunct ? { customAdjunct, additions, sensoryBeforeAdjunct } : {}),
    recipe: structuredClone(recipe),
    metrics: {
      og: ctx.gravity.og,
      fg: ctx.attenuation.fg,
      abv: ctx.attenuation.abv,
      ibu: ctx.ibu.total,
      srm: recipeSrm(r),
      mashPh: ctx.water.mashPh,
      co2Volumes: r.conditioning.co2Volumes,
    },
    sensory,
    risks: ctx.risks,
    descriptors: [...new Set(descriptors)],
    events,
    curve,
    dryHopActivity,
    hopLotFactors,
    packaging: r.packaging,
    storageC: r.storageC,
    exposure: clamp(
      base +
        (choices.closedTransfer === false ? 0.15 : 0) +
        process.exposure,
      0,
      1,
    ),
    packageDefects: {
      probability: { keg: 0.008, can: 0.035, bottle: 0.025 }[r.packaging],
    },
    yieldL: process.yieldL,
    barrelDays: process.barrelDays,
    storageExcursion: process.storageExcursion,
    sealChecked: choices.sealCheck === true,
  };
}

export function sampleBrews(
  recipe,
  { seed = 1, runs = 100, choices = {} } = {},
) {
  if (!Number.isInteger(runs) || runs < 1 || runs > 10000)
    throw new RangeError("runs 须为 1–10000 的整数");
  const draw = rng(seed, "brew-samples");
  const counts = {
    "scale-drift": 0,
    "warm-night": 0,
    "wild-acid": 0,
    "air-pickup": 0,
  };
  const values = { abv: [], og: [], fg: [], ibu: [], srm: [], mashPh: [] };
  let affected = 0;
  for (let i = 0; i < runs; i++) {
    const batch = brew(recipe, Math.floor(draw() * 4294967296), choices);
    if (batch.events.length) affected++;
    for (const e of batch.events) counts[e.id] = (counts[e.id] ?? 0) + 1;
    for (const [k, list] of Object.entries(values)) list.push(batch.metrics[k]);
  }
  const metrics = {};
  for (const [k, list] of Object.entries(values)) {
    list.sort((a, b) => a - b);
    const q = (p) => list[Math.round((runs - 1) * p)];
    metrics[k] = { p10: q(0.1), p50: q(0.5), p90: q(0.9) };
  }
  const eventRates = Object.fromEntries(
    Object.entries(counts).map(([k, n]) => [k, n / runs]),
  );
  return { runs, seed, eventRates, metrics, anyEventRate: affected / runs };
}
