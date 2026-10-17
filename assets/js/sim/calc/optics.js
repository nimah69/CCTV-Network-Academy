import { positiveNumber } from "../units.js";
const DORI={detection:25,observation:62.5,recognition:125,identification:250}; // Approximate px/m thresholds from commonly cited IEC 62676-4 guidance; verify current edition and task-specific requirements.
export function calculateCoverage({sensorWidthMm,sensorHeightMm,focalLengthMm,distanceM,horizontalPixels,verticalPixels,sceneWidthM,sceneHeightM}={}){
 const sw=positiveNumber(sensorWidthMm,"عرض سنسور"),sh=positiveNumber(sensorHeightMm,"ارتفاع سنسور"),f=positiveNumber(focalLengthMm,"فاصله کانونی"),d=positiveNumber(distanceM,"فاصله نصب"),px=positiveNumber(horizontalPixels,"پیکسل افقی"),py=positiveNumber(verticalPixels,"پیکسل عمودی");
 const fovH=2*Math.atan(sw/(2*f))*180/Math.PI,fovV=2*Math.atan(sh/(2*f))*180/Math.PI,width=2*d*Math.tan(fovH*Math.PI/360),height=2*d*Math.tan(fovV*Math.PI/360),ppmX=px/width,ppmY=py/height,ppm=Math.min(ppmX,ppmY);
 const level=ppm>=DORI.identification?"شناسایی":ppm>=DORI.recognition?"تشخیص هویت":ppm>=DORI.observation?"مشاهده":ppm>=DORI.detection?"کشف":"کمتر از سطح کشف";
 return {horizontalFovDeg:fovH,verticalFovDeg:fovV,coveredWidthM:width,coveredHeightM:height,pixelsPerMeter:ppm,dori:level,doriThresholds:DORI,sceneCoverage:sceneWidthM&&sceneHeightM?{horizontalCameras:Math.ceil(positiveNumber(sceneWidthM,"عرض صحنه")/width),verticalRows:Math.ceil(positiveNumber(sceneHeightM,"ارتفاع صحنه")/height)}:null,warning:"محاسبه هندسی ایده‌آل است؛ ارتفاع، زاویه، اعوجاج، نور و معیار هدف واقعی باید در صحنه بررسی شوند."};
}
