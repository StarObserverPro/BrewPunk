import { packagingShots, supplementalShots, packagingShot } from "./packaging-art.js";
export const kitchenShots = {
  ...packagingShots, ...supplementalShots,
  preparation: { src: "assets/kitchen/k01-preparation.png", label: "厨房备料" },
  mashing: { src: "assets/kitchen/k02-mashing.png", label: "糖化" },
  boiling: { src: "assets/kitchen/k03-boiling.png", label: "煮沸" },
  hops: { src: "assets/kitchen/k04-hop-addition.png", label: "热端投花" },
  cooling: { src: "assets/kitchen/k05-cooling.png", label: "冷却" },
  transfer: { src: "assets/kitchen/k06-transfer-pumped.png", label: "泵送转罐" },
  boilover: { src: "assets/kitchen/k07-boilover.png", label: "溢锅" },
  cleaned: { src: "assets/kitchen/k08-cleaned.png", label: "清洗收尾" },
  pitching: { src: "assets/kitchen/f01-pitching.png", label: "投酵母" },
  active: { src: "assets/kitchen/f02-active-day.png", label: "日间发酵" },
  night: { src: "assets/kitchen/f03-night-check.png", label: "夜间巡桶" },
  warm: { src: "assets/kitchen/f04-warm-warning.png", label: "桶温偏高" },
  airlock: { src: "assets/kitchen/f05-airlock-foam.png", label: "泡沫进入气锁" },
  blowoff: { src: "assets/kitchen/f06-blowoff-recovery.png", label: "更换排气管" },
  sampling: { src: "assets/kitchen/f07-sampling.png", label: "取样" },
  bottling: { src: "assets/kitchen/f08-bottling.png", label: "玻璃瓶分装" },
};
export function shotFor(art, packaging) {
  return { recipe: "preparation", mash: "mashing", ferment: "active", adjunct: "preparation",
    pack: packagingShot(packaging) }[art];
}
export function kitchenPlate(shot, temperature) {
  const asset = kitchenShots[shot];
  if (!asset) return "";
  if (asset.width || Object.hasOwn(supplementalShots, shot)) return '<img class="kitchen-photo" src="' + asset.src + '" alt="' + asset.label + '" decoding="async">';
  const ferment = ["pitching", "active", "night", "warm", "airlock", "blowoff", "sampling", "bottling"].includes(shot);
  const reading = temperature === "—" ? "待用" : temperature + "°";
  // The painted gauges are covered in the same coordinate system as the art.
  // Changing the viewport crops both the illustration and live reading together.
  const gauge = ferment
    ? '<rect x="746" y="690" width="57" height="29" rx="2" fill="#d4d6b6"/><text x="774" y="712" text-anchor="middle" font-size="20" fill="#25382a">' + reading + '</text>'
    : '<circle cx="733" cy="678" r="42" fill="#dedecb" stroke="#5e695d" stroke-width="4"/><text x="733" y="685" text-anchor="middle" font-size="22" fill="#25382a">' + reading + '</text>';
  const alignment = ["preparation", "bottling"].includes(shot) ? "xMinYMid" : "xMidYMid";
  return '<svg class="kitchen-photo" viewBox="0 0 1445 1089" preserveAspectRatio="' + alignment + ' slice" role="img" aria-label="' + asset.label +
    '"><image href="' + asset.src + '" width="1445" height="1089"/>' + gauge + "</svg>";
}
