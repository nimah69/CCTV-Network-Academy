import { normalizeDigits, finiteNumber } from "./units.js";

export const DEVICE_TYPES = Object.freeze(["camera","poe-switch","switch","nvr","router","firewall","ups","monitor","laptop","patch-panel","media-converter","disk-array"]);
export const LINK_TYPES = Object.freeze(["ethernet","poe","fiber","wifi","hdmi","power","coax"]);
const idOf = (value, label) => {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(label + " شناسه معتبر ندارد.");
  return value.trim();
};
export function createGraph({ nodes = [], links = [], vlans = [], acl = [], trafficMbps = 0, metadata = {} } = {}) {
  const nodeIds = new Set(), portIds = new Set(), linkIds = new Set(), vlanIds = new Set();
  const safeNodes = nodes.map((node) => {
    const id = idOf(node.id, "تجهیز");
    if (nodeIds.has(id)) throw new Error("شناسه تجهیز تکراری است: " + id);
    if (!DEVICE_TYPES.includes(node.type)) throw new Error("نوع تجهیز پشتیبانی نمی‌شود: " + node.type);
    nodeIds.add(id);
    const ports = (node.ports || []).map((port) => {
      const portId = idOf(port.id, "پورت");
      const unique = id + ":" + portId;
      if (portIds.has(unique)) throw new Error("پورت تکراری است: " + unique);
      portIds.add(unique);
      const vlan = port.vlan == null || port.vlan === "" ? null : Number(normalizeDigits(port.vlan));
      if (vlan !== null && (!Number.isInteger(vlan) || vlan < 1 || vlan > 4094)) throw new RangeError("شناسه VLAN باید بین ۱ تا ۴۰۹۴ باشد.");
      return Object.freeze({ ...port, id: portId, vlan, adminUp: port.adminUp !== false, speedMbps: port.speedMbps == null ? 1000 : finiteNumber(port.speedMbps, "سرعت پورت"), poeEnabled: Boolean(port.poeEnabled), poeBudgetW: port.poeBudgetW == null ? 0 : finiteNumber(port.poeBudgetW, "بودجه PoE پورت"), poeDrawW: port.poeDrawW == null ? 0 : finiteNumber(port.poeDrawW, "مصرف PoE") });
    });
    return Object.freeze({ ...node, id, ports: Object.freeze(ports) });
  });
  const safeVlans = vlans.map(vlan => {
    const id = Number(normalizeDigits(vlan.id));
    if (!Number.isInteger(id) || id < 1 || id > 4094) throw new RangeError("شناسه VLAN باید بین ۱ تا ۴۰۹۴ باشد.");
    if (vlanIds.has(id)) throw new Error("VLAN تکراری است: " + id);
    vlanIds.add(id);
    return Object.freeze({ ...vlan, id });
  });
  const safeLinks = links.map(link => {
    const id = idOf(link.id, "لینک");
    if (linkIds.has(id)) throw new Error("شناسه لینک تکراری است: " + id);
    linkIds.add(id);
    if (!LINK_TYPES.includes(link.type)) throw new Error("نوع لینک پشتیبانی نمی‌شود: " + link.type);
    if (!nodeIds.has(link.from?.node) || !nodeIds.has(link.to?.node)) throw new Error("لینک به تجهیز ناموجود اشاره می‌کند: " + id);
    const fromNode = safeNodes.find(n => n.id === link.from.node), toNode = safeNodes.find(n => n.id === link.to.node);
    if (!fromNode.ports.some(p => p.id === link.from.port) || !toNode.ports.some(p => p.id === link.to.port)) throw new Error("لینک به پورت ناموجود اشاره می‌کند: " + id);
    const lengthM = link.lengthM == null ? 0 : finiteNumber(link.lengthM, "طول کابل");
    if (lengthM < 0) throw new RangeError("طول کابل نباید منفی باشد.");
    return Object.freeze({ ...link, id, lengthM, quality: link.quality || "normal", active: link.active !== false });
  });
  return Object.freeze({ nodes: Object.freeze(safeNodes), links: Object.freeze(safeLinks), vlans: Object.freeze(safeVlans), acl: Object.freeze(acl.map(rule => Object.freeze({ ...rule }))), trafficMbps: Number(trafficMbps) || 0, metadata: Object.freeze({ ...metadata }) });
}
export function findPort(graph, nodeId, portId) {
  const node = graph.nodes.find(item => item.id === nodeId);
  return node?.ports.find(port => port.id === portId) || null;
}
export function connectedLinks(graph, nodeId) {
  return graph.links.filter(link => link.from.node === nodeId || link.to.node === nodeId);
}
export function validateGraph(graph) {
  const errors = [], warnings = [];
  const usedPorts = new Set();
  for (const link of graph.links) {
    for (const end of [link.from, link.to]) {
      const key = end.node + ":" + end.port;
      if (usedPorts.has(key)) errors.push("پورت به بیش از یک لینک متصل شده است: " + key);
      usedPorts.add(key);
    }
    if (link.type === "ethernet" || link.type === "poe") {
      if (link.lengthM > 100) warnings.push("طول کانال مسی لینک " + link.id + " از ۱۰۰ متر بیشتر است.");
      if (link.type === "poe" && link.lengthM > 100) warnings.push("توان PoE روی کانال مسی بیش از ۱۰۰ متر قابل اتکا نیست.");
    }
  }
  for (const node of graph.nodes) {
    if (!connectedLinks(graph, node.id).length) warnings.push("تجهیز بدون اتصال: " + node.id);
    const poePorts = node.ports.filter(p => p.poeEnabled);
    const draw = poePorts.reduce((sum,p)=>sum+p.poeDrawW,0);
    const budget = node.poeBudgetW ?? node.ports.reduce((sum,p)=>sum+p.poeBudgetW,0);
    if (budget > 0 && draw > budget) errors.push("بودجه PoE تجهیز " + node.id + " بیش از حد است.");
  }
  return { valid: errors.length === 0, errors, warnings };
}
