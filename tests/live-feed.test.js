import test from "node:test";
import assert from "node:assert/strict";
import { blank, shelve, delivery } from "../ui/flow.js";
import { nightFeed, feedProgress } from "../ui/live-feed.js";

test("the live feed shows only the reached evening and reading cannot mutate the service", () => {
  const state = blank(12);
  state.draft.tasted = true;
  shelve(state, 0);
  const { night } = delivery(state.taps[0]);
  const before = structuredClone(night);
  const entries = nightFeed(night, 1);
  assert.ok(entries.length > 0);
  const firstNightPosts = night.posts.filter((post) => post.session === 1);
  assert.deepEqual(entries.filter((entry) => entry.kind === "post").map((entry) => entry.id).sort(),
    firstNightPosts.map((post) => post.id).sort());
  assert.deepEqual(nightFeed(night, 1), entries);
  assert.deepEqual(night, before);
  for (const post of firstNightPosts.filter((p) => p.reply)) {
    assert.ok(entries.findIndex((e) => e.id === post.id) < entries.findIndex((e) => e.id === post.id + "-reply"));
  }
});

test("a resumed feed retains its cursor and pause while a new evening starts independently", () => {
  const tap = { night: 1, feed: { night: 1, shown: 6, paused: true } };
  assert.deepEqual(feedProgress(JSON.parse(JSON.stringify(tap)), 10), { night: 1, shown: 6, paused: true });
  tap.night = 2;
  assert.deepEqual(feedProgress(tap, 10), { night: 2, shown: 1, paused: false });
});

test("a quiet evening still has a feedback line", () => {
  const entries = nightFeed({ posts: [], servings: [{ session: 1 }] }, 1);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].kind, "quiet");
});
