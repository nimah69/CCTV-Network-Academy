import { positiveNumber } from "../units.js";
import { ENGINEERING } from "../constants.js";
const DORI = ENGINEERING.video.legacyDori;
const CURRENT_LEVELS = ENGINEERING.video.currentDensityLevels2025;

export function calculateCoverage({sensorWidthMm,sensorHeightMm,focalLengthMm,distanceM,horizontalPixels,verticalPixels,sceneWidthM,sceneHeightM,overlapPercent=20}={}) {
  const sw=positiveNumber(sensorWidthMm,"عرض سنسور");
  const sh=positiveNumber(sensorHeightMm,"ارتفاع سنسور");
  const f=positiveNumber(focalLengthMm,"فاصله کانونی");
  const d=positiveNumber(distanceM,"فاصله نصب");
  const px=positiveNumber(horizontalPixels,"پیکسل افقی");
  const py=positiveNumber(verticalPixels,"پیکسل عمودی");
  const overlap=Number(overlapPercent);
  if(!Number.isFinite(overlap)||overlap<0||overlap>=80) throw new RangeError("هم‌پوشانی باید بین ۰ تا کمتر از ۸۰ درصد باشد.");
  const fovH=2*Math.atan(sw/(2*f))*180/Math.PI;
  const fovV=2*Math.atan(sh/(2*f))*180/Math.PI;
  const width=2*d*Math.tan(fovH*Math.PI/360);
  const height=2*d*Math.tan(fovV*Math.PI/360);
  // Pixel density is calculated from the actual projected field of view, not the user-entered scene dimensions.
  const ppmX=px/width, ppmY=py/height;
  const ppm=Math.min(ppmX,ppmY);
  if(![fovH,fovV,width,height,ppmX,ppmY,ppm].every(Number.isFinite)||width<=0||height<=0||fovH>=180||fovV>=180)throw new RangeError("نتیجه محاسبه میدان دید/تراکم پیکسل خارج از محدوده عددی است.");
  const legacyDori=ppm>=DORI.identification?"شناسایی (DORI قدیمی)":ppm>=DORI.recognition?"تشخیص هویت (DORI قدیمی)":ppm>=DORI.observation?"مشاهده (DORI قدیمی)":ppm>=DORI.detection?"کشف (DORI قدیمی)":"کمتر از سطح کشف (DORI قدیمی)";
  const current2025DensityLevel=CURRENT_LEVELS.filter(value=>ppm>=value).at(-1)??null;
  let sceneCoverage=null;
  if(sceneWidthM!==undefined&&sceneHeightM!==undefined){
    const sceneW=positiveNumber(sceneWidthM,"عرض صحنه"),sceneH=positiveNumber(sceneHeightM,"ارتفاع صحنه");
    const stepW=width*(1-overlap/100),stepH=height*(1-overlap/100);
    sceneCoverage={
      horizontalCameras:Math.max(1,Math.ceil(Math.max(0,sceneW-width)/stepW)+1),
      verticalRows:Math.max(1,Math.ceil(Math.max(0,sceneH-height)/stepH)+1),
      sceneWidthM:sceneW,sceneHeightM:sceneH,
      fitsSingleCamera:sceneW<=width&&sceneH<=height,
      overlapPercent:overlap,
      horizontalCoverageRatio:sceneW/width,
      verticalCoverageRatio:sceneH/height
    };
  }
  return {
    horizontalFovDeg:fovH,verticalFovDeg:fovV,coveredWidthM:width,coveredHeightM:height,
    horizontalPixelsPerMeter:ppmX,verticalPixelsPerMeter:ppmY,pixelsPerMeter:ppm,
    dori:legacyDori,doriThresholds:DORI,current2025DensityLevel,current2025DensityLevels:CURRENT_LEVELS,
    sceneCoverage,
    warning:"تراکم پیکسل بر اساس میدان دید واقعی محاسبه شده است. DORI قدیمی مرجع تقریبی است؛ IEC 62676-4:2025 از سطوح تراکم پیکسل به‌روز استفاده می‌کند. لنز واقعی، اعوجاج، نور، زاویه، فشرده‌سازی و هم‌پوشانی می‌توانند نتیجه را تغییر دهند."
  };
}
