import test from "node:test";
import assert from "node:assert/strict";
import { brew, makeRecipe, PRESETS, sampleBrews } from "../core/brew.js";

import { RECIPE_FAMILIES, RECIPE_CATALOG } from "../core/recipes-catalog.js";

test("every menu recipe has a unique id, a shelf and a distinguishing hint", () => {
  assert.equal(RECIPE_CATALOG.length, 19);
  assert.equal(new Set(RECIPE_CATALOG.map(r => r.id)).size, RECIPE_CATALOG.length);
  for (const { id } of RECIPE_FAMILIES) assert.ok(RECIPE_CATALOG.filter(r => r.family === id).length >= 2);
  for (const row of RECIPE_CATALOG) {
    assert.ok(RECIPE_FAMILIES.some(f => f.id === row.family) && row.hint.length > 0);
    assert.equal(makeRecipe(row.id).styleId, row.id);
  }
});

test("Gose and Witbier carry intrinsic kettle seasonings through optional flavoring", () => {
  for (const [id, seasoning] of [["gose", "salt"], ["witbier", "orange-peel"]]) {
    for (const volumeL of [20, 40]) {
      const recipe = makeRecipe(id, { volumeL, adjunct: "cherry" });
      const batch = brew(recipe, 31);
      assert.deepEqual(recipe.kettleSeasonings.map(s => s.id), [seasoning, "coriander"]);
      for (const tag of [seasoning, "coriander", "cherry"]) assert.ok(batch.descriptors.includes(tag));
      assert.equal(recipe.kettleSoured, id === "gose");
    }
  }
});

test("milk stout lactose remains in the finished beer", () => {
  const recipe = makeRecipe("milk-stout");
  const original = brew(recipe, 31).metrics;
  recipe.fermentables = recipe.fermentables.filter(f => f.fermentableId !== "lactose");
  const unsweetened = brew(recipe, 31).metrics;
  assert.ok(original.fg - unsweetened.fg > 0.004);
  assert.ok(Math.abs(original.abv - unsweetened.abv) < 0.05);
  assert.ok(original.fg > brew(makeRecipe("dry-stout"), 31).metrics.fg);
});

test("all small-batch presets replay identically and preserve recipe inputs", () => {
  for (const { id } of PRESETS) {
    const recipe = makeRecipe(id);
    const saved = structuredClone(recipe);
    const batch = brew(recipe, "kitchen");
    assert.equal(recipe.batchVolumeL, 25);
    assert.deepEqual(batch, brew(makeRecipe(id), "kitchen"));
    assert.deepEqual(recipe, saved);
    assert.ok(batch.metrics.og > batch.metrics.fg && batch.metrics.abv > 0);
    assert.ok(
      Object.values(batch.sensory).every(
        (x) => Number.isFinite(x) && x >= 0 && x <= 10,
      ),
    );
  }
});

test("specialty malt replaces an equal mass and a hop addition depends on its stage", () => {
  const r = (options) => makeRecipe("house-pale-ale", options);
  const dark = r({ specialtyMaltId: "black-malt", specialtyPct: 10 });
  const mass = (recipe) =>
    recipe.fermentables.reduce((kg, f) => kg + f.weightKg, 0);
  const base = brew(r(), 1);
  assert.ok(Math.abs(mass(dark) - mass(r())) < 1e-8);
  assert.ok(brew(dark, 1).metrics.srm > base.metrics.srm);
  const add = (use) =>
    brew(r({ extraHopId: "citra", extraHopGrams: 40, extraHopUse: use }), 1);
  assert.ok(add("boil").metrics.ibu > add("dryHop").metrics.ibu);
  assert.ok(add("dryHop").sensory.hopAroma > add("boil").sensory.hopAroma);
});

test("dry hop and barrel respond to time spent in the respective stage", () => {
  const haze = (day) => brew(makeRecipe("hazy-ipa", { dryHopDay: day }), 3);
  assert.ok(
    haze(2).dryHopActivity[0].activity > haze(12).dryHopActivity[0].activity,
  );
  const stout = (days) =>
    brew(
      makeRecipe("imperial-stout", { barrelDays: days, adjunct: "pretzel" }),
      3,
    );
  assert.ok(
    stout(540).descriptors.includes("oak") &&
      stout(540).descriptors.includes("pretzel"),
  );
  assert.ok(stout(0).sensory.hopAroma > stout(540).sensory.hopAroma);
  assert.ok(
    brew(makeRecipe("sour-ipa"), 3).sensory.acidity > haze(2).sensory.acidity,
  );
});

test("stricter controls reduce sampled risk with common random numbers", () => {
  const r = makeRecipe("hazy-ipa");
  const options = { runs: 96, seed: 7 };
  const careful = sampleBrews(r, options);
  const rough = sampleBrews(r, {
    ...options,
    choices: {
      precision: false,
      temperatureControl: false,
      sanitation: false,
      closedTransfer: false,
    },
  });
  for (const id of Object.keys(careful.eventRates))
    assert.ok(rough.eventRates[id] > careful.eventRates[id]);
  assert.ok(rough.anyEventRate > careful.anyEventRate);
  assert.deepEqual(careful, sampleBrews(r, options));
});

test("correcting overnight heat preserves the first day and only cools the next day", () => {
  const recipe = makeRecipe("hazy-ipa");
  const choices = { temperatureControl: false };
  let hot;
  for (let seed = 0; seed < 32; seed++) {
    hot = brew(recipe, seed, choices);
    if (hot.events.some((e) => e.id === "warm-night")) break;
  }
  const rescued = brew(recipe, hot.seed, { ...choices, rescueWarm: true });
  const first = hot.events.find((e) => e.id === "warm-night");
  const fixed = rescued.events.find((e) => e.id === "warm-night");
  assert.equal(first.magnitude, fixed.magnitude);
  assert.deepEqual(hot.curve.slice(0, 2), rescued.curve.slice(0, 2));
  assert.equal(fixed.secondDayDeltaC, first.magnitude * 0.25);
  assert.ok(hot.curve[2].tempC > rescued.curve[2].tempC);
  assert.equal(hot.curve[3].tempC, rescued.curve[3].tempC);
  assert.notEqual(hot.curve[2].points, rescued.curve[2].points);
});

test("untroubled batches vary in hop aroma while batch metrics remain unchanged", () => {
  const recipe = makeRecipe("house-pale-ale", { hopId: "citra" });
  const batches = Array.from({ length: 32 }, (_, i) => brew(recipe, i)).filter(
    (b) => !b.events.length,
  );
  const factors = batches.map((b) => b.hopLotFactors.citra);
  assert.ok(Math.min(...factors) >= 0.88 && Math.min(...factors) < 1);
  assert.ok(Math.max(...factors) <= 1.12 && Math.max(...factors) > 1);
  assert.ok(new Set(batches.map((b) => b.sensory.hopAroma)).size > 1);
  for (const batch of batches)
    assert.deepEqual(batch.metrics, batches[0].metrics);
  const noHops = brew({ ...recipe, hops: [] }, batches[0].seed);
  assert.deepEqual(noHops.hopLotFactors, {});
  assert.equal(noHops.sensory.hopAroma, 0);
});

test("scaling a whole recipe and splitting one malt into two entries preserve sensory concentration", () => {
  const r = makeRecipe("house-pale-ale", { volumeL: 20 });
  const small = brew(r, 19);
  const large = brew(makeRecipe("house-pale-ale", { volumeL: 40 }), 19);
  assert.equal(small.sensory.acidity, large.sensory.acidity);
  const split = brew(
    makeRecipe("house-pale-ale", {
      volumeL: 20,
      specialtyMaltId: r.fermentables[0].fermentableId,
      specialtyPct: 5,
    }),
    19,
  );
  assert.deepEqual(split.sensory, small.sensory);
});
