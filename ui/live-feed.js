// A presentation of one already-computed evening. Reading messages never pours
// another glass or advances the simulation.
export function nightFeed(night, evening) {
  const entries = [];
  for (const [index, serving] of night.servings.entries()) {
    if (serving.session !== evening || !serving.refill) continue;
    entries.push({
      id: "refill-" + index, time: serving.time, name: serving.guest,
      text: "又添了一杯。", kind: "action",
    });
  }
  for (const post of night.posts) {
    if (post.session !== evening) continue;
    entries.push({ id: post.id, time: post.time, name: post.name, text: post.text, kind: "post" });
    if (post.reply) entries.push({
      id: post.id + "-reply", time: post.time, name: post.reply.name,
      text: "回复 " + post.name + " · " + post.reply.text, kind: "reply",
    });
  }
  entries.sort((a, b) => a.time.localeCompare(b.time));
  if (!entries.length) {
    const servings = night.servings.filter((s) => s.session === evening);
    entries.push({
      id: "quiet-" + evening, name: "吧台", time: "",
      text: servings.length ? "杯子陆续空了下来。今晚还没有人写留言。" : "这一晚，吧台安静地亮着灯。",
      kind: "quiet",
    });
  }
  return entries;
}
export function feedProgress(tap, count) {
  const saved = tap.feed?.night === tap.night ? tap.feed : {};
  return {
    night: tap.night,
    shown: Math.max(1, Math.min(count, Number.isInteger(saved.shown) ? saved.shown : 1)),
    paused: saved.paused === true,
  };
}
export function readingDelay(text) {
  return Math.min(12000, Math.max(4200, text.length * 145));
}
