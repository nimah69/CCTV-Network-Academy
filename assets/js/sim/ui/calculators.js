import { calculatePoe } from "../calc/poe.js";
import { subnet, sameSubnet, validateGateway, planVLSM } from "../calc/subnet.js";
import { calculateStorage } from "../calc/storage.js";
import { recommendCable } from "../calc/cable.js";
import { calculateUps } from "../calc/ups.js";
import { calculateCoverage } from "../calc/optics.js";
import { assessSecurity } from "../calc/security.js";
import { designCCTV } from "../calc/design.js";

const $=id=>document.getElementById(id);
const fmt=n=>Number(n).toLocaleString("fa-IR",{maximumFractionDigits:2});
const num=(id,label,min=0,max=Infinity,integer=false)=>{const el=$(id);if(!el)throw new Error("فیلد "+label+" پیدا نشد.");const raw=el.value.replace(/[۰-۹٠-٩]/g,d=>"۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩".indexOf(d)<10?"۰۱۲۳۴۵۶۷۸۹".indexOf(d):"٠١٢٣٤٥٦٧٨٩".indexOf(d)-10).replace(/٫/g,".");if(raw.trim()==="")throw new Error(label+" را وارد کن.");const n=Number(raw);if(!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))throw new Error(label+" باید "+(integer?"عدد صحیح ":"")+"در محدوده "+min+" تا "+max+" باشد.");return n};
function show(id,text,kind=""){const el=$(id);if(!el)return;el.className="output "+kind;el.style.whiteSpace="pre-wrap";el.textContent=text}
function bind(id,handler){const el=$(id);if(!el)return;el.addEventListener("click",event=>{event.preventDefault();event.stopImmediatePropagation();try{handler(event)}catch(error){const outputId=({"calcPoe":"poeResult","runPoeSimulation":"poeSimulationResult","calcSubnet":"subnetResult","calcStorage":"storageResult","recommendCable":"cableResult","scoreSecurity":"securityResult","buildReport":"capstoneResult","downloadReport":"capstoneResult","downloadJsonReport":"capstoneResult","printReport":"capstoneResult","planVlsm":"vlsmResult","calcUps":"upsResult","calcLens":"lensResult","exportCommissioning":"commissioningResult","runSwitchFeatureSim":"switchFeaturesResult"})[id];if(outputId)show(outputId,"خطا: "+error.message,"bad")}},true)}
function getPoe(){
 const standard={"12.95":"af","25.5":"at","51":"bt3","71.3":"bt4"}[$("poePortClass").value]||"at";
 return calculatePoe({standard,cameraWatts:num("poeWatts","توان دوربین",.1),lengthM:num("cableLength","طول کابل",0,100),cable:$("cableType").value==="cca"?"cca":"copper",cameraCount:num("poeCams","تعداد دوربین",1,1024,true),budgetW:num("poeBudget","بودجه کل PoE",1),reservePercent:num("poeReserve","حاشیه اطمینان",0,100)});
}
function poeText(r){return "وضعیت: "+r.status+"\nاستاندارد: "+r.standard+"\nتوان برآوردی موردنیاز در PSE برای هر دوربین: "+fmt(r.pseRequiredW)+" W\nتوان تخمینی رسیده به PD: "+fmt(r.pdW)+" W\nافت ولتاژ مدل‌شده: "+fmt(r.voltageDropV)+" V\nاتلاف کابل: "+fmt(r.lossW)+" W\nتوان کل با حاشیه: "+fmt(r.totalRequiredW)+" W\nبودجه پورت: "+(r.portOk?"کافی":"ناکافی")+"؛ بودجه کل: "+(r.totalOk?"کافی":"ناکافی")+"\nفرض: مقاومت حلقه ۱۸۸ Ω/km و اثر CCA تخمینی است؛ با کابل و دیتاشیت واقعی تطبیق بده.\n"+r.warning.join("\n")}
bind("calcPoe",()=>{show("poeResult",poeText(getPoe()),"good")});
bind("runPoeSimulation",()=>{const r=getPoe();show("poeSimulationResult",poeText(r),"good");const nodes=[...document.querySelectorAll("#poe .schematic-node")];nodes.forEach(n=>{n.classList.remove("sim-pass","sim-warn","sim-fail");n.classList.add(r.status==="مناسب"?"sim-pass":r.status==="مرزی"?"sim-warn":"sim-fail")})});
bind("calcSubnet",()=>{
 const ip=$("ipAddress").value,prefix=num("cidr","CIDR",0,32,true),r=subnet(ip,prefix),lines=["آدرس: "+r.address+"/"+r.prefix,"شبکه: "+r.network,"Broadcast: "+r.broadcast,"Mask: "+r.mask,"Wildcard: "+r.wildcard,"اولین میزبان: "+r.firstHost,"آخرین میزبان: "+r.lastHost,"تعداد آدرس قابل استفاده: "+fmt(r.usableHosts),"محدوده خصوصی RFC 1918: "+(r.isPrivate?"بله":"خیر"),"Link-local: "+(r.isLinkLocal?"بله":"خیر"),"Loopback: "+(r.isLoopback?"بله":"خیر"),...r.notes];
 if($("gateway").value.trim()){const g=validateGateway(ip,prefix,$("gateway").value);lines.push("Gateway: "+g.reason)}
 if($("otherIp").value.trim()){try{lines.push("IP دوم: "+(sameSubnet({ip,prefix},{ip:$("otherIp").value,prefix})?"در همان زیرشبکه":"در زیرشبکه متفاوت"))}catch(e){lines.push("IP دوم: "+e.message)}}
 show("subnetResult",lines.join("\n"),"good");
});
bind("calcStorage",()=>{
 const cameras=num("storageCams","تعداد دوربین",1,1024,true),rate=num("bitrate","Bitrate",.01),days=num("recordDays","روز نگهداری",1,3650,true),hours=num("recordHours","ساعات ضبط",1,24),head=num("headroom","حاشیه ذخیره",0,100),networkHead=num("networkHeadroom","حاشیه شبکه",0,100);
 const r=calculateStorage({cameras,bitrateMbps:rate,days,hoursPerDay:hours,activityPercent:100,overheadPercent:7,headroomPercent:head,raid:"raid5",diskCount:4,diskTB:8,uplinkMbps:1000,playbackMbps:cameras*rate*networkHead/100});
 show("storageResult","بار ورودی: "+fmt(r.aggregateMbps)+" Mbps\nفضای خام: "+fmt(r.rawTB)+" TB اعشاری\nبا سربار ۷٪ و حاشیه: "+fmt(r.requiredTB)+" TB\nRAID5 تخمینی (۴×۸ TB، ضریب ظرفیت ۹۱٪): "+fmt(r.usableTB)+" TB قابل استفاده\nظرفیت: "+r.capacityStatus+"؛ ورودی NVR: "+r.nvrInputStatus+"؛ Uplink: "+r.uplinkStatus+"\n"+r.warnings.join("\n"),r.capacityStatus==="مناسب"?"good":"warn");
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
 const codec=$("projectCodec")?.value||"H.264",resolution=$("projectResolution")?.value||"1080p";
 const cams=num("projectCams","تعداد دوربین",1,1024,true),rate=num("projectRate","Bitrate",.1),days=num("projectDays","روز نگهداری",1,3650,true),watts=num("projectWatts","توان هر دوربین",.1),length=num("projectCable","طول کابل",.1,10000),upsMinutes=num("projectUps","هدف UPS",1,1440),buildings=num("projectBuildings","تعداد ساختمان/طبقه",1,1000,true),budget=num("projectBudget","بودجه",0);
 reportData=designCCTV({cameras:cams,bitrateMbps:rate,retentionDays:days,poeWatts:watts,cableLengthM:length,activityPercent:activity,upsMinutes,environment:"indoor",diskCount:8,diskTB:8,raid:"raid6",totalLoadW:cams*watts+80});
 reportData.project={name:$("projectName").value||"پروژه CCTV",codec,resolution,buildings,recording:motion?"motion":"continuous",budget,activityPercent:activity};
 reportText="گزارش "+reportData.type+"\nنام پروژه: "+reportData.project.name+"\nکدک: "+codec+"؛ رزولوشن: "+resolution+"؛ ساختمان/طبقه: "+buildings+"\nتعداد دوربین: "+cams+"؛ نرخ بیت: "+rate+" Mbps؛ نگهداری: "+days+" روز\nفعالیت ضبط مدل‌شده: "+activity+"٪\nفضای موردنیاز: "+fmt(reportData.storage.requiredTB)+" TB؛ ظرفیت RAID تخمینی: "+fmt(reportData.storage.usableTB)+" TB\nتوان PoE با حاشیه: "+fmt(reportData.poe.totalRequiredW)+" W\nزمان UPS تخمینی: "+fmt(reportData.ups.runtimeMinutes)+" دقیقه؛ هدف: "+upsMinutes+" دقیقه\nتعداد پورت پیشنهادی با ذخیره: "+reportData.bom[1].quantity+"\nبودجه ورودی: "+(budget?fmt(budget):"اعلام نشده")+"\nهشدارها:\n"+reportData.warnings.join("\n")+"\nفرض‌ها:\n"+reportData.assumptions.join("\n")+"\n\nداده ساخت‌یافته در JSON جداگانه قابل ذخیره است.";
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
bind("calcUps",()=>{
 const r=calculateUps({loadW:num("upsLoad","بار وات",.1),powerFactor:num("upsPf","ضریب توان",.1,1),batteryWh:num("upsBattery","ظرفیت باتری",.1),inverterEfficiency:num("upsEfficiency","بازده",1,100)/100,depthOfDischarge:num("upsDod","عمق تخلیه",1,100)/100,ageFactor:num("upsAge","سلامت باتری",1,100)/100});
 show("upsResult","توان ظاهری لازم: "+fmt(r.requiredVA)+" VA\nانرژی قابل استفاده تخمینی: "+fmt(r.usableWh)+" Wh\nزمان پشتیبانی: "+fmt(r.runtimeMinutes)+" دقیقه\nوضعیت: "+r.status+"\nفرض‌ها: "+r.assumptions.join("؛ "),"good");
});
bind("calcLens",()=>{
 const r=calculateCoverage({sensorWidthMm:num("lensSensorW","عرض سنسور",.1),sensorHeightMm:num("lensSensorH","ارتفاع سنسور",.1),focalLengthMm:num("lensFocal","فاصله کانونی",.1),distanceM:num("lensDistance","فاصله",.1),horizontalPixels:num("lensPixelsX","پیکسل افقی",1),verticalPixels:num("lensPixelsY","پیکسل عمودی",1),sceneWidthM:num("lensSceneW","عرض فضا",.1),sceneHeightM:num("lensSceneH","عمق فضا",.1)});
 show("lensResult","زاویه افقی: "+fmt(r.horizontalFovDeg)+"°؛ عمودی: "+fmt(r.verticalFovDeg)+"°\nپوشش تخمینی: "+fmt(r.coveredWidthM)+" × "+fmt(r.coveredHeightM)+" m\nتراکم پیکسل: "+fmt(r.pixelsPerMeter)+" px/m؛ سطح تقریبی DORI: "+r.dori+"\nتعداد دوربین هندسی برای فضا: "+r.sceneCoverage.horizontalCameras+" ستون × "+r.sceneCoverage.verticalRows+" ردیف\n"+r.warning,"good");
 const svg=$("lensCoverageSvg");const half=Math.min(140,Math.max(35,r.horizontalFovDeg*1.5));const left=160-half,right=160+half;svg.innerHTML="<rect x='1' y='1' width='318' height='138' rx='10' fill='#091726' stroke='#294760'/><circle cx='160' cy='22' r='8' fill='#67e8f9'/><path d='M160 22 L"+left+" 124 L"+right+" 124 Z' fill='rgba(56,189,248,.22)' stroke='#38bdf8' stroke-width='2'/><line x1='160' y1='22' x2='160' y2='124' stroke='#67e8f9' stroke-dasharray='4 4'/><text x='160' y='135' fill='#eaf2ff' font-size='10' text-anchor='middle'>نمای شماتیک، نه نقشه مقیاس‌دار</text>";
});
const commissioningKey="cctvCommissioningV1";
function loadCommissioning(){let saved={};try{saved=JSON.parse(localStorage.getItem(commissioningKey)||"{}")}catch{}document.querySelectorAll("[data-commission]").forEach(el=>el.checked=Boolean(saved[el.dataset.commission]));updateCommissioning()}
function updateCommissioning(){const all=[...document.querySelectorAll("[data-commission]")],done=all.filter(x=>x.checked).length;$("commissioningProgress").textContent="تکمیل "+fmt(done)+" از "+fmt(all.length)+" مورد ("+fmt(done/all.length*100)+"٪)";const data=Object.fromEntries(all.map(x=>[x.dataset.commission,x.checked]));localStorage.setItem(commissioningKey,JSON.stringify(data))}
document.querySelectorAll("[data-commission]").forEach(el=>el.addEventListener("change",updateCommissioning));
bind("exportCommissioning",()=>{const all=[...document.querySelectorAll("[data-commission]")];show("commissioningResult",all.map(x=>(x.checked?"[✓] ":"[ ] ")+x.parentElement.textContent.trim()).join("\n"),"good")});
loadCommissioning();
bind("runSwitchFeatureSim",()=>{
 const rstp=$("swRstp").checked,igmp=$("swIgmp").checked,qos=$("swQos").checked,isolation=$("swIsolation").checked,storm=$("swStorm").checked,loop=$("swLoopInjected").checked,multicast=$("swMulticast").checked;
 const lines=[];
 lines.push(loop?(rstp?"Loop تزریق شد: RSTP باید مسیر افزونه را مسدود کند؛ پس از همگرایی توپولوژی را بازبینی کن.":"هشدار بحرانی: Loop بدون RSTP می‌تواند Broadcast storm ایجاد کند."):"Loop تزریق نشده است؛ RSTP همچنان برای افزونگی ایمن لازم است.");
 lines.push(multicast?(igmp?"IGMP snooping فعال: جریان multicast به پورت‌های عضو گروه محدود می‌شود.":"IGMP snooping خاموش: ترافیک multicast ممکن است به پورت‌های بیشتری flood شود."):"جریان multicast اضافه نشده است.");
 lines.push(qos?"QoS فعال: صف‌بندی اولویت‌دار مدل شده؛ پیکربندی واقعی باید با DSCP/صف‌های دستگاه تطبیق یابد.":"QoS خاموش: در ازدحام، تأخیر جریان ویدئو تضمین نمی‌شود.");
 lines.push(isolation?"Port isolation فعال: ارتباط مستقیم پورت‌های ایزوله‌شده محدود می‌شود؛ مسیر NVR باید مجاز بماند.":"Port isolation خاموش: سیاست دسترسی باید با ACL/VLAN بررسی شود.");
 lines.push(storm?"Storm control فعال: نرخ broadcast/multicast از آستانه تنظیمی فراتر رود، محدود یا drop می‌شود.":"Storm control خاموش: در رخداد Loop، دامنه اختلال می‌تواند گسترش یابد.");
 show("switchFeaturesResult",lines.join("\n"),loop&&!rstp?"bad":loop||multicast&&!igmp?"warn":"good");
});
