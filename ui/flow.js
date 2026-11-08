import { makeRecipe, brew } from "../core/brew.js";
import { simulateNight } from "../core/taproom.js";

export const styles = {
  "hazy-ipa": "浑浊 IPA", "west-coast-ipa": "西岸 IPA",
  "house-pale-ale": "美式淡色艾尔", "czech-lager": "捷克淡色拉格",
  "imperial-stout": "帝国世涛", "sour-ipa": "酸 IPA",
};
export const stages = ["写酒单", "糖化煮沸", "看发酵桶", "加点味道", "分装", "尝第一杯"];
export const packs = { keg: "生啤桶", bottle: "玻璃瓶", can: "易拉罐" };
export const beerName = (d) => d.name || styles[d.preset];
export const newSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
export function newDraft(seed = newSeed()) {
  return {
    preset: "hazy-ipa", options: { volumeL: 25, processVersion: 2 }, name: "", benchmark: "",
    choices: { precision: true, sanitation: true, temperatureControl: false, closedTransfer: true },
    step: 0, seed, inspected: false, tasted: false,
  };
}
export function blank(seed) {
  return {
    version: 2, draft: newDraft(seed), view: "kitchen", taps: Array(6).fill(null),
    archive: [], selected: 0, nextNumber: 1, story: null, overlay: null,
    history: [], settings: { motion: true, typewriter: true },
  };
}
export function restore(raw) {
  const s = structuredClone(raw);
  if (!s?.draft || !Array.isArray(s.taps) || s.taps.length !== 6) throw Error("手记格式不完整");
  if (!Number.isInteger(s.draft.step) || s.draft.step < 0 || s.draft.step > 5) throw Error("手记页码不正确");
  if (s.draft.step === 0 && s.draft.options.processVersion === undefined) s.draft.options.processVersion = 2;
  batchOf(s.draft);
  s.archive ??= [];
  s.history ??= [];
  s.settings ??= { motion: true, typewriter: true };
  s.overlay ??= null;
  s.story ??= null;
  s.selected = Math.max(0, Math.min(5, s.selected || 0));
  s.nextNumber ??= 1;
  s.draft.inspected ??= s.draft.step > 2;
  s.draft.tasted ??= s.draft.step === 5;
  s.version = 2;
  return s;
}
export function batchOf(draft) {
  const recipe = makeRecipe(draft.preset, draft.options);
  return { recipe, batch: brew(recipe, draft.seed, draft.choices) };
}
export function delivery(tap) {
  const { recipe, batch } = batchOf(tap.d);
  const options = {
    seed: tap.d.seed, beerName: beerName(tap.d), tap: tap.slot + 1,
    volumeL: batch.yieldL ?? recipe.batchVolumeL, ageDays: recipe.ageDays, packageType: recipe.packaging,
    serviceChoices: tap.serviceChoices,
  };
  return { recipe, batch, options, night: simulateNight(batch, options) };
}
export function nightStatus(tap) {
  const result = delivery(tap);
  const servings = result.night.servings.filter((s) => s.session <= tap.night);
  const posts = result.night.posts.filter((p) => p.session <= tap.night);
  // The engine reports transfer/pour loss for the complete service. Keep the UI
  // on supplied volume and cumulative served volume until that service ends.
  const servedL = servings.reduce((total, s) => total + s.ml / 1000, 0);
  return {
    ...result, servings, posts, servedL,
    finished: tap.night >= result.night.sessionCount,
  };
}
export function shelve(state, slot) {
  if (state.taps[slot] || slot < 0 || slot > 5) throw Error("这一席已经有酒了，请另选空席");
  if (!state.draft.tasted) throw Error("先尝过第一杯，再送去酒房");
  const tap = {
    slot, number: state.nextNumber++, d: structuredClone(state.draft), night: 1,
  };
  state.taps[slot] = tap;
  state.selected = slot;
  state.draft = newDraft();
  state.view = "room";
  state.overlay = null;
  return tap;
}
export function nextNight(state) {
  const tap = state.taps[state.selected];
  if (!tap) throw Error("先选一席有酒的位置");
  if (nightStatus(tap).finished) throw Error("这桶酒已经供应完了");
  tap.night++;
}
export function archiveTap(state, dumped = false) {
  const tap = state.taps[state.selected];
  if (!tap) throw Error("这一席已收起");
  if (!dumped && !nightStatus(tap).finished) throw Error("这桶酒还在供应");
  state.archive.push({ ...structuredClone(tap), dumped });
  state.taps[state.selected] = null;
  state.overlay = null;
}
