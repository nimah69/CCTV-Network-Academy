import { ENGINEERING } from "./constants.js";
import { findPort, validateGraph } from "./graph.js";

function ipv4Number(value) {
  if (typeof value !== "string") return null;
  const parts = value.trim().split(".");
  if (parts.length !== 4 || parts.some(part => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return null;
  return parts.reduce((acc, part) => (acc * 256 + Number(part)) >>> 0, 0) >>> 0;
}
function maskFor(prefix) { return prefix === 0 ? 0 : (0xffffffff << (32-prefix)) >>> 0; }
function sameSubnet(a, b) {
  if (!a?.ip || !b?.ip || !Number.isInteger(a.prefix) || a.prefix !== b.prefix) return false;
  const ai=ipv4Number(a.ip), bi=ipv4Number(b.ip);
  return ai !== null && bi !== null && ((ai & maskFor(a.prefix)) >>> 0) === ((bi & maskFor(b.prefix)) >>> 0);
}
function hasPath(graph, linkState, from, to) {
  if (from === to) return true;
  const queue=[from], seen=new Set(queue);
  while(queue.length) {
    const current=queue.shift();
    for(const link of graph.links) {
      if(!linkState[link.id]?.up) continue;
      const next=link.from.node===current?link.to.node:link.to.node===current?link.from.node:null;
      if(!next || seen.has(next)) continue;
      if(next===to) return true;
      seen.add(next); queue.push(next);
    }
  }
  return false;
}
export function evaluateNetwork(graph, { acl = graph.acl || [], now = 0 } = {}) {
  const graphValidation=validateGraph(graph),nodeState=Object.create(null),linkState=Object.create(null),events=[];
  const nodes=new Map(graph.nodes.map(node=>[node.id,node]));
  for(const node of graph.nodes) nodeState[node.id]={online:node.adminUp!==false,ipReachable:false,streamAvailable:false,recording:false,reasons:node.adminUp===false?["تجهیز خاموش یا غیرفعال است"]:[],ip:node.ip||null,prefix:node.prefix??null,vlan:node.vlan??null};
  for(const link of graph.links) {
    const a=nodes.get(link.from.node),b=nodes.get(link.to.node),pa=findPort(graph,link.from.node,link.from.port),pb=findPort(graph,link.to.node,link.to.port);
    const active=link.active!==false&&!["open","short"].includes(link.cableFault)&&a.adminUp!==false&&b.adminUp!==false&&pa?.adminUp!==false&&pb?.adminUp!==false;
    const vlanCompatible=pa?.vlan==null||pb?.vlan==null||pa.vlan===pb.vlan;
    const powerSource=a.type==="poe-switch"?{node:a,port:pa}:b.type==="poe-switch"?{node:b,port:pb}:null;
    const pd=powerSource?(powerSource.node.id===a.id?b:a):null;
    const isPoeLink=link.type==="poe"||(link.type==="ethernet"&&powerSource?.port?.poeEnabled);
    const aggregateDraw=powerSource?powerSource.node.ports.filter(p=>p.poeEnabled).reduce((sum,p)=>sum+(p.poeDrawW||0),0):0;
    const budgetOk=!powerSource||!powerSource.node.poeBudgetW||aggregateDraw<=powerSource.node.poeBudgetW;
    const materialFactor=link.cableMaterial==="cca"?1.575:1;
    const parallelPaths=link.pairs===4?2:1;
    const resistance=188*(link.lengthM||0)/1000*materialFactor/parallelPaths;
    const current=(powerSource?.port?.poeDrawW||0)/48;
    const loss=current*current*resistance;
    const rawPower=powerSource?.port?.poeDrawW||powerSource?.port?.poeBudgetW||0;
    const poeDelivered=powerSource&&isPoeLink&&powerSource.port?.poeEnabled&&budgetOk&&link.lengthM<=ENGINEERING.ethernet.maxCopperChannelM?Math.max(0,rawPower-loss):0;
    const powered=!pd||!pd.poeRequired||(isPoeLink&&budgetOk&&poeDelivered>=(pd.minPoeW||0));
    const loopRisk=(Boolean(link.loop)&&!a.rstpEnabled)||(link.from.node===link.to.node&&a.type.includes("switch")&&!a.rstpEnabled);
    const up=Boolean(active&&vlanCompatible&&powered&&!loopRisk);
    const speedMbps=Math.min(link.speedMbps||Infinity,pa?.speedMbps||1000,pb?.speedMbps||1000);
    linkState[link.id]={up,active,vlanCompatible,powered,budgetOk,loopRisk,duplexMismatch:Boolean(link.duplexMismatch),crcErrors:link.crcErrors||0,emi:Boolean(link.emi),speedMbps,poeDeliveredW:Number(poeDelivered.toFixed(2)),voltageDropV:Number((current*resistance).toFixed(3)),reasons:[]};
    if(!active)linkState[link.id].reasons.push("لینک یا یکی از پورت‌ها غیرفعال/معیوب است");
    if(!vlanCompatible)linkState[link.id].reasons.push("VLAN دو سر لینک سازگار نیست");
    if(!powered)linkState[link.id].reasons.push(budgetOk?"توان رسیده به دستگاه کمتر از حد مدل‌شده است":"بودجه کل PoE سوئیچ تمام شده است");
    if(loopRisk)linkState[link.id].reasons.push("خطر Loop لایه دوم؛ RSTP غیرفعال یا لینک حلقه‌ای است");
    if(link.duplexMismatch)linkState[link.id].reasons.push("Duplex دو سر لینک یکسان نیست");
    if(link.emi)linkState[link.id].reasons.push("نشانه‌های تداخل EMI روی مسیر مدل شده است");
    if(link.quality==="marginal"&&link.lengthM>60&&powerSource)linkState[link.id].reasons.push("حاشیه توان/کیفیت کابل پایین است و ممکن است قطعی متناوب ایجاد کند");
    if(!up)events.push({time:now,type:"link-down",link:link.id,message:"لینک "+link.id+" قطع یا ناسازگار است"});
    if(loopRisk)events.push({time:now,type:"broadcast-storm",link:link.id,message:"الگوی Loop/Broadcast storm در شبکه شناسایی شد"});
    if(link.duplexMismatch||link.emi||link.crcErrors>0)events.push({time:now,type:"interface-errors",link:link.id,message:"خطاهای لایه فیزیکی/پیوند داده روی لینک "+link.id});
    if(pd?.poeRequired&&!powered){nodeState[pd.id].online=false;nodeState[pd.id].reasons.push("توان PoE کافی در لینک "+link.id+" وجود ندارد");}
    if(!up){for(const endpoint of [a,b])if(endpoint.id!==(powerSource?.node.id)&&!["switch","poe-switch"].includes(endpoint.type)){nodeState[endpoint.id].online=false;nodeState[endpoint.id].reasons.push(...linkState[link.id].reasons);}}
  }
  const ips=new Map(),conflicted=new Set();
  for(const node of graph.nodes) {
    if(!node.ip)continue;
    if(ipv4Number(node.ip)===null){nodeState[node.id].reasons.push("آدرس IP نامعتبر است");events.push({time:now,type:"invalid-ip",nodes:[node.id],message:"آدرس IP نامعتبر است"});}
    else if(ips.has(node.ip)){nodeState[node.id].reasons.push("تداخل IP تکراری");nodeState[ips.get(node.ip)].reasons.push("تداخل IP تکراری");conflicted.add(node.id);conflicted.add(ips.get(node.ip));events.push({time:now,type:"ip-conflict",nodes:[ips.get(node.ip),node.id],message:"تداخل آدرس IP شناسایی شد"});}
    else ips.set(node.ip,node.id);
  }
  for(const node of graph.nodes)nodeState[node.id].ipReachable=nodeState[node.id].online&&Boolean(node.ip)&&ipv4Number(node.ip)!==null&&!conflicted.has(node.id);
  for(const node of graph.nodes) {
    const state=nodeState[node.id];
    if(node.type==="nvr"){
      state.recording=state.online&&node.recordingEnabled!==false&&node.diskHealthy!==false&&node.freeStorageTB!==0;
      if(node.diskHealthy===false)state.reasons.push("خطای دیسک NVR");
      if(node.freeStorageTB===0)state.reasons.push("فضای ذخیره‌سازی پر است");
      if(node.hdmiConnected===false)state.reasons.push("خروجی HDMI یا اتصال نمایشگر مشکل دارد");
      continue;
    }
    if(node.type!=="camera")continue;
    const target=graph.nodes.find(n=>n.type==="nvr"&&sameSubnet(n,node)&&hasPath(graph,linkState,node.id,n.id));
    const blocked=target&&acl.some(rule=>rule.from===node.id&&rule.to===target.id&&rule.action==="deny");
    state.streamAvailable=state.ipReachable&&Boolean(target)&&!blocked&&node.rtspEnabled!==false&&node.firmware!=="incompatible";
    state.recording=state.streamAvailable&&nodeState[target.id].recording;
    if(!target)state.reasons.push("NVR هم‌شبکه و متصل به این دوربین پیدا نشد");
    if(blocked)state.reasons.push("ACL ارتباط دوربین و NVR را مسدود کرده است");
    if(node.rtspEnabled===false)state.reasons.push("سرویس RTSP غیرفعال است");
    if(node.clockSynced===false)state.reasons.push("ساعت دوربین/NTP هماهنگ نیست");
    if(node.irHealthy===false||node.irReflection===true)state.reasons.push("کیفیت تصویر شب/بازتاب IR نیازمند بررسی است");
    if(node.firmware==="incompatible")state.reasons.push("ناسازگاری firmware/codec مدل شده است");
    if(target?.diskHealthy===false)state.reasons.push("دیسک NVR خطا دارد");
    if(target?.freeStorageTB===0)state.reasons.push("فضای ذخیره‌سازی آزاد وجود ندارد");
  }
  for(const node of graph.nodes){if(node.type==="camera"){const target=graph.nodes.find(n=>n.type==="nvr"&&sameSubnet(n,node)&&hasPath(graph,linkState,node.id,n.id));nodeState[node.id].recording=nodeState[node.id].streamAvailable&&Boolean(target)&&nodeState[target.id].recording;}}\n  const totalPoeDraw=graph.nodes.filter(n=>n.type==="poe-switch").reduce((sum,n)=>sum+n.ports.filter(p=>p.poeEnabled).reduce((v,p)=>v+(p.poeDrawW||0),0),0);
  const totalPoeBudget=graph.nodes.filter(n=>n.type==="poe-switch").reduce((sum,n)=>sum+(n.poeBudgetW||0),0);
  if(totalPoeDraw>totalPoeBudget)events.push({time:now,type:"poe-overload",message:"مصرف تجمیعی PoE از بودجه کل سوئیچ بیشتر است"});
  const uplinkCapacity=graph.links.filter(l=>l.type==="ethernet"||l.type==="fiber").reduce((m,l)=>Math.max(m,linkState[l.id]?.speedMbps||0),0);
  const uplinkSaturated=graph.trafficMbps>0&&graph.trafficMbps>uplinkCapacity*ENGINEERING.design.uplinkTargetUtilization;
  if(uplinkSaturated)events.push({time:now,type:"uplink-saturation",message:"بار ترافیک از آستانه طراحی Uplink عبور کرده است"});
  return {at:now,graphValid:graphValidation.valid,graphValidation,nodes:nodeState,links:linkState,events,totalPoeDrawW:totalPoeDraw,totalPoeBudgetW:totalPoeBudget,uplinkSaturated};
}
export function runDiagnostic(graph,tool,target,options={}) {
  const state=evaluateNetwork(graph,options),node=state.nodes[target];
  if(!node)throw new Error("نقطه اتصال ابزار در شبکه مجازی وجود ندارد.");
  const source=options.source||target,sourceNode=graph.nodes.find(n=>n.id===source),targetNode=graph.nodes.find(n=>n.id===target);
  const reachable=Boolean(sourceNode&&targetNode&&state.nodes[source]?.online&&node.online&&hasPath(graph,state.links,source,target)&&sameSubnet(sourceNode,targetNode)&&!options.acl?.some(rule=>rule.from===source&&rule.to===target&&rule.action==="deny"));
  switch(tool){
    case "ping":return {tool,target,source,ok:reachable,output:reachable?"پاسخ ICMP دریافت شد.":"پاسخی دریافت نشد؛ لینک، IP، ماسک، VLAN و ACL را بررسی کن.",state};
    case "web-camera":{const ok=node.online&&node.streamAvailable;return {tool,target,ok,output:!node.online?"دوربین خاموش یا از نظر شبکه جداست.":ok?"رابط دوربین و جریان مدل‌شده در دسترس‌اند.":node.reasons.join("؛ ")||"سرویس تصویر در دسترس نیست.",state};}
    case "nvr":{const def=targetNode,ok=node.online&&def?.diskHealthy!==false&&def?.freeStorageTB!==0&&def?.recordingEnabled!==false;return {tool,target,ok,output:!node.online?"NVR در دسترس نیست.":def?.diskHealthy===false?"خطای دیسک/RAID شناسایی شد.":def?.freeStorageTB===0?"فضای ذخیره‌سازی پر است.":def?.hdmiConnected===false?"خروجی HDMI یا ورودی نمایشگر را بررسی کن.":ok?"NVR در دسترس است؛ وضعیت ضبط از مدل محاسبه شد.":"ضبط در تنظیمات مجازی غیرفعال است.",state};}
    case "show-poe":{const ports=(targetNode?.ports||[]).map(p=>({port:p.id,enabled:p.poeEnabled,budgetW:p.poeBudgetW,drawW:p.poeDrawW,state:p.poeEnabled&&p.poeDrawW<=p.poeBudgetW?"delivering":"denied-or-off"}));return {tool,target,ports,output:ports.map(p=>p.port+": "+p.state+" ("+p.drawW+"/"+p.budgetW+" W)").join("\n"),state};}
    default:throw new RangeError("ابزار عیب‌یابی ناشناخته است: "+tool);
  }
}
