/** Deterministic, independently keyed streams for process, service and replay. */
export function rng(seed, scope = "") {
  let state = 2166136261;
  for (const char of JSON.stringify([String(seed), String(scope)])) {
    state = Math.imul(state ^ char.codePointAt(0), 16777619);
  }
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let x = Math.imul(state ^ (state >>> 15), state | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
