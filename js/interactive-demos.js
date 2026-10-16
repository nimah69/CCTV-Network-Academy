/* سه نمایش تعاملی سبک برای آموزش شبکه و CCTV؛ بدون SVG یا کتابخانه بیرونی. */
(function(root){
"use strict";
const doc=root&&root.document;
const state={
 path:{layer:"data",cut:false},
 poe:{cameras:6,watts:8,budget:90,reserve:20},
 tree:{step:0,answers:{},terminal:null,lastFeedback:null}
};
const faNum=value=>String(value).replace(/\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
function evaluatePoe(cameras,watts,budget,reserve=20){
 const calc=root&&root.CCTVCalculations;
 if(!calc||typeof calc.poe!=="function")return {error:"ماژول محاسبات PoE در دسترس نیست."};
 const limit=Number(budget);
 if(!Number.isFinite(limit)||limit<=0)return {error:"بودجه PoE باید عددی بزرگ‌تر از صفر باشد."};
 try{
  const result=calc.poe(Number(cameras),Number(watts),Number(reserve));
  const status=result.total>limit?"insufficient":result.total>limit*.8?"borderline":"enough";
  const advice=status==="insufficient"?"تعداد دوربین‌ها را کم کن، سوئیچ با بودجه PoE بیشتر انتخاب کن یا مصرف واقعی هر دوربین را از دیتاشیت بررسی کن.":status==="borderline"?"حاشیه کمی باقی می‌ماند؛ مصرف اوج، توان راه‌اندازی و سایر بارهای PoE را با مشخصات سازنده بررسی کن.":"برآورد واردشده زیر ۸۰٪ بودجه است؛ همچنان توان هر پورت و بودجه واقعی سوئیچ را از دیتاشیت تأیید کن.";
  return {base:result.base,total:result.total,budget:limit,status,advice,reserve:Number(reserve),cameras:Number(cameras),watts:Number(watts)};
 }catch(error){return {error:error&&error.message?error.message:"ورودی محاسبه معتبر نیست."}}
}
function evaluateTreeChoice(step,value){
 const n=Number(step);
 if(n===0&&value==="fault")return {terminal:true,title:"بررسی فیزیکی",reason:"اگر برق یا Link مشکل دارد، ابتدا منبع تغذیه یا PoE، کابل و سوکت، پورت سوئیچ و چراغ Link را بررسی کن. تا رفع این مرحله سراغ تنظیمات تصویر نرو."};
 if(n===0&&value==="ok")return {nextStep:1,title:"مرحله فیزیکی تأیید شد",reason:"وقتی برق و Link طبیعی‌اند، مرحله بعد آدرس‌دهی IP، Subnet، VLAN و دسترسی شبکه است."};
 if(n===1&&value==="fault")return {terminal:true,title:"بررسی IP و شبکه",reason:"آدرس IP دوربین و NVR، Subnet، تداخل IP، VLAN، Gateway و قواعد ACL/Firewall را بررسی کن. پاسخ‌ندادن Ping نشانه است، نه تشخیص قطعی یک علت."};
 if(n===1&&value==="ok")return {nextStep:2,title:"دسترسی IP تأیید شد",reason:"دسترسی IP برقرار است؛ حالا سرویس و جریان تصویر را جداگانه بررسی کن. Ping به‌تنهایی سلامت Stream را ثابت نمی‌کند."};
 if(n===2&&value==="fault")return {terminal:true,title:"بررسی سرویس تصویر",reason:"اعتبارنامه، مجوز کاربر، پورت و سرویس ویدئو، سازگاری ONVIF/Stream، کدک، تعداد اتصال و تنظیمات کانال را بررسی کن."};
 if(n===2&&value==="ok")return {terminal:true,title:"بررسی سمت NVR و نمایش",reason:"اگر IP و سرویس تصویر پاسخ می‌دهند، کانال و منبع Stream در NVR، مجوز کاربر، کدک، زمان، ضبط، Playback و خروجی نمایش را بررسی کن."};
 return {terminal:true,title:"نیازمند بازبینی",reason:"انتخاب ثبت‌شده با مرحله جاری سازگار نیست؛ درخت را از ابتدا اجرا کن."};
}
function pathMarkup(){
 const p=state.path,layer=p.layer,cut=p.cut;
 const status=cut?(layer==="power"?"کابل بین سوئیچ و دوربین قطع است؛ در فرض تغذیه PoE، برق دوربین نیز قطع می‌شود.":"مسیر داده بین دوربین و سوئیچ قطع است؛ NVR تصویر جدید دریافت نمی‌کند."):(layer==="power"?"برق PoE از سوئیچ به دوربین می‌رسد؛ NVR منبع تغذیه خودش را دارد.":"داده از دوربین IP به سوئیچ و سپس به NVR می‌رود.");
 return '<section class="demo-card demo-path-card"><div class="demo-heading"><div><span class="demo-kicker">نمایش تعاملی ۱</span><h2>مسیر داده و برق</h2></div><span class="demo-tag">فصل ۱ و ۳</span></div><p class="demo-intro">لایه را عوض کن و اثر قطع کابل بین دوربین و سوئیچ را ببین.</p><div class="demo-controls" role="group" aria-label="انتخاب لایه مسیر"><button type="button" data-demo-action="path-layer" data-layer="data" class="'+(layer==="data"?"active":"")+'">لایه داده</button><button type="button" data-demo-action="path-layer" data-layer="power" class="'+(layer==="power"?"active":"")+'">لایه برق</button></div><div class="demo-path-flow '+(cut?"is-cut":"")+'" dir="ltr"><div class="demo-device"><span class="demo-device-icon">◉</span><b>دوربین IP</b><small>'+(cut&&layer==="power"?"PoE قطع":"دوربین")+'</small></div><div class="demo-link '+(cut?"cut":"")+'"><span>'+(cut?"قطع":"کابل")+'</span><b>'+(layer==="data"?"→":"←")+'</b></div><div class="demo-device"><span class="demo-device-icon">▦</span><b>سوئیچ PoE</b><small>'+(layer==="power"?"منبع PoE":"تبادل فریم")+'</small></div><div class="demo-link '+(cut&&layer==="data"?"cut":"")+'"><span>'+(layer==="data"?"داده":"مسیر داده")+'</span><b>'+(layer==="data"?"→":"—")+'</b></div><div class="demo-device"><span class="demo-device-icon">▣</span><b>NVR</b><small>برق محلی</small></div></div><div class="demo-status '+(cut?"warn":"ok")+'" role="status">'+esc(status)+'</div><div class="demo-actions"><button type="button" data-demo-action="path-cut" class="'+(cut?"secondary":"primary")+'">'+(cut?"وصل دوباره کابل":"قطع کابل بین سوئیچ و دوربین")+'</button><button type="button" data-demo-action="path-reset" class="secondary">بازنشانی نمایش</button></div><p class="demo-note">فرض آموزشی: دوربین با PoE و از همین کابل تغذیه می‌شود. اگر منبع برق جداگانه داشته باشد، قطع کابل شبکه الزاماً برق دوربین را قطع نمی‌کند.</p></section>';
}
function poeMarkup(){
 const p=state.poe,result=evaluatePoe(p.cameras,p.watts,p.budget,p.reserve);
 const labels={enough:"کافی",borderline:"مرزی",insufficient:"ناکافی"};
 return '<section class="demo-card demo-poe-card"><div class="demo-heading"><div><span class="demo-kicker">نمایش تعاملی ۲</span><h2>برآورد بودجه PoE</h2></div><span class="demo-tag">فصل ۳</span></div><p class="demo-intro">تعداد دوربین‌ها را تغییر بده و اثر مصرف و حاشیه اطمینان را ببین.</p><div class="demo-input-grid"><div class="demo-field"><label>تعداد دوربین</label><div class="demo-counter"><button type="button" data-demo-action="poe-remove" aria-label="کم‌کردن یک دوربین">−</button><output>'+faNum(p.cameras)+'</output><button type="button" data-demo-action="poe-add" aria-label="افزودن یک دوربین">+</button></div></div><label class="demo-field">توان هر دوربین (وات)<input type="number" min="1" max="100" step="0.5" value="'+esc(p.watts)+'" data-poe-input="watts" inputmode="decimal"></label><label class="demo-field">بودجه سوئیچ (وات)<input type="number" min="1" max="2000" step="1" value="'+esc(p.budget)+'" data-poe-input="budget" inputmode="decimal"></label></div>'+(result.error?'<div class="demo-status warn" role="alert">'+esc(result.error)+'</div>':'<div class="demo-result"><div class="demo-result-main"><span>مصرف برآوردی با حاشیه '+faNum(result.reserve)+'٪</span><strong>'+faNum(result.total.toFixed(1))+' وات</strong></div><div class="demo-result-meter"><span class="'+result.status+'" style="width:'+Math.min(100,result.total/result.budget*100)+'%"></span></div><div class="demo-result-stats"><span>مصرف پایه: <b>'+faNum(result.base)+' وات</b></span><span>بودجه: <b>'+faNum(result.budget)+' وات</b></span></div><div class="demo-status '+(result.status==="enough"?"ok":result.status==="borderline"?"warn":"bad")+'" role="status">وضعیت: '+labels[result.status]+'</div><div class="demo-advice"><b>اقدام پیشنهادی</b><p>'+esc(result.advice)+'</p></div></div>')+'<p class="demo-note"><b>فرض‌ها:</b> توان هر دوربین ثابت و برابر مقدار واردشده، حاشیه اطمینان ۲۰٪ و بودجه قابل استفاده برابر مقدار ورودی فرض شده است. این برآورد جایگزین دیتاشیت سوئیچ و دوربین نیست؛ توان هر پورت و مصرف اوج را جداگانه بررسی کن.</p></section>';
}
const treeSteps=[
 {title:"۱. برق و لینک",question:"اولین بررسی چه نتیجه‌ای دارد؟",options:[{value:"fault",label:"برق یا Link مشکل دارد"},{value:"ok",label:"برق و Link طبیعی‌اند"}]},
 {title:"۲. IP و دسترسی شبکه",question:"آیا دوربین از نظر IP در دسترس است؟",options:[{value:"fault",label:"IP پاسخ نمی‌دهد یا Subnet/VLAN مشکوک است"},{value:"ok",label:"دسترسی IP برقرار است"}]},
 {title:"۳. سرویس تصویر",question:"آیا سرویس تصویر یا Stream پاسخ می‌دهد؟",options:[{value:"fault",label:"سرویس تصویر پاسخ نمی‌دهد"},{value:"ok",label:"سرویس تصویر پاسخ می‌دهد"}]}
];
function treeMarkup(){
 const t=state.tree,step=treeSteps[t.step]||treeSteps[0];
 const last=t.lastFeedback?'<div class="demo-tree-feedback" role="status"><b>'+esc(t.lastFeedback.title)+'</b><p>'+esc(t.lastFeedback.reason)+'</p></div>':"";
 const body=t.terminal?'<div class="demo-tree-terminal"><span class="demo-kicker">نتیجه مسیر</span><h3>'+esc(t.terminal.title)+'</h3><p>'+esc(t.terminal.reason)+'</p><button type="button" data-demo-action="tree-reset" class="secondary">شروع دوباره عیب‌یابی</button></div>':last+'<div class="demo-tree-step"><span class="demo-step-label">مرحله '+faNum(t.step+1)+' از '+faNum(treeSteps.length)+'</span><h3>'+esc(step.title)+'</h3><p>'+esc(step.question)+'</p><div class="demo-tree-options">'+step.options.map(o=>'<button type="button" data-demo-action="tree-choice" data-value="'+o.value+'">'+esc(o.label)+'<span aria-hidden="true">←</span></button>').join("")+'</div>'+(t.step>0?'<button type="button" class="text-button" data-demo-action="tree-back">بازگشت به مرحله قبل</button>':"");
 return '<section class="demo-card demo-tree-card"><div class="demo-heading"><div><span class="demo-kicker">نمایش تعاملی ۳</span><h2>درخت عیب‌یابی «تصویر نیست»</h2></div><span class="demo-tag">فصل ۹</span></div><p class="demo-intro">با انتخاب نشانه واقعی، مسیر بعدی و دلیل آن را ببین؛ از لایه ساده‌تر شروع کن.</p><div class="demo-tree-rail"><span class="'+(t.step>=0?"active":"")+'">برق / Link</span><i></i><span class="'+(t.step>=1?"active":"")+'">IP</span><i></i><span class="'+(t.step>=2?"active":"")+'">سرویس تصویر</span></div>'+body+'<p class="demo-note">این درخت راهنمای آموزشی است، نه تشخیص قطعی. پس از هر اصلاح، همان مرحله و سپس ضبط و Playback را دوباره آزمایش کن.</p></section>';
}
function renderForChapter(chapterIndex){
 const index=Number(chapterIndex);
 if(index!==0&&index!==2&&index!==8)return "";
 const contents=index===0?pathMarkup():index===2?pathMarkup()+poeMarkup():treeMarkup();
 return '<section class="interactive-demos" data-interactive-demos data-demo-chapter="'+index+'" aria-label="نمایش‌های تعاملی فصل">'+contents+'</section>';
}
function rerender(container){if(!container||!container.parentNode)return;const chapter=Number(container.dataset.demoChapter);container.outerHTML=renderForChapter(chapter)}
function handleClick(event){
 const button=event.target&&event.target.closest?event.target.closest("[data-demo-action]"):null;
 if(!button)return;
 const container=button.closest("[data-interactive-demos]");if(!container)return;
 const action=button.dataset.demoAction;
 if(action==="path-layer")state.path.layer=button.dataset.layer==="power"?"power":"data";
 else if(action==="path-cut")state.path.cut=!state.path.cut;
 else if(action==="path-reset"){state.path.layer="data";state.path.cut=false}
 else if(action==="poe-add")state.poe.cameras=Math.min(64,state.poe.cameras+1);
 else if(action==="poe-remove")state.poe.cameras=Math.max(1,state.poe.cameras-1);
 else if(action==="tree-choice"){
  const result=evaluateTreeChoice(state.tree.step,button.dataset.value);
  state.tree.lastFeedback=result;
  if(result.terminal)state.tree.terminal=result;
  else if(Number.isInteger(result.nextStep))state.tree.step=result.nextStep;
 }
 else if(action==="tree-reset")state.tree={step:0,answers:{},terminal:null,lastFeedback:null};
 else if(action==="tree-back"){state.tree.step=Math.max(0,state.tree.step-1);state.tree.terminal=null;state.tree.lastFeedback=null}
 else return;
 event.preventDefault();rerender(container);
}
function handleChange(event){
 const input=event.target;if(!input||!input.dataset||!input.dataset.poeInput)return;
 const key=input.dataset.poeInput,value=Number(input.value);
 if(!Number.isFinite(value)||value<=0)return;
 if(key==="watts")state.poe.watts=Math.min(100,value);
 if(key==="budget")state.poe.budget=Math.min(2000,value);
 const container=input.closest("[data-interactive-demos]");if(container)rerender(container);
}
if(doc){doc.addEventListener("click",handleClick);doc.addEventListener("change",handleChange)}
root.CCTVInteractiveDemos={renderForChapter,evaluatePoe,evaluateTreeChoice,treeSteps,getState:()=>JSON.parse(JSON.stringify(state))};
})(typeof window!=="undefined"?window:null);
