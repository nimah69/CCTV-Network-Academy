import { calculatePoe } from "./poe.js";
import { subnet, planVLSM } from "./subnet.js";
import { calculateStorage } from "./storage.js";
import { recommendCable } from "./cable.js";
import { calculateUps } from "./ups.js";
import { calculateCoverage } from "./optics.js";
import { assessSecurity } from "./security.js";
import { ENGINEERING } from "../constants.js";
export function designCCTV(input={}){
 const cameras=Number(input.cameras??8),bitrateMbps=Number(input.bitrateMbps??4),days=Number(input.retentionDays??30),poeWatts=Number(input.poeWatts??12),upsMinutes=Number(input.upsMinutes??30),codec=input.codec??"H.264",resolution=input.resolution??"1080p",audio=input.audio===true,ptz=input.ptz===true,remoteViewing=input.remoteViewing===true,buildings=Number(input.buildings??1),environment=input.environment??"indoor";
 const recommendedBitrate=ENGINEERING.video.bitrateMbps[resolution]?.[codec]??null;
 const storage=calculateStorage({cameras,bitrateMbps,days,hoursPerDay:Number(input.hoursPerDay??24),activityPercent:Number(input.activityPercent??100),audioMbps:audio?0.128:0,diskCount:Number(input.diskCount??4),diskTB:Number(input.diskTB??8),raid:input.raid??"raid5",nvrMaxInputMbps:Number(input.nvrMaxInputMbps??160),uplinkMbps:Number(input.uplinkMbps??1000),playbackMbps:remoteViewing?cameras*0.5:0});
 const poe=calculatePoe({standard:input.poeStandard??"at",cameraWatts:poeWatts,lengthM:Number(input.cableLengthM??50),cameraCount:cameras,budgetW:Number(input.poeBudgetW??120),reservePercent:Number(input.reservePercent??20)});
 const ip=subnet(input.baseIp??"192.168.10.10",Number(input.cidr??24));
 const cable=recommendCable({distanceM:Number(input.cableLengthM??50),environment:input.environment??"indoor",emi:input.emi??"low",speedMbps:Number(input.uplinkMbps??1000),needsPoe:true,budget:input.budget??"medium"});
 const ups=calculateUps({loadW:Number(input.totalLoadW??cameras*(poeWatts+(ptz?8:0))+80),powerFactor:Number(input.powerFactor??0.8),batteryWh:Number(input.batteryWh??600),depthOfDischarge:Number(input.depthOfDischarge??0.8),ageFactor:Number(input.batteryAgeFactor??0.8)});
 const coverage=input.sensorWidthMm?calculateCoverage({sensorWidthMm:Number(input.sensorWidthMm),sensorHeightMm:Number(input.sensorHeightMm??3.6),focalLengthMm:Number(input.focalLengthMm??4),distanceM:Number(input.distanceM??10),horizontalPixels:Number(input.horizontalPixels??1920),verticalPixels:Number(input.verticalPixels??1080)}):null;
 const security=assessSecurity(input.securityControls??[]);
 const warnings=[...(storage.warnings||[]),...(poe.warning||[]),...(cable.warnings||[])];
 if(recommendedBitrate&&bitrateMbps<recommendedBitrate)warnings.push("Bitrate واردشده از نقطه شروع معمول برای "+resolution+" / "+codec+" پایین‌تر است؛ کیفیت واقعی صحنه را آزمایش کن.");
 if(audio)warnings.push("برای صدا، قانون محل نصب، حریم خصوصی و پهنای باند اضافه را بررسی کن.");
 if(ptz)warnings.push("دوربین PTZ ممکن است در حرکت/هیتر/IR پیک توان بالاتری داشته باشد؛ دیتاشیت پیک ملاک است.");
 if(environment==="outdoor")warnings.push("فضای بیرون: کابل UV-rated، ارت، Surge protection و مسیر برق/زمین را طراحی کن.");
 if(buildings>1)warnings.push("بین ساختمان‌ها فیبر و حفاظت در برابر اختلاف پتانسیل زمین را بررسی کن؛ فیبر PoE منتقل نمی‌کند.");
 if(ups.runtimeMinutes<upsMinutes) warnings.push("زمان پشتیبانی تخمینی UPS ("+Math.round(ups.runtimeMinutes)+" دقیقه) کمتر از هدف ("+upsMinutes+" دقیقه) است.");
 if(coverage&&coverage.pixelsPerMeter<125) warnings.push("تراکم پیکسل برای شناسایی چهره طبق آستانه تقریبی DORI کافی نیست.");
 return {type:"برآورد اولیه",inputs:{cameras,bitrateMbps,days,poeWatts,upsMinutes,codec,resolution,audio,ptz,remoteViewing,buildings,environment,recommendedBitrate},bom:[{item:"دوربین IP PoE",quantity:cameras,notes:"توان و bitrate باید از دیتاشیت واقعی جایگزین شود."},{item:"پورت سوئیچ PoE",quantity:Math.ceil(cameras*(1+ENGINEERING.design.defaultPortSpareFraction))+2,notes:"شامل ذخیره طراحی ۲۵٪ و پورت‌های uplink/NVR؛ بر حسب توپولوژی بازبینی شود."},{item:"NVR/VMS",quantity:1,notes:"تعداد کانال، ورودی bitrate، codec و خروجی HDMI را تأیید کن."},{item:"دیسک خام",quantity:Number(input.diskCount??4),unit:"دیسک",notes:"ظرفیت و سازگاری با NVR و RAID باید بررسی شود."},{item:"ظرفیت قابل استفاده تخمینی",quantity:storage.usableTB,unit:"TB",notes:"پس از RAID و ضریب ظرفیت قابل استفاده."},{item:"UPS",quantity:1,notes:"VA و runtime با بار واقعی و دیتاشیت باتری تطبیق داده شود."},{item:"کابل و متعلقات",quantity:cameras,unit:"مسیر",notes:"طول هر مسیر، کانکتور، پچ‌پنل و مسیر بیرون جداگانه محاسبه شود."}],ipPlan:ip,storage,poe,cable,ups,coverage,security,warnings,assumptions:["این برآورد اولیه است و جایگزین طراحی اجرایی، دیتاشیت و تست محل نیست.","مدل افت PoE و عمر باتری تقریبی است.","در صورت ارائه تعداد VLANها می‌توان برنامه VLSM را جداگانه محاسبه کرد."]};
}
export { planVLSM };
