import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { normalizeTopologyConfig, applyTopologyConfig } from "../assets/js/sim/ui/topology-scenario-io.js";

const valid = {
  schemaVersion: 1,
  equipment: ["router", "switch", "switch2", "camera", "nvr"],
  links: ["router-switch", "switch-camera", "switch-nvr", "switch-switch"],
  cameraCount: 8,
  switchPorts: 16
};

test("normalizes a valid topology scenario and preserves chosen options", () => {
  assert.deepEqual(normalizeTopologyConfig(valid), valid);
});

test("rejects unknown schema versions and arbitrary device identifiers", () => {
  assert.throws(() => normalizeTopologyConfig({ ...valid, schemaVersion: 2 }), /نسخه/);
  assert.throws(() => normalizeTopologyConfig({ ...valid, equipment: ["script"] }), /ناشناخته/);
  assert.throws(() => normalizeTopologyConfig({ ...valid, links: ["unknown-link"] }), /ناشناخته/);
  assert.deepEqual(normalizeTopologyConfig({ ...valid, links: ["switch2-camera", "switch2-nvr"] }).links, ["switch2-camera", "switch2-nvr"]);
});

test("rejects duplicate identifiers rather than silently changing the scenario", () => {
  assert.throws(() => normalizeTopologyConfig({ ...valid, equipment: ["switch", "switch"] }), /تکراری/);
  assert.throws(() => normalizeTopologyConfig({ ...valid, links: ["switch-camera", "switch-camera"] }), /تکراری/);
});

test("rejects invalid camera counts and unsupported switch port counts", () => {
  for (const cameraCount of [0, -1, 1.5, 257, "eight", null]) {
    assert.throws(() => normalizeTopologyConfig({ ...valid, cameraCount }), /تعداد دوربین/);
  }
  for (const switchPorts of [0, 12, 32, "sixteen", null]) {
    assert.throws(() => normalizeTopologyConfig({ ...valid, switchPorts }), /تعداد پورت/);
  }
});


test("applying an imported scenario updates every control and runs the topology analysis", () => {
  const makeCheckboxes = values => values.map(value => ({
    value, checked: false, events: [],
    dispatchEvent(event) { this.events.push(event.type); }
  }));
  const equipment = makeCheckboxes(["router", "switch", "switch2", "camera", "nvr", "monitor", "ups"]);
  const links = makeCheckboxes(["router-switch", "switch-camera", "switch2-camera", "switch-nvr", "switch2-nvr", "nvr-monitor", "router-camera", "switch-switch"]);
  const cameraCount = { value: "1", events: [], dispatchEvent(event) { this.events.push(event.type); } };
  const switchPorts = { value: "8", events: [], dispatchEvent(event) { this.events.push(event.type); } };
  const checkTopology = { clicks: 0, click() { this.clicks += 1; } };
  const root = {
    querySelectorAll(selector) {
      if (selector === "#equipmentChecks input[type=checkbox]") return equipment;
      if (selector === "#linkChecks input[type=checkbox]") return links;
      throw new Error("Unexpected selector: " + selector);
    },
    querySelector(selector) {
      return ({
        "#camCount": cameraCount,
        "#switchPorts": switchPorts,
        "#checkTopology": checkTopology
      })[selector] || null;
    }
  };
  const scenario = {
    ...valid,
    equipment: ["switch", "switch2", "camera", "nvr"],
    links: ["switch2-camera", "switch-switch", "switch2-nvr"],
    cameraCount: 12,
    switchPorts: 24
  };
  applyTopologyConfig(scenario, root);
  assert.deepEqual(equipment.filter(item => item.checked).map(item => item.value).sort(), [...scenario.equipment].sort());
  assert.deepEqual(links.filter(item => item.checked).map(item => item.value).sort(), [...scenario.links].sort());
  assert.equal(cameraCount.value, "12");
  assert.equal(switchPorts.value, "24");
  assert.deepEqual(cameraCount.events, ["change"]);
  assert.deepEqual(switchPorts.events, ["change"]);
  assert.ok(equipment.filter(item => item.checked).every(item => item.events.includes("change")));
  assert.ok(links.filter(item => item.checked).every(item => item.events.includes("change")));
  assert.equal(checkTopology.clicks, 1);
});

test("rejects malformed objects and missing arrays", () => {
  assert.throws(() => normalizeTopologyConfig(null), /ساختار/);
  assert.throws(() => normalizeTopologyConfig({ ...valid, equipment: "switch" }), /فهرست/);
});

test("workshop UI exposes import/export controls and loads the scenario module", () => {
  const html = fs.readFileSync("workshops.html", "utf8");
  assert.match(html, /id="exportTopologyScenario"/);
  assert.match(html, /id="importTopologyScenario"/);
  assert.match(html, /id="topologyScenarioFile"[^>]*type="file"/);
  assert.match(html, /assets\/js\/sim\/ui\/topology-scenario-io\.js/);
  assert.match(html, /id="topologyScenarioStatus"[^>]*aria-live="polite"/);
  assert.match(html, /value="switch2"/, "The second switch must be a real selectable device");
  assert.match(html, /"switch-switch":\["switch","switch2"\]/, "The inter-switch link must connect two distinct modeled devices");
  assert.doesNotMatch(html, /مدل فعلی سوئیچ دوم را جداگانه تعریف نمی‌کند/, "The old nonfunctional switch link warning must be removed");
});
