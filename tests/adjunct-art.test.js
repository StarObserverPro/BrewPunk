import test from "node:test";
import assert from "node:assert/strict";
import { materialArt } from "../ui/adjunct-art.js";

test("ingredient plate keeps one layered composition across all tones and stages", () => {
  const plates = new Set();
  for (const stage of ["boil", "pitch", "active", "conditioning"]) {
    for (const tone of ["dark", "light", "neutral"]) {
      const svg = materialArt(tone, stage);
      assert.match(svg, /viewBox="0 0 400 156"/);
      assert.match(svg, /role="img" aria-label="[^"]+"/);
      assert.doesNotMatch(svg, /<(?:image|script|foreignObject)\b|href=/);
      assert.deepEqual(
        [...svg.matchAll(/data-layer="([^"]+)"/g)].map((m) => m[1]),
        ["table", "vessel-back", "arm", "bag", "material", "foreground"],
      );
      plates.add(svg);
    }
  }
  assert.equal(plates.size, 12);
  assert.equal(materialArt("<script>", "__proto__"), materialArt());
});
