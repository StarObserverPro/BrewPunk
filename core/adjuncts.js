// Concentration thresholds and sensory weights are game priors, not toxicity or safety limits.
export const STAGES = ["boil", "pitch", "active", "conditioning"];
export const AXES = [
  "roast",
  "acidity",
  "fruitEsters",
  "sweetness",
  "body",
  "bitterness",
  "alcoholWarmth",
];
const enumOf = (...values) => ({ type: "string", enum: values });
const phrase = { type: "string" };
const fraction = { type: "number", minimum: 0, maximum: 1 };
const certainty = enumOf("low", "medium", "high");
const axis = enumOf("none", ...AXES);
// Families describe a surviving sensory note. A neutral/unknown note carries no style penalty.
const family = enumOf(
  "other",
  "allium",
  "pepperHeat",
  "savoury",
  "herbSpice",
  "citrusPeel",
  "coffeeCocoa",
  "fruit",
);
const record = (properties) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const constituent = record({
  name: phrase,
  basis: phrase,
  route: phrase,
  pathway: enumOf("stable", "heat", "yeast", "breakdown"),
  confidence: certainty,
  direct: phrase,
  directAxis: axis,
  directFamily: family,
  evolved: phrase,
  evolvedAxis: axis,
  evolvedFamily: family,
  share: fraction,
  convertible: fraction,
});
export const PROFILE_SCHEMA = record({
  direct: phrase,
  evolved: phrase,
  axis,
  behaviour: enumOf("neutral", "inhibit", "accelerate"),
  potency: { type: "integer", minimum: 0, maximum: 3 },
  convertible: fraction,
  confidence: certainty,
  tone: enumOf("dark", "light", "neutral"),
  yeastMechanism: phrase,
  yeastConfidence: certainty,
  constituents: { type: "array", items: constituent, maxItems: 3 },
});

function verify(value, spec, key) {
  const fail = () => {
    throw new RangeError(`无效的增味字段 ${key}`);
  };
  if (spec.enum) {
    if (!spec.enum.includes(value)) fail();
  } else if (spec.type === "object") {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Object.keys(value).length !== spec.required.length
    )
      fail();
    for (const k of spec.required) {
      if (!Object.hasOwn(value, k)) fail();
      verify(value[k], spec.properties[k], k);
    }
  } else if (spec.type === "array") {
    if (!Array.isArray(value) || value.length > spec.maxItems) fail();
    for (const item of value) verify(item, spec.items, key);
  } else if (spec.type === "string") {
    const long = ["basis", "route", "yeastMechanism"].includes(key);
    if (
      typeof value !== "string" ||
      value.length > (long ? 180 : 48) ||
      /[\x00-\x1f]/.test(value)
    )
      fail();
  } else if (
    !Number.isFinite(value) ||
    value < spec.minimum ||
    value > spec.maximum ||
    (spec.type === "integer" && !Number.isInteger(value))
  )
    fail();
}
export function validateProfile(profile) {
  verify(profile, PROFILE_SCHEMA, "profile");
  const components = profile.constituents;
  if (
    components.length &&
    Math.abs(components.reduce((sum, item) => sum + item.share, 0) - 1) > 1e-6
  )
    throw new RangeError("成分份额之和须为 1");
  if (
    components.some(
      (c) =>
        !c.name.trim() || !c.basis.trim() || !c.route.trim() || c.share <= 0,
    )
  )
    throw new RangeError("成分缺少名称、依据、路径或份额");
  if (
    profile.behaviour !== "neutral" &&
    (!components.length || !profile.yeastMechanism.trim())
  )
    throw new RangeError("酵母作用缺少成分依据");
  return structuredClone(profile);
}
const neutral = {
  direct: "",
  evolved: "",
  axis: "none",
  behaviour: "neutral",
  potency: 0,
  convertible: 0,
  confidence: "low",
  tone: "neutral",
  yeastMechanism: "",
  yeastConfidence: "low",
  constituents: [],
};
function material(
  profile,
  name,
  basis,
  route,
  pathway = "stable",
  evolvedAxis = "none",
  directFamily = "other",
  evolvedFamily = "other",
) {
  return {
    ...profile,
    constituents: [
      {
        name,
        basis,
        route,
        pathway,
        confidence: profile.confidence,
        direct: profile.direct,
        directAxis: profile.axis,
        directFamily,
        evolved: profile.evolved,
        evolvedAxis,
        evolvedFamily,
        share: 1,
        convertible: profile.convertible,
      },
    ],
  };
}
export function offlineProfile(name, preparation = "") {
  if (/^(大蒜|蒜|蒜瓣|garlic|raw garlic|roasted garlic)$/i.test(name)) {
    const roast = /烤|烘|roast/i.test(preparation + " " + name);
    return material(
      {
        ...neutral,
        direct: roast ? "烤蒜甜香" : "鲜蒜辛香",
        evolved: roast ? "柔和的烤蒜余香" : "较柔和的葱蒜气息",
        behaviour: "inhibit",
        potency: roast ? 1 : 3,
        convertible: 0.35,
        confidence: "medium",
        tone: roast ? "dark" : "light",
        yeastMechanism:
          "大蒜素可与巯基反应。酿酒酵母在本批麦汁中的抑制程度采用游戏推断。",
      },
      "蒜氨酸及其有机硫产物",
      "生蒜组织破损时，蒜氨酸酶促生成大蒜素，后者可继续分解。",
      roast
        ? "受热使蒜氨酸酶失活，已有含硫物继续变化，直接辛香减弱。"
        : "切碎或拍碎使酶和前体接触，生成的大蒜素可转为二烯丙基二硫醚等含硫物。",
      "breakdown",
      "none",
      "allium",
      "allium",
    );
  }
  if (/^(咖啡|coffee|可可|cocoa)$/i.test(name))
    return material(
      {
        ...neutral,
        direct: /咖啡|coffee/i.test(name) ? "咖啡烘香" : "可可烘香",
        axis: "roast",
        tone: "dark",
        confidence: "medium",
      },
      "烘焙香气组分",
      "烘焙原料自带香气。",
      "以浸提贡献直接烘香。",
      "stable",
      "none",
      "coffeeCocoa",
    );
  if (/^(樱桃|cherry)$/i.test(name))
    return material(
      {
        ...neutral,
        direct: "鲜樱桃酸香",
        evolved: "发酵樱桃果香",
        axis: "acidity",
        convertible: 0.55,
        tone: "dark",
        confidence: "medium",
      },
      "果实有机酸及挥发物",
      "果实提供酸度与果香。",
      "酸与香气进入酒液，活跃发酵改变果香轮廓。",
      "yeast",
      "fruitEsters",
      "fruit",
      "fruit",
    );
  return structuredClone(neutral);
}
export function normalizeAdjunct(input) {
  const { name, preparation = "", grams, stage = "pitch", profile } = input;
  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.length > 80 ||
    typeof preparation !== "string" ||
    preparation.length > 120 ||
    !Number.isFinite(grams) ||
    grams < 0 ||
    grams > 50000 ||
    !STAGES.includes(stage)
  )
    throw new RangeError("增味名称、处理方式、克数或阶段无效");
  return {
    name: name.trim(),
    preparation,
    grams,
    stage,
    ...(Number.isFinite(input.day)?{day:Math.max(0,input.day)}:{}),
    profile: validateProfile(
      profile ?? offlineProfile(name.trim(), preparation),
    ),
  };
}
export function resolveAdjunct(input, volumeL) {
  if (!Number.isFinite(volumeL) || volumeL <= 0)
    throw new RangeError("批量须为正数");
  const a = normalizeAdjunct(input),
    p = a.profile,
    doseGL = a.grams / volumeL;
  const load = ((doseGL * p.potency) / 3) * (a.stage === "boil" ? 0.25 : 1);
  const rawTier =
    p.behaviour === "neutral" || a.stage === "conditioning" || load < 1.5
      ? 0
      : load < 8
        ? 1
        : load < 40
          ? 2
          : 3;
  // Garlic's offline inhibition curve is an explicit game calibration, independent of literature confidence.
  const garlic = offlineProfile(a.name, a.preparation);
  const calibrated =
    garlic.behaviour === "inhibit" &&
    p.behaviour === garlic.behaviour &&
    p.potency <= garlic.potency;
  const tier =
    p.yeastConfidence === "low" && !calibrated ? Math.min(rawTier, 1) : rawTier;
  const rateMultiplier = (
    p.behaviour === "accelerate" ? [1, 1.06, 1.18, 1.35] : [1, 0.9, 0.55, 0.015]
  )[tier];
  return {
    ...a,
    doseGL,
    tier,
    rateMultiplier,
    startDay: a.stage === "active" ? (a.day??2) : 0,
  };
}
export function finishAdjunct(
  a,
  curve,
  { boilTimeMin = 0, conditioningDays = 0, packageThermalDays = 0 } = {},
) {
  const at = curve.find((x) => x.day >= a.startDay) ?? curve.at(-1);
  const consumption =
    a.stage === "conditioning"
      ? 0
      : Math.max(0, at.points - curve.at(-1).points) /
        Math.max(1, curve[0].points);
  const units =
    4 * (1 - Math.exp(-a.doseGL / 3)) * (a.stage === "boil" ? 0.65 : 1);
  // Packaged residence uses equivalent days at 10 °C, including any storage excursion.
  const contactDays =
    conditioningDays +
    packageThermalDays +
    (a.stage === "conditioning"
      ? 0
      : Math.max(0, curve.at(-1).day - a.startDay));
  const exposure = {
    stable: 0,
    yeast: Math.min(1, consumption),
    heat: a.stage === "boil" ? 1 - Math.exp(-boilTimeMin / 30) : 0,
    breakdown: 1 - Math.exp(-contactDays / 10),
  };
  const budgets = a.profile.constituents.map((c) => {
    const budget = units * c.share;
    const evolvedWeight = c.evolved
      ? budget * c.convertible * exposure[c.pathway]
      : 0;
    return {
      name: c.name,
      direct: c.direct,
      directAxis: c.directAxis,
      directFamily: c.directFamily,
      evolved: c.evolved,
      evolvedAxis: c.evolvedAxis,
      evolvedFamily: c.evolvedFamily,
      budget,
      directWeight: budget - evolvedWeight,
      evolvedWeight,
    };
  });
  const sum = (key) => budgets.reduce((total, c) => total + c[key], 0);
  const axisWeights = {};
  for (const c of budgets) {
    for (const [axis, weight] of [
      [c.directAxis, c.directWeight],
      [c.evolvedAxis, c.evolvedWeight],
    ]) {
      if (axis !== "none")
        axisWeights[axis] = (axisWeights[axis] ?? 0) + weight;
    }
  }
  return {
    ...a,
    budgets,
    axisWeights,
    budget: sum("budget"),
    directWeight: sum("directWeight"),
    evolvedWeight: sum("evolvedWeight"),
  };
}
