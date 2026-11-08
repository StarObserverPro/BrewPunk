import { delivery, beerName } from "./flow.js";
import { nightFeed } from "./live-feed.js";
const titles=[["断弦苦啤","反馈啸叫 IPA","锈钉苦啤","失真踏板艾尔","耳鸣之后 IPA"],["地下室小麦","撕票小麦","车库白噪音","别拔插头白啤","走调小麦"],["停电黑啤","铁皮鼓世涛","散场不熄灯","烧坏音箱波特","午夜焊枪黑啤"]];
function newHouse(){return titles.map(pool=>pool[Math.floor(Math.random()*pool.length)]);}

const stories = [
  [
    ["背琴的阿梁", "这苦的行。刚翻琴盒，还夹着我爸给的末班车票呢，那站都拆了。", "票留着呗。下回带琴来，我给你占座。"],
    ["背琴的阿梁", "你们还真给我占座了啊。先让我喝口苦的，第三段我还是弹不顺。", "我上回就是听见你弹错，才推门进来的。"],
  ],
  [
    ["小蓝", "白啤喝着挺顺。巷口裁缝收摊了，塞给我一卷蓝线，我连扣子都不会缝。", "拿我袖口练练？松了三年了。"],
    ["小蓝", "这杯白啤算我的。上回那扣子缝歪了，他今天还挨桌给人看。", "别拆啊，我就喜欢歪的。"],
  ],
  [
    ["阿渡", "黑啤给我小半杯就行。刚从旧书里抖出张海边明信片，背面就俩词，到了，风大。", "给我瞅瞅。那灯塔好像在我家边上。"],
    ["阿渡", "还是上回那黑啤。照你画的路去了一趟，灯塔没了，卖热饼的还在。", "卖饼的是我叔！你早说我让他多给一张。"],
  ],
];
export function sessionOf(s){const svc=s.service??={day:1,closed:false,cursor:1,filter:null,replies:{}};svc.house??=newHouse();return svc;}
export function linesFor(s){
 const svc=sessionOf(s),out=[];
 s.taps.slice(0,3).forEach((t,i)=>{if(!t)return;for(const e of nightFeed(delivery(t).night,t.night)){if(e.kind==="quiet")continue;out.push({...e,id:i+"-"+e.id,slot:i,beer:beerName(t.d),minute:e.time.split(" ").at(-1)});}});
 out.sort((a,b)=>a.minute.localeCompare(b.minute));
 const n=(svc.day-1)%3,k=Math.floor((svc.day-1)/3)%2,[title,text,reply]=stories[n][k],id="regular-"+svc.day;
 out.splice(Math.floor(out.length*.55),0,{id,slot:n+3,beer:svc.house[n],name:title,text,reply,kind:"post"});
 if(svc.replies[id]){const i=out.findIndex(x=>x.id===id);out.splice(i+1,0,{id:id+"-reply",slot:n+3,beer:svc.house[n],name:"隔壁桌",text:reply,kind:"reply"});}
 return out;
}
