import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { normalizeTopologyConfig } from "../assets/js/sim/ui/topology-scenario-io.js";

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
