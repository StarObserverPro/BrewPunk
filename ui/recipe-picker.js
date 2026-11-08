import { RECIPE_CATALOG, RECIPE_FAMILIES } from "../core/recipes-catalog.js";

export function activeFamily(draft) {
  return draft.recipeFamily || (draft.picked && RECIPE_CATALOG.find(r => r.id === draft.preset)?.family) || "";
}

export function hasPickedRecipe(draft) {
  return Boolean(draft.picked && RECIPE_CATALOG.some(r => r.id === draft.preset && r.family === activeFamily(draft)));
}

// Only catalog constants are interpolated here. Names and recipes entered by players are rendered elsewhere.
export function recipePicker(draft) {
  const family = activeFamily(draft);
  const families = RECIPE_FAMILIES.map(group =>
    `<label class="family-tab"><input type="radio" name="recipeFamily" required value="${group.id}" ${family === group.id ? "checked" : ""}><span>${group.name}</span></label>`
  ).join("");
  const group = RECIPE_FAMILIES.find(g => g.id === family);
  const recipes = RECIPE_CATALOG.filter(r => r.family === family).map(r =>
    `<label class="radio-card recipe-leaf"><input required type="radio" name="preset" value="${r.id}" ${draft.picked && draft.preset === r.id ? "checked" : ""}><span><b>${r.name}</b><small>${r.hint}</small></span></label>`
  ).join("");
  return `<fieldset class="recipe-shelf"><legend>选酒系</legend><div class="family-grid">${families}</div></fieldset>` +
    (group ? `<fieldset class="recipe-shelf"><legend>${group.name} · 选底方</legend><div class="recipe-grid">${recipes}</div></fieldset>` : "");
}
