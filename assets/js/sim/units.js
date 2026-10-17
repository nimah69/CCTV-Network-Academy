const DIGITS = Object.freeze({ "۰":"0","۱":"1","۲":"2","۳":"3","۴":"4","۵":"5","۶":"6","۷":"7","۸":"8","۹":"9","٠":"0","١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9" });
export function normalizeDigits(value) {
  return String(value).replace(/[۰-۹٠-٩]/g, digit => DIGITS[digit]).replace(/٫/g, ".").replace(/٬/g, "");
}
export function finiteNumber(value, label = "مقدار") {
  const normalized = normalizeDigits(value).trim();
  if (!normalized) throw new TypeError(label + " را وارد کن.");
  const number = Number(normalized);
  if (!Number.isFinite(number)) throw new TypeError(label + " باید عدد معتبر باشد.");
  return number;
}
export function positiveNumber(value, label = "مقدار") {
  const number = finiteNumber(value, label);
  if (number <= 0) throw new RangeError(label + " باید بزرگ‌تر از صفر باشد.");
  return number;
}
export function nonNegativeNumber(value, label = "مقدار") {
  const number = finiteNumber(value, label);
  if (number < 0) throw new RangeError(label + " نباید منفی باشد.");
  return number;
}
export const mbpsToMBps = mbps => finiteNumber(mbps, "Mbps") / 8;
export const MBpsToMbps = MBps => finiteNumber(MBps, "MB/s") * 8;
export const decimalGBToGiB = gb => finiteNumber(gb, "GB") * 1e9 / (1024 ** 3);
export const decimalTBToTiB = tb => finiteNumber(tb, "TB") * 1e12 / (1024 ** 4);
export const wattsToVA = (watts, powerFactor) => {
  const w = nonNegativeNumber(watts, "توان بر حسب وات");
  const pf = positiveNumber(powerFactor, "ضریب توان");
  if (pf > 1) throw new RangeError("ضریب توان باید بین صفر و یک باشد.");
  return w / pf;
};
export const metersToFeet = meters => finiteNumber(meters, "متر") * 3.280839895;
export const formatNumber = (value, maximumFractionDigits = 2) =>
  new Intl.NumberFormat("fa-IR", { maximumFractionDigits }).format(value);
