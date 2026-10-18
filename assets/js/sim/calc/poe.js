import { positiveNumber, nonNegativeNumber } from "../units.js";
export function poeCapacity({budgetW,cameraWatts,reservePercent=20}){const budget=positiveNumber(budgetW,"بودجه PoE"),load=positiveNumber(cameraWatts,"مصرف هر دوربین"),reserve=nonNegativeNumber(reservePercent,"حاشیه");return Math.floor(budget/(load*(1+reserve/100)))}

// IEEE-oriented reference model for the PoE workshop.
export const R_COND_OHM_PER_M = 0.0938;
export const CCA_FACTOR = 1.55; // [ASSUMPTION] Verify against the selected cable datasheet.
export const CU_TEMPCO = 0.00393;
export const MAX_CHANNEL_M = 100;
export const PERMANENT_LINK_M = 90;
export const EPS = 1e-9;
export const POE_TYPES = {
  af:  { pseW: 15.4, pdW: 12.95, vPseMin: 44.0, vPdMin: 37.0, iPairMaxA: 0.35, pairs: 2 },
  at:  { pseW: 30.0, pdW: 25.5, vPseMin: 50.0, vPdMin: 42.5, iPairMaxA: 0.60, pairs: 2 },
  bt3: { pseW: 60.0, pdW: 51.0, vPseMin: 50.0, vPdMin: 42.5, iPairMaxA: 0.60, pairs: 4 },
  bt4: { pseW: 90.0, pdW: 71.3, vPseMin: 52.3, vPdMin: 41.1, iPairMaxA: 0.96, pairs: 4 },
};
export const POE_CLASSES = {
  1: { pseW: 4, pdW: 3.84 }, 2: { pseW: 7, pdW: 6.49 },
  3: { pseW: 15.4, pdW: 12.95 }, 4: { pseW: 30, pdW: 25.5 },
  5: { pseW: 45, pdW: 40 }, 6: { pseW: 60, pdW: 51 },
  7: { pseW: 75, pdW: 62 }, 8: { pseW: 90, pdW: 71.3 },
};
function assertPositive(name, v, allowZero = false) {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || (!allowZero && v === 0))
    throw new RangeError(`${name} نامعتبر است`);
}
export function loopResistance({ lengthM, material = "cu", tempC = 20, pairs = 2 }) {
  assertPositive("lengthM", lengthM, true);
  if (pairs !== 2 && pairs !== 4) throw new RangeError("pairs باید 2 یا 4 باشد");
  const k = material === "cca" ? CCA_FACTOR : 1;
  const rCond = R_COND_OHM_PER_M * lengthM * k * (1 + CU_TEMPCO * (tempC - 20));
  return pairs === 4 ? rCond / 2 : rCond;
}
export function solveLink({ type, pdW, lengthM, material = "cu", tempC = 20, pairs }) {
  const t = POE_TYPES[type];
  if (!t) throw new RangeError("نوع PoE نامعتبر است");
  assertPositive("pdW", pdW);
  const n = pairs ?? t.pairs;
  const R = loopResistance({ lengthM, material, tempC, pairs: n });
  const V = t.vPseMin;
  const iMax = t.iPairMaxA * (n / 2);
  const reasons = [], warnings = [];
  let I, feasible = true;
  if (R === 0) I = pdW / V;
  else {
    const disc = V * V - 4 * R * pdW;
    if (disc < 0) { feasible = false; I = NaN; reasons.push("توان مورد نیاز در این طول/مقاومت قابل تحویل نیست"); }
    else I = (V - Math.sqrt(disc)) / (2 * R);
  }
  const lossW = feasible ? I * I * R : NaN;
  const pseW = feasible ? pdW + lossW : NaN;
  const vPd = feasible ? V - I * R : NaN;
  if (lengthM > MAX_CHANNEL_M) reasons.push("طول بیش از 100 متر (خارج از استاندارد کانال)");
  if (feasible) {
    if (I > iMax + EPS) reasons.push("جریان بیش از حد مجاز هر جفت");
    if (pseW > t.pseW + EPS) reasons.push("توان لازم در PSE بیش از ظرفیت پورت");
    if (vPd < t.vPdMin - EPS) reasons.push("ولتاژ در PD کمتر از حداقل مجاز");
    if (lengthM > PERMANENT_LINK_M && lengthM <= MAX_CHANNEL_M) warnings.push("طول بیش از 90 متر؛ حاشیه کم");
    if (I > 0.9 * iMax && I <= iMax + EPS) warnings.push("جریان بیش از 90٪ حد مجاز");
    if (pseW > 0.9 * t.pseW && pseW <= t.pseW + EPS) warnings.push("بار پورت بیش از 90٪ ظرفیت");
  }
  const status = reasons.length ? "fail" : warnings.length ? "marginal" : "ok";
  return { status, reasons, warnings, resistanceOhm: R, currentA: I, lossW, pseW, vPdV: vPd, iMaxA: iMax };
}
export function budgetCheck({ switchBudgetW, marginPct = 20, allocationsW }) {
  assertPositive("switchBudgetW", switchBudgetW);
  if (!Array.isArray(allocationsW) || allocationsW.some(a => !(a >= 0))) throw new RangeError("allocationsW نامعتبر است");
  const totalW = allocationsW.reduce((s, a) => s + a, 0);
  const usableW = switchBudgetW * (1 - marginPct / 100);
  const status = totalW <= usableW + EPS ? "ok" : totalW <= switchBudgetW + EPS ? "marginal" : "fail";
  const avg = allocationsW.length ? totalW / allocationsW.length : 0;
  const maxSameCount = avg > 0 ? Math.floor((usableW + EPS) / avg) : null;
  return { status, totalW, usableW, maxSameCount };
}

