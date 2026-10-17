import { ENGINEERING } from "../constants.js";
import { positiveNumber } from "../units.js";
const OPTIONS=[
 {id:"cat5e",name:"مس Cat5e",maxM:100,poe:true,emi:"medium",speedMbps:1000,cost:1,pros:["اقتصادی و سازگار با PoE"],cons:["حاشیه توسعه محدودتر از Cat6A"]},
 {id:"cat6",name:"مس Cat6",maxM:100,poe:true,emi:"medium",speedMbps:10000,cost:1.2,pros:["مناسب بسیاری از لینک‌های ۱ گیگ و بعضی لینک‌های کوتاه ۱۰ گیگ"],cons:["عملکرد ۱۰ گیگ به طول و نصب وابسته است"]},
 {id:"cat6a",name:"مس Cat6A",maxM:100,poe:true,emi:"medium",speedMbps:10000,cost:1.7,pros:["۱۰ گیگ تا کانال ۱۰۰ متر در طراحی سازگار"],cons:["قطورتر و گران‌تر"]},
 {id:"fiber-os2",name:"فیبر OS2 + SFP هم‌نوع",maxM:10000,poe:false,emi:"high",speedMbps:10000,cost:2.8,pros:["مسافت طولانی و مصونیت در برابر EMI"],cons:["برق PoE منتقل نمی‌کند؛ SFP دو سر باید سازگار باشد"]},
 {id:"fiber-om3",name:"فیبر OM3 + SFP سازگار",maxM:300,poe:false,emi:"high",speedMbps:10000,cost:2.2,pros:["مناسب برخی لینک‌های چندگیگابیتی داخل ساختمان"],cons:["برد وابسته به سرعت و اپتیک است؛ برق محلی لازم است"]},
 {id:"poe-extender",name:"PoE extender",maxM:200,poe:true,emi:"low",speedMbps:1000,cost:2.3,pros:["گسترش مشروط مسیر PoE"],cons:["افت توان و محدودیت زنجیره/تعداد دستگاه‌ها باید محاسبه شود"]},
 {id:"media-converter",name:"Media converter + فیبر",maxM:10000,poe:false,emi:"high",speedMbps:10000,cost:2.5,pros:["اتصال مس به فیبر در نقاط انتقال"],cons:["تغذیه محلی و اپتیک سازگار نیاز دارد"]},
 {id:"ethernet-coax",name:"Ethernet over coax",maxM:500,poe:false,emi:"medium",speedMbps:1000,cost:2,pros:["امکان استفاده از کواکسیال موجود در برخی سامانه‌ها"],cons:["سرعت و PoE به مبدل و مدل دقیق وابسته است"]},
 {id:"wireless-ptp",name:"وایرلس نقطه‌به‌نقطه",maxM:5000,poe:false,emi:"medium",speedMbps:1000,cost:2,pros:["مناسب مسیر بدون امکان کابل‌کشی"],cons:["دید مستقیم، تداخل، امنیت و برق دو سمت بررسی شود"]}
];
export function recommendCable({distanceM,environment="indoor",emi="low",speedMbps=1000,needsPoe=false,budget="medium",existingCoax=false,clearLineOfSight=false}={}){
 const d=positiveNumber(distanceM,"فاصله"),speed=positiveNumber(speedMbps,"سرعت موردنیاز");
 const ranked=OPTIONS.map(o=>{let score=0,reasons=[];if(d<=o.maxM)score+=4;else score-=100;if(speed<=o.speedMbps)score+=3;else score-=10;if(needsPoe){if(o.poe)score+=5;else score-=8}if(emi==="high"&&o.emi==="high")score+=5;if(environment==="outdoor"&&o.id.startsWith("cat"))score-=1;if(budget==="low"&&o.cost<=1.2)score+=2;if(existingCoax&&o.id==="ethernet-coax")score+=6;if(clearLineOfSight&&o.id==="wireless-ptp")score+=4;if(d>ENGINEERING.ethernet.maxCopperChannelM&&o.id.startsWith("cat"))score-=100;if(o.id.startsWith("fiber")&&!needsPoe)score+=1;if(o.id.startsWith("fiber")&&needsPoe)reasons.push("تغذیه محلی یا مسیر برق جداگانه لازم است");if(environment==="outdoor"&&o.id.startsWith("cat"))reasons.push("کابل UV-rated، ارت و Surge protector مناسب محیط بیرون را انتخاب کن");if(d>100&&o.id.startsWith("cat"))reasons.push("مس اترنت مستقیم بیش از ۱۰۰ متر برای کانال استاندارد توصیه نمی‌شود");return {...o,score,reasons}}).filter(o=>o.score>0).sort((a,b)=>b.score-a.score);
 if(!ranked.length) return {options:[],warnings:["هیچ گزینه‌ای با قیود واردشده سازگار نیست؛ طراحی مسیر را بازبینی کن."]};
 return {options:ranked.map(({score,...o})=>o),warnings:[...(d>100?["برای مس مستقیم از ۱۰۰ متر عبور نکن؛ فیبر یا راهکار توسعه استاندارد را بررسی کن."]:[]),...(needsPoe&&d>90?["افت ولتاژ PoE و طول کل پچ‌کوردها را محاسبه کن."]:[]),...(environment==="outdoor"?["حفاظت در برابر UV، Surge و اجرای ارت مطابق ضوابط محل ضروری است."]:[]),...(emi==="high"?["در محیط EMI شدید، فیبر گزینه مقاوم‌تری است."]:[])]};
}
