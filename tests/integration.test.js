import { test } from "node:test";
import assert from "node:assert/strict";
import { buildExample } from "../vendor/brewlab/recipes.js";
import { simulate } from "../vendor/brewlab/simulate.js";
import { PRESETS, makeRecipe, brew } from "../core/brew.js";
import { taste } from "../core/tasting.js";
import { simulateNight, guestPrompt } from "../core/taproom.js";

test("the pinned upstream Hazy IPA still matches the reference brew", () => {
  const { og, fg, abv, ibu, srm } = simulate(buildExample("hazy-ipa")).metrics;
  assert.deepEqual(
    { og, fg, abv, ibu, srm },
    { og: 1.064, fg: 1.016, abv: 6.3, ibu: 24.2, srm: 5.2 },
  );
});

test("every starting recipe completes a batch, a tasting and finite service", () => {
  assert.ok(PRESETS.length >= 6);
  for (const { id } of PRESETS) {
    const batch = brew(makeRecipe(id, { volumeL: 25 }), "opening-week");
    const card = taste(batch, { ageDays: 30 });
    assert.ok(card.note.length > 8, id);
    for (const axis of card.axes)
      assert.ok(axis.value >= 0 && axis.value <= 10, id + "/" + axis.id);
    assert.equal(
      card.bjcp.parts.reduce((sum, p) => sum + p.max, 0),
      50,
    );
    const service = simulateNight(batch, {
      seed: "regulars",
      volumeL: 25,
      ageDays: 30,
    });
    assert.ok(service.posts.length && service.servings.length, id);
    assert.ok(
      Math.abs(service.consumedL + service.remainingL + service.lossL - 25) <
        1e-9,
    );
    for (const post of service.posts)
      assert.ok(guestPrompt(post).instructions.length > 0);
  }
});
