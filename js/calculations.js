(function(root){
"use strict";
function finite(value,name){
  if(typeof value==="string"&&value.trim()==="")throw new TypeError(name+" نباید خالی باشد");
  const number=Number(value);
  if(!Number.isFinite(number))throw new TypeError(name+" باید عدد معتبر باشد");
  return number;
}
function positive(value,name){const number=finite(value,name);if(number<=0)throw new RangeError(name+" باید بزرگ‌تر از صفر باشد");return number}
function nonNegative(value,name){const number=finite(value,name);if(number<0)throw new RangeError(name+" نباید منفی باشد");return number}
function poe(count,watts,reservePercent){
  const n=positive(count,"تعداد دوربین");
  if(!Number.isInteger(n))throw new RangeError("تعداد دوربین باید عدد صحیح باشد");
  const w=positive(watts,"توان هر دوربین"),reserve=nonNegative(reservePercent,"حاشیه اطمینان");
  if(reserve>100)throw new RangeError("حاشیه اطمینان نباید بیشتر از ۱۰۰٪ باشد");
  const base=n*w;return {base,total:base*(1+reserve/100)};
}
function bandwidth(count,rateMbps,reservePercent){
  const n=positive(count,"تعداد دوربین");
  if(!Number.isInteger(n))throw new RangeError("تعداد دوربین باید عدد صحیح باشد");
  const rate=positive(rateMbps,"نرخ بیت"),reserve=nonNegative(reservePercent,"حاشیه");
  if(reserve>100)throw new RangeError("حاشیه نباید بیشتر از ۱۰۰٪ باشد");
  const base=n*rate;return {base,total:base*(1+reserve/100),gigabits:base*(1+reserve/100)/1000};
}
function storage(count,rateMbps,days,headroomPercent){
  const n=positive(count,"تعداد دوربین");
  if(!Number.isInteger(n))throw new RangeError("تعداد دوربین باید عدد صحیح باشد");
  const rate=positive(rateMbps,"نرخ بیت"),duration=positive(days,"روز");
  const headroom=nonNegative(headroomPercent===undefined?10:headroomPercent,"حاشیه ذخیره‌سازی");
  if(headroom>100)throw new RangeError("حاشیه ذخیره‌سازی نباید بیشتر از ۱۰۰٪ باشد");
  const tb=n*rate*10.8*duration/1000;return {tb,withHeadroom:tb*(1+headroom/100)};
}
function link(loadMbps,speedMbps,limitPercent){
  const load=nonNegative(loadMbps,"بار لینک"),speed=positive(speedMbps,"سرعت لینک"),limit=positive(limitPercent,"حد طراحی");
  if(limit>100)throw new RangeError("حد طراحی نباید بیشتر از ۱۰۰٪ باشد");
  const percent=load/speed*100,remaining=Math.max(0,speed-load),status=percent>limit?"status-bad":percent>limit*.8?"status-warn":"status-good";
  const advice=percent>limit?"بالاتر از حد طراحی است؛ ظرفیت لینک یا تقسیم ترافیک را بازبینی کن.":percent>limit*.8?"به حد طراحی نزدیک است؛ ترافیک سایر سرویس‌ها را هم بررسی کن.":"در محدوده حد طراحی واردشده است؛ ظرفیت واقعی تجهیزات را هم بررسی کن.";
  return {percent,remaining,status,advice};
}
function ipv4ToNumber(value){
  if(typeof value!=="string"||value.trim()==="")throw new TypeError("آدرس IPv4 را وارد کن.");
  const parts=value.trim().split(".");
  if(parts.length!==4||parts.some(part=>!/^\d{1,3}$/.test(part)||Number(part)>255))throw new TypeError("آدرس IPv4 معتبر نیست؛ چهار بخش ۰ تا ۲۵۵ وارد کن.");
  return parts.reduce((number,part)=>(number*256+Number(part))>>>0,0)>>>0;
}
function ipv4ToText(number){return [(number>>>24)&255,(number>>>16)&255,(number>>>8)&255,number&255].join(".")}
function subnet(address,cidrValue){
  const ip=ipv4ToNumber(address),cidr=finite(cidrValue,"CIDR");
  if(!Number.isInteger(cidr)||cidr<0||cidr>32)throw new RangeError("CIDR باید عدد صحیحی بین ۰ و ۳۲ باشد.");
  const mask=cidr===0?0:(0xffffffff<<(32-cidr))>>>0;
  const network=(ip&mask)>>>0,broadcast=(network|(~mask>>>0))>>>0;
  const hostCount=cidr>=31?(cidr===31?2:1):Math.pow(2,32-cidr)-2;
  return {ip, cidr, mask, network, broadcast, hostCount, first:cidr<=30?network+1:network, last:cidr<=30?broadcast-1:broadcast,
    address:ipv4ToText(ip), maskText:ipv4ToText(mask), networkText:ipv4ToText(network), broadcastText:ipv4ToText(broadcast),
    firstText:ipv4ToText(cidr<=30?network+1:network), lastText:ipv4ToText(cidr<=30?broadcast-1:broadcast)};
}
const api={poe,bandwidth,storage,link,ipv4ToNumber,ipv4ToText,subnet};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.CCTVCalculations=api;
})(typeof window!=="undefined"?window:null);
