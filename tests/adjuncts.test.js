import test from "node:test";
import assert from "node:assert/strict";
import { brew, makeRecipe } from "../core/brew.js";
import { taste } from "../core/tasting.js";
import {
  finishAdjunct,
  offlineProfile,
  resolveAdjunct,
  validateProfile,
} from "../core/adjuncts.js";

const garlic = {
  name: "大蒜",
  preparation: "拍碎",
  grams: 1000,
  stage: "pitch",
};
function batch(volumeL, customAdjunct) {
  return brew(
    makeRecipe("hazy-ipa", {
      volumeL,
      ...(customAdjunct && { adjunct: "custom", customAdjunct }),
    }),
    17,
  );
}

test("garlic concentration changes the gravity trajectory and ABV", () => {
  const normal = batch(10),
    heavy = batch(10, garlic);
  assert.equal(heavy.customAdjunct.doseGL, 100);
  assert.equal(heavy.customAdjunct.tier, 3);
  assert.ok(heavy.metrics.fg > normal.metrics.fg + 0.02);
  assert.ok(heavy.metrics.abv < normal.metrics.abv / 2);
  const light = batch(50, { ...garlic, grams: 48 });
  assert.equal(light.customAdjunct.tier, 0);
  assert.deepEqual(light.curve, batch(50).curve);
  assert.ok(
    offlineProfile("大蒜", "烤").potency <
      offlineProfile("大蒜", "拍碎").potency,
  );
});

test("conditioning cannot change past attenuation and day two additions preserve start", () => {
  const normal = batch(10);
  const late = batch(10, { ...garlic, stage: "conditioning" });
  assert.deepEqual(late.curve, normal.curve);
  assert.equal(late.metrics.fg, normal.metrics.fg);
  const active = batch(10, { ...garlic, stage: "active" });
  assert.deepEqual(
    active.curve.filter((x) => x.day <= 2),
    normal.curve.filter((x) => x.day <= 2),
  );
  assert.ok(active.metrics.fg > normal.metrics.fg);
});

test("unknown materials stay neutral and low-confidence yeast mechanisms have bounded effects", () => {
  const unknown = { ...garlic, name: "未知草籽" };
  assert.equal(resolveAdjunct(unknown, 10).tier, 0);
  assert.deepEqual(offlineProfile(unknown.name).constituents, []);
  const profile = offlineProfile("大蒜");
  assert.equal(resolveAdjunct({ ...unknown, profile }, 10).tier, 1);
  for (const invalid of [
    { ...profile, potency: 4 },
    { ...profile, extra: true },
    { ...profile, constituents: [{ ...profile.constituents[0], share: 0.3 }] },
  ]) {
    assert.throws(() => validateProfile(invalid));
  }
});

test("component budgets conserve direct and transformed contributions by exposure", () => {
  const p = offlineProfile("樱桃");
  const profile = {
    ...p,
    constituents: ["heat", "yeast", "breakdown"].map((pathway, i) => ({
      ...p.constituents[0],
      name: pathway,
      pathway,
      share: [0.2, 0.3, 0.5][i],
      convertible: 1,
    })),
  };
  const curve = [
    { day: 0, points: 50 },
    { day: 10, points: 10 },
  ];
  const weights = (stage, boilTimeMin, conditioningDays) =>
    finishAdjunct(resolveAdjunct({ ...garlic, stage, profile }, 20), curve, {
      boilTimeMin,
      conditioningDays,
    });
  const hot = weights("boil", 60, 2),
    cold = weights("conditioning", 60, 2);
  assert.ok(
    hot.budgets[0].evolvedWeight >
      weights("boil", 10, 2).budgets[0].evolvedWeight,
  );
  assert.equal(cold.budgets[0].evolvedWeight, 0);
  assert.equal(cold.budgets[1].evolvedWeight, 0);
  assert.ok(hot.budgets[1].evolvedWeight > 0);
  assert.ok(
    weights("conditioning", 60, 14).budgets[2].evolvedWeight >
      cold.budgets[2].evolvedWeight,
  );
  for (const c of hot.budgets)
    assert.ok(Math.abs(c.directWeight + c.evolvedWeight - c.budget) < 1e-10);
});

test("packaged glasses sample breakdown at their own age and temperature, retaining barrel contact", () => {
  const profile = offlineProfile("樱桃");
  Object.assign(profile.constituents[0], {
    pathway: "breakdown",
    convertible: 0.85,
  });
  const options = {
    adjunct: "custom",
    customAdjunct: { name: "果料", grams: 90, stage: "conditioning", profile },
  };
  const r = makeRecipe("house-pale-ale", options);
  const b = brew(r, 17);
  const history = structuredClone(b.curve);
  const glass = (day, temp) => taste(b, { ageDays: day, storageC: temp });
  const fresh = glass(0, 10);
  const aged = glass(30, 10);
  const warm = glass(30, 20);
  assert.deepEqual(fresh.customAdjunct.budgets, b.customAdjunct.budgets);
  assert.equal(fresh.customAdjunct.evolvedWeight, 0);
  assert.ok(
    aged.customAdjunct.evolvedWeight > fresh.customAdjunct.evolvedWeight,
  );
  assert.ok(
    warm.customAdjunct.evolvedWeight > aged.customAdjunct.evolvedWeight,
  );
  assert.ok(fresh.sensory.acidity > aged.sensory.acidity);
  assert.ok(aged.sensory.fruitEsters > fresh.sensory.fruitEsters);
  assert.ok(
    !fresh.afterNotes.includes(profile.evolved) &&
      aged.afterNotes.includes(profile.evolved),
  );
  assert.deepEqual(b.curve, history);
  assert.deepEqual(b.metrics, brew(makeRecipe("house-pale-ale"), 17).metrics);
  const barreled = brew(
    makeRecipe("house-pale-ale", { ...options, barrelDays: 25 }),
    17,
  );
  assert.ok(barreled.customAdjunct.evolvedWeight > 0);
  assert.deepEqual(
    taste(barreled, { ageDays: 0 }).customAdjunct.budgets,
    barreled.customAdjunct.budgets,
  );
});

test("classic style and 30A score the same glass by surviving character and base style", () => {
  const recipe = (grams, profile = offlineProfile("大蒜")) =>
    makeRecipe("house-pale-ale", {
      volumeL: 10,
      adjunct: "custom",
      customAdjunct: {
        name: "实验料袋",
        stage: "conditioning",
        grams,
        profile,
      },
    });
  const base = brew(makeRecipe("house-pale-ale", { volumeL: 10 }), 17);
  const high = brew(recipe(1000), 17);
  const at = (b, styleId) => taste(b, { ageDays: 8, styleId });
  const classic = at(high, "apa"),
    special = at(high, "30A");
  assert.ok(at(base, "apa").bjcp.total - classic.bjcp.total >= 3);
  assert.match(classic.bjcp.comment, /蒜/);
  assert.match(special.bjcp.name, /30A.*18B/);
  assert.ok(special.bjcp.total > classic.bjcp.total);
  assert.ok(special.bjcp.total > at(base, "30A").bjcp.total);
  assert.deepEqual(classic.sensory, special.sensory);
  assert.equal(classic.note, special.note);
  assert.deepEqual(at(brew(recipe(0.1), 17), "apa").bjcp, at(base, "apa").bjcp);
  const citrus = offlineProfile("樱桃");
  Object.assign(citrus.constituents[0], {
    direct: "新鲜橙皮",
    directFamily: "citrusPeel",
    directAxis: "none",
    convertible: 0,
  });
  assert.deepEqual(
    at(brew(recipe(1000, citrus), 17), "ipa").bjcp,
    at(base, "ipa").bjcp,
  );
});
