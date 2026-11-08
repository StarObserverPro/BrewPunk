import { delivery, beerName } from "./flow.js";
import { nightFeed } from "./live-feed.js";
const titles=[["断弦苦啤","反馈啸叫 IPA","锈钉苦啤","失真踏板艾尔","耳鸣之后 IPA"],["地下室小麦","撕票小麦","车库白噪音","别拔插头白啤","走调小麦"],["停电黑啤","铁皮鼓世涛","散场不熄灯","烧坏音箱波特","午夜焊枪黑啤"]];
function newHouse(){return titles.map(pool=>pool[Math.floor(Math.random()*pool.length)]);}

const stories=[
 [["琴盒上的车票","我爸把末班车票塞在琴盒里，说赶不上演出就凭它回家。票上那个站，去年拆了。","那就别把票扔了。下回带琴来，我们给你留张椅子。"],["空椅子","上回说的椅子还真留着。我只会三段，第三段还老弹错。","弹错那段最好听。我在门口就是听见那一下才进来的。"]],
 [["缝衣铺的灯","巷口裁缝今天退休，把最后一卷蓝线送给了我。我一颗扣子都不会缝。","先拿我这件练。袖口松三年了，正等个新师傅。"],["一只蓝扣子","那颗扣子缝歪了。可他今天特地把袖口翻出来给每个人看。","可不是，整条街就我有这个签名。"]],
 [["没寄出的明信片","旧书里掉出张没贴邮票的海边照片，背面只写着：到了，风大。","我家以前就在那个灯塔旁边。翻过来，我画条回去的路。"],["灯塔背面","昨天照着杯垫上的地图走到渡口，灯塔早没了，卖热饼的人还在。","他还把第一张煎破的留给小孩吗？那是我叔。"]]
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
