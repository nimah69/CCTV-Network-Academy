import { createGraph } from "./graph.js";
const definitions=[
["basic-poe","پایه","یک دوربین خاموش است اما دوربین‌های دیگر تصویر دارند.","یک پورت PoE غیرفعال است.","show-poe","enable-port"],
["basic-cable","پایه","یک دوربین گهگاه از دسترس خارج می‌شود.","کابل اترنت قطع/باز است.","cable-tester","replace-cable"],
["basic-port","پایه","لینک دوربین برقرار نمی‌شود.","پورت سوئیچ از نظر مدیریتی خاموش است.","switch-console","enable-port"],
["basic-ip","پایه","گاهی به‌جای دوربین درست، دستگاه دیگری پاسخ می‌دهد.","IP تکراری است.","ping","fix-ip"],
["basic-hdmi","پایه","NVR ضبط می‌کند اما نمایشگر تصویر ندارد.","ورودی HDMI نمایشگر اشتباه است.","nvr","select-hdmi"],
["basic-disk","پایه","تصویر زنده هست اما ضبط انجام نمی‌شود.","دیسک پر شده است.","nvr","free-storage"],
["mid-budget","متوسط","دوربین‌های آخر پس از روشن شدن IR خاموش می‌شوند.","بودجه کل PoE از بار واقعی کمتر است.","show-poe","increase-budget"],
["mid-cca","متوسط","دوربین دورتر در شب ریبوت می‌شود.","کابل CCA افت ولتاژ بیشتری ایجاد می‌کند.","poe-tester","replace-cable"],
["mid-duplex","متوسط","تصویر با تأخیر و خطاهای CRC همراه است.","Duplex mismatch در یک سمت لینک وجود دارد.","switch-console","match-duplex"],
["mid-vlan","متوسط","دوربین و NVR روشن‌اند اما به هم دسترسی ندارند.","VLAN پورت دوربین اشتباه است.","ping","fix-vlan"],
["mid-subnet","متوسط","مدیریت محلی کار می‌کند اما ارتباط با NVR ناموفق است.","ماسک یا Gateway دوربین نادرست است.","ping","fix-subnet"],
["mid-ntp","متوسط","زمان رخدادها با زمان واقعی اختلاف دارد.","NTP یا منطقه زمانی نادرست است.","system-log","fix-clock"],
["adv-loop","پیشرفته","شبکه دوره‌ای کند می‌شود و CPU سوئیچ بالا می‌رود.","Loop لایه دوم و Broadcast storm رخ داده است.","switch-console","break-loop"],
["adv-acl","پیشرفته","دوربین ping می‌شود اما جریان به NVR نمی‌رسد.","ACL جریان دوربین به NVR را مسدود کرده است.","web-camera","fix-acl"],
["adv-uplink","پیشرفته","با افزایش تعداد جریان‌ها، مشاهده راه دور افت می‌کند.","Uplink یک گیگابیتی اشباع شده است.","system-log","upgrade-uplink"],
["adv-ir","پیشرفته","تصویر شب سفید یا مه‌آلود می‌شود.","بازتاب IR از سطح نزدیک/شیشه رخ می‌دهد.","webCamera","adjust-ir"],
["adv-raid","پیشرفته","هشدار دیسک و افت افزونگی در NVR دیده می‌شود.","یک دیسک RAID خراب شده و بازسازی در حال انجام است.","nvr","replace-disk"],
["adv-firmware","پیشرفته","پس از به‌روزرسانی، یک مدل دوربین stream نمی‌دهد.","ناسازگاری firmware/codec رخ داده است.","webCamera","rollback-firmware"],
["adv-ups","پیشرفته","سامانه با قطعی برق زودتر از انتظار خاموش می‌شود.","ظرفیت/سلامت باتری UPS کافی نیست.","system-log","replace-battery"],
["adv-emi","پیشرفته","خطاهای CRC روی مسیر کنار کابل قدرت افزایش می‌یابند.","تداخل EMI روی مسیر مسی نامناسب وجود دارد.","cable-tester","reroute-cable"]
].map(([id,level,customer,rootCause,firstTool,fix],index)=>({id,level,customer,rootCause,firstTool,fix,index,
 symptoms:[],redHerrings:["علائم مشابه می‌تواند ناشی از خرابی موقت یا بار هم‌زمان باشد؛ هر فرض را با آزمون بسنج."],
 optimalPath:["inspect",firstTool,fix],commonMistakes:["تعویض چند قطعه بدون آزمون","ریست کارخانه بدون نسخه پشتیبان","فرض گرفتن علت فقط از روی علامت"],
 hints:["از کم‌خطرترین آزمون و لایه فیزیکی شروع کن.","نتیجه ابزار را با توپولوژی و تنظیمات همین سناریو تطبیق بده.","به وابستگی‌ای توجه کن که علت مشترک چند علامت است."],
 lesson:"عیب‌یابی را مرحله‌ای انجام بده، یک متغیر را هر بار تغییر بده و پس از اصلاح تست تحویل ثبت کن."}));
function random(seed){let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296}}
function baseGraph(seed){
 const r=random(seed),poePort=1+Math.floor(r()*8),host=20+Math.floor(r()*180),length=15+Math.floor(r()*80);
 const nodes=[
 {id:"sw",type:"poe-switch",poeBudgetW:120,ports:Array.from({length:12},(_,i)=>({id:"p"+(i+1),vlan:10,adminUp:true,speedMbps:1000,duplex:"full",poeEnabled:i<8,poeBudgetW:30,poeDrawW:i===poePort-1?12:0}))},
 {id:"cam",type:"camera",ip:"192.168.10."+host,prefix:24,vlan:10,poeRequired:true,minPoeW:9,rtspEnabled:true,firmware:"stable",clockSynced:true,irHealthy:true,ports:[{id:"eth0",vlan:10}]},
 {id:"nvr",type:"nvr",ip:"192.168.10.10",prefix:24,vlan:10,recordingEnabled:true,diskHealthy:true,freeStorageTB:3,firmware:"stable",clockSynced:true,hdmiConnected:true,ports:[{id:"eth0",vlan:10}]},
 {id:"router",type:"router",ip:"192.168.10.1",prefix:24,vlan:10,ports:[{id:"lan",vlan:10}]},
 {id:"monitor",type:"monitor",input:"HDMI1",hdmiConnected:true,ports:[{id:"hdmi"}]},
 {id:"service-laptop",type:"laptop",ip:"192.168.10.50",prefix:24,vlan:10,ports:[{id:"eth0",vlan:10}]}
 ];
 const links=[
 {id:"cam-link",type:"poe",from:{node:"sw",port:"p"+poePort},to:{node:"cam",port:"eth0"},lengthM:length,quality:"normal"},
 {id:"nvr-link",type:"ethernet",from:{node:"sw",port:"p9"},to:{node:"nvr",port:"eth0"},lengthM:3},
 {id:"router-link",type:"ethernet",from:{node:"sw",port:"p10"},to:{node:"router",port:"lan"},lengthM:2},
 {id:"service-link",type:"ethernet",from:{node:"sw",port:"p11"},to:{node:"service-laptop",port:"eth0"},lengthM:3}
 ];
 return {nodes,links,vlans:[{id:10,name:"CCTV"},{id:20,name:"Management"}],meta:{poePort,length,host}};
}
function inject(def,model,seed){
 const r=random(seed),n=model.nodes,sw=n.find(x=>x.id==="sw"),cam=n.find(x=>x.id==="cam"),nvr=n.find(x=>x.id==="nvr"),link=model.links.find(x=>x.id==="cam-link");
 switch(def.fix){
 case "enable-port": if(def.id==="basic-port")sw.ports[model.meta.poePort-1].adminUp=false;else sw.ports[model.meta.poePort-1].poeEnabled=false;break;
 case "replace-cable": if(def.id==="mid-cca"){cam.minPoeW=20;sw.ports[model.meta.poePort-1].poeDrawW=24;link.cableMaterial="cca";link.quality="marginal";link.lengthM=85+Math.floor(r()*15)}else{link.cableFault="open";link.quality="marginal"}break;
 case "fix-ip": n.push({...cam,id:"rogue",ip:cam.ip,type:"camera",poeRequired:false,ports:[{id:"eth0",vlan:10}]});break;
 case "select-hdmi": n.find(x=>x.id==="monitor").input="HDMI2";nvr.hdmiConnected=false;break;
 case "free-storage": nvr.freeStorageTB=0;break;
 case "increase-budget": sw.poeBudgetW=55;for(const p of sw.ports)if(p.poeEnabled)p.poeDrawW=12;break;
 case "match-duplex": link.duplexMismatch=true;link.crcErrors=1200;break;
 case "fix-vlan": sw.ports[model.meta.poePort-1].vlan=20;break;
 case "fix-subnet": cam.prefix=28;break;
 case "fix-clock": cam.clockSynced=false;cam.timezone="UTC";nvr.timezone="local";break;
 case "break-loop": model.links.push({id:"loop-link",type:"ethernet",from:{node:"sw",port:"p9"},to:{node:"sw",port:"p10"},lengthM:1,loop:true});sw.rstpEnabled=false;break;
 case "fix-acl":model.acl=[{from:"cam",to:"nvr",action:"deny"}];break;
 case "upgrade-uplink":model.links.find(x=>x.id==="nvr-link").speedMbps=1000;model.trafficMbps=1250;break;
 case "adjust-ir":cam.irHealthy=false;cam.irReflection=true;break;
 case "replace-disk":nvr.diskHealthy=false;nvr.raid="raid5";nvr.rebuilding=true;break;
 case "rollback-firmware":cam.firmware="incompatible";cam.rtspEnabled=false;break;
 case "replace-battery":n.push({id:"ups1",type:"ups",capacityWh:180,chargePercent:20,healthFactor:.35,ports:[{id:"out1"}]});break;
 case "reroute-cable":link.quality="noisy";link.emi=true;link.lengthM=75+Math.floor(r()*25);break;
 }
 model.seed=seed;model.faultId=def.id;return model;
}
export function listScenarios(){return definitions.map(({id,level,customer,index})=>({id,level,customer,index}))}
export function createScenario(id,seed=1){
 const def=definitions.find(x=>x.id===id);if(!def)throw new RangeError("سناریو پیدا نشد: "+id);
 const model=inject(def,baseGraph(seed),seed);
 const {faultId,...publicModel}=model;
 return {id:def.id,level:def.level,customer:def.customer,seed,model:createGraph(publicModel),meta:{length:model.meta?.length},hints:def.hints,redHerrings:def.redHerrings,optimalPath:def.optimalPath,commonMistakes:def.commonMistakes,lesson:def.lesson,answerKey:{rootCause:def.rootCause,fix:def.fix,firstTool:def.firstTool}};
}
export function publicScenario(scenario){const {answerKey,model,...safe}=scenario;return {...safe,model:{nodes:model.nodes.map(n=>({id:n.id,type:n.type,ip:n.ip||null})),links:model.links.map(l=>({id:l.id,type:l.type,lengthM:l.lengthM}))}}}
