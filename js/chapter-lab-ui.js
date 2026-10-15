/* رابط کاربری آزمایشگاه‌های عملی فصل‌ها؛ پیشرفت در localStorage برنامه ذخیره می‌شود. */

var chapterLabTests=[
 {id:"link",label:"کابل و اتصال فیزیکی",icon:"↔",keys:["کابل","لینک","سوئیچ","پورت","uplink","فیبر","ethernet","متصل","قطع","طول مسیر"]},
 {id:"address",label:"آدرس‌دهی شبکه",icon:"⌘",keys:["ip","آدرس","vlan","شبکه","gateway","دروازه","dhcp","ping","arp","زیرشبکه","روتر"]},
 {id:"power",label:"برق و توان دوربین",icon:"ϟ",keys:["poe","توان","برق","تغذیه","ریست","خاموش","ir","ups","وات","افت مسیر"]},
 {id:"video",label:"خود تصویر و کیفیت آن",icon:"▣",keys:["تصویر","ویدئو","stream","کدک","h.264","h.265","لنز","چهره","نور","wdr","hlc","fps","bitrate","نرخ بیت"]},
 {id:"record",label:"ضبط، ساعت و هارد",icon:"◷",keys:["nvr","dvr","ضبط","بازپخش","هارد","hdd","ذخیره","زمان","ntp","آرشیو","raid","روز نگهداری"]}
];

function labNodeDiagnosticClass(node,diagnostics){
 var n=String(node).toLowerCase(),category=null;
 if(["سوئیچ","کابل","فیبر","uplink","پورت","لینک","ethernet"].some(function(k){return n.indexOf(k)!==-1}))category="link";
 else if(["ip","vlan","شبکه","روتر","gateway","dhcp","آدرس"].some(function(k){return n.indexOf(k)!==-1}))category="address";
 else if(["poe","برق","توان","تغذیه","ups","ir"].some(function(k){return n.indexOf(k)!==-1}))category="power";
 else if(["تصویر","ویدئو","stream","لنز","wdr","hlc","کدک","دوربین"].some(function(k){return n.indexOf(k)!==-1}))category="video";
 else if(["nvr","dvr","هارد","hdd","ضبط","بازپخش","زمان","ntp","آرشیو","raid"].some(function(k){return n.indexOf(k)!==-1}))category="record";
 var d=category&&diagnostics[category];return d?(d.fault?" node-fault":d.tested?" node-checked":""):"";
}
function chapterLabDiagnosticHTML(s,key,diagnostics){
 var styles='<style>.lab-node.node-fault{border-color:#f17887!important;background:#4a2631!important;color:#ffe1e5!important;box-shadow:0 0 0 2px #f1788733}.lab-node.node-checked{border-color:#42c8a6!important;background:#103d3b!important;color:#baf8e8!important}.lab-simulator{margin:16px 0 20px;padding:clamp(12px,2vw,18px);border:1px solid #28536b;border-radius:16px;background:linear-gradient(145deg,#0b1a2a,#10263a);color:#e7f2ff;min-width:0}.lab-sim-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}.lab-sim-kicker{font-size:9px;letter-spacing:.08em;color:#5fe1d5;font-weight:900}.lab-sim-head h3{font-size:16px;margin:4px 0;color:#f0f8ff}.lab-sim-head p{font-size:11px;color:#a9c2d8;margin:0}.lab-sim-count{font-size:10px;color:#8ce9df;border:1px solid #28566b;background:#0b2535;border-radius:9px;padding:6px 8px;white-space:nowrap}.lab-diag-list{display:grid;gap:8px;margin-top:14px}.diag-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px;border:1px solid #29475f;border-radius:12px;background:#0a1a2a;min-width:0}.diag-info{display:grid;gap:3px;min-width:0}.diag-info>b{font-size:12px;color:#e5f4ff}.diag-info small{font-size:10px;color:#91abc2;line-height:1.7}.diag-info span{font-size:10px;overflow-wrap:anywhere}.diag-good{color:#6de2b6}.diag-bad{color:#ff9aa7}.diag-pending{color:#a3b5c9}.diag-actions{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}.diag-btn,.diag-reset-all{min-height:35px;border:1px solid #315570;border-radius:8px;background:#132b40;color:#dcecff;padding:6px 9px;font:inherit;font-size:10px;font-weight:700}.diag-btn:hover,.diag-btn:focus-visible,.diag-reset-all:hover{border-color:#5bded4;background:#173a4c}.diag-btn.diag-selected{background:#63343b;border-color:#e98591;color:#ffe5e8}.diag-clear{color:#b9c9d9}.lab-sim-foot{font-size:10px;line-height:1.9;color:#9db6ca;background:#0b1d2c;border-right:3px solid #2c9b9c;border-radius:7px;padding:9px 11px;margin:12px 0}.diag-reset-all{margin-top:9px}.lab-simulator button:focus-visible{outline:3px solid #66e6dc;outline-offset:2px}@media(max-width:540px){.diag-row{grid-template-columns:minmax(0,1fr)}.diag-actions{justify-content:stretch}.diag-btn{flex:1;min-width:80px}.lab-sim-head h3{font-size:14px}}</style>';
 var text=(s.title+" "+s.context+" "+s.why+" "+s.clue+" "+s.nodes.join(" ")+" "+s.options.join(" ")).toLowerCase();
 var rows=chapterLabTests.map(function(test){
  var prior=diagnostics[test.id]||{},relevant=test.keys.some(function(k){return text.indexOf(k.toLowerCase())!==-1});
  var status=prior.tested?(prior.fault?"<b class='diag-bad'>آزمون، مشکل فرضی را پیدا کرد</b>":"<b class='diag-good'>در این آزمون، مشکل فرضی فعالی پیدا نشد</b>"):"<span class='diag-pending'>هنوز آزمایش نشده</span>";
  return '<div class="diag-row"><div class="diag-info"><b>'+test.icon+' '+test.label+'</b><small>'+(relevant?"به موضوع این سناریو مرتبط است":"آزمون کمکی؛ ارتباط مستقیم آن در این سناریو تأیید نشده")+'</small><span>'+status+'</span></div><div class="diag-actions"><button type="button" class="diag-btn '+(prior.fault?"diag-selected":"")+'" onclick="setChapterLabFault(\''+test.id+'\',true)" aria-pressed="'+String(!!prior.fault)+'">ایجاد مشکل فرضی</button><button type="button" class="diag-btn" onclick="runChapterLabDiagnostic(\''+test.id+'\')">آزمایش کن</button><button type="button" class="diag-btn diag-clear" onclick="setChapterLabFault(\''+test.id+'\',false)">برطرف کن</button></div></div>';
 }).join("");
 var count=chapterLabTests.filter(function(t){return diagnostics[t.id]&&diagnostics[t.id].tested}).length;
 return styles+'<section class="lab-simulator"><div class="lab-sim-head"><div><span class="lab-sim-kicker">شبیه‌ساز تمرینی</span><h3>یک خرابی فرضی ایجاد کن و راه تشخیصش را یاد بگیر</h3><p>این بخش مثل یک میز تمرین است؛ چیزی را روی دوربین واقعی قطع یا تغییر نمی‌دهد.</p></div><span class="lab-sim-count">'+count+' از ۵ آزمون</span></div><div class="lab-diag-list">'+rows+'</div><div class="lab-sim-foot" aria-live="polite">نتیجه‌ها ساختگی و آموزشی‌اند؛ برنامه به دوربین، سوئیچ یا NVR واقعی وصل نیست. نتیجه فقط وضعیت داخل همین تمرین را نشان می‌دهد.</div><button type="button" class="diag-reset-all" onclick="resetChapterLabDiagnostics()">شروع دوباره آزمایش‌های این سناریو</button></section>';
}
function chapterLabChoiceHint(option,scenario,index){
 var t=String(option||"").toLowerCase();
 if(index===scenario.answer)return "این گزینه با نشانه‌های سناریو ارتباط دارد. "+scenario.why+" نتیجه بررسی را ثبت کن.";
 if(/فوراً|فورا|تعویض|بخر|عوض کن|جایگزین/.test(t))return "تعویض بدون پیدا کردن علت ممکن است هزینه ایجاد کند و مشکل اصلی را پنهان نگه دارد.";
 if(/رزولوشن|مگاپیکسل|لنز/.test(t))return "این گزینه بیشتر به وضوح یا شکل تصویر مربوط است؛ اگر نشانه درباره اتصال یا برق باشد، آن را بررسی نمی‌کند.";
 if(/هارد|دیسک|raid|فرمت/.test(t))return "این گزینه به ذخیره‌سازی مربوط است؛ به‌تنهایی مشکل اتصال، آدرس‌دهی یا برق دوربین را حل نمی‌کند.";
 if(/dns/.test(t))return "DNS نام دستگاه یا دامنه را به نشانی IP تبدیل می‌کند؛ خرابی کابل، برق یا کیفیت تصویر را برطرف نمی‌کند.";
 if(/bitrate|نرخ بیت|fps|فریم/.test(t))return "این تنظیم بر حجم یا روانی ویدئو اثر دارد؛ فقط وقتی نشانه به کیفیت، ترافیک یا ذخیره‌سازی مربوط است آن را بررسی کن.";
 if(/ip|vlan|شبکه|gateway|زیرشبکه|آدرس/.test(t))return "این گزینه درباره ارتباط شبکه‌ای است؛ نتیجه را با نشانی واقعی، ماسک شبکه و مسیر ارتباط مقایسه کن.";
 if(/poe|توان|برق|تغذیه|وات|ups/.test(t))return "این گزینه به برق‌رسانی مربوط است؛ مشخصات منبع، مصرف واقعی و محدودیت هر پورت را بررسی کن.";
 if(/رمز|دسترسی|پورت|امنیت|اینترنت|vpn/.test(t))return "این گزینه به دسترسی یا امنیت مربوط است؛ فقط دسترسی‌های لازم را نگه دار و تغییر را ثبت و دوباره آزمایش کن.";
 if(/کابل|سوئیچ|لینک|فیبر|پچ/.test(t))return "این گزینه مسیر فیزیکی ارتباط را بررسی می‌کند؛ دو سر کابل، چراغ لینک و خطاهای پورت را جداگانه بسنج.";
 if(/فقط|همه|هیچ|بدون آزمون|فرض کن/.test(t))return "این کار نتیجه قابل‌اندازه‌گیری به دست نمی‌دهد یا چند عامل را هم‌زمان تغییر می‌دهد؛ تشخیص علت سخت‌تر می‌شود.";
 return "از خودت بپرس: آیا این کار مستقیماً همان نشانه‌ای را بررسی می‌کند که در شرح سناریو دیده‌ای؟";
}
function chapterLabTermGuideHTML(s){
 var terms=[["IP","نشانی عددی هر دستگاه در شبکه"],["VLAN","جداکردن منطقی گروهی از دستگاه‌ها در یک شبکه"],["Ping","آزمون ساده برای دیدن اینکه یک نشانی شبکه پاسخ می‌دهد یا نه"],["DHCP","سرویسی که می‌تواند نشانی شبکه را خودکار به دستگاه بدهد"],["DNS","سرویسی که نام دستگاه یا دامنه را به نشانی IP تبدیل می‌کند"],["Gateway","مسیر خروج دستگاه از شبکه محلی به شبکه‌های دیگر"],["ARP","جدولی که ارتباط نشانی IP با نشانی سخت‌افزاری دستگاه را نشان می‌دهد"],["PoE","برق‌رسانی به دوربین از همان کابل شبکه، در صورت سازگاری تجهیزات"],["IR","نور مادون قرمز برای دیدن تصویر در تاریکی"],["WDR","قابلیتی برای بهتر دیدن صحنه‌ای که بخش‌هایی خیلی روشن و بخش‌هایی تاریک دارد"],["HLC","قابلیتی برای کنترل اثر منبع نور شدید مثل چراغ خودرو"],["Bitrate","مقدار داده ویدئو در هر ثانیه؛ بر شبکه و فضای ضبط اثر می‌گذارد"],["FPS","تعداد فریم‌های تصویر در هر ثانیه"],["H.264","روش فشرده‌سازی ویدئو"],["H.265","روش فشرده‌سازی ویدئو که ممکن است با بعضی دستگاه‌های قدیمی سازگار نباشد"],["NVR","دستگاه ضبط تصویر دوربین‌های تحت شبکه"],["DVR","دستگاه ضبط دوربین‌های آنالوگ یا سازگار"],["HDD","هاردی که فیلم‌ها روی آن ذخیره می‌شوند"],["RAID","روش چیدمان چند دیسک برای تحمل برخی خرابی‌ها؛ جای نسخه پشتیبان را نمی‌گیرد"],["NTP","سرویسی برای هماهنگ نگه‌داشتن ساعت دستگاه‌ها"],["Uplink","اتصال اصلی سوئیچ به سوئیچ یا شبکه بالادستی"],["RPO","میزان داده‌ای که از دست‌رفتنش از نظر زمانی قابل‌قبول است"],["RTO","زمان هدف برای برگرداندن سرویس پس از خرابی"],["ACL","قانونی که مشخص می‌کند چه دستگاهی اجازه ارتباط با چه مقصدی را دارد"],["VPN","راه ارتباطی رمزگذاری‌شده برای دسترسی کنترل‌شده از راه دور"]];
 var text=[s.title,s.context,s.why,s.clue].concat(s.nodes||[],s.options||[]).join(" ").toLowerCase();
 var found=terms.filter(function(pair){return text.indexOf(pair[0].toLowerCase())!==-1});
 if(!found.length)return "";
 return '<details class="lab-term-guide"><summary>معنی اصطلاحات این سناریو به زبان ساده ('+found.length+')</summary><div>'+found.map(function(pair){return '<p><b>'+esc(pair[0])+' یعنی:</b> '+esc(pair[1])+'</p>'}).join("")+'</div></details>';
}
function chapterLabHTML(){
 var chapter=state.chapter, bank=window.CCTVChapterLabs||[], scenarios=bank[chapter]||[], c=chapters[chapter];
 if(scenarios.length!==5)return '<section class="panel"><h2>آزمایشگاه این فصل</h2><p>سناریوها بارگذاری نشدند؛ صفحه را تازه‌سازی کن.</p><button class="secondary" onclick="go(\'lesson\','+chapter+')">بازگشت به درس</button></section>';
 var idx=Math.max(0,Math.min(4,state.labScenario||0)),s=scenarios[idx],key=chapter+":"+idx,saved=state.progress.labs[key]||null,answered=!!(saved&&saved.checked),chosen=state.labDraft!==null?state.labDraft:(saved?saved.answer:null),diagnostics=saved&&saved.diagnostics||{};
 var completed=scenarios.filter(function(item,i){var r=state.progress.labs[chapter+":"+i];return r&&r.checked&&r.correct}).length;
 var path=s.nodes.map(function(n,i){return '<div class="lab-node '+(answered&&saved.correct?'node-done':'')+labNodeDiagnosticClass(n,diagnostics)+'"><span>'+(i+1).toLocaleString('fa-IR')+'</span><b>'+esc(n)+'</b></div>'}).join('<span class="lab-path-arrow" aria-hidden="true">←</span>');
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
