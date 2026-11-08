import test from "node:test";
import assert from "node:assert/strict";
import { blank, restore, batchOf, shelve, nextNight, archiveTap, nightStatus } from "../ui/flow.js";

test("restoring a warm-night decision preserves its first-night evidence and later correction", () => {
  const state = blank(3);
  Object.assign(state.draft, { preset: "house-pale-ale", step: 2 });
  state.draft.options.fermentC = 19;
  const before = batchOf(state.draft).batch.events.find((e) => e.id === "warm-night");
  state.draft.choices.rescueWarm = true;
  state.draft.inspected = true;
  state.story = { title: "桶边", frames: [{ text: "已经换过冰袋" }], index: 0, ending: {} };
  const restored = restore(JSON.parse(JSON.stringify(state)));
  const after = batchOf(restored.draft).batch.events.find((e) => e.id === "warm-night");
  assert.equal(after.magnitude, before.magnitude);
  assert.ok(after.secondDayDeltaC < before.secondDayDeltaC);
  assert.equal(restored.story.frames[restored.story.index].text, "已经换过冰袋");
});

test("delivery survives reload and repeating an old delivery cannot take a second seat", () => {
  const state = blank(3);
  state.draft.tasted = true;
  state.draft.step = 5;
  state.draft.name = "楼下这一桶";
  shelve(state, 1);
  const restored = restore(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.taps.filter(Boolean).length, 1);
  assert.equal(restored.taps[1].d.name, "楼下这一桶");
  assert.equal(restored.draft.step, 0);
  assert.throws(() => shelve(restored, 2));
  assert.equal(restored.nextNumber, 2);
});

test("occupied seats retain their original batch and a full room preserves the new draft", () => {
  const state = blank(3);
  for (let slot = 0; slot < 3; slot++) {
    state.draft.tasted = true;
    shelve(state, slot);
  }
  state.draft.tasted = true;
  state.draft.name = "等空位";
  const before = structuredClone(state);
  for (let slot = 0; slot < 6; slot++) assert.throws(() => shelve(state, slot));
  assert.deepEqual(state, before);
});

test("repeated nightly reads do not pour more beer and archive retains only reached nights", () => {
  const state = blank(3);
  state.draft.tasted = true;
  state.draft.step = 5;
  state.draft.options.packaging = "bottle";
  shelve(state, 0);
  const first = nightStatus(state.taps[0]);
  assert.ok(first.posts.every((post) => post.session <= 1));
  assert.deepEqual(nightStatus(state.taps[0]), first);
  while (!nightStatus(state.taps[0]).finished) nextNight(state);
  assert.throws(() => nextNight(state));
  const last = nightStatus(state.taps[0]);
  assert.ok(last.servedL <= last.recipe.batchVolumeL);
  archiveTap(state);
  assert.equal(state.taps[0], null);
  assert.equal(state.archive.length, 1);
  assert.equal(state.archive[0].night, last.night.sessionCount);
  assert.throws(() => archiveTap(state));
});
