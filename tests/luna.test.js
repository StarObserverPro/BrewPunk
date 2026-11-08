import test from "node:test";
import assert from "node:assert/strict";
import { createLuna } from "../server/luna.mjs";
import { offlineProfile } from "../core/adjuncts.js";

const candidate = offlineProfile("大蒜", "拍碎");
const glass = {
  material: { name: "大蒜", preparation: "拍碎", grams: 1000, stage: "pitch" },
  context: { style: "APA", litres: 10 },
};
const guest = {
  id: "night1",
  view: { 人物: "小路", 杯中印象: ["尾段苦"], 酿造真相: "绝密资料" },
  replyName: null,
};
const noteTemplate =
  "倒出来是{{colour}}，先闻到{{nose}}。{{palate}}。{{finish}}。";
const judgeTemplate = "{{style}}：{{match}}";
function fake(handle) {
  const requests = [];
  const dispatch = createLuna({
    apiKey: "test-only",
    fetchImpl: async (url, options) => {
      assert.equal(url, "https://api.openai.com/v1/responses");
      const body = JSON.parse(options.body);
      requests.push(body);
      const out = handle(body);
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
  return { requests, dispatch };
}
test("one glass request learns a reusable preparation; concurrent identical opens cost one request", async () => {
  const { dispatch, requests } = fake((b) => ({
    profile: JSON.parse(b.input).knownProfile ? null : candidate,
    noteTemplate,
    judgeTemplate,
  }));
  const [x, y] = await Promise.all([
    dispatch("adjudicate", glass),
    dispatch("adjudicate", glass),
  ]);
  assert.deepEqual(x, y);
  assert.deepEqual(x.profile, candidate);
  assert.equal(requests.length, 1);
  const next = structuredClone(glass);
  next.material.grams = 45;
  next.context.litres = 50;
  assert.deepEqual((await dispatch("adjudicate", next)).profile, candidate);
  assert.deepEqual(JSON.parse(requests[1].input).knownProfile, candidate);
  assert.equal(requests[0].model, "gpt-6-luna");
  assert.equal(requests[0].text.format.strict, true);
  assert.equal(requests[0].tools, undefined);
  assert.equal(requests[0].store, false);
});
test("guest request strips hidden information and cannot reassign a post or invent replies", async () => {
  const item = { id: "night1", text: "舌根还有点苦。", replyText: null };
  const { dispatch, requests } = fake(() => ({ posts: [item] }));
  assert.deepEqual(
    (
      await dispatch("guests", {
        guests: [guest],
        recipe: { hidden: "secret" },
      })
    ).posts,
    [item],
  );
  assert.doesNotMatch(requests[0].input, /绝密资料|secret|酿造真相/);
  assert.equal(requests[0].text.format.name, "taproom_guests");
  const bad = fake(() => ({ posts: [{ ...item, replyText: "不应出现" }] }));
  await assert.rejects(bad.dispatch("guests", { guests: [guest] }));
  await assert.rejects(bad.dispatch("guests", { guests: [guest, guest] }), {
    status: 400,
  });
});
test("an unknown material may carry a neutral profile; malformed profiles and unavailable keys fail closed", async () => {
  const bad = fake(() => ({
    profile: { mystery: 42 },
    noteTemplate,
    judgeTemplate,
  }));
  await assert.rejects(bad.dispatch("adjudicate", glass));
  const offline = createLuna({
    apiKey: "",
    fetchImpl: () => assert.fail("No network expected"),
  });
  await assert.rejects(offline("adjudicate", glass), { status: 503 });
});

test("a mixed evening's schema ties replies to the patrons who have one", async () => {
  const guests = [guest, { ...guest, id: "night2", replyName: "阿梨" }];
  const {dispatch, requests} = fake(() => ({ posts: [
    { id: "night1", text: "苦。", replyText: null },
    { id: "night2", text: "给你留了一口。", replyText: "来了。" },
  ] }));
  await dispatch("guests", {guests});
  const posts = requests[0].text.format.schema.properties.posts;
  assert.equal(posts.minItems, 2);
  assert.equal(posts.maxItems, 2);
  assert.deepEqual(posts.items.anyOf.map(({ properties }) =>
    [properties.id.enum, properties.replyText.type]), [
    [["night1"], "null"], [["night2"], "string"],
  ]);
});

test("legacy material input with no preparation reaches the provider",async()=>{
  const {dispatch,requests}=fake(()=>({profile:candidate,noteTemplate,judgeTemplate}));
  const input=structuredClone(glass);delete input.material.preparation;
  const result=await dispatch("adjudicate",input);
  assert.deepEqual(result.profile,candidate);
  assert.equal(JSON.parse(requests[0].input).material.preparation,"");
});
