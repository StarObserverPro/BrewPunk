import test from "node:test";
import assert from "node:assert/strict";
import { makeRecipe, brew, sampleBrews, PRESETS } from "../core/brew.js";
import { taste } from "../core/tasting.js";
import { simulateNight, packageCondition } from "../core/taproom.js";
import { incidents, incidentFrames } from "../ui/incidents.js";
import { blank, restore, batchOf } from "../ui/flow.js";

const recipe = makeRecipe("hazy-ipa", { processVersion: 2, barrelDays: 180, ageDays: 30, packaging: "bottle" });
function findEvent(id) {
  for (let seed = 0; seed < 500; seed++) {
    const batch = brew(recipe, seed);
    if (batch.events.some(event => event.id === id)) return batch;
  }
  throw Error("No seeded example for " + id);
}
test("each process warning is reachable, keeps its evidence, and applies a response to the model", () => {
  const checks = {
    "scale-drift": (a, b) => b.metrics.og > a.metrics.og,
    "mash-cool": (a, b) => b.curve.at(-1).points !== a.curve.at(-1).points,
    "filter-slow": (a, b) => b.yieldL > a.yieldL,
    "boil-over": (a, b) => b.yieldL > a.yieldL,
    "pitch-warm": (a, b) => b.curve[0].tempC !== a.curve[0].tempC || b.curve[1].tempC !== a.curve[1].tempC,
    "warm-night": (a, b) => b.events.find(e => e.id === "warm-night").secondDayDeltaC < a.events.find(e => e.id === "warm-night").secondDayDeltaC,
    "airlock-foam": (a, b) => b.yieldL > a.yieldL,
    "dryhop-contact": (a, b) => b.sensory.hopAroma > a.sensory.hopAroma,
    "barrel-strong": (a, b) => b.barrelDays < a.barrelDays && b.sensory.hopAroma > a.sensory.hopAroma,
    "air-pickup": (a, b) => b.exposure < a.exposure,
    "storage-warm": (a, b) => taste(b).sensory.hopAroma > taste(a).sensory.hopAroma,
  };
  for (const [id, check] of Object.entries(checks)) {
    const before = findEvent(id);
    const after = brew(recipe, before.seed, { [incidents[id].control]: true });
    assert.equal(before.events.find(e => e.id === id).magnitude, after.events.find(e => e.id === id).magnitude, id);
    assert.ok(check(before, after), id);
    assert.deepEqual(after, brew(recipe, before.seed, { [incidents[id].control]: true }));
    const draft = blank(before.seed).draft;
    Object.assign(draft, { options: { processVersion: 2, barrelDays: 180, ageDays: 30, packaging: "bottle" } });
    assert.equal(incidentFrames(draft, [id])[0].eventId, id);
  }
});
test("storage heat affects only samples after the excursion, and old recipes do not acquire new events", () => {
  const batch = findEvent("storage-warm");
  const rescued = brew(recipe, batch.seed, { storageRescue: true });
  assert.deepEqual(taste(batch, { ageDays: 0 }).sensory, taste(rescued, { ageDays: 0 }).sensory);
  const legacy = brew(makeRecipe("hazy-ipa"), batch.seed);
  assert.ok(legacy.events.every(e => ["scale-drift", "warm-night", "wild-acid", "air-pickup"].includes(e.id)));
  const restored = restore(JSON.parse(JSON.stringify({ ...blank(), draft: { ...blank().draft, step: 2, options: { volumeL: 25 } } })));
  assert.equal(batchOf(restored.draft).recipe.processVersion, 1);
  const unstarted = restore({ ...blank(), draft: { ...blank().draft, options: { volumeL: 25 } } });
  assert.equal(unstarted.draft.options.processVersion, 2);
});
test("losses constrain all servings, and later service responses preserve earlier evenings", () => {
  const batch = findEvent("boil-over");
  const original = simulateNight(batch, { seed: 13, volumeL: batch.yieldL, packageType: "keg" });
  assert.ok(original.consumedL + original.lossL + original.remainingL <= batch.yieldL + 0.001);
  const event = original.serviceEvents.find(e => e.session > 1);
  assert.ok(event, "seeded fixture includes a later-night foam event");
  if (event) {
    const fixed = simulateNight(batch, { seed: 13, volumeL: batch.yieldL, packageType: "keg", serviceChoices: { [event.session]: { chillLine: true } } });
    assert.deepEqual(fixed.servings.filter(s => s.session < event.session), original.servings.filter(s => s.session < event.session));
    assert.equal(fixed.serviceEvents.find(e => e.session === event.session).lostMl, 30);
  }
});
test("checking remaining seals cannot rewrite the first sampled container", () => {
  const batch = brew(recipe, 21);
  const checked = brew(recipe, 21, { sealCheck: true });
  assert.deepEqual(packageCondition(batch, "bottle", 0), packageCondition(checked, "bottle", 0));
  const faults = (b) => Array.from({ length: 500 }, (_, id) => packageCondition(b, "bottle", id)).filter(c => c.co2Loss > 0).length;
  assert.ok(faults(checked) < faults(batch));
});
test("Monte Carlo includes new event rates as finite seeded values", () => {
  const result = sampleBrews(recipe, { runs: 40, seed: 2 });
  assert.ok("boil-over" in result.eventRates);
  assert.ok(Object.values(result.eventRates).every(rate => Number.isFinite(rate) && rate >= 0 && rate <= 1));
});
test("all six current recipes complete under the incident model with finite metrics and conserved service volume", () => {
  for (const { id } of PRESETS) {
    for (const seed of [3, 9, 21]) {
      const r = makeRecipe(id, { processVersion: 2, barrelDays: 180 });
      const choices = Object.fromEntries(Object.values(incidents).map(definition => [definition.control, true]));
      const b = brew(r, seed, choices);
      assert.ok(Object.values(b.metrics).every(Number.isFinite), id);
      assert.ok(Object.values(taste(b).sensory).every(Number.isFinite), id);
      const n = simulateNight(b, { volumeL: b.yieldL, seed: 7 });
      assert.ok(n.consumedL + n.lossL + n.remainingL <= b.yieldL + 0.001, id);
    }
  }
});
