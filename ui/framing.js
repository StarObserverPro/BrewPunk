/* Horizontal subject centres in the source paintings, not a universal centre crop. */
export const focusX={
 preparation:33,mashing:50,boiling:51,hops:56,cooling:49,transfer:57,boilover:50,cleaned:50,
 pitching:56,active:54,night:54,warm:41,airlock:54,blowoff:50,sampling:35,bottling:25,
 "kitchen-day":50,"kitchen-night":50,"fermentation-day":53,"fermentation-night":54,
 "B01-keg-master":24,"B02-keg-cleaning-v2":23,"B03-keg-filling":30,"B04-keg-sealed":47,
 "B05-keg-coldstorage":50,"B06-keg-connection":64,"B07-tap-pour":37,"B08-empty-keg-v2":22,
 "B09-bottle-capping":46,"B10-bottles-finished":53,"B11-can-filling":29,"B12-can-seaming":35,
 "B13-cans-finished":47,"B14-bottles-coldstorage":29,
 empty:38,flight:54,pair:72,sour:62,stout:66,"ext-01-2":66,"ext-02-1":58,"ext-03-2":51,
 "ext-05-3":54,"ext-06-2":42,"ext-08-3":68,"ext-09-1":42,"ext-09-4":48,"ext-12-4":60
};
export function focalStyle(shot){return "--subject:"+(focusX[shot]??50)+"%";}
export function cropPlate(svg){
 const shot=svg.dataset.subject;if(!shot)return;
 const original=svg.dataset.fullBox??=svg.getAttribute("viewBox");
 const [, ,w,h]=original.split(" ").map(Number),box=svg.getBoundingClientRect();
 if(box.width>=box.height || !box.height){svg.setAttribute("viewBox",original);return;}
 const width=Math.min(w,h*box.width/box.height);
 const x=Math.max(0,Math.min(w-width,w*(focusX[shot]??50)/100-width/2));
 svg.setAttribute("viewBox",[x,0,width,h].join(" "));
}
