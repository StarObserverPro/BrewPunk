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
  return events;
}
