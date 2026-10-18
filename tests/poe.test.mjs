import test from "node:test";
import assert from "node:assert/strict";
import { solveLink, budgetCheck, loopResistance } from "../assets/js/sim/calc/poe.js";
const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b} ±${tol}`);

test("V1: 10W, af, 50m مس → ok", () => {
  const r = solveLink({ type: "af", pdW: 10, lengthM: 50 });
  near(r.resistanceOhm, 4.69, 0.001); near(r.currentA, 0.2331, 0.001);
  near(r.lossW, 0.255, 0.005); near(r.pseW, 10.255, 0.005); near(r.vPdV, 42.907, 0.01);
  assert.equal(r.status, "ok");
});
test("V2: 10W, at, 100m مس → marginal", () => {
  const r = solveLink({ type: "at", pdW: 10, lengthM: 100 });
  near(r.currentA, 0.2081, 0.001); near(r.lossW, 0.406, 0.005); near(r.pseW, 10.406, 0.005); near(r.vPdV, 48.048, 0.01);
  assert.equal(r.status, "marginal");
});
test("V3: 10W, at, 100m CCA", () => {
  const r = solveLink({ type: "at", pdW: 10, lengthM: 100, material: "cca" });
  near(r.resistanceOhm, 14.539, 0.001); near(r.currentA, 0.2132, 0.001); near(r.lossW, 0.661, 0.005); near(r.pseW, 10.661, 0.005);
  assert.equal(r.status, "marginal");
});
test("V4: 25.5W, at, 100m مس → marginal", () => {
  const r = solveLink({ type: "at", pdW: 25.5, lengthM: 100 });
  near(r.currentA, 0.5712, 0.001); near(r.lossW, 3.06, 0.01); near(r.pseW, 28.56, 0.01);
  assert.equal(r.status, "marginal");
});
test("V5: 25.5W, at, 100m CCA → fail", () => {
  const r = solveLink({ type: "at", pdW: 25.5, lengthM: 100, material: "cca" });
  near(r.currentA, 0.6228, 0.001); near(r.pseW, 31.14, 0.02);
  assert.equal(r.status, "fail"); assert.ok(r.reasons.length >= 2);
});
test("V6: 12.95W, af, 100m مس → marginal", () => {
  const r = solveLink({ type: "af", pdW: 12.95, lengthM: 100 });
  near(r.currentA, 0.3156, 0.001); near(r.lossW, 0.934, 0.005); near(r.pseW, 13.884, 0.005);
  assert.equal(r.status, "marginal");
});
test("V7: 71.3W, bt4, 100m مس (4 جفت)", () => {
  const r = solveLink({ type: "bt4", pdW: 71.3, lengthM: 100 });
  near(r.resistanceOhm, 4.69, 0.001); near(r.currentA, 1.590, 0.002); near(r.lossW, 11.86, 0.02); near(r.pseW, 83.16, 0.02);
  assert.equal(r.status, "marginal");
});
test("V8: طول بیش از 100m → fail", () => assert.equal(solveLink({ type: "at", pdW: 10, lengthM: 120 }).status, "fail"));
test("V9: طول صفر", () => { const r = solveLink({ type: "af", pdW: 10, lengthM: 0 }); near(r.currentA, 10 / 44, 1e-9); near(r.lossW, 0, 1e-12); });
test("ورودی نامعتبر", () => {
  assert.throws(() => solveLink({ type: "xx", pdW: 10, lengthM: 10 }), RangeError);
  assert.throws(() => solveLink({ type: "af", pdW: -1, lengthM: 10 }), RangeError);
  assert.throws(() => solveLink({ type: "af", pdW: 10, lengthM: NaN }), RangeError);
  assert.throws(() => loopResistance({ lengthM: 10, pairs: 3 }), RangeError);
  assert.throws(() => loopResistance({ lengthM: 10, material: "mystery" }), RangeError);
  assert.throws(() => loopResistance({ lengthM: 10, tempC: 200 }), RangeError);
});
test("B1: بودجه، 8 دوربین × 13W روی 120W با حاشیه 20٪ → marginal", () => {
  const r = budgetCheck({ switchBudgetW: 120, allocationsW: Array(8).fill(13) });
  assert.equal(r.status, "marginal"); near(r.totalW, 104, 1e-9); near(r.usableW, 96, 1e-9); assert.equal(r.maxSameCount, 7);
});
test("B2: 6 × 13W → ok", () => assert.equal(budgetCheck({ switchBudgetW: 120, allocationsW: Array(6).fill(13) }).status, "ok"));
test("B3: 10 × 13W → fail", () => assert.equal(budgetCheck({ switchBudgetW: 120, allocationsW: Array(10).fill(13) }).status, "fail"));
test("B5: بودجه باید اعداد محدود و حاشیه معتبر داشته باشد", () => {
  assert.throws(() => budgetCheck({ switchBudgetW: 120, allocationsW: [Infinity] }), RangeError);
  assert.throws(() => budgetCheck({ switchBudgetW: 120, allocationsW: [NaN] }), RangeError);
  assert.throws(() => budgetCheck({ switchBudgetW: 120, marginPct: 100, allocationsW: [10] }), RangeError);
});
test("B4: تخصیص ایستا کلاس 3 در برابر تخصیص پویا", () => {
  assert.equal(budgetCheck({ switchBudgetW: 120, allocationsW: Array(8).fill(15.4) }).status, "fail");
  assert.equal(budgetCheck({ switchBudgetW: 120, allocationsW: Array(8).fill(10.406) }).status, "ok");
});
