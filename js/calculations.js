(function(root){
"use strict";
function finite(value,name){const number=Number(value);if(!Number.isFinite(number))throw new TypeError(name+" must be finite");return number}
function positive(value,name){const number=finite(value,name);if(number<=0)throw new RangeError(name+" must be greater than zero");return number}
function nonNegative(value,name){const number=finite(value,name);if(number<0)throw new RangeError(name+" must not be negative");return number}
function poe(count,watts,reservePercent){const n=positive(count,"count"),w=positive(watts,"watts"),reserve=nonNegative(reservePercent,"reservePercent");const base=n*w;return {base,total:base*(1+reserve/100)}}
function bandwidth(count,rateMbps,reservePercent){const n=positive(count,"count"),rate=positive(rateMbps,"rateMbps"),reserve=nonNegative(reservePercent,"reservePercent");const base=n*rate;return {base,total:base*(1+reserve/100),gigabits:base*(1+reserve/100)/1000}}
function storage(count,rateMbps,days,headroomPercent){const n=positive(count,"count"),rate=positive(rateMbps,"rateMbps"),duration=positive(days,"days"),headroom=nonNegative(headroomPercent===undefined?10:headroomPercent,"headroomPercent");const tb=n*rate*10.8*duration/1000;return {tb,withHeadroom:tb*(1+headroom/100)}}
function link(loadMbps,speedMbps,limitPercent){const load=nonNegative(loadMbps,"loadMbps"),speed=positive(speedMbps,"speedMbps"),limit=positive(limitPercent,"limitPercent");if(limit>100)throw new RangeError("limitPercent must not exceed 100");const percent=load/speed*100,remaining=Math.max(0,speed-load),status=percent>limit?"status-bad":percent>limit*.8?"status-warn":"status-good";const advice=percent>limit?"بالاتر از حد طراحی است؛ ظرفیت لینک یا تقسیم ترافیک را بازبینی کن.":percent>limit*.8?"به حد طراحی نزدیک است؛ ترافیک سایر سرویس‌ها را هم بررسی کن.":"در محدوده حد طراحی واردشده است؛ ظرفیت واقعی تجهیزات را هم بررسی کن.";return {percent,remaining,status,advice}}
const api={poe,bandwidth,storage,link};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.CCTVCalculations=api;
})(typeof window!=="undefined"?window:null);
