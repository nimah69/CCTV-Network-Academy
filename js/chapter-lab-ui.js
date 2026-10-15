/* رابط کاربری آزمایشگاه‌های عملی فصل‌ها؛ پیشرفت در localStorage برنامه ذخیره می‌شود. */

var chapterLabTests=[
 {id:"link",label:"لینک و کابل",icon:"↔",keys:["کابل","لینک","سوئیچ","پورت","uplink","فیبر","ethernet","متصل","قطع","طول مسیر"]},
 {id:"address",label:"IP و VLAN",icon:"⌘",keys:["ip","آدرس","vlan","شبکه","gateway","دروازه","dhcp","ping","arp","زیرشبکه","روتر"]},
 {id:"power",label:"توان و PoE",icon:"ϟ",keys:["poe","توان","برق","تغذیه","ریست","خاموش","ir","ups","وات","افت مسیر"]},
 {id:"video",label:"جریان و کیفیت تصویر",icon:"▣",keys:["تصویر","ویدئو","stream","کدک","h.264","h.265","لنز","چهره","نور","wdr","hlc","fps","bitrate","نرخ بیت"]},
 {id:"record",label:"ضبط، زمان و دیسک",icon:"◷",keys:["nvr","dvr","ضبط","بازپخش","هارد","hdd","ذخیره","زمان","ntp","آرشیو","raid","روز نگهداری"]}
];
function chapterLabDiagnosticHTML(s,key,diagnostics){
 var text=(s.title+" "+s.context+" "+s.why+" "+s.clue+" "+s.nodes.join(" ")+" "+s.options.join(" ")).toLowerCase();
 var rows=chapterLabTests.map(function(test){
  var prior=diagnostics[test.id]||{},relevant=test.keys.some(function(k){return text.indexOf(k.toLowerCase())!==-1});
  var status=prior.tested?(prior.fault?"<b class='diag-bad'>خرابی شبیه‌سازی‌شده پیدا شد</b>":"<b class='diag-good'>آزمون بدون خرابی شبیه‌سازی‌شده</b>"):"<span class='diag-pending'>آزمون اجرا نشده</span>";
  return '<div class="diag-row"><div class="diag-info"><b>'+test.icon+' '+test.label+'</b><small>'+(relevant?"به موضوع این سناریو مرتبط است":"آزمون کمکی؛ ارتباط مستقیم آن در این سناریو تأیید نشده")+'</small><span>'+status+'</span></div><div class="diag-actions"><button type="button" class="diag-btn '+(prior.fault?"diag-selected":"")+'" onclick="setChapterLabFault(\''+test.id+'\',true)" aria-pressed="'+String(!!prior.fault)+'">ایجاد خرابی</button><button type="button" class="diag-btn" onclick="runChapterLabDiagnostic(\''+test.id+'\')">اجرای آزمون</button><button type="button" class="diag-btn diag-clear" onclick="setChapterLabFault(\''+test.id+'\',false)">رفع خرابی</button></div></div>';
 }).join("");
 var count=chapterLabTests.filter(function(t){return diagnostics[t.id]&&diagnostics[t.id].tested}).length;
 return '<section class="lab-simulator"><div class="lab-sim-head"><div><span class="lab-sim-kicker">FAULT INJECTION · شبیه‌ساز</span><h3>آزمایشگاه عیب‌یابی مرحله‌ای</h3><p>خرابی فرضی بساز، آزمون مرتبط را اجرا کن و تغییر وضعیت را ببین.</p></div><span class="lab-sim-count">'+count+' از ۵ آزمون</span></div><div class="lab-diag-list">'+rows+'</div><div class="lab-sim-foot" aria-live="polite">این نتایج کاملاً شبیه‌سازی‌شده‌اند؛ هیچ داده‌ای از تجهیزات واقعی خوانده نمی‌شود. برای سناریوهای کم‌ارتباط، نتیجه فقط تمرین روش آزمون است.</div><button type="button" class="diag-reset-all" onclick="resetChapterLabDiagnostics()">پاک‌کردن همه خرابی‌ها و نتایج این سناریو</button></section>';
}
function chapterLabHTML(){
 var chapter=state.chapter, bank=window.CCTVChapterLabs||[], scenarios=bank[chapter]||[], c=chapters[chapter];
 if(scenarios.length!==5)return '<section class="panel"><h2>آزمایشگاه این فصل</h2><p>سناریوها بارگذاری نشدند؛ صفحه را تازه‌سازی کن.</p><button class="secondary" onclick="go(\'lesson\','+chapter+')">بازگشت به درس</button></section>';
 var idx=Math.max(0,Math.min(4,state.labScenario||0)),s=scenarios[idx],key=chapter+":"+idx,saved=state.progress.labs[key]||null,answered=!!(saved&&saved.checked),chosen=state.labDraft!==null?state.labDraft:(saved?saved.answer:null),diagnostics=saved&&saved.diagnostics||{};
 var completed=scenarios.filter(function(item,i){var r=state.progress.labs[chapter+":"+i];return r&&r.checked&&r.correct}).length;
 var path=s.nodes.map(function(n,i){return '<div class="lab-node '+(answered&&saved.correct?'node-done':'')+'"><span>'+(i+1).toLocaleString('fa-IR')+'</span><b>'+esc(n)+'</b></div>'}).join('<span class="lab-path-arrow" aria-hidden="true">←</span>');
 var tabs=scenarios.map(function(item,i){var result=state.progress.labs[chapter+":"+i];return '<button class="lab-scenario-tab '+(i===idx?'active':'')+'" onclick="openChapterLabScenario('+i+')" aria-current="'+(i===idx?'step':'false')+'"><span class="lab-tab-number">'+(i+1).toLocaleString('fa-IR')+'</span><span><b>'+esc(item.title)+'</b><small>'+(result&&result.checked?(result.correct?'✓ حل صحیح':'پاسخ ثبت‌شده'):'در انتظار اجرا')+'</small></span></button>'}).join('');
 var opts=s.options.map(function(o,i){return '<label class="lab-option '+(answered&&i===s.answer?'correct-option':'')+'"><input type="radio" name="chapterLabAnswer" value="'+i+'" '+(String(chosen)===String(i)?'checked':'')+' onchange="selectChapterLabAnswer(this.value)" '+(answered?'disabled':'')+'><span>'+esc(o)+'</span></label>'}).join('');
 var feedback=answered?'<section class="lab-feedback '+(saved.correct?'feedback-correct':'feedback-incorrect')+'" aria-live="polite"><h3>'+(saved.correct?'✓ تصمیم درست':'↻ این انتخاب بهترین قدم نبود')+'</h3><p><b>تحلیل فنی:</b> '+esc(s.why)+'</p><p><b>سرنخ آموزشی:</b> '+esc(s.clue)+'</p><p>'+(saved.correct?'این سناریو به‌درستی حل شده و پیشرفت آن ذخیره شد.':'پاسخ ثبت شد؛ می‌توانی دوباره تلاش کنی تا روش درست را تمرین کنی.')+'</p></section>':'<p class="lab-hint"><b>راهنمای کار:</b> پاسخ را بر اساس شواهد و آزمون قابل تکرار انتخاب کن؛ از تعویض بی‌دلیل تجهیزات پرهیز کن.</p>';
 return '<div class="crumb"><button class="secondary" onclick="go(\'lesson\','+chapter+')">بازگشت به درس</button>　/　آزمایشگاه فصل '+(chapter+1).toLocaleString('fa-IR')+'</div>'+
 '<section class="chapter-lab-hero"><div class="lab-launch-kicker">INTERACTIVE FIELD LAB · فصل '+(chapter+1).toLocaleString('fa-IR')+'</div><h1>آزمایشگاه عملی: '+esc(c.title)+'</h1><p>در هر مأموریت، مثل یک تکنسین عمل کن: نشانه را تحلیل کن، آزمون مناسب را انتخاب کن، نتیجه را ببین و دلیل تصمیم را یاد بگیر.</p><div class="lab-progress-row"><b>'+completed.toLocaleString('fa-IR')+' از ۵ سناریو حل‌شده</b><div class="lab-progress"><i style="width:'+(completed*20)+'%"></i></div></div></section>'+
 '<div class="lab-scenario-layout"><aside class="lab-scenario-rail"><h2>مأموریت‌های فصل</h2><p>برای تمرین دوباره هر سناریو آن را انتخاب کن.</p>'+tabs+'</aside>'+
 '<article class="lab-scenario-main"><div class="lab-scenario-meta"><span class="lab-chip">سناریو '+(idx+1).toLocaleString('fa-IR')+' از ۵</span><span class="lab-chip">فصل: '+esc(c.title)+'</span></div><h2>'+esc(s.title)+'</h2><p class="lab-context">'+esc(s.context)+'</p>'+
 '<section class="lab-schematic-card"><div class="lab-schematic-heading"><div><b>شماتیک مسیر بررسی</b><p>اجزای اصلی مسیر را از چپ به راست دنبال کن.</p></div><span class="lab-live-dot"></span></div><div class="lab-schematic-path">'+path+'</div><p class="lab-schematic-foot">نمای آموزشی مفهومی؛ نتیجه‌ها با تجهیزات واقعی اندازه‌گیری نشده‌اند.</p></section>'+chapterLabDiagnosticHTML(s,key,diagnostics)+
 '<fieldset class="lab-options" '+(answered?'disabled':'')+'><legend>کدام آزمون یا اقدام، قدم بعدی مناسب‌تری است؟</legend>'+opts+'</fieldset>'+
 '<div class="lab-action-row">'+(answered?'<button class="primary" onclick="retryChapterLabScenario('+idx+')">تلاش دوباره</button>':'<button class="primary" onclick="runChapterLabScenario()">اجرای آزمون و مشاهده نتیجه</button>')+'<button class="secondary" onclick="openChapterLabScenario('+((idx+1)%5)+')">'+(idx===4?'بازگشت به سناریو ۱':'سناریوی بعدی')+' ←</button></div>'+feedback+
 '<div class="lab-bottom-actions"><button class="secondary" onclick="go(\'chapterQuiz\','+chapter+')">رفتن به آزمون چهارگزینه‌ای فصل</button><button class="secondary" onclick="go(\'lesson\','+chapter+')">بازگشت به توضیحات فصل</button></div></article></div>';
}
function openChapterLabScenario(index){state.labScenario=Math.max(0,Math.min(4,Number(index)||0));state.labDraft=null;render();window.scrollTo({top:0,behavior:"smooth"})}
function selectChapterLabAnswer(value){state.labDraft=Number(value)}
function runChapterLabScenario(){if(!Number.isInteger(state.labDraft)||state.labDraft<0||state.labDraft>2){alert("ابتدا یکی از گزینه‌ها را انتخاب کن.");return}var chapter=state.chapter,idx=state.labScenario,s=window.CCTVChapterLabs[chapter][idx],correct=state.labDraft===s.answer,key=chapter+":"+idx,old=state.progress.labs[key];state.progress.labs[key]={answer:state.labDraft,checked:true,correct:correct,attempts:(old&&old.attempts||0)+1,at:new Date().toISOString()};if(correct){var count=window.CCTVChapterLabs[chapter].filter(function(item,i){return (state.progress.labs[chapter+":"+i]&&state.progress.labs[chapter+":"+i].correct)||i===idx}).length;if(count===5&&!state.progress.done.includes(chapter))state.progress.done.push(chapter)}saveProgress();state.labDraft=null;render()}
function retryChapterLabScenario(index){var key=state.chapter+":"+index;delete state.progress.labs[key];saveProgress();state.labScenario=index;state.labDraft=null;render()}

function chapterLabStoreDiagnostic(mutator){
 var chapter=state.chapter,idx=state.labScenario,key=chapter+":"+idx,old=state.progress.labs[key]||{answer:null,checked:false,correct:false,attempts:0};
 old.diagnostics=old.diagnostics||{};mutator(old.diagnostics);state.progress.labs[key]=old;saveProgress();render();
}
function setChapterLabFault(id,active){
 var test=chapterLabTests.find(function(t){return t.id===id});if(!test)return;
 chapterLabStoreDiagnostic(function(diag){var old=diag[id]||{tested:false,fault:false};old.fault=!!active;old.tested=false;old.message=active?"خرابی فرضی فعال شد؛ برای مشاهده نتیجه آزمون را اجرا کن.":"خرابی فرضی رفع شد؛ برای تأیید، آزمون را دوباره اجرا کن.";diag[id]=old});
}
function runChapterLabDiagnostic(id){
 var test=chapterLabTests.find(function(t){return t.id===id});if(!test)return;
 chapterLabStoreDiagnostic(function(diag){var old=diag[id]||{fault:false};old.tested=true;old.at=new Date().toISOString();old.message=old.fault?"آزمون، خرابی تزریق‌شده در شبیه‌ساز را تشخیص داد.":"آزمون در مدل فعلی نشانه خرابی تزریق‌شده پیدا نکرد.";diag[id]=old});
}
function resetChapterLabDiagnostics(){
 chapterLabStoreDiagnostic(function(diag){Object.keys(diag).forEach(function(k){delete diag[k]})});
}
