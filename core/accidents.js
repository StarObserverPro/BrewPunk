import { rng } from "./random.js";

// Game priors. Probability per batch, independent conditional on the chosen controls.
export function processEvents(recipe, seed, controls) {
  const events = [];
  function roll(id, stage, probability, low, high, text, unit) {
    const draw = rng(seed, `process/${id}`);
    if (draw() >= probability) return;
    const magnitude = +(low + (high - low) * draw()).toFixed(3);
    events.push({
      id,
      stage,
      scope: "batch",
      probability,
      magnitude,
      unit,
      text: text(magnitude),
    });
  }
  roll(
    "scale-drift",
    "mash",
    controls.precision === false ? 0.55 : 0.06,
    0.02,
    0.11,
    (x) => `秤的零点漂了，实投麦芽少了 ${(100 * x).toFixed(1)}%。`,
    "fraction",
  );
  roll(
    "warm-night",
    "fermentation",
    controls.temperatureControl === false ? 0.54 : 0.04,
    1.1,
    4.6,
    (x) => `第一晚桶温升了，测得酒液比设定高 ${x.toFixed(1)} °C。`,
    "°C",
  );
  roll(
    "wild-acid",
    "fermentation",
    controls.sanitation === false ? 0.39 : 0.009,
    1.7,
    4.9,
    () => "取样阀残液带入杂菌，发酵末段冒出一股意料外的酸味。",
    "sensory/10",
  );
  const base = { keg: 0.04, can: 0.07, bottle: 0.09 }[recipe.packaging];
  roll(
    "air-pickup",
    "packaging",
    base + (controls.closedTransfer === false ? 0.4 : 0),
    0.14,
    0.52,
    () => "转移中管路吸进一段空气，封装后香气会衰退得更快。",
    "exposure",
  );
  if (recipe.processVersion >= 2) {
    roll("mash-cool", "mash", 0.14, 2, 5, (x) => `糖化途中温度比设定低了 ${x.toFixed(1)} °C。`, "°C");
    roll("filter-slow", "mash", 0.12, 0.025, 0.065, () => "过滤的液线变细，滤床排液变慢。", "fraction");
    roll("boil-over", "mash", 0.13, 0.02, 0.055, () => "泡沫顶到锅沿，一点麦汁溢上了台面。", "fraction");
    roll("pitch-warm", "mash", 0.12, 2, 5, (x) => `冷却还差一点，温度比投酵目标高 ${x.toFixed(1)} °C。`, "°C");
    roll("airlock-foam", "fermentation", 0.13, 0.004, 0.014, () => "泡沫爬进了气锁，排气开始断断续续。", "fraction");
    if (recipe.hops.some((hop) => hop.use === "dryHop" && hop.grams > 0))
      roll("dryhop-contact", "fermentation", 0.12, 0.16, 0.32, () => "干投袋的上半截没有充分浸润。", "fraction");
    if (recipe.barrelDays >= 30)
      roll("barrel-strong", "adjunct", 0.2, 0.6, 0.6, () => "中途取样，木香已经很明显了。", "fraction");
    if (recipe.ageDays >= 2)
      roll("storage-warm", "storage", 0.13, 6, 11, (x) => `储存角落升温，比原先高 ${x.toFixed(1)} °C。`, "°C");
  }
  return events;
}
