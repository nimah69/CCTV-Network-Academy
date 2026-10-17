import { ENGINEERING } from "../constants.js";
import { positiveNumber, nonNegativeNumber } from "../units.js";
export function calculatePoe({standard="at",cameraWatts,lengthM=0,voltage=ENGINEERING.poe.nominalVoltageV,pairs=null,cable="copper",cableLoopOhmPerKm=ENGINEERING.ethernet.copperLoopResistanceOhmPerKm,reservePercent=20,portBudgetW,budgetW,cameraCount=1,allocation="actual",classPseW}={}) {
 const profile=ENGINEERING.poe[standard];if(!profile)throw new RangeError("استاندارد PoE انتخاب‌شده پشتیبانی نمی‌شود.");
 const load=positiveNumber(cameraWatts,"مصرف دوربین"),length=nonNegativeNumber(lengthM,"طول کابل"),v=positiveNumber(voltage,"ولتاژ مدل"),reserve=nonNegativeNumber(reservePercent,"حاشیه اطمینان"),count=positiveNumber(cameraCount,"تعداد دوربین"),loop=positiveNumber(cableLoopOhmPerKm,"مقاومت حلقه کابل"),pairCount=pairs??profile.pairs;
 if(!Number.isInteger(count)||![2,4].includes(pairCount))throw new RangeError("تعداد دوربین باید صحیح و تعداد زوج‌های موازی ۲ یا ۴ باشد.");
 if(length>ENGINEERING.ethernet.maxCopperChannelM)throw new RangeError("طول کانال مسی بیش از ۱۰۰ متر است؛ برای این مدل لینک را طراحی مجدد کن.");
 if(reserve>100)throw new RangeError("حاشیه اطمینان نباید بیش از ۱۰۰٪ باشد.");
 // Approximation: cableLoopOhmPerKm defaults to 188 Ω/km per current path; four-pair operation models two parallel pair paths.
 // CCA factor is a planning heuristic (55–60% higher resistance) and must be replaced by measured/datasheet values.
 const materialFactor=cable==="cca"?ENGINEERING.ethernet.ccaResistanceFactor:1,parallelPaths=pairCount===4?2:1,resistance=loop*length/1000*materialFactor/parallelPaths;
 const current=load/v,drop=current*resistance,loss=current*current*resistance,pdW=Math.max(0,load-loss),pseRequiredW=load+loss;
 const perPortLimit=portBudgetW==null?profile.pseW:positiveNumber(portBudgetW,"حد توان پورت");
 const totalBudget=budgetW==null?Infinity:positiveNumber(budgetW,"بودجه کل سوئیچ");
 const classReservation=allocation==="class"?(classPseW==null?profile.pseW:positiveNumber(classPseW,"رزرو کلاس")):pseRequiredW;
 const totalRequired=allocation==="class"?classReservation*count*(1+reserve/100):pseRequiredW*count*(1+reserve/100),portOk=pseRequiredW<=perPortLimit,totalOk=totalRequired<=totalBudget;
 const status=portOk&&totalOk&&pdW>=load*.9?"مناسب":portOk&&totalOk?"مرزی":"نامناسب";
 return {standard:profile.label,cameraWatts:load,pseRequiredW,pdW,voltageDropV:drop,lossW:loss,currentA:current,resistanceOhm:resistance,portLimitW:perPortLimit,totalBudgetW:totalBudget,totalRequiredW:allocation==="class"?classReservation*count*(1+reserve/100):totalRequired,portOk,totalOk,status,material:cable,pairs:pairCount,warning:[...(length>90?["طول بیش از ۹۰ متر است؛ افت، اتصالات و طول پچ‌کوردها را دقیق بررسی کن."]:[]),...(cable==="cca"?["CCA رسانایی پایین‌تری از مس دارد؛ مقدار مقاومت این مدل تخمینی است و به تأیید نیاز دارد."]:[]),...(profile.pseW>=ENGINEERING.design.highPowerPoeWarningW?["توان بالا: گرمایش دسته کابل، دمای محیط و محدودیت سازنده بررسی شود."]:[]),...(!portOk?["توان موردنیاز از سقف مدل‌شده پورت بیشتر است."]:[]),...(!totalOk?["بودجه کل PoE برای تعداد دوربین و حاشیه انتخابی کافی نیست."]:[])]};
}
export function poeCapacity({budgetW,cameraWatts,reservePercent=20}){const budget=positiveNumber(budgetW,"بودجه PoE"),load=positiveNumber(cameraWatts,"مصرف هر دوربین"),reserve=nonNegativeNumber(reservePercent,"حاشیه");return Math.floor(budget/(load*(1+reserve/100)))}
