import { ENGINEERING } from "./constants.js";
import { findPort, validateGraph } from "./graph.js";
import { ipv4ToNumber, subnet } from "../../../js/calculations.js";

function addressNumber(value) {
  try { return ipv4ToNumber(String(value)); } catch { return null; }
}
function maskFor(prefix) { return prefix === 0 ? 0 : (0xffffffff << (32-prefix)) >>> 0; }
function inSameSubnet(a, b) {
  if (!a?.ip || !b?.ip || !Number.isInteger(a.prefix) || a.prefix !== b.prefix) return false;
  const ai=addressNumber(a.ip), bi=addressNumber(b.ip);
  return ai !== null && bi !== null && ((ai & maskFor(a.prefix)) >>> 0) === ((bi & maskFor(b.prefix)) >>> 0);
}
function portFor(graph, end) { return findPort(graph, end.node, end.port); }
export function evaluateNetwork(graph, { acl = [], now = 0 } = {}) {
  const graphValidation = validateGraph(graph);
  const events = [], nodeState = Object.create(null), linkState = Object.create(null);
  const nodes = new Map(graph.nodes.map(node => [node.id,node]));
  for (const node of graph.nodes) {
    nodeState[node.id] = { online: true, ipReachable: false, streamAvailable: false, recording: false, reasons: [], ip: node.ip || null, prefix: node.prefix ?? null, vlan: node.vlan ?? null };
    if (node.adminUp === false) { nodeState[node.id].online=false; nodeState[node.id].reasons.push("تجهیز خاموش یا غیرفعال است"); }
    if (node.type === "camera" && node.poeRequired && !node.ports?.some(p=>p.poeEnabled && p.poeDrawW <= p.poeBudgetW)) {
      nodeState[node.id].online=false; nodeState[node.id].reasons.push("توان PoE کافی در پورت مدل نشده است");
    }
  }
  for (const link of graph.links) {
    const a=nodes.get(link.from.node), b=nodes.get(link.to.node), pa=portFor(graph,link.from), pb=portFor(graph,link.to);
    const active=link.active && a.adminUp!==false && b.adminUp!==false && pa?.adminUp!==false && pb?.adminUp!==false;
    const vlanCompatible = pa?.vlan == null || pb?.vlan == null || pa.vlan === pb.vlan || link.type === "fiber";
    const powerSource = a.type === "poe-switch" ? { node:a, port:pa } : b.type === "poe-switch" ? { node:b, port:pb } : null;
    const pd = powerSource ? (powerSource.node.id===a.id?b:a) : null;
    const poeDelivered = powerSource && link.type === "poe" && powerSource.port?.poeEnabled && link.lengthM <= ENGINEERING.ethernet.maxCopperChannelM
      ? Math.max(0, Math.min(powerSource.port.poeBudgetW || powerSource.port.poeDrawW, powerSource.port.poeDrawW || powerSource.port.poeBudgetW) * (1 - Math.min(.35, link.lengthM * .0007))) : 0;
    const powered = !pd || !pd.poeRequired || poeDelivered >= (pd.minPoeW || 0);
    const up = Boolean(active && vlanCompatible && powered);
    linkState[link.id] = { up, active, vlanCompatible, powered, poeDeliveredW: Number(poeDelivered.toFixed(2)), speedMbps: Math.min(pa?.speedMbps || 1000, pb?.speedMbps || 1000), reasons: [] };
    if (!active) linkState[link.id].reasons.push("لینک یا یکی از پورت‌ها غیرفعال است");
    if (!vlanCompatible) linkState[link.id].reasons.push("VLAN دو سر لینک سازگار نیست");
    if (!powered) linkState[link.id].reasons.push("توان رسیده به دستگاه کمتر از حد مدل‌شده است");
    if (!up) { nodeState[a.id].online=false; nodeState[a.id].reasons.push(...linkState[link.id].reasons); nodeState[b.id].online=false; nodeState[b.id].reasons.push(...linkState[link.id].reasons); }
  }
  const ips = new Map();
  for (const node of graph.nodes) {
    const state=nodeState[node.id];
    if (node.ip) {
      const number=addressNumber(node.ip);
      if (number === null) { state.reasons.push("آدرس IP نامعتبر است"); state.ipReachable=false; }
      else if (ips.has(node.ip)) {
        state.reasons.push("تداخل IP تکراری"); nodeState[ips.get(node.ip)].reasons.push("تداخل IP تکراری");
        events.push({ time:now, type:"ip-conflict", nodes:[ips.get(node.ip),node.id], message:"تداخل آدرس IP شناسایی شد" });
      } else ips.set(node.ip,node.id);
    }
  }
  for (const node of graph.nodes) {
    const state=nodeState[node.id];
    state.ipReachable = state.online && Boolean(node.ip) && !state.reasons.includes("تداخل IP تکراری");
    if (node.type==="camera") {
      const target=graph.nodes.find(n=>n.type==="nvr" && inSameSubnet(n,node));
      const blocked=acl.some(rule=>rule.from===node.id && rule.to===target?.id && rule.action==="deny");
      state.streamAvailable=state.ipReachable && Boolean(target) && !blocked && node.rtspEnabled!==false;
      state.recording=state.streamAvailable && target.recordingEnabled!==false && target.diskHealthy!==false && target.freeStorageTB!==0;
      if (!target) state.reasons.push("NVR هم‌شبکه‌ای با این دوربین پیدا نشد");
      if (blocked) state.reasons.push("ACL ارتباط دوربین و NVR را مسدود کرده است");
      if (node.rtspEnabled===false) state.reasons.push("سرویس RTSP غیرفعال است");
      if (target?.diskHealthy===false) state.reasons.push("دیسک NVR خطا دارد");
    }
  }
  return { at: now, graphValid: graphValidation.valid, graphValidation, nodes:nodeState, links:linkState, events };
}
export function runDiagnostic(graph, tool, target, options = {}) {
  const state=evaluateNetwork(graph, options);
  const node=state.nodes[target];
  if (!node) throw new Error("نقطه اتصال ابزار در شبکه مجازی وجود ندارد.");
  switch (tool) {
    case "ping": return { tool, target, ok:node.ipReachable, output:node.ipReachable?"پاسخ ICMP دریافت شد.":"پاسخی دریافت نشد؛ لینک، IP، VLAN و ACL را بررسی کن.", state };
    case "web-camera": return { tool, target, ok:node.online && node.streamAvailable, output:node.online && node.streamAvailable?"رابط دوربین در دسترس است و سرویس تصویر مدل‌شده فعال است.":"رابط دوربین یا سرویس تصویر در دسترس نیست.", state };
    case "nvr": return { tool, target, ok:node.online && node.recording!==false, output:node.online && node.recording!==false?"وضعیت NVR از مدل شبکه قابل دسترس است.":"NVR یا یکی از وابستگی‌های ضبط مشکل دارد.", state };
    case "show-poe": {
      const nodeDef=graph.nodes.find(n=>n.id===target);
      const ports=(nodeDef?.ports||[]).map(port=>({port:port.id, enabled:port.poeEnabled, budgetW:port.poeBudgetW, drawW:port.poeDrawW, state:port.poeEnabled && port.poeDrawW<=port.poeBudgetW?"delivering":"denied-or-off"}));
      return { tool,target,ports,output:ports.map(p=>p.port+": "+p.state+" ("+p.drawW+"/"+p.budgetW+" W)").join("\n"),state };
    }
    default: throw new RangeError("ابزار عیب‌یابی ناشناخته است: "+tool);
  }
}
