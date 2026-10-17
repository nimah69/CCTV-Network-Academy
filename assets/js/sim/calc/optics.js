import { positiveNumber } from "../units.js";
import { ENGINEERING } from "../constants.js";
const DORI = ENGINEERING.video.legacyDori;
const CURRENT_LEVELS = ENGINEERING.video.currentDensityLevels2025;
export function calculateCoverage({sensorWidthMm,sensorHeightMm,focalLengthMm,distanceM,horizontalPixels,verticalPixels,sceneWidthM,sceneHeightM}={}) {
  const sw=positiveNumber(sensorWidthMm,"عرض سنسور"), sh=positiveNumber(sensorHeightMm,"ارتفاع سنسور"), f=positiveNumber(focalLengthMm,"فاصله کانونی"), d=positiveNumber(distanceM,"فاصله نصب"), px=positiveNumber(horizontalPixels,"پیکسل افقی"), py=positiveNumber(verticalPixels,"پیکسل عمودی");
  const fovH=2*Math.atan(sw/(2*f))*180/Math.PI, fovV=2*Math.atan(sh/(2*f))*180/Math.PI;
  const width=2*d*Math.tan(fovH*Math.PI/360), height=2*d*Math.tan(fovV*Math.PI/360);
  const ppmX=px/width, ppmY=py/height, ppm=Math.min(ppmX,ppmY);
  const legacyDori=ppm>=DORI.identification?"شناسایی (DORI قدیمی)":ppm>=DORI.recognition?"تشخیص هویت (DORI قدیمی)":ppm>=DORI.observation?"مشاهده (DORI قدیمی)":ppm>=DORI.detection?"کشف (DORI قدیمی)":"کمتر از سطح کشف (DORI قدیمی)";
  const current2025DensityLevel=CURRENT_LEVELS.filter(value=>ppm>=value).at(-1)??null;
  return {
    horizontalFovDeg:fovH, verticalFovDeg:fovV, coveredWidthM:width, coveredHeightM:height,
    pixelsPerMeter:ppm, dori:legacyDori, doriThresholds:DORI, current2025DensityLevel,
    current2025DensityLevels:CURRENT_LEVELS,
    sceneCoverage:sceneWidthM&&sceneHeightM?{horizontalCameras:Math.ceil(positiveNumber(sceneWidthM,"عرض صحنه")/width),verticalRows:Math.ceil(positiveNumber(sceneHeightM,"ارتفاع صحنه")/height)}:null,
    warning:"DORI با آستانه‌های ۲۰۱۴/۲۰۱۵ قدیمی است؛ IEC 62676-4:2025 مقیاس تراکم پیکسل را تغییر داده است. خروجی هندسی تضمین عملکرد صحنه نیست."
  };
}
