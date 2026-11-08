import { kitchenShots } from './kitchen-art.js';
import { pictures } from './taproom-art.js';
export const albumEntries = [...Object.values(kitchenShots),{src:"assets/kitchen/first-cup.png",label:"窗边的第一杯"},{"src":"assets/ingredients/grain-pale.png","label":"浅麦芽"},{"src":"assets/ingredients/grain-gold.png","label":"金麦芽"},{"src":"assets/ingredients/grain-amber.png","label":"焦糖麦芽"},{"src":"assets/ingredients/grain-dark.png","label":"烘烤麦芽"}, ...Object.entries(pictures).map(([id,src])=>({src,label:'酒屋 · '+id}))];
export function assetAlbum() {
  return '<p>工坊、分装与酒屋的场景记录。原料区保留画风候选，鲜酒花与酵母候选不作为准确工艺示意。</p><div class="asset-album">' + albumEntries.map(a=>'<figure><img src="'+a.src+'" alt="'+a.label+'" loading="lazy"><figcaption>'+a.label+'</figcaption></figure>').join('') + '</div>';
}
