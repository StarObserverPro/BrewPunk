import { makeRecipe, brew, sampleBrews } from "../core/brew.js";
import { taste, STYLE_OPTIONS } from "../core/tasting.js";
import { simulateNight, sampleTastings } from "../core/taproom.js";
import { sketch } from "./art.js";

const styles = {
  "hazy-ipa": "浑浊 IPA",
  "west-coast-ipa": "西岸 IPA",
  "house-pale-ale": "美式淡色艾尔",
  "czech-lager": "捷克淡色拉格",
  "imperial-stout": "帝国世涛",
  "sour-ipa": "酸 IPA",
};
const malts = {
  pilsner: "皮尔森",
  "pale-ale": "淡色艾尔",
  "maris-otter": "玛丽斯奥特",
  vienna: "维也纳",
};
const waters = {
  balanced: "均衡",
  "soft-pilsner": "软水",
  "hop-forward": "突出酒花",
  "malt-forward": "突出麦芽",
  "dark-alkaline": "深色酒用水",
};
const yeasts = {
  "american-ale": "美式艾尔",
  "neipa-ale": "新英格兰艾尔",
  "czech-lager": "捷克拉格",
  "kveik-voss": "沃斯农家酵母",
};
const hops = {
  citra: "西楚",
  mosaic: "马赛克",
  cascade: "卡斯卡特",
  simcoe: "西姆科",
  saaz: "萨兹",
};
const adjuncts = {
  none: "原味",
  cocoa: "可可碎",
  coffee: "咖啡",
  cherry: "樱桃",
  chili: "辣椒",
  coconut: "椰片",
  pretzel: "椒盐扭结饼干",
};
const packs = { keg: "生啤桶", bottle: "玻璃瓶", can: "易拉罐" };
const stages = [
  "写酒单",
  "糖化煮沸",
  "看发酵桶",
  "加点味道",
  "分装",
  "尝第一杯",
];
const illustrations = ["recipe", "mash", "ferment", "adjunct", "pack", "taste"];
const scenes = [
  "厨房的第一锅",
  "炉灶旁",
  "发酵桶边",
  "增味台",
  "分装台",
  "开瓶手记",
];
const seed = () => crypto.getRandomValues(new Uint32Array(1))[0];
const newDraft = () => ({
  preset: "hazy-ipa",
  options: { volumeL: 25 },
  choices: {
    precision: true,
    sanitation: true,
    temperatureControl: false,
    closedTransfer: true,
  },
  step: 0,
  seed: seed(),
  name: "",
  benchmark: "",
});
const blank = () => ({
  draft: newDraft(),
  view: "kitchen",
  taps: Array(6).fill(null),
  archive: [],
  selected: 0,
  nextNumber: 1,
});
const key = "brewpunk.journal.v1";
let state;
try {
  state = JSON.parse(localStorage.getItem(key));
} catch {}
if (!state?.draft || !Array.isArray(state.taps) || state.taps.length !== 6)
  state = blank();
const app = document.querySelector("#app");
const escape = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let toastTimer;
function notice(message) {
  const el = document.querySelector("#notice");
  el.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.textContent = ""), 3600);
}
function save() {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    notice("浏览器未能保存手记。请保留当前页面。");
  }
}
const number = (n) => String(n).padStart(2, "0");
function field(label, html) {
  return `<label class="field">${label}${html}</label>`;
}
function select(label, id, values, current) {
  return field(
    label,
    `<select data-id="${id}">${Object.entries(values)
      .map(
        ([v, l]) =>
          `<option value="${escape(v)}" ${String(current) === v ? "selected" : ""}>${escape(l)}</option>`,
      )
      .join("")}</select>`,
  );
}
function numeric(label, id, value, min, max, step = 1) {
  return field(
    label,
    `<input type="number" data-id="${id}" value="${escape(value)}" min="${min}" max="${max}" step="${step}" required>`,
  );
}
const choice = (label, id, yes, no, val) =>
  select(label, id, { yes, no }, val ? "yes" : "no");
const following = { "": "沿用配方" };
const button = (label, act, primary = false) =>
  `<button type="button" data-act="${act}" class="${primary ? "primary" : ""}">${escape(label)}</button>`;
const events = (b, stage) =>
  b.events
    .filter((e) => e.stage === stage)
    .map((e) => `<p class="log">${escape(e.text)}</p>`)
    .join("");
const metrics = (b) =>
  `<div class="metrics"><b>${b.metrics.abv.toFixed(1)}% ABV</b><b>${Math.round(b.metrics.ibu)} IBU</b><b>${Math.round(b.metrics.srm)} SRM</b></div>`;
function scene(stage, title, srm, adjunct, pack, caption, steps) {
  return `<aside class="scene"><div class="plate">${sketch(stage, srm, adjunct === "none" ? "" : adjunct, pack)}<div class="caption"><span>${escape(title)}</span><span>${escape(caption)}</span></div></div>${steps}</aside>`;
}
function kitchen() {
  const d = state.draft,
    o = d.options,
    r = makeRecipe(d.preset, o),
    b = brew(r, d.seed, d.choices),
    i = d.step;
  const notes = [
    "挑个底方，把今晚想喝的东西写下来。",
    "麦汁冒泡了。酒花什么时候下锅，香气就往哪里走。",
    "把耳朵凑过去，听气锁响。",
    "盖子掀开一条缝，桶里还容得下一点私心。",
    "瓶盖、罐口、酒管，每一处都得过手。",
    "倒半杯，等泡沫落一点。",
  ];
  const dry = r.hops.find((h) => h.use === "dryHop");
  const controls = [
    () =>
      `<div class="fields">${select("起手配方", "preset", styles, d.preset)}${select("批量", "volumeL", Object.fromEntries([20, 25, 30, 40, 45, 50].map((v) => [v, `${v} L`])), o.volumeL)}${field("这一桶的名字", `<input data-id="name" maxlength="32" placeholder="${escape(styles[d.preset])}" value="${escape(d.name)}">`)}${select("基础麦芽", "maltId", { ...following, ...malts }, o.maltId ?? "")}${select("水质", "waterId", { ...following, ...waters }, o.waterId ?? "")}${select("酵母", "yeastId", { ...following, ...yeasts }, o.yeastId ?? "")}</div><details><summary>拼一款自己的麦芽</summary><div class="fields">${select("拼配麦芽", "specialtyMaltId", { "": "沿用底方", "wheat-malt": "小麦麦芽", "flaked-oats": "燕麦片", "roasted-barley": "烘烤大麦", "black-malt": "黑麦芽", chocolate: "巧克力麦芽" }, o.specialtyMaltId ?? "")}${numeric("替换基础麦芽 · %", "specialtyPct", o.specialtyPct ?? 5, 0, 30)}</div></details>`,
    () =>
      `<div class="fields">${numeric("糖化温度 · °C", "mashC", o.mashC ?? r.mash.steps[0].tempC, 60, 73)}${select("酒花品种", "hopId", { ...following, ...hops }, o.hopId ?? "")}${numeric("干投总量 · g", "dryHopGrams", o.dryHopGrams ?? r.hops.filter((h) => h.use === "dryHop").reduce((a, h) => a + h.grams, 0), 0, 600)}${numeric("干投日 · 第几天", "dryHopDay", o.dryHopDay ?? dry?.day ?? 5, 0, 30)}${choice("投料", "precision", "逐一称重", "凭手感", d.choices.precision)}${choice("桶与管线", "sanitation", "认真清洁消毒", "匆匆冲洗", d.choices.sanitation)}${numeric("主发酵设定 · °C", "fermentC", o.fermentC ?? r.fermentation.steps[0].tempC, 7, 38)}${choice("桶温处理", "temperatureControl", "接上温控", "随室温发酵", d.choices.temperatureControl)}</div><details><summary>拼配酒花与锅边记录</summary><div class="fields">${select("另加一款酒花", "extraHopId", { "": "不加", ...hops }, o.extraHopId ?? "")}${numeric("加投量 · g", "extraHopGrams", o.extraHopGrams ?? 20, 0, r.batchVolumeL * 30)}${select("加投时机", "extraHopUse", { boil: "煮沸", whirlpool: "回旋沉淀", dryHop: "干投" }, o.extraHopUse ?? "whirlpool")}${numeric(o.extraHopUse === "dryHop" ? "接触天数" : "接触分钟", "extraHopTime", o.extraHopTime ?? (o.extraHopUse === "dryHop" ? 3 : 15), 0, o.extraHopUse === "dryHop" ? 21 : 120)}${o.extraHopUse === "dryHop" ? numeric("第几天加投", "extraHopDay", o.extraHopDay ?? 5, 0, 60) : ""}</div>${r.hops.map((h) => `<p class="small">${escape(hops[h.hopId] ?? h.hopId)} · ${escape(h.grams)} g · ${h.use === "dryHop" ? `第 ${h.day} 天干投` : h.use === "boil" ? `距熄火 ${h.time} 分钟` : "回旋沉淀"}</p>`).join("")}</details>`,
    () =>
      `<p class="log">${escape(events(b, "mash") ? "翻开糖化记录，再看桶里的变化。" : "麦汁入桶了。")}</p>${events(b, "mash")}<div class="fields"><p class="small">设定 ${o.fermentC ?? r.fermentation.steps[0].tempC} °C · ${d.choices.temperatureControl ? "控温发酵" : "随室温发酵"}</p></div>${events(b, "fermentation") || '<p class="small">这次巡桶，暂未发现异常。</p>'}${b.events.some((e) => e.id === "warm-night") ? choice("昨夜升温，今天怎么办？", "rescueWarm", "给发酵桶降温", "先照常观察", d.choices.rescueWarm) : ""}`,
    () =>
      `${events(b, "fermentation")}<div class="fields">${select("投入桶里", "adjunct", adjuncts, o.adjunct ?? "none")}${select("橡木桶熟成", "barrelDays", { 0: "直接分装", 30: "一个月", 180: "半年", 365: "一年", 730: "两年" }, o.barrelDays ?? 0)}</div>`,
    () =>
      `<div class="fields">${select("容器", "packaging", packs, r.packaging)}${choice("转移方式", "closedTransfer", "密闭转移", "敞口转移", d.choices.closedTransfer)}${numeric("储存温度 · °C", "storageC", r.storageC, 0, 30)}${numeric("分装后第几天开喝", "ageDays", r.ageDays, 0, 1095)}</div>`,
    () => {
      const t = taste(b, {
        ageDays: r.ageDays,
        packageType: r.packaging,
        styleId: d.benchmark || r.styleId,
      });
      return `${metrics(b)}<h3>杯里喝到的</h3><p>${escape(t.note)}</p>${events(b, "packaging")}<details><summary>把风味放到同一把尺上</summary>${t.axes.map((a) => `<div class="axis">${escape(a.label)} · ${a.value}<meter value="${a.value}" min="0" max="10"></meter><div class="axis-ticks" aria-hidden="true">${a.anchors.map((k) => `<i style="left:${k.value * 10}%"></i>`).join("")}</div><small>${a.anchors.map((k) => `${escape(k.label)} ${k.value}`).join(" ／ ")}</small></div>`).join("")}</details><div class="section">${select("风格对照", "benchmark", { "": "按底方评判", ...Object.fromEntries(STYLE_OPTIONS.map((s) => [s.id, s.name])) }, d.benchmark)}<h3>${escape(t.bjcp.name)} · ${t.bjcp.total}/50</h3><p class="small">${escape(t.bjcp.comment)}</p><details><summary>展开模拟评分</summary>${t.bjcp.parts.map((p) => `<p class="small">${escape(p.label)} · ${p.score} / ${p.max}</p>`).join("")}</details></div><div class="actions">${button("同方再酿 64 次", "risk")}<output id="risk"></output></div>`;
    },
  ];
  const steps = `<ol class="steps">${stages.map((s, n) => `<li ${n === i ? 'aria-current="step"' : ""}>${number(n + 1)} ${s}</li>`).join("")}</ol>`;
  return `<div class="spread">${scene(illustrations[i], scenes[i], b.metrics.srm, r.adjunct, r.packaging, `FIG. ${number(i + 1)}`, steps)}<section class="journal"><span class="kicker">楼下酒局 / BREW JOURNAL</span><h1>${i === 0 ? "今天酿什么？" : stages[i]}</h1><p class="intro">${notes[i]}</p><div class="section"><span class="folio">${number(i + 1)} / 06　·　批次 ${number(state.nextNumber)}</span><h2>${escape(d.name || styles[d.preset])}</h2>${controls[i]()}</div><div class="actions">${i ? button("上一步", "prev") : ""}${button(i === 5 ? "送去酒房上架 →" : ["开火 →", "麦汁入桶 →", "记下桶况 →", "准备分装 →", "开一杯 →"][i], "next", true)}</div></section></div>`;
}
function delivery(t) {
  const r = makeRecipe(t.d.preset, t.d.options),
    b = brew(r, t.d.seed, t.d.choices);
  const opts = {
    seed: t.d.seed,
    beerName: t.d.name || styles[t.d.preset],
    tap: t.slot + 1,
    volumeL: r.batchVolumeL,
    ageDays: r.ageDays,
    packageType: r.packaging,
  };
  return { b, r, opts, n: simulateNight(b, opts) };
}
function postHTML(p) {
  return `<article class="post"><header><b>${escape(p.name)}</b><small>${escape(p.time)}</small></header><p>${escape(p.text)}</p>${p.reply ? `<p class="reply">↳ ${escape(p.reply.name)}　${escape(p.reply.text)}</p>` : ""}</article>`;
}
function room() {
  const slot = state.selected,
    t = state.taps[slot],
    taplist = `<div class="taplist">${state.taps.map((x, i) => `<button type="button" data-slot="${i}" class="${slot === i ? "active" : ""}"><span class="tapno">席 ${number(i + 1)}</span>${x ? escape(x.d.name || styles[x.d.preset]) : "空位"}</button>`).join("")}</div>`;
  let srm = 8;
  let body = button("去厨房酿一桶", "kitchen", true);
  if (t) {
    const { r, b, n } = delivery(t);
    srm = b.metrics.srm;
    const posts = n.posts.filter((p) => p.session <= t.night);
    body = `<span class="folio">批次 ${number(t.number)} · ${packs[r.packaging]} · 第 ${t.night} 晚</span><h2>${escape(t.d.name || styles[t.d.preset])}</h2>${metrics(b)}<p>已出 ${n.servings.filter((p) => p.session <= t.night).length} 杯，留下 ${posts.length} 条酒评。</p><div class="actions">${t.night < n.sessionCount ? button("再开一晚 →", "night", true) : button("收起空酒牌", "archive", true)}${button("换 64 桌酒客看看", "sampling")}</div><output id="sampling"></output>${t.night < n.sessionCount ? "<details><summary>提前收酒</summary><p>已经喝过的人和他们的留言会留在手记里。</p>" + button("把剩下的倒到墙根", "dump") + "</details>" : ""}<h3>桌边留言</h3>${[...posts].reverse().map(postHTML).join("")}`;
  }
  return `<div class="spread">${scene("tap", "楼下酒房", srm, "none", "keg", "FIG. 07", "")}<section class="journal"><span class="kicker">楼下酒局 / TAPROOM</span><h1>今晚喝哪桶？</h1><p class="intro">六个酒位，桶装接酒头，瓶罐放冰柜。</p>${taplist}<div class="section">${body}</div>${state.archive.length ? `<details><summary>酒房手记 · ${state.archive.length} 桶</summary>${state.archive.map((t, i) => `<details data-archive="${i}"><summary>${number(t.number)} · ${escape(t.d.name || styles[t.d.preset])}</summary><div></div></details>`).join("")}</details>` : ""}</section></div>`;
}
function render() {
  app.innerHTML = state.view === "room" ? room() : kitchen();
  for (const [id, view] of [
    ["kitchenNav", "kitchen"],
    ["tapNav", "room"],
  ]) {
    const nav = document.getElementById(id);
    if (view === state.view) nav.setAttribute("aria-current", "page");
    else nav.removeAttribute("aria-current");
  }
}
app.addEventListener(
  "toggle",
  (e) => {
    const card = e.target;
    if (
      !card.open ||
      card.dataset.archive === undefined ||
      card.lastElementChild.innerHTML
    )
      return;
    const t = state.archive[Number(card.dataset.archive)],
      { b, n, opts, r } = delivery(t);
    card.lastElementChild.innerHTML = `<h3>开桶笔记</h3><p>${t.dumped ? "剩酒倒在了墙根。 " : "最后一杯喝完了。 "}${escape(packs[r.packaging])} · ${r.ageDays} 天</p><p>${escape(taste(b, opts).note)}</p><h3>桌边留言</h3>${n.posts
      .filter((p) => p.session <= t.night)
      .map(postHTML)
      .join("")}`;
  },
  true,
);
function go(view) {
  state.view = view;
  render();
  save();
}
document.querySelector("#brand").onclick = (e) => {
  e.preventDefault();
  go("kitchen");
};
document.querySelector("#kitchenNav").onclick = () => go("kitchen");
document.querySelector("#tapNav").onclick = () => go("room");
app.addEventListener("change", (e) => {
  const el = e.target,
    id = el.dataset.id;
  if (!id) return;
  if (!el.checkValidity()) {
    el.reportValidity();
    return;
  }
  const before = structuredClone(state.draft),
    d = state.draft;
  const opened = [...app.querySelectorAll("details")].map((x) => x.open);
  if (id === "preset") {
    d.preset = el.value;
    d.options = { volumeL: d.options.volumeL };
    d.benchmark = "";
  } else if (["name", "benchmark"].includes(id)) d[id] = el.value;
  else if (
    [
      "precision",
      "sanitation",
      "closedTransfer",
      "temperatureControl",
      "rescueWarm",
    ].includes(id)
  )
    d.choices[id] = el.value === "yes";
  else if (id === "extraHopUse") {
    d.options[id] = el.value;
    delete d.options.extraHopTime;
  } else if (!el.value) delete d.options[id];
  else
    d.options[id] =
      el.type === "number" || ["barrelDays", "volumeL"].includes(id)
        ? Number(el.value)
        : el.value;
  try {
    render();
    save();
  } catch (err) {
    state.draft = before;
    render();
    notice(err.message);
  }
  app.querySelectorAll("details").forEach((x, i) => (x.open = !!opened[i]));
  app.querySelector(`[data-id="${id}"]`)?.focus();
});
app.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const d = state.draft,
    a = btn.dataset.act;
  if (btn.dataset.slot !== undefined) {
    state.selected = Number(btn.dataset.slot);
  } else if (a === "kitchen") {
    go("kitchen");
    return;
  } else if (a === "prev") {
    d.step--;
  } else if (a === "next") {
    if (d.step < 5) d.step++;
    else {
      let slot = state.taps[state.selected]
        ? state.taps.indexOf(null)
        : state.selected;
      if (slot < 0) {
        notice("六席都满了。等一席喝完再上酒。");
        return;
      }
      state.taps[slot] = {
        slot,
        number: state.nextNumber++,
        d: structuredClone(d),
        night: 1,
      };
      state.selected = slot;
      state.draft = newDraft();
      state.view = "room";
    }
  } else if (a === "night") {
    state.taps[state.selected].night++;
  } else if (a === "archive" || a === "dump") {
    state.taps[state.selected].dumped = a === "dump";
    state.archive.push(state.taps[state.selected]);
    state.taps[state.selected] = null;
  } else if (a === "risk") {
    const m = sampleBrews(makeRecipe(d.preset, d.options), {
      seed: d.seed,
      runs: 64,
      choices: d.choices,
    });
    document.querySelector("#risk").textContent =
      `出现意外 ${Math.round(m.anyEventRate * 100)}% · ABV 中间八成 ${m.metrics.abv.p10.toFixed(1)}–${m.metrics.abv.p90.toFixed(1)}%`;
    return;
  } else if (a === "sampling") {
    const { b, opts } = delivery(state.taps[state.selected]);
    const m = sampleTastings(b, { ...opts, runs: 64 });
    document.querySelector("#sampling").textContent =
      `同一桶换一批客人，中间八成的场次留下 ${m.reviews.p10}–${m.reviews.p90} 条酒评。`;
    return;
  } else return;
  render();
  save();
});
render();
