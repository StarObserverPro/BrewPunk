import test from "node:test";
import assert from "node:assert/strict";
import { makeRecipe, brew } from "../core/brew.js";
import { offlineProfile } from "../core/adjuncts.js";
import { simulateNight } from "../core/taproom.js";
import { createLuna } from "../server/luna.mjs";
import { adjudicateDraft, voicePosts } from "../ui/ai-client.js";

test("the browser and the two separate server contracts complete one custom batch", async (t) => {
  const profile = offlineProfile("大蒜", "拍碎");
  const calls = [];
  const server = createLuna({
    apiKey: "test-only",
    fetchImpl: async (_url, options) => {
      const req = JSON.parse(options.body);
      calls.push(req);
      const data = JSON.parse(req.input);
      const out =
        req.text.format.name === "brew_adjudication"
          ? {
              profile,
              noteTemplate:
                "杯中呈{{colour}}。闻着有{{nose}}。{{palate}}。{{finish}}。",
              judgeTemplate: "按{{style}}来品，{{match}}",
            }
          : {
              posts: data.guests.map((g) => ({
                id: g.id,
                text: g.view.杯中印象[0] + "。",
                replyText: g.replyName ? "我来尝一口。" : null,
              })),
            };
      return {
        ok: true,
        json: async () => ({
          status: "completed",
          output: [
            {
              type: "message",
              content: [{ type: "output_text", text: JSON.stringify(out) }],
            },
          ],
        }),
      };
    },
  });
  const location = Object.getOwnPropertyDescriptor(globalThis, "location");
  Object.defineProperty(globalThis, "location", {
    value: { protocol: "http:" },
    configurable: true,
  });
  t.after(() =>
    location
      ? Object.defineProperty(globalThis, "location", location)
      : delete globalThis.location,
  );
  t.mock.method(globalThis, "fetch", async (url, opts) => {
    const result = await server(url.split("/").at(-1), JSON.parse(opts.body));
    return { ok: true, json: async () => result };
  });
  const draft = {
    preset: "house-pale-ale",
    seed: 9,
    choices: {},
    options: {
      volumeL: 10,
      processVersion: 2,
      baselineVersion: 1,
      adjunct: "custom",
      customAdjunct: {
        name: "试验蒜种",
        preparation: "拍碎",
        grams: 1000,
        stage: "pitch",
      },
    },
  };
  const original = brew(makeRecipe(draft.preset, draft.options), draft.seed);
  const verdict = await adjudicateDraft(draft, original);
  assert.deepEqual(verdict.profile, profile);
  assert.match(verdict.judgeComment, /按/);
  assert.ok(!verdict.note.includes("{{"));
  assert.equal(calls.length, 1);
  draft.options.customAdjunct.profile = verdict.profile;
  const final = brew(makeRecipe(draft.preset, draft.options), draft.seed);
  assert.ok(final.metrics.abv < original.metrics.abv);
  const payload = JSON.parse(calls[0].input);
  assert.ok(payload.context.beforeAdjunct.abv > final.metrics.abv);
  assert.ok(payload.context.baselineReference.some((r) => r.source));
  const posts = simulateNight(final, { seed: 45 }).posts.filter(
    (p) => p.session === 1,
  );
  assert.ok(posts.length);
  const voiced = await voicePosts(final, posts);
  assert.deepEqual(
    voiced.map((p) => p.id),
    posts.map((p) => p.id),
  );
  assert.equal(calls.length, 2);
  assert.doesNotMatch(
    calls[1].input,
    /preliminaryMetrics|beforeAdjunct|rateMultiplier|试验蒜种/,
  );
  Object.defineProperty(globalThis, "location", {
    value: { protocol: "file:" },
    configurable: true,
  });
  assert.equal(await adjudicateDraft(draft, final), null);
  assert.equal(await voicePosts(final, posts), null);
  assert.equal(calls.length, 2);
});

test("untrusted narrative cannot print a made-up ABV or a rating on the sensory card", async () => {
  const { realiseVerdict } = await import("../ui/ai-client.js");
  const cup = {
    colour: "琥珀色",
    descriptors: ["麦香"],
    phrases: { palate: "稍甜", finish: "微苦" },
    note: "本地笔记",
    bjcp: { name: "APA", comment: "苦度偏低" },
  };
  const value = realiseVerdict(
    {
      noteTemplate: "{{colour}}{{nose}}{{palate}}{{finish}} 99% ABV",
      judgeTemplate: "{{style}}{{match}}{{constructor}}",
    },
    cup,
  );
  assert.equal(value.note, "本地笔记");
  assert.equal(value.judgeComment, "苦度偏低");
});

test("BJCP deltas compare the original cup at identical age and target style", async () => {
  const { compareAdjunct, withoutAdjunct } =
    await import("../core/adjunct-comparison.js");
  const { taste } = await import("../core/tasting.js");
  const draft = {
    preset: "house-pale-ale",
    seed: 24,
    choices: {},
    benchmark: "apa",
    options: {
      volumeL: 10,
      baselineVersion: 1,
      adjunct: "custom",
      customAdjunct: {
        name: "大蒜",
        preparation: "生蒜拍碎",
        grams: 1000,
        stage: "pitch",
      },
    },
  };
  const batch = brew(makeRecipe(draft.preset, draft.options), draft.seed);
  const options = {
    ageDays: 90,
    packageType: "bottle",
    storageC: 12,
    styleId: "apa",
  };
  const cup = taste(batch, options);
  const control = taste(withoutAdjunct(draft), options);
  const result = compareAdjunct(draft, batch, cup, options);
  assert.ok(result.abvDelta < -3);
  assert.deepEqual(
    result.parts.map((p) => p.before),
    control.bjcp.parts.map((p) => p.score),
  );
  assert.equal(
    result.parts.reduce((sum, p) => sum + p.delta, 0),
    result.totalDelta,
  );
  assert.equal(result.totalDelta, cup.bjcp.total - control.bjcp.total);
});

test("a saved guest voice survives journal reload without changing seats, ratings or unserved nights", async () => {
  const { blank, shelve, delivery, restore } = await import("../ui/flow.js");
  const state = blank(29);
  state.draft.tasted = true;
  const slot = shelve(state, 0);
  const baseline = delivery(slot).night;
  const [first] = baseline.posts.filter((p) => p.session === 1);
  assert.ok(first);
  slot.voices = {
    1: [
      {
        id: first.id,
        text: "闻到一点果香。",
        replyText: first.reply ? "给我尝一口。" : null,
      },
    ],
  };
  const reloaded = restore(JSON.parse(JSON.stringify(state)));
  const saved = delivery(reloaded.taps[0]).night;
  assert.deepEqual(saved.servings, baseline.servings);
  assert.deepEqual(
    saved.posts.map((p) => [p.id, p.rating]),
    baseline.posts.map((p) => [p.id, p.rating]),
  );
  assert.equal(
    saved.posts.find((p) => p.id === first.id).text,
    "闻到一点果香。",
  );
  assert.deepEqual(
    saved.posts.filter((p) => p.session > 1),
    baseline.posts.filter((p) => p.session > 1),
  );
});

test("200 g hawthorn without preparation waits for both additions and replaces a failed saved verdict", async t => {
  const { applyAdjudication } = await import("../ui/ai-client.js");
  const { taste } = await import("../core/tasting.js");
  const oldLocation = Object.getOwnPropertyDescriptor(globalThis,"location");
  Object.defineProperty(globalThis,"location",{value:{protocol:"https:"},configurable:true});
  t.after(()=>oldLocation ? Object.defineProperty(globalThis,"location",oldLocation) : delete globalThis.location);
  const draft={preset:"house-pale-ale",seed:24,choices:{},adjudication:{status:"local"},options:{
    volumeL:20,adjunct:"custom",previousAdditions:[{name:"山楂",grams:100,stage:"conditioning"}],
    customAdjunct:{name:"山楂",grams:100,stage:"conditioning"},
  }};
  const profile={...offlineProfile("大蒜"),direct:"山楂果酸",evolved:"柔和果酸",axis:"acidity",behaviour:"neutral",potency:2};
  profile.constituents=profile.constituents.map(c=>({...c,direct:"山楂果酸",evolved:"柔和果酸",directAxis:"acidity",evolvedAxis:"acidity"}));
  const requests=[];let release;
  const gate=new Promise(resolve=>release=resolve);
  t.mock.method(globalThis,"fetch",async(_url,opts)=>{
    requests.push(JSON.parse(opts.body));
    await gate;
    return {ok:true,json:async()=>({profile,noteTemplate:"{{colour}}{{nose}}{{palate}}{{finish}}",judgeTemplate:"{{style}}{{match}}"})};
  });
  const initial=brew(makeRecipe(draft.preset,draft.options),draft.seed);
  let completed=false;
  const task=adjudicateDraft(draft,initial).then(result=>{completed=true;return result;});
  assert.equal(completed,false);assert.equal(requests.length,2);
  assert.ok(requests.every(r=>r.material.preparation===""));
  release();const result=await task;assert.ok(result);
  applyAdjudication(draft,result);
  assert.equal(draft.adjudication.status,"luna");
  assert.deepEqual(draft.options.previousAdditions[0].profile,profile);
  assert.deepEqual(draft.options.customAdjunct.profile,profile);
  const final=brew(makeRecipe(draft.preset,draft.options),draft.seed);
  assert.ok(taste(final).sensory.acidity>taste(initial).sensory.acidity);
});
