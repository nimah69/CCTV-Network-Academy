import { positiveNumber } from "../units.js";
export function calculateUps({loadW,powerFactor=0.8,inverterEfficiency=0.85,batteryWh,depthOfDischarge=0.8,ageFactor=0.8}={}){
 const load=positiveNumber(loadW,"بار وات"),pf=positiveNumber(powerFactor,"ضریب توان"),eff=positiveNumber(inverterEfficiency,"بازده اینورتر"),capacity=positiveNumber(batteryWh,"ظرفیت باتری Wh"),dod=positiveNumber(depthOfDischarge,"عمق تخلیه"),age=positiveNumber(ageFactor,"ضریب سلامت باتری");
 if(pf>1||eff>1||dod>1||age>1)throw new RangeError("ضریب توان، بازده، عمق تخلیه و سلامت باید حداکثر ۱ باشند.");
 const va=load/pf,usableWh=capacity*dod*age*eff,runtimeHours=usableWh/load,runtimeMinutes=runtimeHours*60;
 if(!Number.isFinite(va)||!Number.isFinite(usableWh)||!Number.isFinite(runtimeHours)||!Number.isFinite(runtimeMinutes))throw new RangeError("نتیجه محاسبه UPS خارج از محدوده عددی است.");
 return {loadW:load,requiredVA:va,usableWh,runtimeHours,runtimeMinutes,assumptions:["ظرفیت باتری بر حسب Wh است؛ برای Ah باید ولتاژ باتری نیز وارد و تبدیل شود.","زمان واقعی با دما، جریان تخلیه، منحنی باتری و راندمان UPS تغییر می‌کند."],status:runtimeHours>=1?"مناسب":runtimeHours>=0.5?"مرزی":"نامناسب"};
}
