import test from "node:test";
import assert from "node:assert/strict";
import { RECIPE_CATALOG, RECIPE_FAMILIES } from "../core/recipes-catalog.js";
import { taste } from "../core/tasting.js";
import { blank, batchOf, restore, shelve, nightStatus } from "../ui/flow.js";
import { activeFamily, hasPickedRecipe, recipePicker } from "../ui/recipe-picker.js";

const originalPresets = ["hazy-ipa", "west-coast-ipa", "house-pale-ale", "czech-lager", "imperial-stout", "sour-ipa"];

function radioValues(markup, name) {
  return [...markup.matchAll(/<input\b[^>]*>/g)]
    .map(([tag]) => tag)
    .filter(tag => tag.includes(`name="${name}"`))
    .map(tag => tag.match(/value="([^"]+)"/)[1]);
}

test("the six shelves expose all 19 recipes exactly once", () => {
  const draft = blank(21).draft;
  const initial = recipePicker(draft);
  const families = radioValues(initial, "recipeFamily");
  assert.equal(families.length, 6);
  assert.equal(new Set(families).size, 6);
  assert.deepEqual(families, RECIPE_FAMILIES.map(f => f.id));
  assert.deepEqual(radioValues(initial, "preset"), []);

  const recipes = families.flatMap(recipeFamily => {
    const visible = radioValues(recipePicker({ ...draft, recipeFamily }), "preset");
    assert.ok(visible.length >= 2);
    assert.deepEqual(visible, RECIPE_CATALOG.filter(row => row.family === recipeFamily).map(row => row.id));
    return visible;
  });
  assert.equal(recipes.length, 19);
  assert.equal(new Set(recipes).size, 19);
  assert.deepEqual(recipes.toSorted(), RECIPE_CATALOG.map(row => row.id).toSorted());
});

test("a recipe from the previous shelf cannot authorize the next brew", () => {
  const draft = { ...blank(21).draft, preset: "witbier", recipeFamily: "wheat", picked: true };
  assert.equal(hasPickedRecipe(draft), true);
  draft.recipeFamily = "sour";
  assert.equal(hasPickedRecipe(draft), false);
  assert.ok(!radioValues(recipePicker(draft), "preset").includes("witbier"));
  draft.preset = "gose";
  draft.picked = false;
  assert.equal(hasPickedRecipe(draft), false);
  draft.picked = true;
  assert.equal(hasPickedRecipe(draft), true);
});

test("old saves keep their chosen recipe and infer its shelf without a stored family", () => {
  for (const preset of originalPresets) {
    const state = blank(43);
    Object.assign(state.draft, { preset, picked: true, step: 2 });
    const loaded = restore(JSON.parse(JSON.stringify(state)));
    assert.equal(activeFamily(loaded.draft), RECIPE_CATALOG.find(row => row.id === preset).family);
    assert.ok(hasPickedRecipe(loaded.draft));
    assert.equal(batchOf(loaded.draft).recipe.presetId, preset);
  }
  const untouched = restore(blank(43)).draft;
  assert.equal(activeFamily(untouched), "");
  assert.equal(hasPickedRecipe(untouched), false);
});

test("every added recipe makes a first cup and reaches the tap under its own name", () => {
  for (const row of RECIPE_CATALOG.filter(r => !originalPresets.includes(r.id))) {
    const state = blank(67);
    Object.assign(state.draft, { preset: row.id, recipeFamily: row.family, picked: true, step: 5 });
    const { recipe, batch } = batchOf(state.draft);
    assert.equal(recipe.presetId, row.id);
    assert.equal(recipe.name, row.name);
    const cup = taste(batch);
    assert.ok(cup.note.length > 0, row.id);
    assert.ok(Number.isFinite(cup.bjcp.total), row.id);
    assert.throws(() => shelve(state, 0), /先尝过第一杯/);
    state.draft.tasted = true;
    const tap = shelve(state, 0);
    const serving = nightStatus(tap);
    assert.equal(serving.options.beerName, row.name);
    assert.equal(serving.recipe.presetId, row.id);
    assert.equal(taste(serving.batch).note, cup.note);
    assert.ok(serving.servings.length > 0, row.id);
  }
});
