import test from "node:test";
import assert from "node:assert/strict";
import { blank, restore, shelve, nextNight } from "../ui/flow.js";
import { needsStock, stockRoom, retireShown } from "../ui/message-pool.js";
import { sessionOf, linesFor } from "../ui/service.js";

test("draws survive reload and only unplayed lines carry to the next evening", async () => {
  const s = blank(12);
  s.draft.tasted = true;
  shelve(s, 0);
  sessionOf(s);
  const sizes = [];
  const write = async (_, posts) => {
    sizes.push(posts.length);
    return posts.map(p => ({id:p.id, text:"来一口？", replyText:p.reply ? "给我留点" : null}));
  };
  await stockRoom(s, write);
  assert.deepEqual(sizes, [9]);
  assert.equal(s.service.draw.lines.filter(e => e.kind === "post").length, 5);
  assert.ok(s.service.draw.lines.filter(e => e.kind === "post").every(e => e.text === "来一口？"));
  const loaded = restore(JSON.parse(JSON.stringify(s)));
  assert.equal(needsStock(loaded), false);
  assert.deepEqual(linesFor(loaded), linesFor(s));
  const lines = linesFor(loaded);
  loaded.service.cursor = lines.findIndex(e => e.kind === "post" && e.slot === 0) + 1;
  const played = new Set(lines.slice(0, loaded.service.cursor).map(e => e.id));
  const before = loaded.taps[0].messagePool.flat().map(e => e.id);
  retireShown(loaded, lines);
  const kept = loaded.taps[0].messagePool.flat().map(e => e.id);
  assert.deepEqual(kept, before.filter(id => !played.has(id)));
  nextNight(loaded);
  loaded.service = {day:2,cursor:1,replies:{}};
  await stockRoom(loaded, write);
  assert.ok(sizes.slice(1).every(n => n <= 2));
  assert.ok(loaded.taps[0].messagePool.flat().every(e => !played.has(e.id)));
});
test("three taps and the regular share one generation request with distinct tickets", async () => {
  const state = blank(12);
  for (let slot = 0; slot < 3; slot++) {
    state.draft.seed = 12;
    state.draft.tasted = true;
    shelve(state, slot);
  }
  sessionOf(state);
  const requests = [];
  await stockRoom(state, async (_, posts) => {
    requests.push(posts);
    return posts.map(p => ({ id:p.id, text:p.id, replyText:p.reply ? "给你留着。" : null }));
  });
  assert.equal(requests.length, 1);
  const ids = requests[0].map(post => post.id);
  assert.equal(ids.length, 25);
  const prompts = requests[0].map(p => p.prompt);
  assert.equal(new Set(prompts.map(p => p.天气)).size, 1);
  assert.ok(prompts.every(p => p.酒牌 && p.天气 && p.邻桌 && p.心情 && p.此刻));
  assert.ok(prompts.filter(p => p.杯中印象.length === 4).length >= 24);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(state.service.draw.regular.text, "regular-1");
  for (const tap of state.taps) if (tap) {
    assert.ok(tap.messagePool.every(([line]) => line.text === line.id));
  }
});
