// Packaged-beer predictions are relative teaching scales, not assay results.
const bound = (x, low = 0, high = 10) => Math.max(low, Math.min(high, x));
const round = (x) => Math.round(x * 10) / 10;
const outside = (x, [lo, hi]) => Math.max(0, lo - x, x - hi);
const colourName = (srm) =>
  srm < 4
    ? "浅金色"
    : srm < 8
      ? "金黄色"
      : srm < 14
        ? "琥珀色"
        : srm < 20
          ? "铜褐色"
          : srm < 32
            ? "深褐色"
            : "近乎漆黑";

/** Commercial examples and style landmarks anchor one axis at a time.
 * Their placement on a 0–10 scale is the game's calibration. */
const scales = [
  [
    "colour",
    "色深",
    [
      [1.1, "慕尼黑淡色拉格"],
      [7.3, "德式黑拉格"],
      [9.8, "帝国世涛"],
    ],
  ],
  [
    "bitterness",
    "入口苦感",
    [
      [1.8, "慕尼黑淡色拉格"],
      [5.2, "美式淡色艾尔"],
      [8, "美式 IPA"],
    ],
  ],
  [
    "sweetness",
    "甜感",
    [
      [2, "德式皮尔森"],
      [5.8, "甜世涛"],
    ],
  ],
  [
    "acidity",
    "酸感",
    [
      [0.8, "慕尼黑淡色拉格"],
      [7.2, "柏林小麦酸啤"],
    ],
  ],
  [
    "body",
    "酒体",
    [
      [2.4, "美式淡拉格"],
      [5, "美式淡色艾尔"],
      [8.6, "帝国世涛"],
    ],
  ],
  [
    "roast",
    "烘烤",
    [
      [0.3, "慕尼黑淡色拉格"],
      [3.6, "德式黑拉格"],
      [7.6, "爱尔兰干世涛"],
    ],
  ],
  [
    "hopAroma",
    "酒花香",
    [
      [2, "慕尼黑淡色拉格"],
      [5.7, "Sierra Nevada Pale Ale"],
      [8.5, "浑浊 IPA"],
    ],
  ],
  [
    "carbonation",
    "气泡感",
    [
      [2.2, "英式桶装苦啤"],
      [5.2, "美式淡色艾尔"],
      [8.4, "德式小麦"],
    ],
  ],
];
const labels = {
  citrus: "葡萄柚皮",
  tropical: "芒果",
  "stone-fruit": "杏桃",
  berry: "黑醋栗",
  floral: "白花",
  spicy: "胡椒",
  herbal: "草本",
  resin: "松脂",
  pine: "松针",
  earthy: "湿土",
  grassy: "青草",
  dank: "青树脂",
  vanilla: "香草",
  cocoa: "可可",
  chili: "辣椒",
  cherry: "樱桃",
  bourbon: "波本桶香",
  coconut: "椰片",
  orange: "橙皮",
  coffee: "咖啡",
  oak: "橡木",
  pretzel: "椒盐饼干",
};
// SRM, IBU and ABV are published ranges for classic styles. The remaining
// intervals are internal sensory calibration. Mixed/specialty styles have
// no fixed vital statistics; their declared base and special character matter.
const styles = {
  "hazy-ipa": [
    "21C 浑浊 IPA",
    [3, 7],
    [25, 60],
    [6, 9],
    [6, 10],
    [2, 6],
    [4.5, 9],
    [0, 1.5],
    [0, 2.5],
  ],
  "west-coast-ipa": [
    "21A 美式 IPA",
    [6, 14],
    [40, 70],
    [5.5, 7.5],
    [6, 10],
    [5, 10],
    [2, 6],
    [0, 1.5],
    [0, 2.5],
  ],
  apa: [
    "18B 美式淡色艾尔",
    [5, 10],
    [30, 50],
    [4.5, 6.2],
    [4, 8],
    [3, 7],
    [2, 6],
    [0, 1.6],
    [0, 2.5],
  ],
  lager: [
    "4A 慕尼黑淡色拉格",
    [3, 5],
    [16, 22],
    [4.7, 5.4],
    [0, 3.5],
    [1, 4.5],
    [2, 6],
    [0, 1],
    [0, 2.5],
  ],
  "czech-pilsner": [
    "3B 捷克优质淡色拉格",
    [3.5, 6],
    [30, 45],
    [4.2, 5.8],
    [2, 7],
    [3, 7.5],
    [3, 7],
    [0, 1],
    [0, 2.5],
  ],
  "german-pils": [
    "5D 德式皮尔森",
    [2, 4.5],
    [22, 40],
    [4.4, 5.2],
    [2, 7],
    [3, 8],
    [2, 5.5],
    [0, 1],
    [0, 2.5],
  ],
  "imperial-stout": [
    "20C 帝国世涛",
    [30, 40],
    [50, 90],
    [8, 12],
    [0, 7],
    [3.5, 10],
    [5.5, 10],
    [4, 10],
    [0, 3],
  ],
  "sour-ipa": [
    "34B 混合风格 · 酸 IPA",
    null,
    null,
    null,
    [4, 10],
    [1, 7],
    [2, 7],
    [0, 2],
    [4, 9],
  ],
  "barrel-stout": [
    "33A 木桶陈酿 · 世涛基底",
    null,
    null,
    null,
    [0, 7],
    [2, 9],
    [5, 10],
    [3, 10],
    [0, 3],
  ],
};
const aliases = {
  "house-pale-ale": "apa",
  "czech-lager": "czech-pilsner",
  "pale-ale": "apa",
  "american-pale-ale": "apa",
  "american-ipa": "west-coast-ipa",
  ipa: "west-coast-ipa",
  neipa: "hazy-ipa",
  helles: "lager",
  "munich-helles": "lager",
  "pale-lager": "lager",
  pilsner: "czech-pilsner",
  "barrel-aged-stout": "barrel-stout",
  stout: "imperial-stout",
};
export const STYLE_OPTIONS = Object.entries(styles).map(([id, [name]]) => ({
  id,
  name,
}));

function assess(id, m, s, notes) {
  const style = styles[aliases[id] ?? id];
  if (!style) throw new RangeError("未知的申报风格 " + id);
  const [name, colour, ibu, abv, hops, bitterness, body, roast, acid] = style;
  const colourMiss = colour ? outside(m.srm, colour) : 0;
  const ibuMiss = ibu ? outside(m.ibu, ibu) : 0;
  const abvMiss = abv ? outside(m.abv, abv) : 0;
  const aromaMiss = outside(s.hopAroma, hops);
  const bitterMiss = outside(s.bitterness, bitterness);
  const bodyMiss = outside(s.body, body);
  const roastMiss = outside(s.roast, roast);
  const acidMiss = outside(s.acidity, acid);
  const gasMiss = outside(s.carbonation, [2.5, 8]);
  const faults = s.stale + s.offFlavour;
  const score = (max, loss) => Math.round(bound(max - loss, 0, max));
  const flavourMiss = bitterMiss + roastMiss + acidMiss;
  const scores = [
    ["香气", 12, 1 + aromaMiss * 0.85 + faults * 0.7],
    ["外观", 3, Math.min(2, colourMiss * 0.23) + gasMiss * 0.25],
    [
      "风味",
      20,
      2 + flavourMiss * 1.35 + faults * 1.4 + Math.min(2, ibuMiss * 0.065),
    ],
    ["口感", 5, 0.4 + bodyMiss * 0.65 + gasMiss * 0.55],
    [
      "整体印象",
      10,
      1 +
        (aromaMiss + flavourMiss + bodyMiss) * 0.38 +
        faults * 0.7 +
        Math.min(2, abvMiss * 0.6),
    ],
  ];
  const parts = scores.map(([label, max, loss]) => ({
    label,
    max,
    score: score(max, loss),
  }));
  const compare = (n, r, low, high) => (n < r[0] ? low : high);
  const shifts = [
    [colourMiss / 4, colour && compare(m.srm, colour, "颜色偏浅", "颜色偏深")],
    [aromaMiss, compare(s.hopAroma, hops, "酒花香偏低", "酒花香过强")],
    [
      bitterMiss,
      compare(s.bitterness, bitterness, "入口苦感偏轻", "入口苦感偏重"),
    ],
    [bodyMiss, compare(s.body, body, "酒体偏薄", "酒体偏厚")],
    [roastMiss, compare(s.roast, roast, "烘烤特征偏轻", "烘烤特征偏重")],
    [acidMiss, compare(s.acidity, acid, "酸感不够突出", "酸感超出预期")],
    [abvMiss, abv && compare(m.abv, abv, "酒精度偏低", "酒精度偏高")],
    [
      ibuMiss / 12,
      ibu && compare(m.ibu, ibu, "估算 IBU 偏低", "估算 IBU 偏高"),
    ],
  ]
    .filter(([n]) => n > 0.12)
    .sort((a, b) => b[0] - a[0]);
  const comments = [...notes, ...shifts.map((x) => x[1])];
  return {
    name,
    total: parts.reduce((sum, p) => sum + p.score, 0),
    parts,
    comment:
      comments.slice(0, 3).join("，") ||
      "这杯的酒体、苦感与香气都落在申报风格的参照范围内。",
  };
}

function readOffFlavours(batch) {
  const names = {
    diacetyl: "黄油",
    dms: "熟玉米",
    fusel: "溶剂",
    grassy: "青梗",
    chlorophenol: "药水",
  };
  const flags = [];
  for (const [key, text] of Object.entries(names)) {
    const risk = batch.risks?.[key] ?? 0;
    if (risk > 4.5) flags.push({ text, strength: bound((risk - 3) * 0.8) });
  }
  return flags.sort((a, b) => b.strength - a.strength);
}

export function taste(batch, options = {}) {
  const { recipe, metrics: m } = batch;
  const ageDays = bound(
    Number(options.ageDays ?? recipe.ageDays ?? 7),
    0,
    1460,
  );
  const packageType = options.packageType ?? recipe.packaging ?? "keg";
  const storageC = bound(
    Number(options.storageC ?? recipe.storageC ?? 5),
    -1,
    35,
  );
  const oxygen = bound(Number(options.oxygen ?? batch.exposure ?? 0.2), 0, 1);
  const co2Loss = bound(Number(options.co2Loss ?? 0), 0, 1);
  const warmDays = ageDays * 2 ** ((storageC - 10) / 10);
  // Relative bands: quick fruit/oil notes fade faster than floral terpenols.
  const hopLoss = (0.0024 + oxygen * 0.012) * warmDays;
  const s = { ...batch.sensory };
  const raw = batch.descriptors ?? [];
  const extraTags = raw.filter(
    (tag) =>
      ![
        "citrus",
        "tropical",
        "stone-fruit",
        "berry",
        "floral",
        "spicy",
        "herbal",
        "resin",
        "pine",
        "earthy",
        "grassy",
        "dank",
      ].includes(tag),
  );
  let smells = raw
    .filter((tag) => !extraTags.includes(tag))
    .map((tag, i) => {
      const rate = ["tropical", "berry", "stone-fruit", "pine"].includes(tag)
        ? 1.4
        : ["floral", "citrus"].includes(tag)
          ? 0.65
          : 1;
      const weight = Math.exp(-i * 0.33 - hopLoss * rate);
      return { text: labels[tag] ?? tag, weight };
    })
    .sort((a, b) => b.weight - a.weight);
  s.hopAroma = bound(s.hopAroma * Math.exp(-hopLoss));
  s.fruitEsters = bound(s.fruitEsters * Math.exp(-warmDays * 0.0025));
  s.stale = bound(8 * (1 - Math.exp(-warmDays * (0.00024 + oxygen * 0.006))));
  const off = readOffFlavours(batch);
  s.offFlavour = off[0]?.strength ?? 0;
  const sourDrift = batch.events?.find((e) => e.id === "wild-acid");
  s.colour = bound((10 * Math.log1p(Math.max(0, m.srm) / 8)) / Math.log(6.5));
  const bottleProgress =
    packageType === "bottle"
      ? 0.36 +
        0.64 * (1 - Math.exp((-ageDays * 2 ** ((storageC - 18) / 10)) / 9))
      : 1;
  s.carbonation = bound(
    ((m.co2Volumes ?? recipe.conditioning?.co2Volumes ?? 2.4) *
      bottleProgress *
      (1 - co2Loss) -
      0.5) *
      2.8,
  );
  s.crispness = bound(s.crispness * (1 - s.stale / 25));
  smells = smells.filter((x) => s.hopAroma * x.weight > 0.8);
  const candidates = smells
    .slice(0, 2)
    .map(({ text, weight }) => ({ text, strength: s.hopAroma * weight }));
  for (const tag of extraTags)
    candidates.push({
      text: labels[tag] ?? tag,
      strength: 3.6 * Math.exp(-warmDays * 0.0005),
    });
  candidates.push(
    { text: "熟桃", strength: s.fruitEsters * 0.76 },
    { text: "烤面包边", strength: s.roast },
    { text: "新鲜面包芯", strength: (s.malt ?? 0) * 0.78 },
    { text: "焦糖", strength: s.caramel ?? 0 },
  );
  if (s.stale > 2.5)
    candidates.push({ text: "旧纸盒", strength: s.stale * 1.3 });
  candidates.push(...off);
  const distinct = [
    ...new Set(
      candidates
        .filter((c) => c.strength > 1.1)
        .sort((a, b) => b.strength - a.strength)
        .map((c) => c.text),
    ),
  ];
  const descriptors = distinct.slice(0, 4);
  const accents = {
    chili: "咽下去喉咙里还热辣辣的",
    coconut: "杯子暖一点，椰香就出来了",
    pretzel: "仔细尝有一点咸，又有烤饼干的味道",
    coffee: "中段有咖啡似的苦香",
    cocoa: "中段有点像可可碎",
    cherry: "嘴里还留着一股樱桃香",
    oak: "最后有一点干木头的气息",
    vanilla: "温一点能闻见香草",
  };
  const orderedExtras = [...extraTags].sort(
    (a, b) => Number(b === recipe.adjunct) - Number(a === recipe.adjunct),
  );
  const afterNotes = orderedExtras.map((tag) => accents[tag]).filter(Boolean);
  const accent = afterNotes.length
    ? afterNotes.slice(0, 2).join("，") + "。"
    : "";
  const colour = colourName(m.srm);
  const flags = off.map((f) => f.text + "味");
  if (sourDrift && sourDrift.magnitude > 3 && !recipe.kettleSoured) {
    flags.push("一股突出的酸味");
    s.offFlavour += sourDrift.magnitude * 0.5;
  }
  if (s.stale > 2.5) flags.push("旧纸盒气味");
  if (s.carbonation < 2.1) flags.push("气泡微弱");
  const body =
    s.body >= 6 ? "酒液裹着舌面" : s.body < 3.4 ? "酒体很轻" : "酒体适中";
  const first =
    s.acidity >= 3.5
      ? "酸味先到"
      : s.sweetness > 5
        ? "入口先甜"
        : s.carbonation > 6.3
          ? "气泡先扎到舌尖"
          : "入口平顺";
  const tail =
    s.bitterness > 6
      ? "咽下去，舌根的苦味停了好一会儿"
      : s.roast > 4
        ? "咽下去还留着一点可可的烘烤味"
        : s.crispness > 5
          ? "咽下去收得干净"
          : s.sweetness > 4
            ? "最后留着一点甜"
            : s.bitterness >= 3
              ? "舌根留着一点苦"
              : "最后麦香慢慢散了";
  const smell = descriptors.length
    ? "先闻到" +
      descriptors[0] +
      (descriptors[1] ? "，再靠近一点有" + descriptors[1] + "的味道" : "")
    : "闻香很淡，得把杯子凑近";
  const note =
    "倒出来是" +
    colour +
    "。" +
    smell +
    "。" +
    first +
    "，" +
    body +
    "。" +
    tail +
    "。" +
    accent +
    (flags.length ? "杯里还能察觉" + flags.join("、") + "。" : "");
  const styleId = options.styleId ?? recipe.styleId ?? recipe.id ?? "apa";
  return {
    note,
    colour,
    descriptors,
    afterNotes,
    ageDays,
    packageType,
    flags,
    sensory: s,
    axes: scales.map(([id, label, anchors]) => ({
      id,
      label,
      value: round(s[id]),
      min: 0,
      max: 10,
      anchors: anchors.map(([value, label]) => ({ value, label })),
    })),
    bjcp: assess(styleId, m, s, flags),
  };
}
