import assert from 'node:assert/strict';
import test from 'node:test';
import { referenceBaseline, referencePoints, BASELINE_REFERENCES } from '../core/baseline.js';
import { makeRecipe, PRESETS } from '../core/brew.js';

test('every playable style resolves to sourced, typed facts in stable order', () => {
  for (const { id } of PRESETS) {
    const ids = BASELINE_REFERENCES[id];
    assert.ok(ids.length);
    const points = referencePoints(ids);
    assert.deepEqual(points.map(point => point.id), ids);
    for (const { scope, source, use, facts } of points) {
      assert.ok(['recipe', 'brewer-guide', 'supplier-guide', 'style-guide'].includes(scope));
      assert.equal(new URL(source).protocol, 'https:');
      assert.ok(use.length && Object.keys(facts).length);
    }
  }
});

test('only the added ingredient selects an extra process example', () => {
  const ids = ['sn-pale'];
  for (const [ingredient, id] of [
    ['橙皮', 'allagash-wit'], ['cold brew coffee', 'epic-coffee'],
    ['蜂蜜', 'craisin-saison'], ['烟熏麦芽', 'smokeska-porter'],
  ]) {
    const points = referencePoints(ids, ingredient);
    assert.deepEqual(points.map(point => point.id), ['sn-pale', id]);
    assert.ok(points[1].source && points[1].use && Object.keys(points[1].facts).length);
  }
  assert.deepEqual(referencePoints(['sn-pale', 'unknown', 'sn-pale'], '大蒜'), referencePoints(ids));
  assert.deepEqual(referencePoints(['pilz'])[0].facts,
    { bitternessIBU: 40, colorSRM: 3.3, finalGravitySG: 1.009 });
});

test('strain range conditions reproducible bounded batch variation', () => {
  const american = makeRecipe('hazy-ipa', { fermentC: 35, yeastId: 'american-ale' });
  const voss = makeRecipe('hazy-ipa', { fermentC: 35, yeastId: 'kveik-voss' });
  const normal = referenceBaseline(voss, 31);
  const stressed = referenceBaseline(american, 31);
  assert.deepEqual(referenceBaseline(voss, 31), normal);
  assert.equal(normal.outsideC, 0);
  assert.ok(stressed.spread > normal.spread);
  const samples = Array.from({length: 96}, (_, seed) => referenceBaseline(american, seed).rateFactor);
  assert.ok(samples.every(x => Math.abs(x - 1) <= stressed.spread));
  assert.ok(Math.min(...samples) < 1 && Math.max(...samples) > 1);
});
