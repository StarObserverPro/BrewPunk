import { kitchenShots } from './kitchen-art.js';
import { pictures } from './taproom-art.js';
export const albumEntries = [...Object.values(kitchenShots), ...Object.entries(pictures).map(([id,src])=>({src,label:'酒房 · '+id}))];
export function assetAlbum() {
  return '<p>工坊、分装与酒房的场景记录。原料区保留画风候选，鲜酒花与酵母候选不作为准确工艺示意。</p><div class="asset-album">' + albumEntries.map(a=>'<figure><img src="'+a.src+'" alt="'+a.label+'" loading="lazy"><figcaption>'+a.label+'</figcaption></figure>').join('') + '</div>';
}
