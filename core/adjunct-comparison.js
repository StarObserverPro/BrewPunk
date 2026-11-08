import { brew, makeRecipe } from "./brew.js";
import { taste } from "./tasting.js";

// Counterfactual brewed at the same scale, seed, age and serve conditions.
// Evaluate on opening a cup or its journal, never per Monte Carlo visitor.
export function withoutAdjunct(draft) {
  const options = { ...draft.options, adjunct: "none" };
  delete options.customAdjunct;delete options.previousAdditions;
  return brew(makeRecipe(draft.preset, options), draft.seed, draft.choices);
}

export function compareAdjunct(draft, batch, cup, options = {}) {
  if (batch.recipe.adjunct === "none" && !batch.customAdjunct) return null;
  const base = withoutAdjunct(draft);
  const original = taste(base, {
    ageDays: cup.ageDays,
    packageType: cup.packageType,
    styleId: draft.benchmark || base.recipe.styleId,
    ...options,
  });
  return {
    parts: cup.bjcp.parts.map((p, i) => ({
      label: p.label,
      before: original.bjcp.parts[i].score,
      after: p.score,
      delta: p.score - original.bjcp.parts[i].score,
    })),
    totalDelta: cup.bjcp.total - original.bjcp.total,
    abvDelta: +(batch.metrics.abv - base.metrics.abv).toFixed(2),
    fgDelta: +(batch.metrics.fg - base.metrics.fg).toFixed(3),
  };
}
