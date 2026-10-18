import { normalizeDigits } from "../units.js";
import { solveLink, budgetCheck, POE_TYPES } from "../calc/poe.js";
import { subnet, sameSubnet, validateGateway, planVLSM } from "../calc/subnet.js";
import { calculateStorage } from "../calc/storage.js";
import { recommendCable } from "../calc/cable.js";
import { calculateUps } from "../calc/ups.js";
import { calculateCoverage } from "../calc/optics.js";
import { assessSecurity, SECURITY_CONTROLS } from "../calc/security.js";
import { designCCTV } from "../calc/design.js";
import { createGraph } from "../graph.js";
import { evaluateNetwork, runDiagnostic } from "../engine.js";

const $=id=>document.getElementById(id);
const fmt=n=>Number(n).toLocaleString("fa-IR",{maximumFractionDigits:2});
const num=(id,label,min=0,max=Infinity,integer=false)=>{const el=$(id);if(!el)throw new Error("فیلد "+label+" پیدا نشد.");const raw=normalizeDigits(el.value);if(raw.trim()==="")throw new Error(label+" را وارد کن.");const n=Number(raw);if(!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))throw new Error(label+" باید "+(integer?"عدد صحیح ":"")+"در محدوده "+min+" تا "+max+" باشد.");return n};
function show(id,text,kind=""){const el=$(id);if(!el)return;el.className="output "+kind;el.style.whiteSpace="pre-wrap";el.textContent=text}
function bind(id,handler){const el=$(id);if(!el)return;el.addEventListener("click",event=>{event.preventDefault();event.stopImmediatePropagation();try{handler(event)}catch(error){const outputId=({"calcPoe":"poeResult","runPoeSimulation":"poeSimulationResult","calcSubnet":"subnetResult","calcStorage":"storageResult","recommendCable":"cableResult","scoreSecurity":"securityResult","buildReport":"capstoneResult","downloadReport":"capstoneResult","downloadJsonReport":"capstoneResult","printReport":"capstoneResult","planVlsm":"vlsmResult","calcUps":"upsResult","calcLens":"lensResult","exportCommissioning":"commissioningResult","runSwitchFeatureSim":"switchFeaturesResult"})[id];if(outputId)show(outputId,"خطا: "+error.message,"bad")}},true)}
function getPoe(){
 const standard={"12.95":"af","25.5":"at","51":"bt3","71.3":"bt4"}[$("poePortClass").value]||"at";
 const cameraWatts=num("poeWatts","توان دوربین",.1),lengthM=num("cableLength","طول کابل",0,100),cameraCount=num("poeCams","تعداد دوربین",1,1024,true),budgetW=num("poeBudget","بودجه کل PoE",1),reservePercent=num("poeReserve","حاشیه اطمینان",0,50),pairs=Number($("poePairs")?.value||POE_TYPES[standard].pairs);
 const link=solveLink({type:standard,pdW:cameraWatts,lengthM,material:$("cableType").value==="cca"?"cca":"cu",pairs});
 const budget=budgetCheck({switchBudgetW:budgetW,marginPct:reservePercent,allocationsW:Array(cameraCount).fill(link.pseW)});
 const totalRequiredW=budget.totalW/(1-reservePercent/100);
 const portOk=link.pseW<=POE_TYPES[standard].pseW&&link.currentA<=POE_TYPES[standard].iPairMaxA*(pairs/2)&&link.vPdV>=POE_TYPES[standard].vPdMin;
 const totalOk=budget.totalW<=budget.usableW;
 const warning=[...link.reasons,...link.warnings];
 if(budget.status!=="ok")warning.push("بودجهٔ کل PoE با حاشیهٔ انتخاب‌شده کافی نیست.");
 return {status:link.status==="fail"?"نامناسب":link.status==="marginal"?"مرزی":"مناسب",standard,pseRequiredW:link.pseW,pdW:cameraWatts,voltageDropV:POE_TYPES[standard].vPseMin-link.vPdV,lossW:link.lossW,totalRequiredW,portOk,totalOk,warning};
}
function poeText(r){return "وضعیت: "+r.status+"\nاستاندارد: "+r.standard+"\nتوان برآوردی موردنیاز در PSE برای هر دوربین: "+fmt(r.pseRequiredW)+" وات (W)\nتوان تخمینی رسیده به PD: "+fmt(r.pdW)+" وات (W)\nافت ولتاژ مدل‌شده: "+fmt(r.voltageDropV)+" V\nاتلاف کابل: "+fmt(r.lossW)+" وات (W)\nتوان کل با حاشیه: "+fmt(r.totalRequiredW)+" وات (W)\nبودجه پورت: "+(r.portOk?"کافی":"ناکافی")+"؛ بودجه کل: "+(r.totalOk?"کافی":"ناکافی")+"\nمدل آموزشی تقریبی است؛ مشخصات کابل و دیتاشیت PSE/PD را بررسی کن.\n"+r.warning.join("\n")}
bind("calcPoe",()=>{show("poeResult",poeText(getPoe()),"good")});
$("poePortClass").addEventListener("change",()=>{$("poePairs").value=["51","71.3"].includes($("poePortClass").value)?"4":"2"});
bind("runPoeSimulation",()=>{const r=getPoe();show("poeSimulationResult",poeText(r),"good");const nodes=[...document.querySelectorAll("#poe .schematic-node")];nodes.forEach(n=>{n.classList.remove("sim-pass","sim-warn","sim-fail");n.classList.add(r.status==="مناسب"?"sim-pass":r.status==="مرزی"?"sim-warn":"sim-fail")})});
bind("calcSubnet",()=>{
 const ip=$("ipAddress").value,prefix=num("cidr","CIDR",0,32,true),r=subnet(ip,prefix),lines=["آدرس: "+r.address+"/"+r.prefix,"شبکه: "+r.network,"Broadcast: "+r.broadcast,"Mask: "+r.mask,"Wildcard: "+r.wildcard,"اولین میزبان: "+r.firstHost,"آخرین میزبان: "+r.lastHost,"تعداد آدرس قابل استفاده: "+fmt(r.usableHosts),"کلاس IPv4: "+r.addressClass,"محدوده خصوصی RFC 1918: "+(r.isPrivate?"بله":"خیر"),"Link-local: "+(r.isLinkLocal?"بله":"خیر"),"Loopback: "+(r.isLoopback?"بله":"خیر"),...r.notes];
 if($("gateway").value.trim()){const g=validateGateway(ip,prefix,$("gateway").value);lines.push("Gateway: "+g.reason)}
 if($("otherIp").value.trim()){try{lines.push("IP دوم: "+(sameSubnet({ip,prefix},{ip:$("otherIp").value,prefix})?"در همان زیرشبکه":"در زیرشبکه متفاوت"))}catch(e){lines.push("IP دوم: "+e.message)}}
 show("subnetResult",lines.join("\n"),"good");
});
bind("calcStorage",()=>{
 const cameras=num("storageCams","تعداد دوربین",1,1024,true),rate=num("bitrate","Bitrate",.01),days=num("recordDays","روز نگهداری",1,3650,true),hours=num("recordHours","ساعات ضبط",1,24),head=num("headroom","حاشیه ذخیره",0,100),networkHead=num("networkHeadroom","حاشیه شبکه",0,100);
 const mode=$("storageMode")?.value||"continuous",activity=mode==="motion"?num("storageActivity","درصد فعالیت",0,100):100;
 const r=calculateStorage({cameras,bitrateMbps:rate,days,hoursPerDay:hours,activityPercent:activity,prePostPercent:num("storagePrePost","Pre/Post",0,100),audioMbps:num("storageAudio","صدا",0),substreamMbps:num("storageSubstream","Substream",0),overheadPercent:num("storageOverhead","سربار",0,100),headroomPercent:head,raid:$("storageRaid")?.value||"raid5",diskCount:num("storageDiskCount","تعداد دیسک",1,64,true),diskTB:num("storageDiskSize","ظرفیت دیسک",.1),hotSpare:num("storageHotSpare","Hot spare",0,63,true),nvrMaxInputMbps:num("storageNvrInput","حد ورودی NVR",1),uplinkMbps:num("storageUplink","سرعت Uplink",1),playbackMbps:num("storagePlayback","پخش هم‌زمان",0)+networkHead/100*cameras*rate});
 show("storageResult","پروفایل: "+(mode==="motion"?"حرکتی، فعالیت "+activity+"٪":"پیوسته")+"\nبار ورودی ضبط: "+fmt(r.aggregateMbps)+" Mbps\nفضای خام: "+fmt(r.rawTB)+" TB اعشاری\nبا سربار فایل‌سیستم و حاشیه: "+fmt(r.requiredTB)+" TB\nRAID "+r.raid+" قابل استفاده (ضریب فرمت ۹۱٪): "+fmt(r.usableTB)+" TB\nتحمل خرابی: "+r.raidTolerance+"\nظرفیت: "+r.capacityStatus+"؛ ورودی NVR: "+r.nvrInputStatus+"؛ Uplink: "+r.uplinkStatus+" ("+fmt(r.uplinkUtilization*100)+"٪)\n"+r.warnings.join("\n"),r.capacityStatus==="مناسب"?"good":"warn");
});
bind("recommendCable",()=>{
 const env=$("environment").value,d=num("distance","فاصله",.1,100000),speed=num("bandwidthNeed","سرعت",1),poe=$("powerNeed").value==="yes";
 const r=recommendCable({distanceM:d,environment:env==="emi"?"indoor":env,emi:env==="emi"?"high":"low",speedMbps:speed,needsPoe:poe,budget:"medium",existingCoax:false,clearLineOfSight:false});
 show("cableResult",r.options.slice(0,5).map((o,i)=>(i+1)+". "+o.name+"\nمزایا: "+o.pros.join("، ")+"\nمحدودیت‌ها: "+o.cons.join("، ")+"\n"+o.reasons.join("؛ ")).join("\n\n")+"\nهشدارها:\n"+r.warnings.join("\n"),r.options.length?"good":"warn");
});
bind("scoreSecurity",()=>{
 const mapping=["default-password","segmentation","segmentation","patching","patching","remote-cloud","lockout","rbac","ports"];
 const allChecks=[...document.querySelectorAll("#securityChecks input")];const ids=allChecks.map((el,i)=>el.checked?mapping[i]:null).filter(Boolean);
 const r=assessSecurity(ids);
 show("securityResult","امتیاز کنترل‌های نگاشت‌شده: "+r.score+"/100؛ "+r.rating+"\nاولویت‌های اصلاح:\n"+r.priority.slice(0,5).map(x=>x.risk+" · "+x.title).join("\n")+"\nزنجیره حمله احتمالی:\n"+r.attackChain.map(x=>x.text).join("\n"),r.score>=80?"good":"warn");
});
let reportData=null,reportText="";
function buildCapstone(){
 const motion=$("projectStorage").value==="motion",activity=motion?num("projectActivity","درصد فعالیت",0,100):100;
 const codec=$("projectCodec")?.value||"H.264",resolution=$("projectResolution")?.value||"1080p",ptz=$("projectPtz")?.value==="yes",audio=$("projectAudio")?.value==="yes",remoteViewing=$("projectRemote")?.value==="yes",redundantUplink=$("projectRedundantUplink")?.value==="yes",environment=$("projectEnvironment")?.value||"indoor";
 const cams=num("projectCams","تعداد دوربین",1,1024,true),rate=num("projectRate","Bitrate",.1),days=num("projectDays","روز نگهداری",1,3650,true),watts=num("projectWatts","توان هر دوربین",.1),length=num("projectCable","طول کابل",.1,10000),upsMinutes=num("projectUps","هدف UPS",1,1440),buildings=num("projectBuildings","تعداد ساختمان/طبقه",1,1000,true),budget=num("projectBudget","بودجه",0);
 reportData=designCCTV({cameras:cams,bitrateMbps:rate,retentionDays:days,poeWatts:watts,cableLengthM:length,activityPercent:activity,upsMinutes,environment,codec,resolution,ptz,audio,remoteViewing,redundantUplink,buildings,diskCount:8,diskTB:8,raid:"raid6",totalLoadW:cams*(watts+(ptz?8:0))+80});
 reportData.project={name:$("projectName").value||"پروژه CCTV",codec,resolution,buildings,recording:motion?"motion":"continuous",budget,activityPercent:activity};
 reportText="گزارش "+reportData.type+"\nنام پروژه: "+reportData.project.name+"\nکدک: "+codec+"؛ رزولوشن: "+resolution+"؛ ساختمان/طبقه: "+buildings+"\nتعداد دوربین: "+cams+"؛ نرخ بیت: "+rate+" Mbps؛ نگهداری: "+days+" روز\nفعالیت ضبط مدل‌شده: "+activity+"٪\nفضای موردنیاز: "+fmt(reportData.storage.requiredTB)+" TB؛ ظرفیت RAID تخمینی: "+fmt(reportData.storage.usableTB)+" TB\nتوان PoE با حاشیه: "+fmt(reportData.poe.totalRequiredW)+" W\nزمان UPS تخمینی: "+fmt(reportData.ups.runtimeMinutes)+" دقیقه؛ هدف: "+upsMinutes+" دقیقه\nتعداد پورت پیشنهادی با ذخیره: "+reportData.bom[1].quantity+"\nبودجه ورودی: "+(budget?fmt(budget):"اعلام نشده")+"\nهشدارها:\n"+reportData.warnings.join("\n")+"\nفرض‌ها:\n"+reportData.assumptions.join("\n")+"\n\nداده ساخت‌یافته در JSON جداگانه قابل ذخیره است.";
 reportText+="\nIP plan: "+reportData.ipPlan.network+"/"+reportData.ipPlan.prefix+"؛ Broadcast: "+reportData.ipPlan.broadcast+"\nVLAN plan: "+(reportData.vlanPlan||[]).map(v=>v.name+" "+v.cidr).join("؛ ")+"\nBOM:\n"+reportData.bom.map(x=>x.item+": "+x.quantity+" "+(x.unit||"")).join("\n")+"\nآزمون قابلیت اطمینان:\nقطع Uplink: "+reportData.reliability.uplinkFailure.recordingCameras+" دوربین در حال ضبط\nخرابی دیسک: "+reportData.reliability.hddFailure.recordingCameras+" دوربین در حال ضبط\nقطع برق: "+reportData.reliability.powerFailure.recordingCameras+" دوربین در حال ضبط";
 show("capstoneResult",reportText,reportData.warnings.length?"warn":"good");
 return reportData;
}
bind("buildReport",buildCapstone);
function download(filename,mime,text){const blob=new Blob([text],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
bind("downloadReport",()=>{if(!reportText)buildCapstone();download("cctv-design-report.txt","text/plain;charset=utf-8",reportText)});
bind("downloadJsonReport",()=>{if(!reportData)buildCapstone();download("cctv-design-report.json","application/json;charset=utf-8",JSON.stringify(reportData,null,2))});
bind("printReport",()=>{if(!reportText)buildCapstone();const w=window.open("","_blank");if(!w){show("capstoneResult","مرورگر پنجره چاپ را مسدود کرد؛ اجازه pop-up بده یا TXT/JSON را ذخیره کن.","warn");return}const doc=w.document;doc.open();doc.write("<!doctype html><html lang='fa' dir='rtl'><meta charset='utf-8'><title>گزارش طراحی CCTV</title><style>body{font:14px/2 Tahoma,sans-serif;padding:24px}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><pre id='r'></pre></html>");doc.close();doc.getElementById("r").textContent=reportText;w.focus();w.print()});
bind("planVlsm",()=>{
 const base=subnet($("vlsmBase").value,num("vlsmPrefix","پیشوند",0,32,true));
 const requirements=[{name:"دوربین",hosts:num("vlsmCameras","میزبان دوربین",1,65534,true)},{name:"ضبط",hosts:num("vlsmNvr","میزبان ضبط",1,65534,true)},{name:"مدیریت",hosts:num("vlsmManagement","میزبان مدیریت",1,65534,true)},{name:"کاربران",hosts:num("vlsmUsers","میزبان کاربران",1,65534,true)}];
 const rows=planVLSM(requirements,{address:base.address,prefix:base.prefix});
 show("vlsmResult",rows.map(r=>r.name+": "+r.cidr+"؛ میزبان "+r.first+" تا "+r.last+"؛ Broadcast "+r.broadcast).join("\n"),"good");
});
bind("calcAdvancedSecurity",()=>{
 const ids=[...document.querySelectorAll("[data-security-control]:checked")].map(el=>el.dataset.securityControl);
 const r=assessSecurity(ids);
 const details=r.controls.filter(x=>!x.enabled).map(x=>x.risk+" · "+x.title+" (وزن "+x.weight+"): چرا مهم است: "+x.why+" چطور: "+x.how+" سناریو: "+x.attack);
 show("advancedSecurityResult","امتیاز وزنی: "+r.score+"/100؛ "+r.rating+"\nاولویت‌های اصلاح:\n"+details.join("\n\n")+"\nزنجیره حمله محتمل:\n"+(r.attackChain.map(x=>x.text).join("\n")||"کنترل‌های کلیدی انتخاب شده‌اند؛ بازبینی فنی همچنان لازم است."),"good");
});
bind("calcUps",()=>{
 const loadW=num("upsLoad","بار وات",.1);
 const pf=num("upsPf","ضریب توان",.1,1);
 const batteryWh=num("upsBattery","ظرفیت باتری Wh",.1);
 const efficiency=num("upsEfficiency","بازده اینورتر",1,100)/100;
 const dod=num("upsDod","عمق تخلیه مجاز",1,100)/100;
 const health=num("upsAge","سلامت باتری",1,100)/100;
 const r=calculateUps({loadW,powerFactor:pf,batteryWh,inverterEfficiency:efficiency,depthOfDischarge:dod,ageFactor:health});
 const minutes=r.runtimeMinutes;
 const status=minutes<5?"bad":minutes<15?"warn":"good";
 show("upsResult","زمان پشتیبانی تخمینی: "+fmt(minutes)+" دقیقه\nبار اکتیو: "+fmt(loadW)+" W؛ بار ظاهری لازم: "+fmt(r.requiredVA)+" VA\nانرژی اسمی باتری: "+fmt(batteryWh)+" Wh؛ انرژی قابل استفاده پس از اعمال راندمان، عمق تخلیه و سلامت: "+fmt(r.usableWh)+" Wh\nفرض‌ها: PF="+fmt(pf)+"؛ راندمان="+fmt(efficiency*100)+"٪؛ عمق تخلیه="+fmt(dod*100)+"٪؛ سلامت="+fmt(health*100)+"٪\n"+(minutes<5?"هشدار: زمان پشتیبانی بسیار کوتاه است.":minutes<15?"توجه: زمان پشتیبانی محدود است؛ نیاز پروژه را بررسی کن.":"برآورد انرژی با ورودی‌های فعلی محاسبه شد.")+"\nقبل از انتخاب دستگاه، توان پیوسته W و ظرفیت VA خروجی UPS، جریان راه‌اندازی، ضریب توان، ولتاژ/آرایش باتری و منحنی تخلیه سازنده را جداگانه کنترل کن. این فرمول تخمین خطی است و افت ظرفیت در بار بالا را مدل نمی‌کند.",""+status);
});
bind("calcLens",()=>{
 const r=calculateCoverage({
  sensorWidthMm:num("lensSensorW","عرض سنسور",.1),
  sensorHeightMm:num("lensSensorH","ارتفاع سنسور",.1),
  focalLengthMm:num("lensFocal","فاصله کانونی",.1),
  distanceM:num("lensDistance","فاصله",.1),
  horizontalPixels:num("lensPixelsX","پیکسل افقی",1,200000,true),
  verticalPixels:num("lensPixelsY","پیکسل عمودی",1,200000,true),
  sceneWidthM:num("lensSceneW","عرض فضای هدف",.1),
  sceneHeightM:num("lensSceneH","عمق فضای هدف",.1),
  overlapPercent:20
 });
 const coverage=r.sceneCoverage;
 const fit=coverage.fitsSingleCamera;
 const density=r.pixelsPerMeter;
 const status=fit&&r.current2025DensityLevel!==null?"good":"warn";
 show("lensResult","زاویه دید افقی/عمودی: "+fmt(r.horizontalFovDeg)+"° / "+fmt(r.verticalFovDeg)+"°\nمیدان دید تخمینی در فاصله انتخابی: "+fmt(r.coveredWidthM)+" × "+fmt(r.coveredHeightM)+" متر\nتراکم پیکسل افقی/عمودی: "+fmt(r.horizontalPixelsPerMeter)+" / "+fmt(r.verticalPixelsPerMeter)+" px/m؛ مبنای ارزیابی محافظه‌کارانه: "+fmt(density)+" px/m\nسطح مرجع DORI قدیمی: "+r.dori+"\nسطح تراکم IEC 62676-4:2025: "+(r.current2025DensityLevel===null?"کمتر از ۲۰ px/m":fmt(r.current2025DensityLevel)+" px/m")+"\nپوشش فضای هدف "+fmt(coverage.sceneWidthM)+" × "+fmt(coverage.sceneHeightM)+" متر: "+(fit?"از نظر هندسی در میدان دید یک دوربین جا می‌گیرد.":"در یک قاب جا نمی‌گیرد؛ برآورد هندسی با هم‌پوشانی ۲۰٪ حدود "+coverage.horizontalCameras+" ستون × "+coverage.verticalRows+" ردیف دوربین می‌خواهد.")+"\n"+r.warning,""+status);
 const svg=$("lensCoverageSvg");
 const sw=Math.max(20,Math.min(260,260*coverage.horizontalCoverageRatio));
 const sh=Math.max(12,Math.min(82,82*coverage.verticalCoverageRatio));
 const x=160-sw/2,y=112-sh;
 svg.innerHTML="<rect x='1' y='1' width='318' height='138' rx='10' fill='#091726' stroke='#294760'/><circle cx='160' cy='22' r='8' fill='#67e8f9'/><path d='M160 22 L"+(160-sw/2)+" 112 L"+(160+sw/2)+" 112 Z' fill='rgba(56,189,248,.22)' stroke='#38bdf8' stroke-width='2'/><rect x='"+x+"' y='"+y+"' width='"+sw+"' height='"+sh+"' fill='none' stroke='"+(fit?"#53dfae":"#ffca72")+"' stroke-dasharray='4 3'/><line x1='160' y1='22' x2='160' y2='112' stroke='#67e8f9' stroke-dasharray='4 4'/><text x='160' y='132' fill='#eaf2ff' font-size='10' text-anchor='middle'>میدان دید و فضای هدف — شماتیک، نه مقیاس دقیق</text>";
});
const commissioningKey="cctvCommissioningV1";
function loadCommissioning(){let saved={};try{saved=JSON.parse(localStorage.getItem(commissioningKey)||"{}")}catch{}document.querySelectorAll("[data-commission]").forEach(el=>el.checked=Boolean(saved[el.dataset.commission]));updateCommissioning()}
function updateCommissioning(){const all=[...document.querySelectorAll("[data-commission]")],done=all.filter(x=>x.checked).length;$("commissioningProgress").textContent="تکمیل "+fmt(done)+" از "+fmt(all.length)+" مورد ("+fmt(done/all.length*100)+"٪)";const data=Object.fromEntries(all.map(x=>[x.dataset.commission,x.checked]));localStorage.setItem(commissioningKey,JSON.stringify(data))}
document.querySelectorAll("[data-commission]").forEach(el=>el.addEventListener("change",updateCommissioning));
bind("exportCommissioning",()=>{const all=[...document.querySelectorAll("[data-commission]")];show("commissioningResult",all.map(x=>(x.checked?"[✓] ":"[ ] ")+x.parentElement.textContent.trim()).join("\n"),"good")});
loadCommissioning();
bind("runSwitchFeatureSim",()=>{
 const rstp=$("swRstp").checked,igmp=$("swIgmp").checked,qos=$("swQos").checked,isolation=$("swIsolation").checked,storm=$("swStorm").checked,loop=$("swLoopInjected").checked,multicast=$("swMulticast").checked;
 const ports=[{id:"p1",vlan:10,speedMbps:1000,isolated:true},{id:"p2",vlan:10,speedMbps:1000,isolated:true},{id:"p3",vlan:10,speedMbps:1000,isolated:false},{id:"p4",vlan:10,speedMbps:1000,isolated:false},{id:"p5",vlan:10,speedMbps:1000},{id:"p6",vlan:10,speedMbps:1000}];
 const nodes=[
  {id:"sw",type:"switch",rstpEnabled:rstp,igmpSnooping:igmp,qosEnabled:qos,portIsolation:isolation,stormControl:storm,multicastStreams:multicast?4:0,ports},
  {id:"cam1",type:"camera",ip:"192.168.30.11",prefix:24,vlan:10,poeRequired:false,rtspEnabled:true,ports:[{id:"eth0",vlan:10}]},
  {id:"cam2",type:"camera",ip:"192.168.30.12",prefix:24,vlan:10,poeRequired:false,rtspEnabled:true,ports:[{id:"eth0",vlan:10}]},
  {id:"nvr",type:"nvr",ip:"192.168.30.20",prefix:24,vlan:10,recordingEnabled:true,diskHealthy:true,freeStorageTB:2,ports:[{id:"eth0",vlan:10}]},
  {id:"service",type:"laptop",ip:"192.168.30.50",prefix:24,vlan:10,ports:[{id:"eth0",vlan:10}]}
 ];
 const links=[
  {id:"cam1-link",type:"ethernet",from:{node:"sw",port:"p1"},to:{node:"cam1",port:"eth0"},lengthM:25},
  {id:"cam2-link",type:"ethernet",from:{node:"sw",port:"p2"},to:{node:"cam2",port:"eth0"},lengthM:25},
  {id:"nvr-link",type:"ethernet",from:{node:"sw",port:"p3"},to:{node:"nvr",port:"eth0"},lengthM:3},
  {id:"service-link",type:"ethernet",from:{node:"sw",port:"p4"},to:{node:"service",port:"eth0"},lengthM:3},
  ...(loop?[{id:"loop-link",type:"ethernet",from:{node:"sw",port:"p5"},to:{node:"sw",port:"p6"},lengthM:1,loop:true}]:[])
 ];
 const graph=createGraph({nodes,links,vlans:[{id:10,name:"CCTV"}],trafficMbps:multicast?850:800});
 const state=evaluateNetwork(graph),lateral=runDiagnostic(graph,"ping","cam2",{source:"cam1"});
 const lines=["مدل گراف: "+(state.graphValid?"ساختار معتبر":"هشدار اعتبارسنجی")+"؛ بار شبکه: "+graph.trafficMbps+" Mbps"];
 lines.push(...state.events.map(e=>e.type+": "+e.message));
 lines.push("Ping دوربین‌به‌دوربین: "+lateral.output);
 if(!state.events.length)lines.push("در وضعیت فعلی رویداد خطای فعال تولید نشد.");
 show("switchFeaturesResult",lines.join("\n"),state.events.some(e=>e.type==="broadcast-storm"||e.type==="multicast-flooding"||e.type==="qos-congestion")?"warn":"good");
});
