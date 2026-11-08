import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { albumEntries } from '../ui/asset-album.js';
import { kitchenPlate, shotFor } from '../ui/kitchen-art.js';
import { packagingShot, packagingSequence } from '../ui/packaging-art.js';

test('every selected production image is registered, exists, and has a player-visible album entry', () => {
  const registered = new Set(albumEntries.map(a => a.src));
  assert.equal(registered.size, 64);
  for (const dir of ['kitchen','taproom','packaging','workshop','ingredients']) {
    for (const file of readdirSync(new URL('../assets/'+dir+'/', import.meta.url)).filter(f => /\.(png|jpg)$/.test(f))) {
      const src = 'assets/'+dir+'/'+file;
      assert.ok(registered.has(src), src);
      assert.ok(existsSync(new URL('../'+src, import.meta.url)), src);
    }
  }
});
test('all three packaging routes use their own fill, seal and storage art without unrelated gauge overlays', () => {
  for (const pack of ['keg','bottle','can']) {
    assert.equal(shotFor('pack',pack), packagingShot(pack));
    for (const phase of ['fill','seal','finished','storage']) {
      const html=kitchenPlate(packagingShot(pack,phase),'19');
      assert.ok(html.includes('assets/'), pack+'/'+phase);
      if (!(pack==='bottle' && phase==='fill')) assert.ok(!html.includes('<circle'), 'no old kettle gauge');
    }
    assert.ok(packagingSequence(pack).some(f=>f.shot===packagingShot(pack)));
  }
  assert.ok(kitchenPlate(packagingShot('keg','connect')).includes('B06'));
  assert.ok(kitchenPlate(packagingShot('keg','pour')).includes('B07'));
});
