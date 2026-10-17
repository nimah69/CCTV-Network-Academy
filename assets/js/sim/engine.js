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
function portFor(graph, end) { return findPort(graph, end.node, end.port); }
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
export function evaluateNetwork(graph, { acl = [], now = 0 } = {}) {
  const graphValidation = validateGraph(graph);
  const nodeState = Object.create(null), linkState = Object.create(null), events = [];
  const nodes = new Map(graph.nodes.map(node => [node.id,node]));
  for (const node of graph.nodes) {
    nodeState[node.id] = {
      online: node.adminUp !== false, ipReachable: false, streamAvailable: false,
      recording: false, reasons: node.adminUp === false ? ["تجهیز خاموش یا غیرفعال است"] : [],
      ip: node.ip || null, prefix: node.prefix ?? null, vlan: node.vlan ?? null
    };
  }
  for (const link of graph.links) {
    const a=nodes.get(link.from.node), b=nodes.get(link.to.node), pa=portFor(graph,link.from), pb=portFor(graph,link.to);
    const active=link.active && a.adminUp!==false && b.adminUp!==false && pa?.adminUp!==false && pb?.adminUp!==false;
    const vlanCompatible = pa?.vlan == null || pb?.vlan == null || pa.vlan === pb.vlan;
    const powerSource = a.type === "poe-switch" ? { node:a, port:pa, end:link.from } : b.type === "poe-switch" ? { node:b, port:pb, end:link.to } : null;
    const pd = powerSource ? (powerSource.node.id===a.id?b:a) : null;
    const isPoeLink = link.type === "poe" || (link.type === "ethernet" && powerSource?.port?.poeEnabled);
    const poeDelivered = powerSource && isPoeLink && powerSource.port?.poeEnabled && link.lengthM <= ENGINEERING.ethernet.maxCopperChannelM
      ? Math.max(0, (powerSource.port.poeDrawW || powerSource.port.poeBudgetW) * (1 - Math.min(.35, link.lengthM * .0007))) : 0;
    const powered = !pd || !pd.poeRequired || (isPoeLink && poeDelivered >= (pd.minPoeW || 0));
    const up = Boolean(active && vlanCompatible && powered);
    linkState[link.id] = { up, active, vlanCompatible, powered, poeDeliveredW:Number(poeDelivered.toFixed(2)), speedMbps:Math.min(pa?.speedMbps||1000,pb?.speedMbps||1000), reasons:[] };
    if (!active) linkState[link.id].reasons.push("لینک یا یکی از پورت‌ها غیرفعال است");
    if (!vlanCompatible) linkState[link.id].reasons.push("VLAN دو سر لینک سازگار نیست");
    if (!powered) linkState[link.id].reasons.push("توان رسیده به دستگاه کمتر از حد مدل‌شده است");
    if (!up) events.push({time:now,type:"link-down",link:link.id,message:"لینک "+link.id+" قطع یا ناسازگار است"});
    if (pd?.poeRequired && !powered) {
      nodeState[pd.id].online=false;
      nodeState[pd.id].reasons.push("توان PoE کافی در لینک "+link.id+" وجود ندارد");
    }
  }
  const ips = new Map(), validIp = new Set();
  for (const node of graph.nodes) {
    if (!node.ip) continue;
    if (ipv4Number(node.ip) === null) {
      nodeState[node.id].reasons.push("آدرس IP نامعتبر است");
      events.push({time:now,type:"invalid-ip",nodes:[node.id],message:"آدرس IP نامعتبر است"});
    } else if (ips.has(node.ip)) {
      nodeState[node.id].reasons.push("تداخل IP تکراری");
      nodeState[ips.get(node.ip)].reasons.push("تداخل IP تکراری");
      events.push({time:now,type:"ip-conflict",nodes:[ips.get(node.ip),node.id],message:"تداخل آدرس IP شناسایی شد"});
    } else { ips.set(node.ip,node.id); validIp.add(node.id); }
  }
  for (const node of graph.nodes) {
    const state=nodeState[node.id];
    state.ipReachable = state.online && validIp.has(node.id);
  }
  for (const node of graph.nodes) {
    if (node.type !== "camera") continue;
    const state=nodeState[node.id];
    const targets=graph.nodes.filter(n=>n.type==="nvr" && sameSubnet(n,node));
    const target=targets.find(n=>hasPath(graph,linkState,node.id,n.id));
    const blocked=target && acl.some(rule=>rule.from===node.id && rule.to===target.id && rule.action==="deny");
    state.streamAvailable=state.ipReachable && Boolean(target) && !blocked && node.rtspEnabled!==false;
    state.recording=state.streamAvailable && target.recordingEnabled!==false && target.diskHealthy!==false && target.freeStorageTB!==0;
    if (!target) state.reasons.push("NVR هم‌شبکه و متصل به این دوربین پیدا نشد");
    if (blocked) state.reasons.push("ACL ارتباط دوربین و NVR را مسدود کرده است");
    if (node.rtspEnabled===false) state.reasons.push("سرویس RTSP غیرفعال است");
    if (target?.diskHealthy===false) state.reasons.push("دیسک NVR خطا دارد");
    if (target?.freeStorageTB===0) state.reasons.push("فضای ذخیره‌سازی آزاد وجود ندارد");
  }
  return {at:now,graphValid:graphValidation.valid,graphValidation,nodes:nodeState,links:linkState,events};
}
export function runDiagnostic(graph, tool, target, options = {}) {
  const state=evaluateNetwork(graph,options);
  const node=state.nodes[target];
  if (!node) throw new Error("نقطه اتصال ابزار در شبکه مجازی وجود ندارد.");
  const source=options.source;
  const sourceExists=!source || Boolean(state.nodes[source]);
  const reachable=source ? sourceExists && state.nodes[source].online && node.online && hasPath(graph,state.links,source,target) && sameSubnet(graph.nodes.find(n=>n.id===source),graph.nodes.find(n=>n.id===target)) : node.ipReachable;
  switch (tool) {
    case "ping": return {tool,target,source:source||target,ok:reachable,output:reachable?"پاسخ ICMP دریافت شد.":"پاسخی دریافت نشد؛ لینک، IP، ماسک، VLAN و ACL را بررسی کن.",state};
    case "web-camera": return {tool,target,ok:node.online && node.streamAvailable,output:node.online && node.streamAvailable?"رابط دوربین در دسترس است و سرویس تصویر مدل‌شده فعال است.":"رابط دوربین یا سرویس تصویر در دسترس نیست.",state};
    case "nvr": return {tool,target,ok:node.online && (node.recording!==false),output:node.online && node.recording!==false?"وضعیت NVR از مدل شبکه قابل دسترس است.":"NVR یا یکی از وابستگی‌های ضبط مشکل دارد.",state};
    case "show-poe": {
      const nodeDef=graph.nodes.find(n=>n.id===target);
      const ports=(nodeDef?.ports||[]).map(port=>({port:port.id,enabled:port.poeEnabled,budgetW:port.poeBudgetW,drawW:port.poeDrawW,state:port.poeEnabled && port.poeDrawW<=port.poeBudgetW?"delivering":"denied-or-off"}));
      return {tool,target,ports,output:ports.map(p=>p.port+": "+p.state+" ("+p.drawW+"/"+p.budgetW+" W)").join("\n"),state};
    }
    default: throw new RangeError("ابزار عیب‌یابی ناشناخته است: "+tool);
  }
}
