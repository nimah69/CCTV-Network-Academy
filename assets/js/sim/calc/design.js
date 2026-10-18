import { solveLink, budgetCheck, POE_TYPES, POE_CLASSES } from "./poe.js";
import { subnet, planVLSM } from "./subnet.js";
import { calculateStorage } from "./storage.js";
import { recommendCable } from "./cable.js";
import { calculateUps } from "./ups.js";
import { calculateCoverage } from "./optics.js";
import { assessSecurity } from "./security.js";
import { ENGINEERING } from "../constants.js";
import { createGraph } from "../graph.js";
import { evaluateNetwork } from "../engine.js";

function buildReliabilityGraph({cameras,poeWatts,poeStandard,cableLengthM,poeBudgetW,storage,raid,diskCount,trafficMbps,redundantUplink=false}){
 const profile=ENGINEERING.poe[poeStandard]||ENGINEERING.poe.at;
 const poePortCount=Math.ceil(cameras*(1+ENGINEERING.design.defaultPortSpareFraction));
 const networkPorts=redundantUplink?4:3;
 const ports=Array.from({length:poePortCount+networkPorts},(_,i)=>({id:"p"+(i+1),vlan:10,adminUp:true,speedMbps:1000,poeEnabled:i<poePortCount,poePriority:3,poeBudgetW:profile.pseW,poeDrawW:i<cameras?poeWatts+((poeWatts/ENGINEERING.poe.nominalVoltageV)**2*ENGINEERING.ethernet.copperLoopResistanceOhmPerKm*cableLengthM/1000/(profile.pairs===4?2:1)):0}));
 const nodes=[{id:"sw",type:"poe-switch",poeBudgetW,ports}];
 for(let i=0;i<cameras;i++){
  const host=20+(i%230),third=Math.floor(i/230);
  nodes.push({id:"cam"+(i+1),type:"camera",ip:"10.10."+third+"."+host,prefix:16,vlan:10,poeRequired:true,minPoeW:poeWatts*.9,rtspEnabled:true,ports:[{id:"eth0",vlan:10}]});
 }
 nodes.push({id:"nvr",type:"nvr",ip:"10.10.255.10",prefix:16,vlan:10,recordingEnabled:true,diskHealthy:true,freeStorageTB:storage.usableTB,raid,diskCount,ports:[{id:"eth0",vlan:10},...(redundantUplink?[{id:"eth1",vlan:10}]:[])]});
 nodes.push({id:"router",type:"router",ip:"10.10.255.1",prefix:16,vlan:10,ports:[{id:"lan",vlan:10}]});
 nodes.push({id:"service",type:"laptop",ip:"10.10.255.50",prefix:16,vlan:10,ports:[{id:"eth0",vlan:10}]});
 const links=[];
 for(let i=0;i<cameras;i++)links.push({id:"cam-link-"+(i+1),type:"poe",from:{node:"sw",port:"p"+(i+1)},to:{node:"cam"+(i+1),port:"eth0"},lengthM:cableLengthM,pairs:profile.pairs});
 links.push({id:"nvr-link",type:"ethernet",from:{node:"sw",port:"p"+(poePortCount+1)},to:{node:"nvr",port:"eth0"},lengthM:3});
 if(redundantUplink)links.push({id:"nvr-link-backup",type:"ethernet",from:{node:"sw",port:"p"+(poePortCount+2)},to:{node:"nvr",port:"eth1"},lengthM:3});
 const networkStart=poePortCount+(redundantUplink?3:2);
 links.push({id:"router-link",type:"ethernet",from:{node:"sw",port:"p"+networkStart},to:{node:"router",port:"lan"},lengthM:3});
 links.push({id:"service-link",type:"ethernet",from:{node:"sw",port:"p"+(networkStart+1)},to:{node:"service",port:"eth0"},lengthM:3});
 return createGraph({nodes,links,vlans:[{id:10,name:"CCTV"}],trafficMbps});
}
function reliabilitySummary(graph){
 const state=evaluateNetwork(graph),cameras=graph.nodes.filter(n=>n.type==="camera");
 return {graphValid:state.graphValid,onlineCameras:cameras.filter(n=>state.nodes[n.id]?.online).length,streamingCameras:cameras.filter(n=>state.nodes[n.id]?.streamAvailable).length,recordingCameras:cameras.filter(n=>state.nodes[n.id]?.recording).length,events:state.events.map(e=>e.type),uplinkSaturated:state.uplinkSaturated};
}
export function designCCTV(input={}){
 const redundantUplink=input.redundantUplink===true;
 const cameras=Number(input.cameras??8),bitrateMbps=Number(input.bitrateMbps??4),days=Number(input.retentionDays??30),basePoeWatts=Number(input.poeWatts??12),ptz=input.ptz===true,audio=input.audio===true,remoteViewing=input.remoteViewing===true,poeWatts=basePoeWatts+(ptz?ENGINEERING.video.typicalPtzExtraW:0),upsMinutes=Number(input.upsMinutes??30),codec=input.codec??"H.264",resolution=input.resolution??"1080p",buildings=Number(input.buildings??1),environment=input.environment??"indoor",poeStandard=input.poeStandard??"at";
 if(!Number.isInteger(cameras)||cameras<1||cameras>2048)throw new RangeError("تعداد دوربین باید عدد صحیح بین ۱ تا ۲۰۴۸ باشد.");
 const recommendedBitrate=ENGINEERING.video.bitrateMbps[resolution]?.[codec]??null;
 const storage=calculateStorage({cameras,bitrateMbps,days,hoursPerDay:Number(input.hoursPerDay??24),activityPercent:Number(input.activityPercent??100),audioMbps:audio?ENGINEERING.video.typicalAudioMbps:0,substreamMbps:Number(input.substreamMbps??0),prePostPercent:Number(input.prePostPercent??0),overheadPercent:Number(input.overheadPercent??7),headroomPercent:Number(input.headroomPercent??10),diskCount:Number(input.diskCount??4),diskTB:Number(input.diskTB??8),hotSpare:Number(input.hotSpare??0),raid:input.raid??"raid5",nvrMaxInputMbps:Number(input.nvrMaxInputMbps??160),uplinkMbps:Number(input.uplinkMbps??1000),playbackMbps:remoteViewing?cameras*ENGINEERING.video.typicalRemoteStreamMbps:0});
 const poeLengthM=Number(input.cableLengthM??50),poeBudgetW=Number(input.poeBudgetW??120),reservePercent=Number(input.reservePercent??20),poeMaterial=input.cableMaterial==="cca"?"cca":"cu";
 const poeLink=solveLink({type:poeStandard,pdW:poeWatts,lengthM:poeLengthM,pairs:input.pairs??POE_TYPES[poeStandard]?.pairs,material:poeMaterial});
 const poeClass=Object.entries(POE_CLASSES).find(([,entry])=>poeWatts<=entry.pdW);
 const poeAllocation=input.poeAllocation==="class"?(poeClass?.[1].pseW??POE_CLASSES[8].pseW):poeLink.pseW;
 const poeBudget=budgetCheck({switchBudgetW:poeBudgetW,marginPct:reservePercent,allocationsW:Array(cameras).fill(poeAllocation)});
 const poe={...poeLink,pdW:poeWatts,pseRequiredW:poeLink.pseW,voltageDropV:POE_TYPES[poeStandard].vPseMin-poeLink.vPdV,totalRequiredW:poeBudget.totalW*(1+reservePercent/100),totalOk:poeBudget.status!=="fail"&&(input.poeAllocation!=="class"||Boolean(poeClass)),portOk:poeLink.status!=="fail",status:poeBudget.status==="fail"||poeLink.status==="fail"?"نامناسب":poeBudget.status==="marginal"||poeLink.status==="marginal"?"مرزی":"مناسب",warning:[...poeLink.reasons,...poeLink.warnings,...(poeBudget.status!=="ok"?["بودجه کل PoE برای مصرف سمت PSE و حاشیه انتخابی کافی نیست."]:[]),...(input.poeAllocation==="class"?["رزرو ایستا بر اساس کلاس "+(poeClass?.[0]??"۸")+" انتخاب شده است."]:[]),...(input.poeAllocation==="class"&&!poeClass?["توان دوربین از سقف توان PD کلاس ۸ بیشتر است."]:[])]};
 const ip=subnet(input.baseIp??"192.168.10.10",Number(input.cidr??24));
 const cable=recommendCable({distanceM:Number(input.cableLengthM??50),environment,emi:input.emi??"low",speedMbps:Number(input.uplinkMbps??1000),needsPoe:true,budget:input.budget??"medium"});
 const totalLoadW=Number(input.totalLoadW??cameras*poeWatts+ENGINEERING.video.typicalNvrOtherLoadW);
 const ups=calculateUps({loadW:totalLoadW,powerFactor:Number(input.powerFactor??0.8),batteryWh:Number(input.batteryWh??600),depthOfDischarge:Number(input.depthOfDischarge??0.8),ageFactor:Number(input.batteryAgeFactor??0.8)});
 const coverage=input.sensorWidthMm?calculateCoverage({sensorWidthMm:Number(input.sensorWidthMm),sensorHeightMm:Number(input.sensorHeightMm??3.6),focalLengthMm:Number(input.focalLengthMm??4),distanceM:Number(input.distanceM??10),horizontalPixels:Number(input.horizontalPixels??1920),verticalPixels:Number(input.verticalPixels??1080)}):null;
 const security=assessSecurity(input.securityControls??[]);
 const warnings=[...(storage.warnings||[]),...(poe.warning||[]),...(cable.warnings||[])];
 if(recommendedBitrate&&bitrateMbps<recommendedBitrate)warnings.push("Bitrate واردشده از نقطه شروع معمول برای "+resolution+" / "+codec+" پایین‌تر است؛ کیفیت واقعی صحنه را آزمایش کن.");
 if(audio)warnings.push("برای صدا، قانون محل نصب، حریم خصوصی و پهنای باند اضافه را بررسی کن.");
 if(ptz)warnings.push("دوربین PTZ ممکن است در حرکت/هیتر/IR پیک توان بالاتری داشته باشد؛ دیتاشیت پیک ملاک است.");
 if(environment==="outdoor")warnings.push("فضای بیرون: کابل UV-rated، ارت، Surge protection و مسیر برق/زمین را طراحی کن.");
 if(buildings>1)warnings.push("بین ساختمان‌ها فیبر و حفاظت در برابر اختلاف پتانسیل زمین را بررسی کن؛ فیبر PoE منتقل نمی‌کند.");
 if(!redundantUplink)warnings.push("Uplink یدکی مدل نشده؛ قطع مسیر NVR تا سوئیچ می‌تواند ضبط را متوقف کند.");
 else warnings.push("افزونگی Uplink فقط مسیر جایگزین را مدل می‌کند؛ LACP/Failover و پشتیبانی NVR باید بررسی شود؛ یک جریان منفرد الزاماً سریع‌تر نمی‌شود.");
 let vlanPlan=null;
 try{vlanPlan=planVLSM([{name:"دوربین‌ها",hosts:cameras},{name:"NVR/ضبط",hosts:Math.max(2,Math.ceil(cameras/32))},{name:"مدیریت",hosts:Math.max(2,buildings*3)},{name:"کاربران",hosts:Number(input.userHosts??20)}],{address:input.vlanBaseIp??"192.168.20.1",prefix:Number(input.vlanBasePrefix??24)});}
 catch(error){warnings.push("VLSM خودکار تولید نشد: "+error.message+"؛ بلوک آدرس بزرگ‌تر انتخاب کن.");}
 const model=buildReliabilityGraph({cameras,poeWatts,poeStandard,cableLengthM:Number(input.cableLengthM??50),poeBudgetW:Number(input.poeBudgetW??120),storage,raid:input.raid??"raid5",diskCount:Number(input.diskCount??4),trafficMbps:storage.aggregateMbps,redundantUplink});
 const baseline=reliabilitySummary(model);
 const noUplink=createGraph({nodes:model.nodes,links:model.links.map(l=>l.id==="nvr-link"?{...l,active:false}:l),vlans:model.vlans,acl:model.acl,trafficMbps:model.trafficMbps});
 const raid=input.raid??"raid5",diskCount=Number(input.diskCount??4),raidTolerance=["raid1","raid5","raid6","raid10"].includes(raid)&&diskCount>=(raid==="raid6"||raid==="raid10"?4:raid==="raid5"?3:2);
 const hddNodes=model.nodes.map(n=>n.id!=="nvr"?n:{...n,diskHealthy:raidTolerance,raidDegraded:raidTolerance});
 const hddGraph=createGraph({nodes:hddNodes,links:model.links,vlans:model.vlans,acl:model.acl,trafficMbps:model.trafficMbps});
 const powerOk=ups.runtimeMinutes>=upsMinutes;
 const powerNodes=model.nodes.map(n=>!powerOk&&["sw","nvr",...model.nodes.filter(x=>x.type==="camera").map(x=>x.id)].includes(n.id)?{...n,adminUp:false}:n);
 const powerGraph=createGraph({nodes:powerNodes,links:model.links,vlans:model.vlans,acl:model.acl,trafficMbps:model.trafficMbps});
 const reliability={baseline,uplinkFailure:reliabilitySummary(noUplink),hddFailure:reliabilitySummary(hddGraph),powerFailure:reliabilitySummary(powerGraph),notes:["مدل خرابی ساده‌سازی‌شده است و جایگزین آزمون failover واقعی نیست.","خرابی یک دیسک با RAID افزونه به‌صورت degraded مدل می‌شود؛ سازگاری RAID/کنترلر و تعداد دیسک واقعی را تأیید کن.","اثر قطعی برق بر اساس زمان UPS تخمینی و هدف کاربر مدل شده است."]};
 if(!powerOk)warnings.push("آزمون قطع برق: زمان UPS تخمینی از هدف کمتر است؛ دوربین/NVR در آزمون قابلیت اطمینان خاموش می‌شوند.");
 return {type:"برآورد اولیه",inputs:{cameras,bitrateMbps,days,poeWatts,upsMinutes,codec,resolution,audio,ptz,remoteViewing,buildings,environment,redundantUplink,recommendedBitrate},bom:[{item:"دوربین IP PoE",quantity:cameras,notes:"توان و bitrate باید از دیتاشیت واقعی جایگزین شود."},{item:"پورت سوئیچ PoE",quantity:Math.ceil(cameras*(1+ENGINEERING.design.defaultPortSpareFraction))+2,notes:"شامل ذخیره طراحی ۲۵٪ و پورت‌های uplink/NVR؛ بر حسب توپولوژی بازبینی شود."},{item:"NVR/VMS",quantity:1,notes:"تعداد کانال، ورودی bitrate، codec و خروجی HDMI را تأیید کن."},{item:"دیسک",quantity:Number(input.diskCount??4),unit:"دیسک",notes:"ظرفیت و سازگاری با NVR و RAID باید بررسی شود."},{item:"ظرفیت قابل استفاده تخمینی",quantity:storage.usableTB,unit:"TB",notes:"پس از RAID و ضریب ظرفیت قابل استفاده."},{item:"UPS",quantity:1,notes:"VA و runtime با بار واقعی و دیتاشیت باتری تطبیق داده شود."},{item:"کابل و متعلقات",quantity:cameras,unit:"مسیر",notes:"طول هر مسیر، کانکتور، پچ‌پنل و مسیر بیرون جداگانه محاسبه شود."},...(redundantUplink?[{item:"مسیر Uplink پشتیبان",quantity:1,unit:"لینک",notes:"Failover/LACP و ظرفیت پورت‌های NVR و سوئیچ باید تأیید شود."}]:[]),...(buildings>1?[{item:"فیبر + دو ماژول SFP سازگار",quantity:buildings-1,unit:"لینک بین‌ساختمانی",notes:"فیبر PoE منتقل نمی‌کند؛ تغذیه محلی لازم است."}]:[]),...(environment==="outdoor"?[{item:"Surge protector و اقلام محیط باز",quantity:cameras,unit:"مجموعه",notes:"انتخاب بر اساس ریسک صاعقه، ارت و ضوابط محل."}]:[])],ipPlan:ip,vlanPlan,storage,poe,cable,ups,coverage,security,reliability,warnings,assumptions:["این برآورد اولیه است و جایگزین طراحی اجرایی، دیتاشیت و تست محل نیست.","مدل افت PoE و عمر باتری تقریبی است؛ ضریب مقاومت CCA نیازمند تأیید است.","Bitrateها نقطه شروع هستند؛ صحنه، FPS، WDR، کدک و encoder نتیجه را تغییر می‌دهند.","VLANها بر اساس فرض‌های اولیه تخصیص یافته‌اند و باید با IP plan نهایی تطبیق داده شوند."]};
}
export { planVLSM };
