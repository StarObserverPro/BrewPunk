// The game owns the cup and the audience. The local server is optional.
import { brew, makeRecipe } from "../core/brew.js";
import { withoutAdjunct } from "../core/adjunct-comparison.js";
import { referencePoints } from "../core/baseline.js";
import { taste } from "../core/tasting.js";
import { guestPrompt, packageCondition } from "../core/taproom.js";

async function request(route, data) {
  if (!globalThis.location || !["http:", "https:"].includes(location.protocol))
    return null;
  try {
    const response = await fetch("/api/" + route, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(100000),
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

function cupAtOpening(batch, draft) {
  const r = batch.recipe;
  return taste(batch, {
    ageDays: r.ageDays,
    packageType: r.packaging,
    styleId: draft.benchmark || r.styleId,
    ...(r.processVersion >= 2 ? packageCondition(batch, r.packaging, 0) : {}),
  });
}

// Substitute only after the model's profile has been run through the actual batch.
export function realiseVerdict(result, cup) {
  const tokens = {
    colour: cup.colour,
    nose: cup.descriptors.slice(0, 2).join("、") || "很轻的麦香",
    palate: cup.phrases?.palate || cup.note,
    finish: cup.phrases?.finish || "",
    style: cup.bjcp.name,
    match: cup.bjcp.comment,
  };
  const render = (pattern, required, fallback) => {
    if (
      typeof pattern !== "string" ||
      pattern.length > 300 ||
      !required.every((k) => pattern.includes("{{" + k + "}}")) ||
      /[0-9%]|\b(?:ABV|IBU|SRM)\b/i.test(pattern) ||
      [...pattern.matchAll(/\{\{([^{}]+)\}\}/g)].some(
        (m) => !required.includes(m[1]),
      )
    )
      return fallback;
    return pattern.replace(/\{\{(\w+)\}\}/g, (_, k) => tokens[k]);
  };
  const note = cup.phrases
    ? render(
        result.noteTemplate,
        ["colour", "nose", "palate", "finish"],
        cup.note,
      )
    : cup.note;
  return {
    note,
    judgeComment: render(
      result.judgeTemplate,
      ["style", "match"],
      cup.bjcp.comment,
    ),
  };
}

export async function adjudicateDraft(draft, batch) {
  const { recipe: r } = batch;
  const cup = cupAtOpening(batch, draft);
  const source = r.customAdjunct;
  const material =
    r.adjunct === "custom" && source
      ? {
          name: source.name,
          preparation: source.preparation,
          grams: source.grams,
          stage: source.stage,
        }
      : null;
  const baseBatch = r.customAdjunct || r.previousAdditions?.length || r.adjunct !== "none"
    ? withoutAdjunct(draft) : batch;
  const baseCup = cupAtOpening(baseBatch, draft);
  const context = {
    style: cup.bjcp.name,
    preset: r.presetId,
    litres: r.batchVolumeL,
    adjunct: r.adjunct,
    yeast: r.fermentation.yeastId,
    temperatures: r.fermentation.steps.map((s) => ({
      days: s.days,
      c: s.tempC,
    })),
    barrelDays: r.barrelDays,
    ageDays: r.ageDays,
    storageC: r.storageC,
    packaging: r.packaging,
    baselineReference: referencePoints(
      baseBatch.baseline?.referenceIds || [],
      material?.name || r.adjunct,
    ),
    beforeAdjunct: {
      abv: baseBatch.metrics.abv,
      fg: baseBatch.metrics.fg,
      ibu: baseBatch.metrics.ibu,
      note: baseCup.note,
    },
    openingPreview: cup.note,
    stylePreview: cup.bjcp.comment,
  };
  const materials = [...(r.previousAdditions || []), ...(source ? [source] : [])];
  const results = await Promise.all((materials.length ? materials : [null]).map(item =>
    request("adjudicate", {
      material: item ? {name:item.name, preparation:item.preparation, grams:item.grams, stage:item.stage} : null,
      context: {...context, baselineReference:referencePoints(baseBatch.baseline?.referenceIds || [],item?.name || r.adjunct)},
    })));
  if (results.some(result => !result)) return null;
  try {
    const options = structuredClone(draft.options);
    for (let i=0; i<materials.length; i++) {
      if (!results[i].profile) return null;
      const original = i < (r.previousAdditions?.length || 0)
        ? options.previousAdditions[i] : options.customAdjunct;
      original.profile = results[i].profile;
    }
    const finalBatch = brew(makeRecipe(draft.preset, options), draft.seed, draft.choices);
    const result = results.at(-1);
    return {
      options,
      profile: source ? result.profile : null,
      ...realiseVerdict(result, cupAtOpening(finalBatch, draft)),
    };
  } catch {
    return null;
  }
}

export function applyAdjudication(draft, result, benchmark = draft.benchmark) {
  if (result.options) draft.options = result.options;
  else if (result.profile && draft.options.customAdjunct) draft.options.customAdjunct.profile = result.profile;
  draft.adjudication = {status:"luna", note:result.note,
    judgeComment:benchmark===draft.benchmark ? result.judgeComment : null};
}

export async function voicePosts(_batch, posts) {
  if (!posts.length) return [];
  // Deliberately no batch, recipe, incident or BJCP record in the guest payload.
  const guests = posts.map((post) => ({
    id: post.id,
    view: guestPrompt(post).input,
    replyName: post.reply?.name ?? null,
  }));
  return (await request("guests", { guests }))?.posts ?? null;
}
