import { normalizeDigits } from "../units.js";
import { ENGINEERING } from "../constants.js";
export function parseIPv4(value) {
  const text=normalizeDigits(value).trim(), parts=text.split(".");
  if(parts.length!==4 || parts.some(p=>!/^\d{1,3}$/.test(p) || (p.length>1 && p[0]==="0") || Number(p)>255)) throw new TypeError("IPv4 باید چهار بخش ۰ تا ۲۵۵ و بدون صفر پیشرو مبهم داشته باشد.");
  return parts.reduce((n,p)=>(n*256+Number(p))>>>0,0)>>>0;
}
export function formatIPv4(n){return [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join(".")}
export function parseCIDR(value){const n=Number(normalizeDigits(value));if(!Number.isInteger(n)||n<0||n>32)throw new RangeError("پیشوند CIDR باید عدد صحیح ۰ تا ۳۲ باشد.");return n}
export function subnet(address,prefixValue){
 const ip=parseIPv4(address),prefix=parseCIDR(prefixValue),mask=prefix===0?0:(0xffffffff<<(32-prefix))>>>0,network=(ip&mask)>>>0,broadcast=(network|(~mask>>>0))>>>0;
 const hosts=prefix===31?2:prefix===32?1:Math.max(0,2**(32-prefix)-2);
 const first=prefix===31||prefix===32?network:network+1,last=prefix===31?broadcast:prefix===32?network:broadcast-1;
 const inPrivate=ENGINEERING.network.privateRanges.some(r=>ip>=r.start&&ip<=r.end);
 const firstOctet=(ip>>>24)&255;const addressClass=firstOctet>=1&&firstOctet<=126?"A":firstOctet>=128&&firstOctet<=191?"B":firstOctet>=192&&firstOctet<=223?"C":firstOctet>=224&&firstOctet<=239?"D (multicast)":firstOctet>=240?"E (reserved)":"special";
 return {address:formatIPv4(ip),prefix,mask:formatIPv4(mask),wildcard:formatIPv4((~mask)>>>0),network:formatIPv4(network),broadcast:prefix===31?"ندارد (/31 point-to-point)":formatIPv4(broadcast),addressClass,firstHost:formatIPv4(first),lastHost:formatIPv4(last),usableHosts:hosts,isPrivate:inPrivate,isLinkLocal:ip>=ENGINEERING.network.linkLocalStart&&ip<=ENGINEERING.network.linkLocalEnd,isLoopback:ip>=ENGINEERING.network.loopbackStart&&ip<=ENGINEERING.network.loopbackEnd,notes:prefix===31?["/31: هر دو آدرس برای لینک نقطه‌به‌نقطه طبق RFC 3021 قابل استفاده‌اند."]:prefix===32?["/32: یک آدرس منفرد؛ برای رابط میزبان/مسیر میزبان، نه LAN معمولی."]:prefix===0?["/0: کل فضای IPv4 را پوشش می‌دهد؛ در طراحی معمول LAN به‌ندرت مناسب است."]:[]};
}
export function sameSubnet(a,b){const x=subnet(a.ip,a.prefix),y=subnet(b.ip,b.prefix);return x.network===y.network&&x.prefix===y.prefix}
export function validateGateway(ip,prefix,gateway){const net=subnet(ip,prefix),gw=parseIPv4(gateway);if(net.prefix<=30&&(formatIPv4(gw)===net.network||formatIPv4(gw)===net.broadcast))return {valid:false,reason:"Gateway نمی‌تواند آدرس شبکه یا Broadcast باشد."};if(subnet(gateway,prefix).network!==net.network)return {valid:false,reason:"Gateway باید در همان زیرشبکه باشد."};return {valid:true,reason:"Gateway در محدوده زیرشبکه است."}}
export function planVLSM(requirements,baseCidr){
 const base=subnet(baseCidr.address,baseCidr.prefix),start=parseIPv4(base.network),end=parseIPv4(base.broadcast);
 const sorted=requirements.map(r=>({...r,hosts:Number(normalizeDigits(r.hosts))})).sort((a,b)=>b.hosts-a.hosts);
 let cursor=start+1;const results=[];
 for(const req of sorted){if(!Number.isInteger(req.hosts)||req.hosts<1)throw new RangeError("تعداد میزبان هر VLAN باید عدد صحیح مثبت باشد.");let prefix=32;while((2**(32-prefix)-2)<req.hosts&&prefix>0)prefix--;if(prefix<1)throw new RangeError("تعداد میزبان در محدوده IPv4 پشتیبانی نمی‌شود.");const size=2**(32-prefix),network=Math.ceil(cursor/size)*size,broadcast=network+size-1;if(network<start||broadcast>end)throw new RangeError("فضای آدرس‌دهی برای تمام VLANها کافی نیست.");results.push({...req,prefix,cidr:formatIPv4(network)+"/"+prefix,network:formatIPv4(network),first:formatIPv4(network+1),last:formatIPv4(broadcast-1),broadcast:formatIPv4(broadcast)});cursor=broadcast+1}
 return results;
}
