import { packagingShot } from "./packaging-art.js";
import { batchOf } from "./flow.js";

export const incidents = {
  "scale-drift": { control: "scaleCorrect", title: "秤的零点", shot: "preparation", yes: "重新校零，补齐投料", no: "记下偏差，按实投继续",
    result: (b) => "重新核对后，这次实投仍比酒单少 " + (b.events.find(e => e.id === "scale-drift").effectiveMagnitude * 100).toFixed(1) + "%。实投量留在锅边记录里。" },
  "mash-cool": { control: "mashRescue", title: "糖化温度走低", shot: "mashing", yes: "复测后给后半段补温", no: "保留当前火候",
    result: (_, yes) => yes ? "把后半段的温度拉了回来。前面走低的那一段也留在糖化记录里。" : "按这一段的实际温度继续，糖化结果会随它变化。" },
  "filter-slow": { control: "filterRescue", title: "滤床排液变慢", shot: "mashing", yes: "松开滤床，慢慢排液", no: "接受少收一些麦汁",
    result: (b) => "这一段留在滤床里的麦汁约 " + lossL(b, "filter-slow") + " L，实际收液量已记下。" },
  "boil-over": { control: "boilRescue", title: "泡沫到了锅沿", shot: "boilover", yes: "降火，等泡沫落下再续煮", no: "按原火候继续",
    result: (b) => "擦掉台面的麦汁。这次溢锅损失约 " + lossL(b, "boil-over") + " L，后面按剩下的量走。" },
  "pitch-warm": { control: "pitchWait", title: "离投酵目标还差一点", shot: "cooling", yes: "继续冷却，再投酵", no: "按眼前的温度投酵",
    result: (_, yes) => yes ? "等到投酵目标温度，再打开酵母。多等的这阵子没有进入高温发酵。" : "酵母在偏暖的麦汁里开始工作，早期轨迹会留下这段温度。" },
  "warm-night": { control: "rescueWarm", title: "昨夜的桶温", shot: "warm", yes: "换上冰袋", no: "先照常观察",
    result: (b) => "稍后复测，第二天酒液比设定高 " + b.events.find(e => e.id === "warm-night").secondDayDeltaC.toFixed(1) + " °C。第一晚的实测仍在上一行。" },
  "airlock-foam": { control: "blowoff", title: "泡沫进了气锁", shot: "airlock", yes: "换上排气管", no: "保持气锁，继续观察",
    result: (b, yes) => (yes ? "换好排气管，泡沫沿管子排进接液瓶。" : "继续观察气锁，流出的泡沫也接了起来。") + "这一段损失约 " + lossL(b, "airlock-foam") + " L。" },
  "dryhop-contact": { control: "dryHopRescue", title: "桶签上的干投日", shot: "active", yes: "检查酒花袋，让它充分浸润", no: "按现在的接触情况继续",
    result: (_, yes) => yes ? "把没有浸湿的一侧放回酒液里，余下接触时间会更充分。" : "在桶签上记下接触不足，这次酒花提取会弱一些。" },
  "wild-acid": { control: "declareSour", title: "末段取样的酸味", shot: "sampling", yes: "记下酸味，改用酸 IPA 对照", no: "保留原风格，照原计划完成",
    result: (_, yes) => yes ? "把申报对照改为酸 IPA。杯中的酸味保留，开喝时再尝。" : "酸味留在这锅酒里，第一杯会按实际味道记录。" },
  "barrel-strong": { control: "barrelStop", title: "木香已经很明显", shot: "sampling", yes: "现在离开木材", no: "继续到原定日期",
    result: (b) => "这次实际与木材接触 " + b.barrelDays + " 天。后续按这段接触来写风味。" },
  "air-pickup": { control: "transferRescue", title: "酒管里经过一段空气", shot: "transfer", yes: "停一下，重新检查接口", no: "按当前管路继续",
    result: (_, yes) => yes ? "接口重新接好，后续摄氧减少。先前进入的空气仍会影响储存中的香气。" : "记下这段空气，后面按实际摄氧推演这批酒。" },
  "storage-warm": { control: "storageRescue", title: "储存角落升温", shot: "night", yes: "恢复冷藏", no: "按现在的环境放着",
    result: (b) => "这段偏暖储存持续了 " + b.storageExcursion.days + " 天。开喝日的香气按这段温度经历计算。" },
  "closure": { control: "sealCheck", title: "第一只容器的封口", shot: "bottling", yes: "核对其余容器的封口", no: "记下这一只，先照常开喝",
    result: (_, yes) => yes ? "这只样酒的状态记下来，其余容器重新检查封口，后续封口偏差的风险降低。" : "样酒状态保留，后续每只容器仍按自己的封口记录开杯。" },
  "tap-foam": { control: "chillLine", title: "酒头的第一杯", shot: null, yes: "冷却酒线，再慢慢倒", no: "接掉泡沫，继续出杯",
    result: (b, yes) => yes ? "酒线冷下来，泡沫收住了。这次仍倒掉了 30 mL，已经从供应量里扣除。" : "先接掉这阵泡沫，共损失 100 mL，再把下一杯递出去。" },
};
function lossL(batch, id) {
  return (batch.recipe.batchVolumeL * batch.events.find(e => e.id === id).effectiveMagnitude).toFixed(2);
}
export function incidentFrames(draft, ids) {
  const { batch } = batchOf(draft);
  return ids.flatMap((id) => {
    const event = batch.events.find((item) => item.id === id);
    if (!event) return [];
    const definition = incidents[id];
    const text = id === "barrel-strong" ? "接触到第 " + event.sampleDay + " 天，取样时木香已经很明显了。" : event.text;
    const art = { mash: "mash", adjunct: "adjunct", packaging: "pack", storage: "pack" }[event.stage] || "ferment";
    const shot = id === "air-pickup" ? packagingShot(batch.packaging) : id === "storage-warm" ? packagingShot(batch.packaging, "storage") : definition.shot;
    return [{ text, art, shot, take: definition.title, choice: "incident", eventId: id }];
  });
}
export function resetResponses(draft, step) {
  const phases = [
    ["scaleCorrect", "mashRescue", "filterRescue", "boilRescue", "pitchWait"],
    ["rescueWarm", "blowoff", "dryHopRescue", "declareSour"],
    ["barrelStop"], ["transferRescue", "storageRescue", "sealCheck"],
  ];
  const start = step <= 1 ? 0 : step === 2 ? 1 : step === 3 ? 2 : 3;
  if (start <= 1 && draft.choices.declareSour && draft.benchmark === "sour-ipa") draft.benchmark = "";
  for (const key of phases.slice(start).flat()) delete draft.choices[key];
}
