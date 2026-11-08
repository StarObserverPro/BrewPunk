import { guestVoice } from "./guest-voice.js";
import { rng } from "./random.js";
import { taste } from "./tasting.js";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const pick = (r, items) => items[Math.floor(r() * items.length)];
const regulars = [
  ["米粒", 3, 2, 5],
  ["隔壁老周", 8, 1, 4],
  ["小路", 5, 4, 4],
  ["阿岑", 3, 5, 6],
  ["小时", 7, 3, 3],
  ["飞鱼", 3, 7, 4],
  ["六子", 6, 4, 7],
  ["阿梨", 2, 3, 6],
  ["手抄酒单", 7, 6, 4],
  ["罐底", 8, 2, 5],
  ["小田", 4, 7, 3],
  ["南门", 2, 1, 3],
];
const firstNames = [
  "小钟",
  "花生",
  "石头",
  "阿何",
  "豆皮",
  "张姐",
  "面包",
  "纸杯",
  "老夏",
  "团子",
  "松子",
  "半山",
  "阿潘",
  "宋老师",
  "遥遥",
  "邓叔",
  "桃子",
  "阿陆",
  "小蔡",
  "礼拜天",
  "阿文",
  "老谭",
  "秋葵",
  "平平",
  "一横",
  "橙子",
  "小鱼",
  "波子",
  "克勤",
  "安安",
  "马丁",
  "小季",
];
const sideTalk = [
  ["一下午都在搬架子，现在坐下来连背都不想挺直。", "你那个架子最后进去了吗？"],
  ["房东刚问我搬走没，我还想问他钥匙收哪儿去了。", "你猜怎么着，挂我车上呢。"],
  ["有人知道这附近还有哪家厨房没关吗？", "街角那家还能点。"],
  ["分手四个月，他又来问空气炸锅算谁的。", "炸锅归你。我给你买的。"],
  ["旁边桌分我两张球票，看来明天不用早起了。", "明天那场下午三点。"],
  ["今天打了三盘全输，最后一盘还是我开的球。", "下周接着来。"],
  ["雨还没停。我的车窗好像开着。", "关了，我路过看了。"],
  ["上次坐这个位置，桌腿就短一截。", "底下那张酒垫垫回去。"],
];
const guess = {
  葡萄柚皮: "柚子皮",
  芒果: "芒果泥",
  黑醋栗: "浆果",
  杏桃: "桃子",
  可可: "可可豆",
  熟桃: "桃汁",
  香草: "香草荚",
  烤面包边: "咖啡豆",
  焦糖: "红糖",
  白花: "接骨木花",
  草本: "茶叶",
  樱桃: "樱桃汁",
};
/** This deliberately exposes only the drinker's view, never the recipe, score or fault log. */
export function guestPrompt(post) {
  return { instructions: guestVoice, input: { ...post.prompt } };
}

function glassFacts(t, foam) {
  const s = t.sensory,
    first = t.descriptors[0] ?? "麦香";
  const tasteWord =
    s.acidity >= 3.5
      ? "酸"
      : s.bitterness >= 4.2
        ? "苦"
        : s.sweetness >= 4.8
          ? "甜"
          : s.hopAroma >= 5
            ? "香"
            : "淡";
  const small = [
    ...t.afterNotes,
    ...t.flags.map((f) => (f === "气泡微弱" ? "泡几乎没了" : "能尝到" + f)),
    "是" + t.colour + "的",
    "闻着像" + first,
    s.body > 6 ? "口感挺厚" : s.body < 3.4 ? "口感挺轻" : "喝着不厚",
    s.acidity >= 3.5
      ? "一入口就酸"
      : s.bitterness >= 4.2
        ? "咽完还有点苦"
        : s.sweetness >= 4.8
          ? "后面有点甜"
          : "喝着挺温和",
  ];
  if (foam) small.unshift("第一杯泡沫特别多");
  return { first, small, tasteWord };
}

function affinity(sensory, guest, mood) {
  const distance =
    Math.abs(guest.bitter - sensory.bitterness) * 0.34 +
    Math.abs(guest.acid - sensory.acidity) * 0.26 +
    Math.abs(guest.body - sensory.body) * 0.19;
  return clamp(
    1 -
      distance / 8 -
      sensory.stale * 0.04 -
      sensory.offFlavour * 0.07 +
      (mood - 0.5) * 0.48,
    0,
    1,
  );
}
function visitReport(
  r,
  glass,
  guest,
  board,
  history,
  recent,
  group,
  foam,
  seenTalk,
  fit,
) {
  const f = glassFacts(glass, foam);
  const liking = fit >= 0.64 ? "喜欢" : fit >= 0.43 ? "一般" : "不合口味";
  const length = r();
  const len = length < 0.43 ? "短" : length < 0.82 ? "中" : "长";
  const life =
    len !== "短" && r() < 0.24 && seenTalk.size < sideTalk.length
      ? pick(
          r,
          sideTalk.filter(([s]) => !seenTalk.has(s)),
        )
      : null;
  if (life) seenTalk.add(life[0]);
  const prime = foam ? f.small[0] : pick(r, f.small);
  const preference = {
    喜欢: ["我还想喝。", "下杯还点它。", "这口我喜欢。"],
    一般: ["半杯刚好。", "还行。", "我先慢慢喝。"],
    不合口味: ["喝不惯。", "谁跟我换？", "下杯我换个头。"],
  };
  let text;
  // Diversify wording before publication. No reroll ever changes the tasted beer.
  for (let attempt = 0; attempt < 6; attempt++) {
    const detail = attempt ? pick(r, f.small) : prime;
    const verdict = pick(r, preference[liking]);
    if (len === "短")
      text = pick(r, [
        detail + "。",
        f.tasteWord + "。" + verdict,
        detail + "，" + verdict,
        "有点" + f.tasteWord + "。",
        "这杯" + detail + "。" + verdict,
        "三口下去，" + detail + "。",
      ]);
    else if (life) text = detail + "。" + life[0];
    else if (
      guest.confidence > 0.66 &&
      guest.experience < 0.53 &&
      guess[f.first]
    )
      text =
        pick(r, [
          "我赌里面放了" + guess[f.first] + "。",
          "这味道我熟，八成有" + guess[f.first] + "。",
        ]) + (len === "长" ? "问我怎么知道的？猜的。" : "");
    else if (len === "长" || guest.experience > 0.65) {
      const note = pick(r, [
        "闻着有" + f.first + "，",
        "凑近了才闻着点" + f.first + "的味道，",
        "刚倒下来先闻到" + f.first + "，",
        "一杯见底，最记得" + f.first + "那股香，",
      ]);
      text =
        note +
        pick(
          r,
          f.small.filter((x) => !x.startsWith("闻着")),
        ) +
        "。" +
        (len === "长" && history ? "上回我也点的它。" : "") +
        verdict;
    } else if (history)
      text =
        pick(r, [
          "上回也是这桶。今天" + detail + "。",
          "又点了它，" + detail + "。",
        ]) + verdict;
    else
      text =
        group && r() < 0.5
          ? "同桌递来一口，" + detail + "。" + verdict
          : detail + "。" + verdict;
    if (!recent.has(text)) break;
  }
  const replyText = life
    ? life[1]
    : pick(r, [
        "你那杯给我留一口。",
        "我刚点了。",
        "下回叫上我。",
        "你再闻一口试试。",
      ]);
  return {
    text,
    fit,
    liking,
    replyText,
    len,
    prompt: {
      人物: guest.name,
      经验:
        guest.experience > 0.65
          ? "记过许多杯"
          : guest.experience < 0.33
            ? "很少喝这类"
            : "偶尔喝",
      口味:
        guest.bitter > 6
          ? "爱偏苦的酒"
          : guest.acid > 5
            ? "喜欢酸味"
            : "偏爱温和的酒",
      表达把握: guest.confidence > 0.66 ? "说话很笃定" : "按感受说",
      酒牌: board,
      杯中印象: [prime, "闻着像" + f.first],
      反应: liking,
      今晚: life?.[0] ?? (group ? "和同桌分尝" : "自己点的"),
      篇幅: len,
      喝过这桶: history,
    },
  };
}

function pourClock(count, evening) {
  const minutes = 17 * 60 + 35 + count * 8;
  return (
    "第" +
    evening +
    "晚 " +
    String(Math.floor(minutes / 60)).padStart(2, "0") +
    ":" +
    String(minutes % 60).padStart(2, "0")
  );
}

function visitor(r, names, returns) {
  const pool = regulars.filter(([n]) => !names.has(n));
  const useRegular = pool.length && r() < 0.48;
  const alias = useRegular ? pick(r, pool) : null;
  const available = firstNames.filter((n) => !names.has(n));
  const name =
    alias?.[0] ?? (available.length ? pick(r, available) : "邻桌" + names.size);
  names.add(name);
  // Regulars carry their palate and voice across different nights and brews.
  const quirks = useRegular ? rng("brew-punk-regulars", name) : r;
  return {
    name,
    bitter: alias?.[1] ?? r() * 10,
    acid: alias?.[2] ?? r() * 8,
    body: alias?.[3] ?? 2 + r() * 6,
    experience: quirks(),
    confidence: quirks(),
    history: returns.has(name) && Boolean(useRegular),
  };
}

/** Follow a finite lot through the evenings required to serve it. */
export function simulateNight(batch, options = {}) {
  const volumeL = clamp(
    Number(options.volumeL ?? batch.recipe.batchVolumeL ?? 25),
    0,
    50,
  );
  const seed = options.seed ?? 1,
    tap = options.tap ?? 1,
    firstEvening = options.evening ?? 1;
  const guests = rng(seed, "guests"),
    mood = rng(seed, "palate"),
    publish = rng(seed, "publishing"),
    replies = rng(seed, "replies"),
    prose = rng(options.proseSeed ?? seed, "prose");
  const pack = options.packageType ?? batch.recipe.packaging ?? "keg";
  const age = options.ageDays ?? batch.recipe.ageDays ?? 7;
  const board = options.beerName ?? batch.recipe.name ?? "第" + tap + "号龙头";
  const returns = new Set(),
    seenTalk = new Set(),
    recent = new Set(),
    posts = [],
    servings = [],
    serviceEvents = [],
    packageCache = new Map();
  let remainingMl = Math.round(volumeL * 1000),
    servedMl = 0,
    lostMl = 0,
    sessions = 0,
    visitors = 0,
    totalFit = 0,
    nextPackage = 0;
  // A fresh audience seed cannot change an already packaged bottle or can.
  const getGlass = (day, groupId) => {
    const key = day + "-" + groupId;
    if (packageCache.has(key)) return packageCache.get(key);
    const condition = packageCondition(batch, pack, groupId);
    const result = taste(batch, {
      ...options,
      ...condition,
      packageType: pack,
      ageDays: day,
    });
    packageCache.set(key, result);
    return result;
  };
  // Larger vessels serve more guests without proportionally increasing reading load.
  const reviewProbability = 0.65 * Math.min(1, 21.5 / Math.max(1, volumeL));
  while (remainingMl >= 60) {
    const session = firstEvening + sessions,
      day = age + sessions;
    sessions++;
    const names = new Set(),
      target = 11 + Math.floor(guests() * 9);
    let eveningVisits = 0;
    while (eveningVisits < target && remainingMl >= 60) {
      const grouped = guests() < 0.35 && eveningVisits + 1 < target;
      const party = grouped ? 2 : 1;
      const glassId = servings.length;
      const packageId = pack === "keg" ? 0 : nextPackage++;
      const unitMl = pack === "bottle" ? 500 : 473;
      // A split pour shares one opened unit; a later group gets the next closure.
      const glass = getGlass(day, packageId);
      const foam =
        pack === "keg" &&
        eveningVisits === 0 &&
        rng(batch.seed, "tap-line/" + tap + "/" + session)() < 0.22;
      if (foam) {
        const lost = Math.min(options.serviceChoices?.[session]?.chillLine ? 30 : 100, remainingMl);
        remainingMl -= lost;
        lostMl += lost;
        serviceEvents.push({ id: "tap-foam", session, lostMl: lost, scope: "first-pour" });
      }
      for (let member = 0; member < party && remainingMl >= 60; member++) {
        const guest = visitor(guests, names, returns);
        const ml = Math.min(
          remainingMl,
          pack !== "keg"
            ? grouped
              ? Math.floor(unitMl / 2) + member * (unitMl % 2)
              : unitMl
            : grouped
              ? 237
              : guests() < 0.22
                ? 300
                : 473,
        );
        remainingMl -= ml;
        servedMl += ml;
        visitors++;
        eveningVisits++;
        const time = pourClock(eveningVisits, session);
        const fit = affinity(glass.sensory, guest, mood());
        totalFit += fit;
        returns.add(guest.name);
        servings.push({
          guest: guest.name,
          ml,
          glassId,
          packageId,
          session,
          time,
        });
        if (publish() < reviewProbability && posts.length < 48) {
          const note = visitReport(
            prose,
            glass,
            guest,
            board,
            guest.history,
            recent,
            grouped,
            foam,
            seenTalk,
            fit,
          );
          recent.add(note.text);
          const reply =
            note.len === "长" && replies() < 0.29
              ? {
                  name: pick(
                    prose,
                    regulars.map((r) => r[0]).filter((n) => n !== guest.name),
                  ),
                  text: note.replyText,
                }
              : null;
          posts.push({
            id: "s" + session + "-v" + visitors,
            session,
            name: guest.name,
            time,
            text: note.text,
            reply,
            prompt: note.prompt,
            glassId,
            packageId,
            rating: Math.round((1 + 4 * note.fit) * 4) / 4,
          });
        }
        if (
          member === party - 1 &&
          fit > 0.55 &&
          guests() < 0.23 &&
          remainingMl >= 237
        ) {
          const refill = Math.min(remainingMl, unitMl);
          remainingMl -= refill;
          servedMl += refill;
          servings.push({
            guest: guest.name,
            ml: refill,
            glassId: servings.length,
            packageId: pack === "keg" ? 0 : nextPackage++,
            session,
            time,
            refill: true,
          });
        }
      }
    }
  }
  return {
    seed,
    posts,
    servings,
    pours: servings.length,
    visitors,
    reviewCount: posts.length,
    sessionCount: sessions,
    consumedL: servedMl / 1000,
    lossL: lostMl / 1000,
    remainingL: remainingMl / 1000,
    meanEnjoyment: visitors ? totalFit / visitors : 0,
    serviceEvents,
  };
}

export function packageCondition(batch, type, id) {
  if (type === "keg") return {};
  const r = rng(batch.seed, "pack/" + type + "/" + id);
  const baseline = clamp(batch.exposure ?? 0.2, 0, 1);
  // A single poor closure is local; an interrupted fill affects a run of cans.
  const run = rng(batch.seed, "pack-run/" + type + "/" + Math.floor(id / 6));
  const factor = batch.sealChecked && id > 0 ? 0.2 : 1;
  const exposed = type === "can" && run() < (0.04 + 0.12 * baseline) * factor;
  const loose =
    r() < (batch.packageDefects?.probability ?? 0.018 + 0.06 * baseline) * factor;
  return {
    oxygen: clamp(baseline + (exposed ? 0.45 : 0) + (loose ? 0.28 : 0), 0, 1),
    co2Loss: loose ? 0.64 : 0,
  };
}

function spread(values) {
  const xs = values.sort((a, b) => a - b),
    q = (p) => xs[Math.round(p * (xs.length - 1))];
  return { p10: q(0.1), p50: q(0.5), p90: q(0.9) };
}
export function sampleTastings(batch, options = {}) {
  const runs = clamp(Math.floor(options.runs ?? 100) || 1, 1, 1000),
    seed = options.seed ?? 1;
  const reviews = [],
    visitors = [],
    enjoyment = [];
  for (let i = 0; i < runs; i++) {
    const night = simulateNight(batch, {
      ...options,
      seed: String(seed) + "/night/" + i,
    });
    reviews.push(night.reviewCount);
    visitors.push(night.visitors);
    enjoyment.push(Math.round(night.meanEnjoyment * 100));
  }
  return {
    runs,
    seed,
    reviews: spread(reviews),
    visitors: spread(visitors),
    enjoyment: spread(enjoyment),
  };
}
