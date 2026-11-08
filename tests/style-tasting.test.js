import test from 'node:test';
import assert from 'node:assert/strict';
import { brew, makeRecipe } from '../core/brew.js';
import { taste, STYLE_OPTIONS } from '../core/tasting.js';
import { referencePoints } from '../core/baseline.js';
import { simulateNight } from '../core/taproom.js';
import { STYLE_BENCHMARKS } from '../core/style-benchmarks.js';

const batchFor = (id, options) => brew(makeRecipe(id, { baselineVersion: 1, ...options }), 31);

test('each new shelf recipe has its own cited classic benchmark and can be declared as a 30A base', () => {
  for (const [id, guide] of Object.entries(STYLE_BENCHMARKS)) {
    const batch = batchFor(id);
    const [ref] = referencePoints(batch.baseline.referenceIds);
    assert.equal(ref.id, 'bjcp-' + guide.code.toLowerCase());
    assert.deepEqual(ref.facts.colorSRM, guide.colorSRM);
    assert.equal(STYLE_OPTIONS.filter(option => option.name.startsWith(guide.code + ' ')).length, 1);
    const classic = taste(batch);
    assert.ok(classic.bjcp.name.startsWith(guide.code + ' '));
    const specialty = taste(batch, { styleId: '30A' });
    assert.ok(specialty.bjcp.name.includes(classic.bjcp.name));
    assert.equal(classic.note, specialty.note);
  }
});

test('changing the yeast or smoked grist changes what reaches the glass and the judge', () => {
  const wheat = taste(batchFor('hefeweizen'));
  assert.match(wheat.note, /香蕉/);
  assert.match(wheat.note, /丁香/);
  const neutral = taste(batchFor('hefeweizen', { yeastId: 'american-ale' }));
  assert.doesNotMatch(neutral.note, /香蕉|丁香/);
  assert.match(neutral.bjcp.comment, /酵母香/);

  const recipe = makeRecipe('rauchbier');
  const smoke = taste(brew(recipe, 31));
  assert.match(smoke.note, /木烟/);
  for (const grain of recipe.fermentables) {
    if (grain.fermentableId === 'smoked-malt') grain.fermentableId = 'pilsner';
  }
  const clean = taste(brew(recipe, 31));
  assert.doesNotMatch(clean.note, /木烟/);
  assert.match(clean.bjcp.comment, /木烟/);
  assert.ok(clean.bjcp.total < smoke.bjcp.total);
});

test('kettle spices follow dose and salinity stays on the palate, including in the taproom', () => {
  const gose = makeRecipe('gose');
  const batch = brew(gose, 31);
  const glass = taste(batch);
  assert.match(glass.note, /芫荽籽/);
  assert.match(glass.phrases.finish, /咸/);
  assert.ok(glass.descriptors.every(word => !/咸|salt/.test(word)));
  const posts = simulateNight(batch, {seed: 9}).posts;
  assert.ok(posts.some(p => /咸|芫荽/.test(p.text)));

  gose.kettleSeasonings.forEach(dose => dose.gramsPerL = 0.001);
  const faint = taste(brew(gose, 31));
  assert.doesNotMatch(faint.note, /芫荽|咸/);
  assert.match(faint.bjcp.comment, /微咸/);

  const wit = makeRecipe('witbier');
  const fresh = taste(brew(wit, 31));
  assert.match(fresh.note, /苦橙皮/);
  assert.match(fresh.note, /芫荽籽/);
  wit.kettleSeasonings = [];
  assert.doesNotMatch(taste(brew(wit, 31)).note, /苦橙皮|芫荽籽/);
});
