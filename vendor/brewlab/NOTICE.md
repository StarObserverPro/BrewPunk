# BrewLab

Upstream: [MortenBrandanger/brewlab](https://github.com/MortenBrandanger/brewlab/tree/5ffd53cade73fd9f9e4c8365c05c1e2d0bd1c39d/src/lib/brewing)  
Revision: `5ffd53cade73fd9f9e4c8365c05c1e2d0bd1c39d`  
Copyright © 2026 Morten Brandanger. [MIT license](LICENSE).

These ES modules are the runtime dependency closure of the upstream recipe builder and simulator. The TypeScript source was transformed with Node 24's `node:module.stripTypeScriptTypes(source, { mode: "transform" })`. Relative imports gained a `.js` extension. Type-only modules, UI, third-party assets, and the upstream variance/tasting panel interface are excluded. BrewPunk's adapters, sensory notes, incident model, social simulation and drawings live outside this directory.

BrewPunk adds one optional `rateFactor` per fermentation step in `fermentationKinetics.js`. A missing factor defaults to one, preserving the pinned upstream time loop. The adapter uses the factor for seeded yeast-lot variation and timed ingredient effects.
