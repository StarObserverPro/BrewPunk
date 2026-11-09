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
  assert.deepEqual(sizes, [8]);
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
  assert.ok(sizes.slice(1).every(n => n <= 1));
  assert.ok(loaded.taps[0].messagePool.flat().every(e => !played.has(e.id)));
});
