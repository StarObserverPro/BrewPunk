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
      signal: AbortSignal.timeout(40000),
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
  const source = draft.options.customAdjunct;
  const material =
    r.adjunct === "custom" && source
      ? {
          name: source.name,
          preparation: source.preparation,
          grams: source.grams,
          stage: source.stage,
        }
      : null;
  const baseBatch = r.adjunct === "none" ? batch : withoutAdjunct(draft);
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
  const result = await request("adjudicate", { material, context });
  if (!result) return null;
  try {
    const options =
      result.profile && material
        ? {
            ...draft.options,
            customAdjunct: { ...source, profile: result.profile },
          }
        : draft.options;
    const finalBatch =
      options === draft.options
        ? batch
        : brew(makeRecipe(draft.preset, options), draft.seed, draft.choices);
    return {
      profile: material ? result.profile : null,
      ...realiseVerdict(result, cupAtOpening(finalBatch, draft)),
    };
  } catch {
    return null;
  }
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
