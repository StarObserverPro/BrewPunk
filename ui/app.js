import {cropPlate} from "./framing.js";
import {sessionOf,linesFor} from "./service.js";
import { materialArt } from "./adjunct-art.js";
import { adjudicateDraft, applyAdjudication, voicePosts } from "./ai-client.js";
import { compareAdjunct } from "../core/adjunct-comparison.js";
import { offlineProfile } from "../core/adjuncts.js";
import { taste, STYLE_OPTIONS } from "../core/tasting.js";
import { sampleBrews } from "../core/brew.js";
import { sampleTastings, packageCondition } from "../core/taproom.js";
import { wort, sketch } from "./art.js";
import { nightFeed, feedProgress, readingDelay } from "./live-feed.js";
import { incidents, incidentFrames, resetResponses } from "./incidents.js";
import { taproomPlate, taproomShot, shots } from "./taproom-art.js";
import { packagingShot, packagingSequence } from "./packaging-art.js";
import { assetAlbum } from "./asset-album.js";
import { ingredientsPage } from "./ingredient-cards.js";
import { kitchenPlate, shotFor } from "./kitchen-art.js";
import {
  blank, restore, batchOf, styles, stages, packs, beerName,
  shelve, nextNight, archiveTap, delivery, nightStatus,
} from "./flow.js";

const app = document.querySelector("#app");
const storageKey = "brewpunk.journal.v2";
const escape = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const malts = { pilsner: "皮尔森", "pale-ale": "淡色艾尔", "maris-otter": "玛丽斯奥特", vienna: "维也纳" };
const waters = { balanced: "均衡", "soft-pilsner": "软水", "hop-forward": "突出酒花", "malt-forward": "突出麦芽", "dark-alkaline": "深色酒用水" };
const yeasts = { "american-ale": "美式艾尔", "neipa-ale": "新英格兰艾尔", "czech-lager": "捷克拉格", "kveik-voss": "沃斯农家酵母" };
const hops = { citra: "西楚", mosaic: "马赛克", cascade: "卡斯卡特", simcoe: "西姆科", saaz: "萨兹" };
const adjuncts = { none: "原味", cocoa: "可可碎", coffee: "咖啡", cherry: "樱桃", chili: "辣椒", coconut: "椰片", pretzel: "椒盐扭结饼干", custom:"自己添一种" };
const inherited = { "": "沿用底方" };
const locations = ["厨房 · 备料桌", "厨房 · 炉灶旁", "发酵角落 · 巡桶", "厨房 · 增味台", "厨房 · 分装台", "窗前 · 第一杯"];
const artStages = ["recipe", "mash", "ferment", "adjunct", "pack", "taste"];
let state;
let loadWarning = "";
let originalSave = "";
try {
  const saved = localStorage.getItem(storageKey) || localStorage.getItem("brewpunk.novel.sandbox.v1");
  const legacy = saved ? null : localStorage.getItem("brewpunk.journal.v1");
  originalSave = saved || legacy || "";
  state = saved || legacy ? restore(JSON.parse(saved || legacy)) : blank();
} catch {
  state = blank();
  loadWarning = "这份手记暂时无法读取。可在手记的「偏好」里导出原始存档，保留后再开始。";
}
let storageBroken = false;
let alarmTimer;
const timedFrame = f => f && (f.choice === "warm" || (f.choice === "incident" && !["closure","storage-warm","tap-foam"].includes(f.eventId)));
const clockArt = '<svg class="alarm" aria-label="约三秒后自动选择" role="img" viewBox="0 0 64 58" fill="none" stroke="#493a29" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"><path fill="#e8a555" d="M5 18Q4 8 15 5l7 3-13 13ZM43 7q12-7 17 9l-4 5Z"/><path fill="#ffebbf" d="M12 28q1-17 21-17 21 2 20 22-2 18-22 18-21-1-19-23Z"/><path d="m32 19-1 13 11 3m-23 13-5 7m32-7 5 5M4 25l-3 6m57-6 4 5"/><path opacity=".6" d="M16 24q3-9 12-10m5 33q11 0 14-8"/></svg>';
let noticeTimer;
let typingTimer;
let typing = false;
let overlayReturnFocus = null;
let feedTimer;

let roomArrived = false;
let feedAnimation;
let transitionGhost;
let transitionAnimation;
let transitionBusy = false;
const reducedMotion = () => !state.settings.motion || matchMedia("(prefers-reduced-motion: reduce)").matches;
function notice(text, sticky = false) {
  const el = document.querySelector("#notice");
  el.textContent = text;
  el.toggleAttribute("data-sticky", sticky);
  clearTimeout(noticeTimer);
  if (!sticky) noticeTimer = setTimeout(() => {
    if (!storageBroken) el.textContent = "";
  }, 5000);
}
function save() {
  try {
    if (loadWarning && originalSave) localStorage.setItem(storageKey + ".unreadable", originalSave);
    localStorage.setItem(storageKey, JSON.stringify(state));
    storageBroken = false;
  } catch {
    storageBroken = true;
    notice("手记没有写入成功。请在关闭前从「手记 → 偏好」导出存档。", true);
  }
}
const btn = (text, action, cls = "choice", attrs = "") =>
  '<button type="button" class="' + cls + '" data-act="' + action + '" ' + attrs + ">" + escape(text) + "</button>";
const field = (label, control) => "<label>" + escape(label) + control + "</label>";
function select(label, name, values, current) {
  return field(label, '<select name="' + name + '">' + Object.entries(values).map(([v, text]) =>
    '<option value="' + escape(v) + '"' + (String(current) === v ? " selected" : "") + ">" + escape(text) + "</option>").join("") + "</select>");
}
function numeric(label, name, value, min, max, step = "any") {
  return field(label, '<input required type="number" name="' + name + '" value="' + escape(value) + '" min="' + min + '" max="' + max + '" step="' + step + '">');
}
const yesno = (label, name, yes, no, current) => select(label, name, { yes, no }, current ? "yes" : "no");
function panel(title, content, canClose = true) {
  return '<div class="scrim"><section class="panel" role="dialog" aria-modal="true" aria-label="' + escape(title) + '" tabindex="-1"><div class="panel-head"><h1>' + escape(title) + "</h1>" + (canClose ? btn("×", "close", "close", 'aria-label="收起"') : "") + "</div>" + content + "</section></div>";
}
function frame(text, options = {}) { return { text, ...options }; }
function currentFrame() {
  const stored = state.story.frames[state.story.index];
  if (!stored.dynamic) return stored;
  const { recipe, batch } = batchOf(state.draft);
  const texts = {
    barrel: "与木材接触 " + batch.barrelDays + " 天后，把这段日子写回桶签。",
    yield: "记录实际可分装的 " + batch.yieldL.toFixed(2) + " L，把批签系好。",
    cup: state.draft.adjudication?.note || taste(batch, cupOptions(state.draft, recipe, batch)).note,
  };
  return { ...stored, text: texts[stored.dynamic] };
}
function cupOptions(draft, recipe, batch) {
  const condition = recipe.processVersion >= 2 ? packageCondition(batch, recipe.packaging, 0) : {};
  return { ageDays: recipe.ageDays, packageType: recipe.packaging, styleId: draft.benchmark || recipe.styleId, ...condition };
}
function logCurrent() {
  const story = state.story;
  if (!story) return;
  const f = currentFrame();
  state.history.push({ text: f.text, speaker: f.speaker || "我的手记", title: story.title });
  if (state.history.length > 500) state.history.shift();
}
function play(title, frames, ending = {}) {
  state.overlay = null;
  state.story = { title, frames, index: 0, ending };
}
function finishStory() {
  const end = state.story.ending;
  state.story = null;
  if (end.step !== undefined) state.draft.step = end.step;
  if (end.inspected) {state.draft.inspected = true;state.draft.step=3;}
  if (end.tasted) state.draft.tasted = true;
  offerServiceIncident();
}
function offerServiceIncident() {
  if (state.view !== "room" || state.story || sessionOf(state).closed) return;
  for(const other of state.taps.slice(0,3))if(other && other.slot!==state.selected)supplyNight(other);
  const tap = state.taps[state.selected];
  if (!tap || batchOf(tap.d).recipe.processVersion < 2) return;
  if (tap.serviceChoices?.[tap.night]?.chillLine !== undefined) {supplyNight(tap);return;}
  const event = delivery(tap).night.serviceEvents.find(e => e.session === tap.night && e.id === "tap-foam");
  if (!event) {supplyNight(tap);return;}
  play("酒头的第一杯", [frame("第一杯泡沫特别多，接液杯很快就满了一层。", { art: "tap", take: "首杯泡沫", choice: "incident", eventId: "tap-foam" })]);
}
function chooseIncident(rescue) {
  const f = currentFrame();
  if (f.choice !== "incident") return;
  const definition = incidents[f.eventId];
  logCurrent();
  let draft = state.draft;
  if (f.eventId === "tap-foam") {
    const tap = state.taps[state.selected];
    tap.serviceChoices ??= {};
    tap.serviceChoices[tap.night] = { chillLine: rescue };
    draft = tap.d;
  } else draft.choices[definition.control] = rescue;
  if (f.eventId === "wild-acid" && rescue) draft.benchmark = "sour-ipa";
  const { batch } = batchOf(draft);
  const result = frame(definition.result(batch, rescue), {
    art: f.eventId === "tap-foam" ? "tap" : f.art,
    shot: f.eventId === "airlock-foam" && rescue ? "blowoff" :
      f.eventId === "boil-over" && rescue ? "boiling" : f.shot,
    eventId: f.eventId, incidentResult: true,
    warmResult: f.eventId === "warm-night",
  });
  state.history.push({ title: "我的决定", speaker: "我", text: rescue ? definition.yes : definition.no });
  state.story.frames.splice(state.story.index, 1, result);
}
function advance(skip = false) {
  if (!state.story) return;
  if (typing && !skip) { revealText(); return; }
  const from=state.story.index;
  do {
    const f = state.story.frames[state.story.index];
    if (f.choice || (skip && addAt(f) && state.story.index!==from)) return;
    logCurrent();
    if (state.story.index + 1 === state.story.frames.length) {
      finishStory();
      break;
    }
    state.story.index++;
  } while (skip);
}
function inspectBucket() {
  const { batch } = batchOf(state.draft);
  const warm = batch.events.find((e) => e.id === "warm-night");
  const frames = [frame("入夜了，发酵角还亮着一盏灯。", { art: "ferment", shot: "fermentation-night" }),
    frame("把记录本翻到昨夜那页，看看温度和排气。", { art: "ferment", shot: "night" })];
  if (warm && batch.recipe.processVersion >= 2) frames.push(...incidentFrames(state.draft, ["warm-night"]));
  else if (warm) {
    frames.push(frame("昨夜酒液比设定高了 " + warm.magnitude.toFixed(1) + " °C。冰袋还在冷冻格里。", { art: "ferment", take: "昨夜的桶温", choice: "warm" }));
  } else {
    frames.push(frame("这次巡桶，暂未发现温度异常。把温度计挂回去。", { art: "ferment" }));
  }
  if (!warm || batch.recipe.processVersion >= 2) frames.push(...fermentRest(state.draft));
  play("发酵桶边", frames, { inspected: true });
}
function acidFrames(batch) {
  const acid = batch.events.find((e) => e.id === "wild-acid");
  if (acid && batch.recipe.processVersion >= 2) return incidentFrames(state.draft, ["wild-acid"]);
  return acid
    ? [frame("发酵末段，取样杯里多了一股意料外的酸味。我在本子上记下了这个变化。", { art: "ferment", take: "末段取样" })]
    : [frame("末段取样没有发现意外酸味。合上本子，接着看看这一桶还想加点什么。", { art: "ferment" })];
}
function fermentRest(draft) {
  const { recipe, batch } = batchOf(draft);
  const dryHops = recipe.hops.filter((hop) => hop.use === "dryHop" && hop.grams > 0).sort((a, b) => a.day - b.day);
  return [
    frame("清早再来，光已经落在罐盖上。翻开桶签，看看今天要做什么。", { art: "ferment", shot: "fermentation-day", calendar: true }),
    ...incidentFrames(draft, ["airlock-foam"]),
    ...dryHops.map((hop) => frame("第 " + hop.day + " 天，按桶签上的日程投入 " + hop.grams.toFixed(1) + " g " + (hops[hop.hopId] || hop.hopId) + "，接触 " + hop.time + " 天。", { art: "ferment", shot: "active", brewDay:hop.day,take: "桶边干投" })),
    ...incidentFrames(draft, ["dryhop-contact"]),
    ...acidFrames(batch),
  ];
}
function chooseWarm(rescue) {
  if (state.story?.frames[state.story.index]?.choice !== "warm") return;
  logCurrent();
  state.draft.choices.rescueWarm = rescue;
  const { batch } = batchOf(state.draft);
  const event = batch.events.find((e) => e.id === "warm-night");
  state.history.push({ title: "我的决定", speaker: "我", text: rescue ? "换上冰袋。" : "先照常观察。" });
  play("发酵桶边", [
    frame(rescue ? "冰袋有点滑，我把它往桶底挪了挪。" : "我在刻度旁画了个圈，留着晚点对照。", { art: "ferment", take: rescue ? "换上冰袋" : "圈下读数" }),
    frame("窗光挪到了另一边。第二天的记录里，酒液比设定高 " + event.secondDayDeltaC.toFixed(1) + " °C。昨夜的读数仍留在上一行。", { art: "ferment", calendar: true, warmResult: true }),
    ...fermentRest(state.draft),
  ], { inspected: true });
}
function tastingFrames(draft) {
  const { recipe, batch } = batchOf(draft);
  const condition = recipe.processVersion >= 2 ? packageCondition(batch, recipe.packaging, 0) : {};
  const closure = condition.co2Loss > 0 || condition.oxygen > batch.exposure + 0.1;
  return [
    ...(closure ? [frame("打开第一只容器，气泡或香气和预想不一样。先把这只的编号圈下来。", {
      art: "pack", shot: packagingShot(recipe.packaging, "seal"), choice: "incident", eventId: "closure", take: "第一只容器",
    })] : []),
    frame("把杯子举到窗前。泡沫落下一点，杯沿的颜色亮了起来。", { art: "taste", take: "第一杯" }),
    frame("", { art: "taste", speaker: "开杯笔记", dynamic: "cup" }),
    frame("这就是这一锅在今天的味道。酒牌还空着一个角，正好写下它的名字。", { art: "taste" }),
  ];
}
function readNight() {
  openJournal("room");
  state.overlay.expandComments = true;
}
function sceneState() {
  const t = state.view === "room" ? state.taps[state.selected] : null;
  const d = t?.d || state.draft;
  const { recipe, batch } = batchOf(d);
  const storyFrame = state.story ? currentFrame() : null;
  const art = storyFrame?.art || (state.view === "room" ? "tap" : artStages[d.step]);
  const warm = batch.events.find((e) => e.id === "warm-night");
  return { t, d, recipe, batch, storyFrame, art, warm };
}
function roomShot(tap, batch, storyFrame) {
  if (!tap || storyFrame || !roomArrived) return "empty";
  const night = delivery(tap).night;
  const entries = nightFeed(night, tap.night);
  return taproomShot({
    servings: night.servings.filter(s => s.session === tap.night),
    shown: feedProgress(tap, entries.length).shown,
    evening: tap.night,
    batchSeed: tap.d.seed,
    srm: batch.metrics.srm,
    sour: batch.recipe?.adjunct === "cherry" || tap.d.adjunct === "cherry" || batch.sensory.acidity >= 3.5,
  });
}
let camTimer;
function mountCamera(){
 clearTimeout(camTimer);
 const first=app.querySelector(".taproom-photo");if(!first||reducedMotion()||state.overlay)return;
 let prev=first,key="empty";
 function next(){
   if(!prev.isConnected)return;
   const pool=shots.filter(x=>x!==key);key=pool[Math.floor(Math.random()*pool.length)];
   const layer=document.createElement("template");layer.innerHTML=taproomPlate(key);
   const image=layer.content.firstElementChild;image.style.opacity=0;
   image.onload=()=>{if(!prev.isConnected)return;const old=prev;prev=image;
     image.animate([{opacity:0},{opacity:1}],{duration:9000,easing:"ease-in-out"}).finished.then(()=>{image.style.opacity=1;old.remove();});
     camTimer=setTimeout(next,22000+Math.random()*10000);
   };prev.after(image);image.onerror=()=>{image.remove();camTimer=setTimeout(next,20000);};
 }
 camTimer=setTimeout(next,6000);
}
function sceneHTML(context) {
  const { d, recipe, batch, storyFrame: f, art, warm } = context;
  let prop = "";
  if (art === "ferment" && (f?.choice === "warm" || d.inspected || f?.warmResult)) {
    const delta = (d.inspected || f?.warmResult) && d.choices.rescueWarm ? warm?.secondDayDeltaC : warm?.magnitude;
    const measured = (recipe.fermentation.steps[0].tempC + (delta || 0)).toFixed(1);
    prop = '<div class="scene-object">桶温记录<strong>' + measured + '°</strong>设定 ' + recipe.fermentation.steps[0].tempC + "°</div>";
  }
  if (art === "ferment" && d.choices.rescueWarm) prop += '<div class="ice">冰袋</div>';
  const shot = f?.shot || shotFor(art, recipe.packaging);
  const delta = f?.warmResult ? warm?.secondDayDeltaC :
    f?.eventId === "warm-night" || f?.choice === "warm" ? warm?.magnitude : d.inspected ? warm?.secondDayDeltaC : 0;
  const pitch = batch.events.find(e => e.id === "pitch-warm");
  const mashDrop = f?.eventId === "mash-cool" && !(f.incidentResult && d.choices.mashRescue)
    ? batch.events.find(e => e.id === "mash-cool")?.magnitude || 0 : 0;
  const temperature = ["boiling", "hops", "boilover"].includes(shot) ? "100" :
    shot === "mashing" ? (recipe.mash.steps[0].tempC - mashDrop).toFixed(1) :
    ["cooling", "pitching"].includes(shot) ? (recipe.fermentation.steps[0].tempC + (pitch?.effectiveMagnitude || 0)).toFixed(1) :
    art === "ferment" ? (recipe.fermentation.steps[0].tempC + (delta || 0)).toFixed(1) : "—";
  const picture = art==="taste" ? '<svg data-subject="first-cup" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid slice" role="img" aria-label="窗边的第一杯"><image href="assets/kitchen/first-cup.png" width="1536" height="1024"/><path d="M653 284Q766 278 880 284C896 338 920 424 834 472Q771 500 704 473C625 432 628 365 653 284Z" fill="'+wort(batch.metrics.srm)+'" opacity="'+Math.min(.89,.09+batch.metrics.srm*.022)+'" style="mix-blend-mode:multiply"/></svg>' : art === "tap" && !f?.shot ? taproomPlate(roomShot(context.t, batch, f)) : kitchenPlate(shot, temperature);
  if (picture) prop = "";
  if(f?.detail==="filter")prop='<figure class="process-slip"><svg viewBox="0 0 156 100" role="img" aria-label="麦汁穿过滤床，沿管流进量杯"><g stroke="#554431" stroke-width="4" fill="none" stroke-linejoin="round" stroke-linecap="round"><path fill="#ead29c" d="m9 12 70 1-7 36-18 13-2 12-14 1-2-14-20-17z"/><path d="m19 33 50 1m-44 8 40 1m-20 33 1 9 43-1 4-26"/><path fill="#d79a4c" d="m96 52 43-2-4 39-34-1z"/><path d="m120 60 10-1m-11 10 9-1"/></g></svg><figcaption>慢慢滤，别搅动麦床</figcaption></figure>';
  if(f?.take==="桶边干投")prop+='<div class="process-slip">'+ingredientsPage(["hops"],d.seed)+'</div>';
  if(art==="recipe" && f && !f.choice)prop+='<div class="grain-shot">'+maltTray(recipe)+'</div>';
  if (art === "adjunct" && !recipe.customAdjunct && !f?.calendar)prop+='<figure class="process-slip">'+ingredientsPage(["fruit"],d.seed)+'</figure>';
  if (art === "adjunct" && recipe.customAdjunct && !f?.calendar)
    prop += '<figure class="material-inset">' + materialArt(recipe.customAdjunct.profile.tone,recipe.customAdjunct.stage) + '</figure>';
  return '<section class="scene ' + (picture ? "painted " : "") + (f?.take ? "cut-in " : "") + (f?.calendar ? "calendar" : "") + '" aria-label="' + escape(art === "tap" ? "六头酒屋" : locations[d.step]) + '"><div class="art">' +
    (picture || sketch(art, batch.metrics.srm, recipe.adjunct === "none" ? "" : recipe.adjunct, recipe.packaging).replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" ')) +
    '<span class="batch-tag">' + escape(beerName(d)) + "</span>" + prop + "</div>" +
    (f?.take ? '<div class="take-title">' + escape(f.take) + "</div>" : "") + "</section>";
}
function addAt(f){return !f?.incidentResult && !f?.choice && ({boiling:"boil",pitching:"pitch","fermentation-day":"active",active:"active"})[f?.shot];}
function readerHTML() {
  const f = currentFrame();
  const options = f.choice === "incident" ? incidents[f.eventId] : f.choice === "warm" ? { yes: "换上冰袋", no: "先照常观察" } : null;
  const choices = options ? '<div class="story-choices">' + (timedFrame(f) ? clockArt : '') +
    btn(options.yes, f.choice === "warm" ? "warm-cool" : "incident-yes") +
    btn(options.no, f.choice === "warm" ? "warm-watch" : "incident-no") + "</div>" : "";
  return (addAt(f)?'<aside class="adjunct-sign">'+btn("等会！咱加点这个…","add-now","main-action")+'</aside>':"")+'<section class="story-area" aria-label="过场">' + choices + '<div class="readbox">' +
    (f.speaker ? '<p class="speaker">' + escape(f.speaker) + "</p>" : "") +
    '<p class="story-text" id="story-text" aria-live="polite">' + escape(f.text) + '</p><div class="reader-actions">' +
    (f.choice ? "" : btn("快进至选择或结果", "skip", "subtle") + btn("继续 ▷", "continue", "continue")) +
    "</div></div></section>";
}
function mainAction() {
  if (state.view === "room") {
    const svc=sessionOf(state);
    return '<div class="action-area service-actions">'+(svc.closed?btn("回顾当晚","review")+btn("次日厨房","morning")+btn("下一晚营业","new-service"):btn("打烊","close-service","book-toggle"))+'</div>';
  }
  const d = state.draft;
  const label = ["翻开酒单", "看看锅边的工艺单", d.inspected ? "去增味台" : "巡一巡发酵桶", "想添点什么", "把这一锅装起来", d.tasted ? "送去楼下酒屋" : "尝第一杯"][d.step];
  if(d.step===3)return '<div class="adjunct-sign">'+btn("等会！咱加点这个…","add-now","main-action")+'</div><div class="action-area">'+btn(d.addedAt?"保留已加原料，去分装":"照原方，去分装","plain","subtle")+'</div>';
  return '<div class="action-area">' + btn(opening === d ? "正在尝这杯…" : label, "main", "main-action", opening === d ? "disabled" : "") +
    (d.step === 5 && d.tasted ? btn("翻看开杯笔记", "tasting", "subtle") : "") + "</div>";
}
function tapStrip() {
  const svc=sessionOf(state);if(svc.closed)return "";
  return '<nav class="tap-strip" aria-label="按酒头筛选">'+[0,1,2,3,4,5].map(i=>btn((i+1)+" · "+(i<3?(state.taps[i]?beerName(state.taps[i].d):"待上酒"):svc.house[i-3]),"filter","tap","data-slot="+i+" aria-pressed="+(svc.filter===i))).join("")+'</nav>';
}
function feedHTML(){if(state.view!=="room"||state.story||sessionOf(state).closed)return "";return '<aside class="live-feed"><div class="live-window"><div class="live-track" id="live-track" role="log"></div></div><p class="live-status" id="live-status"></p></aside>';}
function feedEntryHTML(e){return '<article class="live-message" data-slot="'+e.slot+'"><b class="live-name">'+escape(e.beer+" · "+e.name)+'</b><span class="live-copy">'+escape(e.text)+'</span>'+(e.reply&&!sessionOf(state).replies[e.id]?btn("接一句","reply","subtle",'data-id="'+escape(e.id)+'"'):"")+'</article>';}
function mountFeed(){
 const track=app.querySelector("#live-track");if(!track)return;
 const svc=sessionOf(state),all=linesFor(state); svc.cursor=Math.min(svc.cursor,all.length);
 const show=()=>{const visible=all.slice(0,svc.cursor).filter(e=>svc.filter==null||svc.filter===e.slot);track.innerHTML=visible.slice(-8).map(feedEntryHTML).join("");app.querySelector("#live-status").textContent=svc.filter==null?"全屋 · 第 "+svc.day+" 晚":"第 "+(svc.filter+1)+" 头 · 再点一次听全屋";};
 show();function tick(){feedTimer=setTimeout(()=>{if(!track.isConnected)return;if(state.overlay||document.hidden){tick();return;}if(svc.cursor>=all.length){svc.closed=true;save();render();return;}const before=track.getBoundingClientRect().height;svc.cursor++;show();if(!reducedMotion())track.animate([{transform:"translateY("+Math.max(0,track.getBoundingClientRect().height-before)+"px)"},{transform:"none"}],{duration:1700});save();tick();},Math.max(7000,readingDelay(all[svc.cursor-1]?.text||"")));}tick();
}
function fadeSnapshot() {
  transitionGhost?.remove();
  transitionAnimation?.cancel();
  if (!app.firstChild || reducedMotion()) return null;
  const ghost = app.cloneNode(true);
  ghost.removeAttribute("id");
  ghost.className = "transition-ghost";
  ghost.inert = true;
  ghost.setAttribute("aria-hidden", "true");
  ghost.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  document.body.appendChild(ghost);
  for (const selector of [".panel", ".readbox"]) {
    const previous = app.querySelector(selector);
    const snapshot = ghost.querySelector(selector);
    if (previous && snapshot) snapshot.scrollTop = previous.scrollTop;
  }
  transitionGhost = ghost;
  return ghost;
}
function crossfade(ghost) {
  if (!ghost) { transitionBusy = false; delete app.dataset.transitioning; return; }
  transitionBusy = true;
  app.dataset.transitioning = "true";
  const outgoing = ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 480, fill: "forwards" });
  transitionAnimation = app.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 480, fill: "both" });
  outgoing.finished.catch(() => {}).then(() => {
    ghost.remove();
    if (transitionGhost === ghost) {
      transitionBusy = false;
      delete app.dataset.transitioning;
    }
  });
}
const grainImages=["assets/ingredients/grain-pale.png","assets/ingredients/grain-gold.png","assets/ingredients/grain-amber.png","assets/ingredients/grain-dark.png"];
function maltTray(r){return '<div class="malt-tray">'+r.fermentables.map(g=>{const id=g.fermentableId,n=/roast|black|chocolate/.test(id)?3:/crystal|cara/.test(id)?2:/munich|vienna|otter|pale-ale/.test(id)?1:0;return '<figure><img src="'+grainImages[n]+'" alt=""><figcaption>'+escape(malts[id]||({"flaked-oats":"燕麦片","wheat-malt":"小麦麦芽","roasted-barley":"烘烤大麦","black-malt":"黑麦芽",chocolate:"巧克力麦芽"}[id])||id)+' · '+g.weightKg.toFixed(2)+' kg</figcaption></figure>';}).join("")+'</div>';}
function formHTML(stage, d) {
  const o = d.options, c = d.choices;
  // Preserve temporarily invalid edits across refresh without asking the engine
  // to compute them. Native validation and the engine check run on submission.
  let r;
  try { r = batchOf(d).recipe; }
  catch { r = batchOf(state.draft).recipe; }
  const dry = r.hops.find((h) => h.use === "dryHop");
  const fields = [
    () => '<div class="radio-cards">' + Object.entries(styles).map(([id, name]) =>
      '<label class="radio-card"><input required type="radio" name="preset" value="' + id + '" ' + (d.picked && d.preset === id ? "checked" : "") + ">" + name + "</label>").join("") + '</div><div class="fields">' +
      select("这一锅的量", "o.volumeL", { 10: "10 L", 20: "20 L", 25: "25 L", 30: "30 L", 40: "40 L", 45: "45 L", 50: "50 L" }, o.volumeL) +
      field("写个酒名", '<input name="name" maxlength="32" placeholder="' + escape(styles[d.preset]) + '" value="' + escape(d.name) + '">') +
      '</div>',
    () => '<h3>这桶的配料 · '+r.batchVolumeL+' L</h3>'+maltTray(r)+'<div class="fields">'+
      select("基础麦芽", "o.maltId", { ...inherited, ...malts }, o.maltId ?? "") +
      select("水质", "o.waterId", { ...inherited, ...waters }, o.waterId ?? "") +
      select("酵母", "o.yeastId", { ...inherited, ...yeasts }, o.yeastId ?? "") +
      select("拼配麦芽", "o.specialtyMaltId", { "": "沿用底方", "wheat-malt": "小麦麦芽", "flaked-oats": "燕麦片", "roasted-barley": "烘烤大麦", "black-malt": "黑麦芽", chocolate: "巧克力麦芽" }, o.specialtyMaltId ?? "") +
      numeric("置换基础麦芽 · %", "o.specialtyPct", o.specialtyPct ?? 5, 0, 30) + '</div>'+'<div class="dose-sheet">'+ingredientsPage(["hops","yeast"],d.seed)+'<p>'+r.hops.map(h=>escape(hops[h.hopId]||h.hopId)+" "+Number(h.grams.toFixed(2))+" g").join(" ／ ")+'</p><p>'+escape(yeasts[r.fermentation.yeastId]||r.fermentation.yeastId)+' · 干酵母备料估算 '+Number((r.batchVolumeL*(r.fermentation.pitchRate==="over"?1:.6)).toFixed(1))+' g</p></div><div class="fields">'+
      numeric("糖化温度 · °C", "o.mashC", o.mashC ?? r.mash.steps[0].tempC, 55, 75) +
      numeric("主发酵设定 · °C", "o.fermentC", o.fermentC ?? r.fermentation.steps[0].tempC, 5, 40) +
      yesno("投料", "c.precision", "逐一称重", "凭手感", c.precision) +
      yesno("桶与管线", "c.sanitation", "认真清洁消毒", "匆匆冲洗", c.sanitation) +
      yesno("桶温处理", "c.temperatureControl", "接上温控", "随室温发酵", c.temperatureControl) +
      '</div><details><summary>翻到投花日程</summary><div class="fields">' +
      select("酒花品种", "o.hopId", { ...inherited, ...hops }, o.hopId ?? "") +
      numeric("干投总量 · g", "o.dryHopGrams", o.dryHopGrams ?? r.hops.filter((h) => h.use === "dryHop").reduce((s, h) => s + h.grams, 0), 0, r.batchVolumeL * 30) +
      numeric("第几天干投", "o.dryHopDay", o.dryHopDay ?? dry?.day ?? 5, 0, 60) +
      select("另加一款酒花", "o.extraHopId", { "": "不加", ...hops }, o.extraHopId ?? "") +
      numeric("加投量 · g", "o.extraHopGrams", o.extraHopGrams ?? r.batchVolumeL*.8, 0, r.batchVolumeL * 30) +
      select("加投时机", "o.extraHopUse", { boil: "煮沸", whirlpool: "回旋沉淀", dryHop: "干投" }, o.extraHopUse ?? "whirlpool") +
      numeric(o.extraHopUse === "dryHop" ? "接触天数" : "接触分钟", "o.extraHopTime", o.extraHopTime ?? (o.extraHopUse === "dryHop" ? 3 : 15), 0, o.extraHopUse === "dryHop" ? 21 : 120) +
      (o.extraHopUse === "dryHop" ? numeric("第几天加投", "o.extraHopDay", o.extraHopDay ?? 5, 0, 60) : "") +
      "</div></details>",
    () => "",
    () => state.overlay.when ? customForm(o) : '<div class="fields">' + select("放到桶里", "o.adjunct", adjuncts, o.adjunct ?? "none") +
      customForm(o) + select("木材接触与陈放", "o.barrelDays", { 0: "直接分装", 30: "一个月", 180: "半年", 365: "一年", 730: "两年" }, o.barrelDays ?? 0) + "</div>",
    () => '<div class="fields">' + select("这次用什么装", "o.packaging", packs, r.packaging) +
      yesno("转移方式", "c.closedTransfer", "密闭转移", "敞口转移", c.closedTransfer) +
      numeric("储存温度 · °C", "o.storageC", r.storageC, 0, 30) +
      numeric("分装后第几天开喝", "o.ageDays", r.ageDays, 0, 1095) + "</div>",
  ];
  const illustrations = stage === 0 ? ""
    : stage === 3 && o.adjunct !== "custom" ? ingredientsPage(["fruit"], d.seed) : "";
  const controls=fields[stage]();if(stage===0){const cut=controls.indexOf('<div class="fields">');return controls.slice(0,cut)+(d.picked?illustrations+controls.slice(cut):"");}return illustrations+controls;
}
function customForm(o) {
  if(o.adjunct!=="custom") return "";
  const a=o.customAdjunct||{name:"",preparation:"",grams:45,stage:"pitch"};
  const tone=(a.profile || offlineProfile(a.name,a.preparation)).tone;
  return '<div class="material-preview">'+materialArt(tone,a.stage)+'</div>'+
    field("放点什么",'<input required name="x.name" maxlength="80" placeholder="例如大蒜" value="'+escape(a.name)+'">')+
    field("怎么处理",'<input name="x.preparation" maxlength="120" placeholder="例如拍碎或整瓣烤熟" value="'+escape(a.preparation)+'">')+
    numeric("投料（克）","x.grams",a.grams,0.01,50000)+
    select("实际投入阶段","x.stage",state.overlay.when?{[a.stage]:"就在此时"}:{boil:"煮沸时",pitch:"接种时",active:"主发酵第 2 天",conditioning:"熟成开始"},a.stage)+
    '<small class="material-dose">按这锅 '+o.volumeL+' L 折算为 <output id="material-dose">'+(a.grams/o.volumeL).toFixed(2)+'</output> g/L。这次确认后即在当前阶段投料。</small>';

}
function editPanel() {
  const { stage, draft, error } = state.overlay;
  const prompts = ["挑个底方，把今晚想喝的东西写下来。", "先把火候和投料日程夹在锅边。", "", "砧板擦干净了。也可以盖好桶盖，保留原味。", "封好以后，就等你写下的那个日子。"];
  const submits = ["照这张酿", "麦汁入桶", "", "记好，准备分装", "封好这批酒"];
  return panel(stage === 0 ? "今天酿什么？" : stages[stage], '<p class="foam-note">' + prompts[stage] +
    '</p><form id="edit-form">' + formHTML(stage, draft) +
    '<p id="form-error" class="error" role="alert">' + escape(error || "") + '</p><div class="panel-actions">' +
    btn("先合上", "close") + '<button class="choice primary" type="submit">' + (state.overlay.when?"加进去，接着酿":submits[stage]) + "</button></div></form>");
}
function materialReport(a) {
  if (!a) return "";
  const levels=["无明显影响","轻微","明显","很强"];
  const certainty={low:"推测",medium:"有一些依据",high:"较有把握"};
  const action={neutral:"作用",inhibit:"抑制",accelerate:"促进"};
  const items=a.profile.constituents.map((c,i)=>{
    const budget=a.budgets[i];
    const fraction=budget?.budget ? Math.round(100*budget.evolvedWeight/budget.budget) : 0;
    return '<li><b>'+escape(c.name)+'</b> · '+certainty[c.confidence]+'<br>'+escape(c.basis)+' '+escape(c.route)+
      '<br>直接味 '+escape(c.direct||"未辨明")+'（'+(100-fraction)+'%）'+
      (c.evolved?'，转化味 '+escape(c.evolved)+'（'+fraction+'%）':'')+'。</li>';
  }).join("");
  return '<details><summary>这次增味</summary><p>'+escape(a.name)+' · '+a.grams+' g · '+a.doseGL.toFixed(2)+' g/L'+
    (a.preparation?' · '+escape(a.preparation):'')+'</p><ul>'+items+'</ul>'+
    (!items?'<p>这份材料还没有足够线索，暂时保留基酒风味。</p>':'')+
    '<p>对酵母的'+action[a.profile.behaviour]+'：'+levels[a.tier]+
    (a.profile.yeastMechanism?'。'+escape(a.profile.yeastMechanism)+'（'+certainty[a.profile.yeastConfidence]+'）':'')+'</p></details>';
}
function styleComparison(comparison) {
  if(!comparison)return "";
  const signed=x=>x>0?"+"+x:String(x);
  return '<p>与未加料的同锅对照：总分 '+signed(comparison.totalDelta)+'，ABV '+signed(comparison.abvDelta)+' 个百分点。</p><p class="muted">'+
    comparison.parts.map(p=>escape(p.label)+' '+signed(p.delta)).join(" · ")+'</p>';
}
function cupHTML(d) {
  const pending = opening === d;
  const needsRetry = ["http:", "https:"].includes(location.protocol) && d.adjudication?.status !== "luna";
  const status = needsRetry ? '<p role="status">' + (pending ? "正在品这一杯…" : "这杯尚未完成品鉴。") + '</p>' +
    btn(pending ? "正在品鉴…" : "重新品鉴这杯", "retry-cup", "subtle", 'data-seed="'+d.seed+'" '+(pending?"disabled":"")) : "";

  const { recipe: r, batch: b } = batchOf(d);
  const cup = taste(b, cupOptions(d, r, b));
  const a = cup.customAdjunct;
  const comp = compareAdjunct(d, b, cup, cupOptions(d, r, b));
  const report = (cup.additions??(a?[a]:[])).map(materialReport).join("");
  return status + '<h2>' + escape(beerName(d)) + '</h2>'+report+'<div class="metric-row"><span>' + b.metrics.abv.toFixed(1) + "% ABV</span><span>" + Math.round(b.metrics.ibu) + " IBU</span><span>" + Math.round(b.metrics.srm) +
    " SRM</span></div><p>" + escape(d.adjudication?.note || cup.note) + "</p><p class='muted'>" + packs[r.packaging] + " · 分装后第 " + r.ageDays + " 天 · 储温 " + r.storageC + " °C</p>" +
    '<details><summary>把风味放到同一把尺上</summary>' + cup.axes.map((axis) =>
      '<div class="axis"><span>' + escape(axis.label) + "</span><span>" + axis.value + '</span><meter min="0" max="10" value="' + axis.value + '"></meter><small>' +
      axis.anchors.map((a) => escape(a.label) + " " + a.value).join(" ／ ") + "</small></div>").join("") +
    '</details><details><summary>风格对照 · ' + cup.bjcp.total + '/50</summary><p class="muted">按申报风格给出的游戏模拟评审</p>' +
    select("申报风格", "benchmark", { "": "按底方评判", ...Object.fromEntries(STYLE_OPTIONS.map((s) => [s.id, s.name])) }, d.benchmark) +
    "<h3>" + escape(cup.bjcp.name) + "</h3><p>" + escape(d.adjudication?.judgeComment || cup.bjcp.comment) + "</p>" +
    styleComparison(comp) + cup.bjcp.parts.map((p) => "<p>" + escape(p.label) + " · " + p.score + "/" + p.max + "</p>").join("") + "</details>";
}
function postHTML(post) {
  return '<article class="post"><header><b>' + escape(post.name) + '</b><small class="muted">' + escape(post.time) +
    '</small></header><p>' + escape(post.text) + "</p>" + (post.reply ? '<p class="reply">' + escape(post.reply.name) + " 回复 · " + escape(post.reply.text) + "</p>" : "") + "</article>";
}
function roomNotes() {
  const tap = state.taps[state.selected];
  const navigation = '<div class="panel-actions">' + btn("去酒屋看一眼", "room") + btn("回厨房", "kitchen") + "</div>";
  if (!tap) return "<p>第 " + (state.selected + 1) + " 席空着，可以摆下一张新酒牌。</p>" + navigation;
  const n = nightStatus(tap);
  return "<h2>" + escape(beerName(tap.d)) + "</h2><p>第 " + (tap.slot + 1) + " 席 · 第 " + tap.night + " 晚</p><p>已经倒出 " + n.servings.length + " 杯，共 " + n.servedL.toFixed(1) + " L。留下 " + n.posts.length +
    " 条留言。</p>" + navigation + "<details" + (state.overlay.expandComments ? " open" : "") + "><summary>截至今晚的桌边留言</summary>" +
    (n.posts.length ? n.posts.map(postHTML).join("") : '<p class="muted">还没有人写下留言。</p>') +
    "</details><details><summary>换一批客人会怎样</summary>" + btn("看看 64 场的变化", "sample-guests") +
    '<output id="sample-output" class="muted"></output></details><details><summary>提前收酒</summary><p class="muted">结束这一席的供应，现有留言会放进旧酒牌。</p>' +
    btn("摘下酒牌，把剩下的倒掉", "confirm-dump") + "</details>";
}
function journalPanel() {
  const tab = state.overlay.tab || "batch";
  const tabs = { batch: "这一锅", room: "酒屋", archive: "旧酒牌", history: "日志", album: "图册", settings: "偏好" };
  const nav = '<nav class="book-tabs" aria-label="手记页">' + Object.entries(tabs).map(([id, label]) => btn(label, "book-tab", "", 'data-tab="' + id + '" ' + (tab === id ? 'aria-current="page"' : ""))).join("") + "</nav>";
  let body;
  if (tab === "batch") {
    const d = state.draft, { recipe } = batchOf(d);
    body = '<h2>' + escape(beerName(d)) + '</h2><ol class="chapter-list">' + stages.map((stage, i) =>
      "<li " + (d.step === i ? 'aria-current="step"' : "") + ">" + stage + "</li>").join("") +
      "</ol><p class='muted'>" + recipe.batchVolumeL + " L · " + styles[d.preset] + "</p>" +
      (d.tasted ? cupHTML(d) : "<p>翻到" + stages[d.step] + "这一页。配方和实测记录会跟着这锅酒留下。</p>") +
      '<div class="panel-actions">' + btn("回厨房", "kitchen") + btn("去酒屋", "room") + "</div>" +
      '<details><summary>回看配方与操作记录</summary>' + recipeSummary(d) + '</details><details><summary>修改这锅的前面几步</summary><p class="muted">翻回那一页重新决定。后续记录会随新决定更新。</p><div class="choices">' +
      stages.slice(0, d.step).map((s, i) => btn(s, "rewind", "choice", 'data-step="' + i + '"')).join("") + "</div></details>" +
      (d.tasted ? '<details><summary>同方再酿的波动</summary>' + btn("按这张方模拟 64 锅", "sample-brews") + '<output id="sample-output" class="muted"></output></details>' : "");
  } else if (tab === "album") body = assetAlbum();
  else if (tab === "room") body = roomNotes();
  else if (tab === "archive") body = state.archive.length ? state.archive.map((t, i) =>
    "<details><summary>第 " + t.number + " 桶 · " + escape(beerName(t.d)) + (t.dumped ? " · 提前收酒" : " · 喝完了") +
    '</summary><p>' + packs[batchOf(t.d).recipe.packaging] + " · 共开了 " + t.night + " 晚</p>" + cupHTML(t.d).replace('name="benchmark"', 'name="archive-benchmark-' + i + '"') +
    delivery(t).night.posts.filter((p) => p.session <= t.night).map(postHTML).join("") + "</details>").join("") : "<p>喝完一桶，这里就会留下一张旧酒牌。</p>";
  else if (tab === "history") body = state.history.length ? state.history.map((h) => '<article class="history-entry"><small>' +
    escape(h.title) + " · " + escape(h.speaker) + "</small><p>" + escape(h.text) + "</p></article>").join("") : "<p>读过的场景和做过的决定会夹在这里。</p>";
  else body = '<div class="fields">' + yesno("文字出现方式", "setting-typewriter", "逐字出现", "整句出现", state.settings.typewriter) +
    yesno("场景动态", "setting-motion", "轻微转场", "静帧", state.settings.motion) +
    '</div><p class="muted">每次决定和翻页自动保存。可以导出一份手记，稍后接着玩。</p><div class="choices">' +
    btn("导出手记", "export") + '<label class="choice">导入手记<input id="import-save" type="file" accept=".json,application/json"></label></div>' +
    '<details><summary>试看片段</summary><p class="muted">保留酒屋，用一张指定酒方开始看桶温片段。当前厨房草稿会被替换。</p>' +
    btn("看一场夜间升温", "demo-warm") + btn("看一场溢锅", "demo-boil") + btn("看一晚酒屋留言", "demo-room") + "</details>";
  return panel("家酿手记", nav + body);
}
function recipeSummary(d) {
  const { recipe, batch } = batchOf(d);
  const malt = recipe.fermentables.map((m) => escape(m.fermentableId) + " " + m.weightKg.toFixed(2) + " kg").join("、");
  return '<p>麦芽 · ' + malt + '</p><p>主发酵设定 · ' + recipe.fermentation.steps[0].tempC + " °C</p><p>" +
    (d.choices.temperatureControl ? "已接温控" : "随室温发酵") + " · " + (d.choices.sanitation ? "认真清洁消毒" : "匆匆冲洗") +
    "</p>" + batch.events.filter((event) => (event.stage === "mash" && d.step > 1) || (event.stage === "fermentation" && d.inspected) || (event.stage === "packaging" && d.step === 5)).map((event) =>
      "<p>" + escape(event.text) + "</p>").join("");
}
function overlayHTML() {
  const overlay = state.overlay;
  if (!overlay) return "";
  if(overlay.type==="review")return panel("第 "+sessionOf(state).day+" 晚 · 打烊手记",linesFor(state).slice(0,sessionOf(state).cursor).map(e=>'<p><b>'+escape(e.beer+" · "+e.name)+'</b><br>'+escape(e.text)+'</p>').join(""));
  if (overlay.type === "edit") return editPanel();
  if (overlay.type === "journal") return journalPanel();
  if (overlay.type === "tasting") return panel("开杯笔记", cupHTML(state.draft));
  if (overlay.type === "slots") return panel("上枪，哪个头？", '<div class="gun-slots">' + state.taps.slice(0,3).map((t,i)=>btn((i+1)+" 号头"+(t?" · "+beerName(t.d):""), "shelve", "choice",
      'data-slot="' + i + '" ' + (t ? "disabled" : ""))).join("") + "</div>" + btn("去酒屋看看", "room", "subtle"));
  if (overlay.type === "dump") {
    const t = state.taps[state.selected];
    return panel("收起这一席？", "<p>第 " + (state.selected + 1) + " 席 · " + escape(beerName(t.d)) +
      "</p><p>剩下的酒倒掉，这一席结束供应。已经写下的留言夹入旧酒牌。</p><div class='panel-actions'>" + btn("先留着", "close") + btn("摘牌收酒", "dump", "choice primary") + "</div>");
  }
  return "";
}
function revealText() {
  clearInterval(typingTimer);
  typing = false;
  const el = document.querySelector("#story-text");
  if (el && state.story) el.textContent = currentFrame().text;
  el?.removeAttribute("data-typing");
  app.querySelectorAll(".story-choices button").forEach((b) => { b.disabled = false; });
}
function animateText() {
  const el = document.querySelector("#story-text");
  if (!el || state.overlay || timedFrame(currentFrame()) || !state.settings.typewriter || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const text = currentFrame().text;
  let i = 0;
  typing = true;
  el.textContent = "";
  el.dataset.typing = "true";
  app.querySelectorAll(".story-choices button").forEach((b) => { b.disabled = true; });
  typingTimer = setInterval(() => {
    i += 2;
    el.textContent = text.slice(0, i);
    if (i >= text.length) revealText();
  }, 28);
}
const cropWatch=new ResizeObserver(entries=>entries.forEach(e=>cropPlate(e.target)));
let autoPage;
function render(focus = true) {
  clearTimeout(autoPage);
  clearInterval(typingTimer);
  clearTimeout(feedTimer);

  feedAnimation?.cancel();
  typing = false;
  const ghost = fadeSnapshot();
  const context = sceneState();
  const label = state.view === "room" ? "楼下酒屋 · 第 "+sessionOf(state).day+" 晚"+(sessionOf(state).closed?" · 已打烊":" · 营业中") :
    state.draft.step === 5 ? "窗前 · 分装后第 " + context.recipe.ageDays + " 天" : locations[state.draft.step];
  app.innerHTML = '<main class="world ' + (state.view === "room" ? "room " : "") + (!state.settings.motion ? "reduce-motion" : "") +
    '"' + (state.overlay ? ' inert aria-hidden="true"' : "") + '><header class="hud"><span class="location">' + escape(label) + "</span>" + btn("手记", "journal", "book-toggle") + "</header>" +
    sceneHTML(context) + feedHTML() + (state.story ? readerHTML() : (state.view === "room" ? tapStrip() : "") + mainAction()) + "</main>" + overlayHTML();
  if (focus) {
    if (state.overlay) {
      app.querySelector(".panel")?.focus({ preventScroll: true });
    } else if (state.story) {
      const next = app.querySelector(".story-choices button, .continue");
      next?.focus({ preventScroll: true });
    } else {
      const target = overlayReturnFocus && app.querySelector(overlayReturnFocus);
      (target || app.querySelector(".main-action"))?.focus({ preventScroll: true });
      overlayReturnFocus = null;
    }
  }
  cropWatch.disconnect();for(const svg of app.querySelectorAll("svg[data-subject]")){cropPlate(svg);cropWatch.observe(svg);}
  animateText();
  mountCamera();
  mountFeed();
  crossfade(ghost);
  clearTimeout(alarmTimer);
  const f = state.story?.frames[state.story.index];
  if(state.view==="kitchen" && f && !f.choice && !state.overlay){
    const turn=()=>{if(document.hidden){autoPage=setTimeout(turn,1500);return;}if(state.story?.frames[state.story.index]!==f||state.overlay)return;if(typing)revealText();advance();save();render();};
    autoPage=setTimeout(turn,Math.min(10000,Math.max(5000,5000+currentFrame().text.length*48)));
  }
  if(!state.story && !state.overlay && state.view==="kitchen" && !opening){
    const d=state.draft;
    const act=d.step===2?"main":d.step===5&&!d.tasted?"main":null;
    if(act){const go=()=>{if(document.hidden){autoPage=setTimeout(go,1000);return;}if(state.draft!==d||state.overlay||state.story)return;doAction({dataset:{act}});save();render();};autoPage=setTimeout(go,6500);}
  }
  if (timedFrame(f)) {
    if (!Number.isFinite(f.deadline)) { f.deadline = Date.now() + 3000 + (ghost ? 480 : 0); save(); }
    alarmTimer = setTimeout(() => {
      if (state.story?.frames[state.story.index] !== f) return;
      (f.choice === "warm" ? chooseWarm : chooseIncident)(Math.random() < .5);
      const entry = state.history.at(-1);
      if (entry?.title === "我的决定") entry.title = "闹钟响过 · 自动选择";
      save(); render();
    }, Math.max(0, f.deadline - Date.now()));
  }
}
function openJournal(tab = "batch") {
  overlayReturnFocus = '[data-act="journal"]';
  state.overlay = { type: "journal", tab };
}
function commitForm() {
  const d = readForm(), stage = state.overlay.stage;
  if(state.overlay.when){batchOf(d);d.addedAt=state.overlay.when;delete d.adjudication;state.draft=d;state.history.push({title:"临时加料",speaker:"我",text:"加入 "+d.options.customAdjunct.name+"，"+d.options.customAdjunct.grams+" 克。"});state.overlay=null;
    const feedback=frame("把 "+d.options.customAdjunct.grams+" 克"+d.options.customAdjunct.name+"加了进去。记好这一笔，接着酿。",{art:"adjunct",additionShot:true,take:"这一回的投料"});
    if(state.story){state.story.frames.splice(state.story.index+1,0,feedback);logCurrent();state.story.index++;}else play("熟成加料",[feedback]);
    return;}
  delete d.adjudication;
  batchOf(d);
  state.draft = d;
  resetResponses(d, stage);
  if (stage <= 1) { d.inspected = false; d.tasted = false; delete d.choices.rescueWarm; }
  const { recipe, batch } = batchOf(d);
  const frames = [];
  if (stage === 0) {
    frames.push(frame("我在酒单上写下「" + beerName(d) + "」，把 " + recipe.batchVolumeL + " L 圈了起来。", { art: "recipe" }));
    frames.push(frame("铅笔落下一勾。把本子推到锅边，窗光已经照上了灶台。", { art: "mash", shot: "kitchen-day", take: "炉灶旁" }));
  } else if (stage === 1) {
    frames.push(frame("按酒单把谷物称进盆里，先看看秤的零点。", { art: "recipe", shot: "preparation" }));
    frames.push(...incidentFrames(d, ["scale-drift"]));
    frames.push(frame("谷物落进温热的水里，糖化开始了。", { art: "mash", shot: "mashing" }));
    frames.push(...incidentFrames(d, ["mash-cool"]));
    frames.push(frame("慢慢过滤，把麦汁收起来。", { art: "mash", shot: "mashing",detail:"filter" }));
    frames.push(...incidentFrames(d, ["filter-slow"]));
    frames.push(frame("麦汁沸腾起来，锅沿的泡沫升了上来。", { art: "mash", shot: "boiling" }));
    frames.push(...incidentFrames(d, ["boil-over"]));
    if (recipe.hops.some(h => h.use !== "dryHop" && h.grams > 0))
      frames.push(frame("按热端日程投花，让香气从蒸汽里升起来。", { art: "mash", shot: "hops" }));
    frames.push(frame("接好冷却盘管，等麦汁降到投酵温度。", { art: "mash", shot: "cooling" }));
    frames.push(...incidentFrames(d, ["pitch-warm"]));
    frames.push(frame("开泵，让冷却后的麦汁沿管子进入发酵罐。", { art: "ferment", shot: "transfer" }));
    frames.push(frame("投入酵母，封好罐盖。", { art: "ferment", shot: "pitching" }));
    frames.push(frame("清洗台面，把干投日程夹在桶签背面。等发酵走起来，再来看看它。", { art: "ferment", shot: "cleaned", calendar: true }));
    frames.push(frame("窗外暗了。厨房只剩一盏工作灯，接下来就等桶里的动静。", { art: "mash", shot: "kitchen-night" }));
  } else if (stage === 3) {
    frames.push(frame(recipe.adjunct === "none" ? "把砧板擦干净，今天就留住这锅酒原来的味道。" : "把" + (recipe.customAdjunct?.name || adjuncts[recipe.adjunct]) + "放到砧板上。处理好，再送进这一桶里。", { art: "adjunct", take: adjuncts[recipe.adjunct] }));
    if (recipe.barrelDays) {
      frames.push(...incidentFrames(d, ["barrel-strong"]));
      frames.push(frame("", { art: "adjunct", shot: "sampling", calendar: true, dynamic: "barrel" }));
    }
  } else if (stage === 4) {
    const actions = { bottle: "瓶盖一个个压下，轻轻一声，瓶口封好了。", can: "罐口合拢。把最后一只罐子擦干，排回箱子。", keg: "扣住桶接头，检查好接口，把日期系在桶把上。" };
    frames.push(...packagingSequence(recipe.packaging).map(({shot, text}) => frame(text, {art: "pack", shot})));
    frames.push(...incidentFrames(d, ["air-pickup"]));
    frames.push(frame(actions[recipe.packaging], { art: "pack", shot: packagingShot(recipe.packaging, "seal"), take: packs[recipe.packaging] }));
    if (recipe.packaging !== "keg") frames.push(frame("擦干容器，按批次排好，留出标签的位置。", {art: "pack", shot: packagingShot(recipe.packaging, "finished")}));
    frames.push(frame("", { art: "pack", shot: packagingShot(recipe.packaging, "finished"), dynamic: "yield" }));
    frames.push(...incidentFrames(d, ["storage-warm"]));
    frames.push(frame("放在 " + recipe.storageC + " °C。分装后第 " + recipe.ageDays + " 天，终于到了写在标签上的日子。", { art: "pack", shot: packagingShot(recipe.packaging, "storage"), calendar: true }));
    d.tasted = false;
  }
  play(stages[stage], frames, { step: stage + 1 });
}
function readForm() {
  const form = document.querySelector("#edit-form");
  const draft = structuredClone(state.overlay.draft);
  for (const [name, value] of new FormData(form)) {
    const [group, key] = name.split(".");
    if (!key) { draft[name] = value; continue; }
    const target = group === "x" ? (draft.options.customAdjunct??={}) : group === "o" ? draft.options : draft.choices;
    const input = form.elements.namedItem(name);
    if (value === "") delete target[key];
    else target[key] = group === "c" ? value === "yes" : (input.type === "number" || ["volumeL", "barrelDays"].includes(key)) ? Number(value) : value;
  }
  if (draft.options.adjunct!=="custom") delete draft.options.customAdjunct;
  else if (draft.options.customAdjunct) {
    const a=draft.options.customAdjunct, prev=state.overlay.draft.options.customAdjunct;
    if(a.name!==prev?.name||a.preparation!==prev?.preparation) delete a.profile;
  }
  return draft;
}
let opening = null;
async function openFirstCup(d, replay = true) {
  if (opening) return;
  opening = d;
  const benchmark = d.benchmark;
  const recipeAtStart = JSON.stringify(d.options);
  const online = ["http:", "https:"].includes(location.protocol);
  if (online && d.adjudication?.status !== "luna") {
    d.adjudication = {status:"pending"};
    save();
    render(false);
    const result = await adjudicateDraft(d, batchOf(d).batch);
    if (!result) {
      d.adjudication = {status:"failed"};
      opening = null;
      save();
      render(false);
      notice("这杯还没品完，点一下再试。");
      return;
    }
    if (JSON.stringify(d.options) !== recipeAtStart) {
      d.adjudication = {status:"failed"};
      opening = null;
      save();
      render(false);
      notice("配方已改，重新尝一下这杯。");
      return;
    }
    applyAdjudication(d, result, benchmark);
  }
  opening = null;
  if (replay && state.draft===d && d.step===5 && !d.tasted && !state.story)
    play("第一杯", tastingFrames(d), {tasted:true});
  save();
  render();
}
const pendingVoices=new WeakMap();
function supplyNight(tap){
  if(!tap)return;
  const day=tap.night; tap.voices??={};
  if(tap.voices[day]?.length || pendingVoices.get(tap)===day)return;pendingVoices.set(tap,day);
  tap.voices[day]=[];save();
  const {batch,night}=delivery(tap);
  voicePosts(batch,night.posts.filter(p=>p.session===day)).then(rows=>{
    pendingVoices.delete(tap);if(!rows)return;
    const target=[...state.taps,...state.archive].find(t=>t && t.number===tap.number && t.d.seed===tap.d.seed);
    if(!target)return;
    target.voices[day]=rows;save();
    if(state.view==="room" && state.taps[state.selected]===tap && tap.night===day) render(false);
  });
}
function doAction(button) {
  const action = button.dataset.act;
  if (action === "retry-cup") {
    const d=[state.draft,...state.taps.filter(Boolean).map(t=>t.d),...state.archive.map(t=>t.d)].find(d=>String(d.seed)===button.dataset.seed);
    if(d)void openFirstCup(d,false);
    return;
  }
  // Story mutations are serialized in this event handler and saved before another
  // input can advance. The DOM is replaced after every transition.
  const svc=sessionOf(state);
  if(state.view==="room"&&action==="kitchen"&&svc.closed)return doAction({dataset:{act:"morning"}});
  if(state.view==="room"&&!svc.closed&&["kitchen","rewind","demo-warm","demo-boil","dump","archive","confirm-dump"].includes(action)){notice("还在营业，打烊后再安排。");return;}
  if(action==="add-now"){const when=state.story?addAt(currentFrame()):state.draft.step===3?"conditioning":null;if(!when)return;const d=structuredClone(state.draft);if(d.options.customAdjunct)(d.options.previousAdditions??=[]).push(structuredClone(d.options.customAdjunct));d.options.adjunct="custom";d.options.customAdjunct={day:state.story?currentFrame().brewDay:undefined,name:"",preparation:"",grams:45,stage:when};state.overlay={type:"edit",stage:3,draft:d,when};return;}
  if(action==="filter"){const i=Number(button.dataset.slot);svc.filter=svc.filter===i?null:i;return;}
  if(action==="reply"){svc.replies[button.dataset.id]=true;svc.cursor++;return;}
  if(action==="close-service"){svc.closed=true;return;}
  if(action==="review"){state.overlay={type:"review"};return;}
  if(action==="morning"||action==="new-service"){if(!svc.closed)return;for(const t of state.taps.slice(0,3).filter(Boolean)){state.selected=t.slot;if(nightStatus(t).finished)archiveTap(state);else nextNight(state);}state.selected=Math.max(0,state.taps.findIndex(Boolean));state.service={day:svc.day+1,closed:false,cursor:1,filter:null,replies:{}};state.overlay=null;state.view=action==="morning"?"kitchen":"room";if(state.view==="room")offerServiceIncident();return;}
  if(action==="plain"&&state.draft.step===3){if(!state.draft.addedAt){state.draft.options.adjunct="none";delete state.draft.options.customAdjunct;}state.draft.options.barrelDays=0;play("照原方",[frame("把砧板收起。今天，让麦芽和酒花自己说话。",{art:"pack"})],{step:4});return;}
  if (action === "continue") {
    if (typing) { revealText(); return "keep"; }
    advance(); return;
  }
  if (action === "skip") { advance(true); return; }
  if (action === "incident-yes" || action === "incident-no") { if (!typing) chooseIncident(action === "incident-yes"); return; }
  if (action === "warm-cool" || action === "warm-watch") { if (!typing) chooseWarm(action === "warm-cool"); return; }
  if (action === "journal") { openJournal(); return; }
  if (action === "history") { openJournal("history"); return; }
  if (action === "book-tab") { state.overlay = { type: "journal", tab: button.dataset.tab }; return; }
  if (action === "close") { state.overlay = null; return; }
  if (action === "room" || action === "kitchen") {
    if (state.story) { state.overlay = null; notice("先把眼前这一段读完，手记里随时可以回看。"); return; }
    roomArrived = false;
    state.view = action === "room" ? "room" : "kitchen"; state.overlay = null; offerServiceIncident(); return;
  }
  if (action === "main") {
    const d = state.draft;
    overlayReturnFocus = '[data-act="main"]';
    if ([0, 1, 3, 4].includes(d.step)) state.overlay = { type: "edit", stage: d.step, draft: structuredClone(d) };
    else if (d.step === 2) {
      if (d.inspected) play("合上巡桶本", [frame("把温度计挂回桶边。砧板洗好了，看看今天想添点什么。", { art: "adjunct" })], { step: 3 });
      else inspectBucket();
    } else if (!d.tasted) void openFirstCup(d);
    else state.overlay = { type: "slots" };
    return;
  }
  if (action === "tasting") { state.overlay = { type: "tasting" }; return; }
  if (action === "shelve") {
    sessionOf(state).filter=null;
    roomArrived = false;
    const tap = shelve(state, Number(button.dataset.slot));
    play("送到楼下", [
      frame("把「" + beerName(tap.d) + "」的酒牌拿在手上。走下楼，吧台里给第 " + (tap.slot + 1) + " 席腾好了位置。", { art: "tap", take: "楼下亮着灯" }),
      ...(batchOf(tap.d).recipe.packaging === "keg" ? [frame("把钢桶放进冷藏柜，接好气线和酒线，检查接头。", {art: "tap", shot: packagingShot("keg", "connect")}), frame("拉开酒头，接好第一杯，再把杯子递出去。", {art: "tap", shot: packagingShot("keg", "pour")})] : []),
      frame(packs[batchOf(tap.d).recipe.packaging] + "就位了。酒牌挂好，今晚的第一只杯子递了过来。", { art: "tap" }),
    ]);
    return;
  }
  if (action === "tap") { state.selected = Number(button.dataset.slot); offerServiceIncident(); return; }
  if (action === "feed-pause") {
    const tap = state.taps[state.selected];
    const progress = feedProgress(tap, nightFeed(delivery(tap).night, tap.night).length);
    progress.paused = !progress.paused;
    tap.feed = progress;
    return;
  }
  if (action === "read-night") { readNight(); return; }
  if (action === "next-night") {
    roomArrived = false;
    nextNight(state);
    play("又一晚", [frame("擦干吧台，重新亮起门口的灯。到了第 " + state.taps[state.selected].night + " 晚。", { art: "tap", calendar: true })]);
    return;
  }
  if (action === "archive" || action === "dump") {
    const name = beerName(state.taps[state.selected].d);
    const keg = batchOf(state.taps[state.selected].d).recipe.packaging === "keg";
    archiveTap(state, action === "dump");
    play("收起酒牌", [frame("把「" + name + "」的酒牌摘下，夹进本子。" + (action === "dump" ? "剩下的酒倒掉了。" : "最后一杯已经喝完了。"), { art: "tap" }),
      ...(keg ? [frame("把空桶送回水槽边。洗净，倒扣，等桶壁上的水慢慢滴干。", {art: "pack", shot: packagingShot("keg", "empty")})] : [])]);
    return;
  }
  if (action === "confirm-dump") { state.overlay = { type: "dump" }; return; }
  if (action === "rewind") {
    if (state.story) throw Error("先读完当前这一段");
    state.draft.step = Number(button.dataset.step);
    resetResponses(state.draft, state.draft.step);
    state.draft.tasted = false;
    if (state.draft.step <= 2) { state.draft.inspected = false; delete state.draft.choices.rescueWarm; }
    state.view = "kitchen"; state.overlay = null; return;
  }
  if (action === "sample-brews" || action === "sample-guests") {
    const output = document.querySelector("#sample-output");
    if (action === "sample-brews") {
      const d = state.draft, { recipe } = batchOf(d);
      const m = sampleBrews(recipe, { seed: d.seed, runs: 64, choices: d.choices });
      output.textContent = "出现意外 " + Math.round(m.anyEventRate * 100) + "% · 中间八成批次的 ABV 为 " + m.metrics.abv.p10.toFixed(1) + "–" + m.metrics.abv.p90.toFixed(1) + "%。";
    } else {
      const { batch, options } = delivery(state.taps[state.selected]);
      const m = sampleTastings(batch, { ...options, runs: 64 });
      output.textContent = "同一桶酒换一批客人，中间八成场次会留下 " + m.reviews.p10 + "–" + m.reviews.p90 + " 条评论。";
    }
    return "keep";
  }
  if (action === "export") {
    const raw = loadWarning ? originalSave : JSON.stringify(state, null, 2);
    const url = URL.createObjectURL(new Blob([raw || JSON.stringify(state)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = "楼下酒局-手记.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); return "keep";
  }
  if (action === "demo-warm") {
    const example = blank(3).draft;
    example.preset = "house-pale-ale"; example.options.fermentC = 19; example.step = 2;
    example.name = "窗边的这一锅";
    state.draft = example; state.view = "kitchen"; state.story = null; state.overlay = null;
    return;
  }
  if (action === "demo-boil") {
    const example = blank(9).draft;
    example.step = 1;
    example.name = "灶台旁的一锅";
    state.draft = example; state.view = "kitchen"; state.story = null; state.overlay = null;
    return;
  }
  if (action === "demo-room") {
    let slot = state.taps.findIndex((tap) => tap?.d.name === "夜班后的半杯");
    if (slot < 0) {
      slot = state.taps.slice(0,3).indexOf(null);
      if (slot < 0) throw Error("酒屋已满，可以直接去看已有的一席");
      const draft = state.draft;
      const example = blank(12).draft;
      Object.assign(example, { step: 5, tasted: true, inspected: true, name: "夜班后的半杯" });
      state.draft = example;
      shelve(state, slot);
      state.draft = draft;
    }
    state.selected = slot;
    state.view = "room";
    state.story = null;
    state.overlay = null;
    offerServiceIncident();
    return;
  }
}
app.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-act]");
  if (!button || button.disabled || transitionBusy) return;
  // Ignore a pointer release from an element removed by a previous transition.
  if (!app.contains(button)) return;
  try {
    const result = doAction(button);
    if (result !== "keep") { save(); render(); }
  } catch (error) { notice(error.message); }
});
app.addEventListener("submit", (event) => {
  if (event.target.id !== "edit-form") return;
  event.preventDefault();
  if (transitionBusy) return;
  if (!event.target.reportValidity()) return;
  const before = structuredClone(state);
  try { commitForm(); save(); render(); }
  catch (error) { state = before; document.querySelector("#form-error").textContent = error.message; }
});
app.addEventListener("change", async (event) => {
  const input = event.target;
  try {
    if (input.id === "import-save") {
      const file = input.files[0];
      if (!file) return;
      const imported = restore(JSON.parse(await file.text()));
      state = imported; loadWarning = ""; save(); render(); notice("手记接上了。"); return;
    }
    if (input.name === "benchmark" || input.name?.startsWith("archive-benchmark-")) {
      const target = input.name === "benchmark" ? state.draft : state.archive[Number(input.name.split("-").at(-1))].d;
      target.benchmark = input.value; if(target.adjudication) delete target.adjudication.judgeComment;
      save(); render();
      const detail = app.querySelector('select[name="' + input.name + '"]')?.closest("details");
      if (detail) detail.open = true;
      app.querySelector('select[name="' + input.name + '"]')?.focus();
      return;
    }
    if (input.name === "setting-motion" || input.name === "setting-typewriter") {
      state.settings[input.name === "setting-motion" ? "motion" : "typewriter"] = input.value === "yes";
      save(); return;
    }
    if (input.closest("#edit-form")) {
      const pending = readForm();
      if (input.name === "preset") {
        pending.picked=true;pending.options = { baselineVersion:pending.options.baselineVersion, volumeL: pending.options.volumeL, processVersion: pending.options.processVersion ?? 1 };
        pending.benchmark = "";
      }
      if (input.name === "o.extraHopUse") delete pending.options.extraHopTime;
      state.overlay.draft = pending;
      save();
      if (input.name === "preset" || ["o.hopId","o.yeastId","o.dryHopGrams","o.specialtyPct","o.extraHopId","o.extraHopGrams"].includes(input.name) || input.name === "o.maltId" || input.name === "o.specialtyMaltId" || input.name === "o.extraHopUse" || input.name === "o.adjunct") {
        const open = [...app.querySelectorAll("details")].map((el) => el.open);
        render(false);
        app.querySelectorAll("details").forEach((el, i) => { el.open = !!open[i]; });
        app.querySelector('[name="' + input.name + '"]' + (input.name === "preset" ? ":checked" : ""))?.focus();
      }
    }
  } catch (error) { notice("没有读入这次修改。" + error.message); }
});
app.addEventListener("input",event=>{
  if(event.target.name!=="x.grams")return;
  const output=app.querySelector("#material-dose"), litres=state.overlay?.draft?.options.volumeL;
  if(output && litres)output.textContent=(Number(event.target.value)/litres).toFixed(2);
});
document.addEventListener("keydown", (event) => {
  if (transitionBusy && ["Escape", " ", "Enter"].includes(event.key)) { event.preventDefault(); return; }
  if (event.key === "Escape" && state.overlay) {
    state.overlay = null; save(); render(); return;
  }
  if (event.key === "Tab" && state.overlay) {
    const panel = app.querySelector(".panel");
    const candidates = [...panel.querySelectorAll('button:not(:disabled), input, select, summary, a[href]')].filter((el) => el.getClientRects().length);
    const first = candidates[0], last = candidates.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  if (event.code === "Space" && state.story && !state.overlay && !event.target.closest("button, input, select, summary")) {
    event.preventDefault();
    if (typing) { revealText(); return; }
    advance(); save(); render();
  }
});
render();
if (loadWarning) notice(loadWarning, true);
