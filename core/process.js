// Game priors for the portion of the process that happens after a warning.
// Observed magnitudes stay fixed; effective deviations record the response.
export function applyProcessChanges(recipe, events, choices) {
  const byId = (id) => events.find((event) => event.id === id);
  let lostFraction = 0;
  function effective(id, control, rescuedFactor) {
    const event = byId(id);
    if (!event) return 0;
    event.effectiveMagnitude = event.magnitude * (choices[control] ? rescuedFactor : 1);
    event.response = choices[control] === undefined ? "pending" : choices[control] ? "remedied" : "continued";
    return event.effectiveMagnitude;
  }
  const scaleLoss = effective("scale-drift", "scaleCorrect", 0.1);
  for (const malt of recipe.fermentables) malt.weightKg *= 1 - scaleLoss;
  const cool = effective("mash-cool", "mashRescue", 0.45);
  if (cool) {
    const rest = recipe.mash.steps.find((step) => ["alpha", "beta", "saccharification"].includes(step.kind)) || recipe.mash.steps[0];
    rest.tempC -= cool;
  }
  lostFraction += effective("filter-slow", "filterRescue", 0.25);
  lostFraction += effective("boil-over", "boilRescue", 0.35);
  lostFraction += effective("airlock-foam", "blowoff", 0.25);
  const pitchHeat = effective("pitch-warm", "pitchWait", 0);
  if (pitchHeat) {
    recipe.chill.pitchTempC += pitchHeat;
    const first = recipe.fermentation.steps[0];
    const days = Math.min(0.5, first.days);
    recipe.fermentation.steps.splice(0, 1,
      { ...first, days, tempC: first.tempC + pitchHeat },
      ...(first.days > days ? [{ ...first, days: first.days - days }] : []));
  }
  const dryLoss = effective("dryhop-contact", "dryHopRescue", 0.25);
  for (const hop of recipe.hops) if (hop.use === "dryHop") hop.grams *= 1 - dryLoss;
  const wood = byId("barrel-strong");
  if (wood) {
    wood.sampleDay = Math.round(recipe.barrelDays * wood.magnitude);
    wood.contactDays = choices.barrelStop ? wood.sampleDay : recipe.barrelDays;
    recipe.barrelDays = wood.contactDays;
  }
  const storage = byId("storage-warm");
  const storageExcursion = storage ? {
    startDay: 1,
    days: Math.min(recipe.ageDays - 1, choices.storageRescue ? 0.5 : 3),
    tempC: recipe.storageC + storage.magnitude,
  } : null;
  if (storage) storage.warmDays = storageExcursion.days;
  const air = effective("air-pickup", "transferRescue", 0.5);
  return {
    exposure: air, storageExcursion,
    yieldL: recipe.batchVolumeL * (1 - Math.min(0.25, lostFraction)),
    barrelDays: recipe.barrelDays,
  };
}
