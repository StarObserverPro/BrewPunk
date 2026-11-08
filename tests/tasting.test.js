import test from "node:test";
import assert from "node:assert/strict";
import { taste } from "../core/tasting.js";
import { simulateNight, sampleTastings, guestPrompt } from "../core/taproom.js";

function fixture() {
  return {
    seed: 51,
    recipe: {
      name: "三号头",
      styleId: "house-pale-ale",
      batchVolumeL: 25,
      packaging: "keg",
      ageDays: 14,
      storageC: 6,
    },
    metrics: { abv: 5.4, ibu: 36, srm: 26, co2Volumes: 2.4 },
    exposure: 0.22,
    packageDefects: { probability: 0.06 },
    sensory: {
      sweetness: 2.6,
      bitterness: 5,
      body: 4,
      roast: 1.6,
      hopAroma: 6,
      fruitEsters: 2.8,
      crispness: 6,
      acidity: 0.5,
      malt: 2.3,
      caramel: 1,
    },
    descriptors: ["citrus", "floral"],
    events: [],
  };
}

test("declared style changes the rubric but never the beer in the glass", () => {
  const a = taste(fixture()),
    b = taste(fixture(), { styleId: "imperial-stout" });
  assert.deepEqual(a.axes, b.axes);
  assert.equal(a.note, b.note);
  assert.notEqual(a.bjcp.total, b.bjcp.total);
  assert.match(a.bjcp.comment, /颜色偏深/);
  assert.equal(
    a.bjcp.parts.reduce((s, p) => s + p.score, 0),
    a.bjcp.total,
  );
  assert.deepEqual(
    a.bjcp.parts.map((p) => p.max),
    [12, 3, 20, 5, 10],
  );
  assert.ok(a.axes.find((a) => a.id === "colour").value > 6);
  assert.ok(a.axes.find((a) => a.id === "roast").value < 2);
});
test("cold storage, oxygen ingress and package age alter sensory state independently", () => {
  const a = taste(fixture(), { ageDays: 150, storageC: 3, oxygen: 0.1 });
  const b = taste(fixture(), { ageDays: 150, storageC: 23, oxygen: 0.1 });
  const c = taste(fixture(), { ageDays: 150, storageC: 23, oxygen: 0.9 });
  assert.ok(
    a.sensory.hopAroma > b.sensory.hopAroma &&
      b.sensory.hopAroma > c.sensory.hopAroma,
  );
  assert.ok(
    a.sensory.stale < b.sensory.stale && b.sensory.stale < c.sensory.stale,
  );
  const fresh = taste(fixture(), { packageType: "bottle", ageDays: 1 });
  const mature = taste(fixture(), { packageType: "bottle", ageDays: 21 });
  assert.ok(fresh.sensory.carbonation < mature.sensory.carbonation);
});
test("unintended strong acidity is observable, and the intended sour style is judged separately", () => {
  const b = fixture();
  b.events = [{ id: "wild-acid", magnitude: 4 }];
  b.sensory.acidity = 6;
  const a = taste(b);
  assert.ok(a.flags.some((s) => s.includes("酸")));
  b.recipe.kettleSoured = true;
  b.recipe.styleId = "sour-ipa";
  b.events = [];
  assert.ok(!taste(b).flags.some((s) => s.includes("酸")));
});
test("one finite service, shared glasses, zero patrons when no beer, deterministic replays", () => {
  const b = fixture(),
    a = simulateNight(b, { seed: 8 });
  assert.deepEqual(a, simulateNight(b, { seed: 8 }));
  assert.equal(a.pours, a.servings.length);
  assert.equal(a.reviewCount, a.posts.length);
  assert.ok(
    a.reviewCount < a.visitors && a.reviewCount > 10 && a.reviewCount < 49,
  );
  assert.ok(new Set(a.servings.map((v) => v.glassId)).size < a.servings.length);
  assert.ok(a.servings.every((v) => v.packageId === 0));
  assert.equal(a.consumedL, a.servings.reduce((s, x) => s + x.ml, 0) / 1000);
  assert.ok(Math.abs(a.consumedL + a.lossL + a.remainingL - 25) < 0.0001);
  assert.equal(simulateNight(b, { volumeL: 0 }).visitors, 0);
  assert.ok(a.posts.every((p) => p.text.length && p.prompt.杯中印象.length));
  assert.deepEqual(
    new Set(Object.keys(guestPrompt(a.posts[0]))),
    new Set(["instructions", "input"]),
  );
  assert.ok(!JSON.stringify(guestPrompt(a.posts[0])).includes("exposure"));
});
test("wording seed cannot change visitors, ratings, purchases or which patrons post", () => {
  const a = simulateNight(fixture(), { seed: 9 }),
    b = simulateNight(fixture(), { seed: 9, proseSeed: 33 });
  assert.deepEqual(a.servings, b.servings);
  assert.deepEqual(
    a.posts.map((p) => [p.id, p.rating]),
    b.posts.map((p) => [p.id, p.rating]),
  );
  assert.notDeepEqual(
    a.posts.map((p) => p.text),
    b.posts.map((p) => p.text),
  );
});
test("package defects stay with their container; repeat service has a stable audience distribution", () => {
  const batch = fixture();
  const night = simulateNight(batch, { packageType: "bottle", seed: 10 });
  const packages = new Map();
  for (const p of night.servings)
    packages.set(p.packageId, (packages.get(p.packageId) ?? 0) + p.ml);
  assert.ok([...packages.values()].every((ml) => ml <= 500));
  assert.ok(packages.size > 1);
  const sam = sampleTastings(batch, { runs: 28, seed: 18 });
  assert.deepEqual(sam, sampleTastings(batch, { runs: 28, seed: 18 }));
  assert.ok(sam.reviews.p10 < sam.reviews.p90);
  assert.ok(sam.reviews.p50 >= 20 && sam.reviews.p50 <= 45);
});

test("late adjunct is identifiable under the base aroma and barrel character", () => {
  const sample = fixture();
  sample.recipe.adjunct = "chili";
  sample.descriptors = ["vanilla", "oak", "chili", "citrus"];
  const glass = taste(sample);
  assert.match(glass.note, /热辣/);
  assert.ok(glass.afterNotes.some((n) => n.includes("木头")));
});
