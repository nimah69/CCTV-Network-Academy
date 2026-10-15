/* رابط کاربری ساده‌شده آزمایشگاه فصل‌ها: تمرین مرحله‌به‌مرحله، بدون خرابی‌سازی مبهم. */
function chapterLabEsc(value){
 return String(value==null?"":value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function chapterLabAdvice(node){
 var n=String(node||"").toLowerCase();
 if(/کابل|سوئیچ|فیبر|پورت|uplink|ethernet|لینک/.test(n))return {
  title:"اتصال فیزیکی را بررسی کن",
  steps:["چراغ پورت دو سر اتصال را ببین؛ خاموش بودن آن می‌تواند نشانه مشکل کابل یا پورت باشد.","سوکت و کابل را بررسی کن؛ در صورت امکان فقط با یک کابل سالمِ آزمایشی مقایسه کن.","هر بار فقط یک مورد را تغییر بده و نتیجه را یادداشت کن."]
 };
 if(/ip|vlan|gateway|شبکه|dhcp|رایانه|روتر|آدرس|mac/.test(n))return {
  title:"آدرس و ارتباط شبکه را بررسی کن",
  steps:["آدرس IP دوربین و رایانه آزمایش را یادداشت کن.","ماسک شبکه و VLAN را بررسی کن؛ دستگاه‌ها باید طبق طرح شبکه امکان ارتباط داشته باشند.","اگر از ping استفاده می‌کنی، بدان که پاسخ آن فقط دسترسی شبکه را می‌سنجد، نه سلامت تصویر و ضبط را."]
 };
 if(/poe|برق|توان|ups|ir|تغذیه|ریست/.test(n))return {
  title:"برق و توان را بررسی کن",
  steps:["چراغ‌های دستگاه و وضعیت توان پورت را ببین.","توان مصرفی دوربین‌ها را با بودجه واقعی PoE سوئیچ مقایسه کن.","اگر مشکل شب‌ها یا با روشن‌شدن IR رخ می‌دهد، توان و افت مسیر را در همان شرایط بررسی کن."]
 };
 if(/nvr|dvr|هارد|ضبط|بازپخش|زمان|ntp|آرشیو|raid|hdd/.test(n))return {
  title:"ضبط و بازپخش را بررسی کن",
  steps:["وضعیت هارد و برنامه ضبط را در دستگاه ببین.","یک زمان مشخص را انتخاب کن و بازپخش همان زمان را آزمایش کن.","ساعت و منطقه زمانی دوربین و دستگاه ضبط را مقایسه کن."]
 };
 if(/تصویر|ویدئو|stream|لنز|دوربین|نمایش|کدک|h\.26/.test(n))return {
  title:"خود تصویر را بررسی کن",
  steps:["مشخص کن مشکل تصویر زنده است، کیفیت تصویر است یا بازپخش.","تنظیمات جریان تصویر، حساب دسترسی و سازگاری دوربین با دستگاه را بررسی کن.","اگر تصویر زنده هست ولی ضبط نیست، مسیر ضبط و هارد را جداگانه آزمایش کن."]
 };
 return {
  title:"این بخش را مرحله‌به‌مرحله بررسی کن",
  steps:["به وضعیت چراغ‌ها یا پیام خطا نگاه کن و نتیجه را دقیق ثبت کن.","اتصال و تنظیم مرتبط با این بخش را بررسی کن.","قبل از تعویض قطعه، نتیجه را با یک آزمون ساده و قابل تکرار تأیید کن."]
 };
}
function chapterLabGlossary(s){
 var text=[s.title,s.context,s.why,s.clue].concat(s.nodes||[],s.options||[]).join(" ").toLowerCase();
 var terms=[
  ["IP","نشانی هر دستگاه در شبکه"],["PoE","برق‌رسانی به دوربین از راه کابل شبکه، در صورت سازگاری تجهیزات"],["NVR","دستگاه ضبط دوربین‌های تحت شبکه"],["DVR","دستگاه ضبط برخی دوربین‌های آنالوگ"],["ping","آزمونی ساده برای بررسی پاسخ‌گویی یک دستگاه در شبکه"],["VLAN","جداکردن منطقی بخش‌های شبکه"],["DHCP","سرویسی که به دستگاه‌ها آدرس شبکه می‌دهد"],["Gateway","دروازه ارتباط با شبکه‌های دیگر"],["Bitrate","مقدار داده ویدئو در هر ثانیه"],["H.265","روش فشرده‌سازی ویدئو؛ باید با دستگاه‌های دو طرف سازگار باشد"],["H.264","یکی از روش‌های رایج فشرده‌سازی ویدئو"],["IR","نور مادون‌قرمز برای دید در تاریکی"],["WDR","قابلیتی برای بهتر دیدن صحنه‌هایی با اختلاف شدید روشنایی"],["NTP","سرویس هماهنگ‌کردن ساعت دستگاه‌ها"],["RAID","چیدمان چند دیسک برای تحمل بعضی خرابی‌ها؛ جای نسخه پشتیبان نیست"],["HDD","هاردی که فیلم‌ها روی آن ذخیره می‌شوند"],["Uplink","اتصال اصلی یک سوئیچ به شبکه بالادستی"],["SFP","درگاه ماژول شبکه؛ در برخی اتصال‌های فیبر استفاده می‌شود"],["VPN","راه ارتباطی رمزگذاری‌شده برای دسترسی از راه دور"],["MAC","شناسه سخت‌افزاری رابط شبکه"],["DNS","سرویسی برای تبدیل نام به آدرس شبکه"],["Playback","بازپخش فیلم ضبط‌شده"],["UPS","برق پشتیبان هنگام قطع برق"],["Stream","جریان زنده داده ویدئویی"]
 ];
 var found=terms.filter(function(pair){return text.indexOf(pair[0].toLowerCase())!==-1;}).slice(0,5);
 if(!found.length)return "";
 return '<details class="cl-glossary"><summary>معنی چند اصطلاح این تمرین</summary><div>'+found.map(function(pair){return '<p><b>'+chapterLabEsc(pair[0])+' یعنی:</b> '+chapterLabEsc(pair[1])+'</p>';}).join("")+'</div></details>';
}
function chapterLabSimulatorHTML(s,idx){
 var selected=Number.isInteger(state.labSimNode)?Math.max(0,Math.min(s.nodes.length-1,state.labSimNode)):0;
 var outcome=state.labSimOutcome||"";
 var node=s.nodes[selected]||"بخش انتخاب‌شده";
 var advice=chapterLabAdvice(node);
 var nodes=s.nodes.map(function(item,i){
  return '<button type="button" class="cl-node '+(i===selected?'is-selected':'')+'" onclick="selectLabSimulatorNode('+i+')" aria-pressed="'+(i===selected?'true':'false')+'"><span>'+(i+1).toLocaleString("fa-IR")+'</span><b>'+chapterLabEsc(item)+'</b><small>'+(i===selected?'در حال بررسی':'برای بررسی بزن')+'</small></button>';
 }).join('<span class="cl-arrow" aria-hidden="true">←</span>');
 var result="";
 if(outcome==="fault")result='<div class="cl-result cl-result-problem" role="status"><b>در این تمرین، مشکل در این بخش پیدا شد.</b><p>نتیجه را ثبت کن؛ فقط همان اتصال یا تنظیم مرتبط را اصلاح کن و بعد همان آزمون را تکرار کن. هنوز لازم نیست قطعه‌ای را تعویض کنی.</p></div>';
 else if(outcome==="ok")result='<div class="cl-result cl-result-ok" role="status"><b>در این تمرین، این بخش سالم فرض شد.</b><p>پس علت را در این نقطه تأیید نکرده‌ایم. به بخش بعدی مسیر برو و آزمون را آنجا تکرار کن.</p>'+(selected<s.nodes.length-1?'<button type="button" class="cl-btn cl-btn-primary" onclick="selectLabSimulatorNode('+(selected+1)+')">بررسی بخش بعدی ←</button>':'<p>به ابتدای مسیر برگرد و فرضیه‌های دیگر را بررسی کن.</p>')+'</div>';
 return '<section class="cl-simulator" aria-labelledby="cl-simulator-title"><div class="cl-sim-head"><div><span class="cl-kicker">تمرین عملی ساده</span><h3 id="cl-simulator-title">میز بررسی عیب‌یابی</h3><p>روی یکی از بخش‌های مسیر بزن، چک‌لیستش را بخوان و نتیجه فرضی را ثبت کن.</p></div><span class="cl-sim-badge">مرحله '+(selected+1).toLocaleString("fa-IR")+' از '+s.nodes.length.toLocaleString("fa-IR")+'</span></div><div class="cl-route" aria-label="مسیر تجهیزات">'+nodes+'</div><div class="cl-inspection"><div><span class="cl-kicker">بخش انتخاب‌شده</span><h4>'+chapterLabEsc(node)+'</h4><b>'+chapterLabEsc(advice.title)+'</b></div><ol>'+advice.steps.map(function(step){return '<li>'+chapterLabEsc(step)+'</li>';}).join("")+'</ol><p class="cl-honesty">این یک تمرین آموزشی فرضی است؛ سایت به دوربین، سوئیچ یا NVR واقعی وصل نیست و نتیجه واقعی دستگاه را اندازه نمی‌گیرد.</p><div class="cl-outcome-actions"><button type="button" class="cl-btn cl-btn-danger" onclick="setLabSimulatorOutcome(\'fault\')">در این بخش مشکل پیدا کردم</button><button type="button" class="cl-btn cl-btn-success" onclick="setLabSimulatorOutcome(\'ok\')">این بخش سالم بود</button><button type="button" class="cl-btn" onclick="resetLabSimulator()">شروع دوباره</button></div>'+result+'</div></section>';
}
function chapterLabHTML(){
 var chapter=state.chapter,bank=window.CCTVChapterLabs||[],scenarios=bank[chapter]||[],c=(typeof chapters!=="undefined"&&chapters[chapter])||{title:"فصل "+(chapter+1)};
 if(scenarios.length!==5)return '<section class="panel"><h2>تمرین‌های این فصل</h2><p>تمرین‌ها بارگذاری نشدند؛ صفحه را تازه‌سازی کن.</p><button class="secondary" onclick="go(\'lesson\','+chapter+')">بازگشت به درس</button></section>';
 var idx=Math.max(0,Math.min(4,Number(state.labScenario)||0)),s=scenarios[idx],key=chapter+":"+idx,saved=state.progress.labs[key]||null,answered=!!(saved&&saved.checked),chosen=state.labDraft!==null&&state.labDraft!==undefined?state.labDraft:(saved?saved.answer:null);
 var completed=scenarios.filter(function(item,i){var r=state.progress.labs[chapter+":"+i];return r&&r.checked&&r.correct;}).length;
 var tabs=scenarios.map(function(item,i){var result=state.progress.labs[chapter+":"+i];return '<button type="button" class="cl-mission '+(i===idx?'is-active':'')+'" onclick="openChapterLabScenario('+i+')" aria-current="'+(i===idx?'step':'false')+'"><span class="cl-mission-number">'+(i+1).toLocaleString("fa-IR")+'</span><span><b>'+chapterLabEsc(item.title)+'</b><small>'+(result&&result.checked?(result.correct?'✓ حل شده':'پاسخ ثبت شده؛ دوباره تمرین کن'):'هنوز تمرین نشده')+'</small></span></button>';}).join("");
 var path=s.nodes.map(function(node,i){return '<span class="cl-path-chip"><b>'+(i+1).toLocaleString("fa-IR")+'</b>'+chapterLabEsc(node)+'</span>';}).join('<span class="cl-arrow" aria-hidden="true">←</span>');
 var options=s.options.map(function(option,i){return '<label class="cl-answer '+(String(chosen)===String(i)?'is-chosen':'')+'"><input type="radio" name="chapterLabAnswer" value="'+i+'" '+(String(chosen)===String(i)?'checked':'')+' '+(answered?'disabled':'')+' onchange="selectChapterLabAnswer(this.value)"><span><b>'+String.fromCharCode(65+i)+'.</b> '+chapterLabEsc(option)+'</span></label>';}).join("");
 var feedback="";
 if(answered){
  var selectedText=s.options[saved.answer]||"";
  feedback='<section class="cl-feedback '+(saved.correct?'is-correct':'is-incorrect')+'" aria-live="polite"><h3>'+(saved.correct?'✓ تصمیم مناسب':'↻ این بار بهترین قدم را انتخاب نکردی')+'</h3><p><b>پاسخ تو:</b> '+chapterLabEsc(selectedText)+'</p><p><b>چرا این مسیر مناسب است؟</b> '+chapterLabEsc(s.why)+'</p><p><b>قدم عملی بعدی:</b> '+chapterLabEsc(s.clue)+'</p>'+(saved.correct?'<p>این تمرین حل شد و پیشرفت آن ذخیره شد.</p>':'<p><b>پیشنهاد:</b> قبل از تلاش دوباره، مسیر بررسی را در شبیه‌ساز بالا دنبال کن و بعد پاسخ را عوض کن.</p>')+'</section>';
 }else{
  feedback='<p class="cl-hint"><b>روش کار:</b> اول مشکل را بفهم، در شبیه‌ساز یک بخش را بررسی کن، سپس گزینه‌ای را انتخاب کن که با یک آزمون ساده علت را محدود می‌کند. عجله نکن و قطعه را بی‌دلیل تعویض نکن.</p>';
 }
 return '<style>.cl-lab{color:var(--ink);margin:0 auto;max-width:1100px}.cl-hero{padding:22px;border:1px solid #28516b;border-radius:17px;background:linear-gradient(130deg,#0b1a2b,#12334b);color:#e7f2ff;margin:12px 0 18px}.cl-hero .cl-kicker,.cl-kicker{display:block;font-size:10px;color:#73e6df;font-weight:900}.cl-hero h1{font-size:clamp(21px,3vw,29px);margin:7px 0}.cl-hero p{font-size:13px;color:#c0d3e5;margin:0}.cl-progress-row{display:flex;align-items:center;gap:12px;margin-top:16px;font-size:12px}.cl-progress{height:7px;border-radius:99px;background:#263d55;overflow:hidden;flex:1}.cl-progress i{display:block;height:100%;background:#43d7c8}.cl-layout{display:grid;grid-template-columns:minmax(220px,.7fr) minmax(0,1.8fr);gap:14px;align-items:start}.cl-rail,.cl-main{min-width:0;border:1px solid var(--line);border-radius:15px;background:var(--panel);padding:15px}.cl-rail h2{font-size:15px;margin:0 0 4px}.cl-rail>p{font-size:11px;color:var(--muted);margin:0 0 12px}.cl-mission{display:flex;align-items:flex-start;gap:9px;width:100%;padding:10px;margin:7px 0;text-align:right;border:1px solid var(--line);border-radius:10px;background:transparent;color:var(--ink);min-height:56px}.cl-mission.is-active{border-color:#39c9d1;background:#103044}.cl-mission-number{display:grid;place-items:center;flex:0 0 29px;height:29px;border-radius:9px;background:#17364d;color:#8ee8e9;font-weight:bold}.cl-mission b,.cl-mission small{display:block}.cl-mission b{font-size:11px;line-height:1.7}.cl-mission small{font-size:10px;color:var(--muted);margin-top:3px}.cl-main h2{font-size:19px;line-height:1.7;margin:8px 0}.cl-meta{display:flex;flex-wrap:wrap;gap:6px}.cl-chip{font-size:10px;border:1px solid #31516a;background:#10273a;color:#9be9e8;border-radius:99px;padding:4px 8px}.cl-context{border-right:3px solid #3bbfc8;background:var(--bg);padding:12px 14px;border-radius:9px;font-size:13px;line-height:2}.cl-context b{display:block;margin-bottom:4px}.cl-glossary{border:1px solid var(--line);border-radius:10px;padding:9px 12px;margin:12px 0;background:var(--bg)}.cl-glossary summary{font-size:12px;font-weight:bold;cursor:pointer}.cl-glossary p{font-size:12px;line-height:1.8;margin:7px 0}.cl-glossary b{color:#75e2df}.cl-simulator{margin:15px 0;border:1px solid #2a5970;border-radius:14px;overflow:hidden;background:#0b1b2b;color:#e7f2ff}.cl-sim-head{padding:14px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.cl-sim-head h3{font-size:17px;margin:4px 0}.cl-sim-head p{font-size:11px;color:#adc4d9;margin:0}.cl-sim-badge{white-space:nowrap;font-size:10px;padding:5px 8px;border-radius:9px;background:#12384a;color:#8be9e2}.cl-route{display:flex;align-items:stretch;gap:6px;padding:10px 12px;overflow-x:auto;border-top:1px solid #233e54;border-bottom:1px solid #233e54}.cl-node{display:flex;flex-direction:column;align-items:flex-start;gap:3px;flex:0 0 116px;min-height:78px;text-align:right;padding:9px;border:1px solid #2d4b64;border-radius:10px;background:#10253a;color:#e5f3ff}.cl-node>span{font-size:10px;color:#77e3e0}.cl-node b{font-size:11px;line-height:1.6}.cl-node small{font-size:9px;color:#9eb5ca}.cl-node.is-selected{border-color:#4be0d0;background:#123d49;box-shadow:inset 0 -3px #4be0d0}.cl-arrow{display:flex;align-items:center;justify-content:center;flex:0 0 18px;color:#6ddad8}.cl-inspection{padding:14px}.cl-inspection h4{font-size:16px;margin:3px 0 5px}.cl-inspection>div:first-child>b{font-size:12px;color:#9dece7}.cl-inspection ol{padding-right:22px;margin:9px 0}.cl-inspection li{font-size:12px;line-height:1.9;margin:5px 0;color:#d0dfef}.cl-honesty{font-size:10px;line-height:1.9;color:#a9c0d6;padding:9px 10px;border-right:3px solid #3c9ba3;background:#102838;border-radius:7px}.cl-outcome-actions{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0}.cl-btn{min-height:42px;border:1px solid #38546b;border-radius:9px;padding:8px 11px;background:#142a40;color:#e7f2ff;font-size:11px;font-weight:bold}.cl-btn-primary{background:#176d83;border-color:#2799a8}.cl-btn-danger{border-color:#a95362;background:#3a202b}.cl-btn-success{border-color:#2e866e;background:#12392f}.cl-result{margin-top:10px;border-radius:10px;padding:11px 12px;font-size:12px;line-height:1.9}.cl-result p{margin:6px 0}.cl-result-problem{border:1px solid #a95362;background:#321f2a;color:#ffe1e5}.cl-result-ok{border:1px solid #2e866e;background:#12352f;color:#d5fff0}.cl-answers{border:0;padding:0;margin:17px 0}.cl-answers legend{font-size:14px;font-weight:bold;margin-bottom:9px}.cl-answer{display:flex;align-items:flex-start;gap:10px;border:1px solid var(--line);border-radius:10px;padding:11px;margin:8px 0;background:var(--panel);font-size:12px;line-height:1.9;cursor:pointer}.cl-answer.is-chosen{border-color:#3dbdc8;background:#103044}.cl-answer input{margin-top:6px;accent-color:#3dd4d0;flex:0 0 auto}.cl-answer span{overflow-wrap:anywhere}.cl-answer span b{color:#6de2de;margin-left:4px}.cl-actions{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.cl-actions button{min-height:44px}.cl-feedback{padding:13px;border-radius:11px;margin:13px 0;font-size:12px;line-height:2}.cl-feedback h3{font-size:14px;margin:0 0 8px}.cl-feedback p{margin:6px 0}.cl-feedback.is-correct{background:#10372f;border:1px solid #277b64;color:#d8fff0}.cl-feedback.is-incorrect{background:#39232b;border:1px solid #9b4b5a;color:#ffe1e5}.cl-hint{padding:11px 13px;background:var(--bg);border-radius:9px;font-size:12px;line-height:2}.cl-bottom{display:flex;gap:8px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:14px;margin-top:18px}.cl-bottom button{min-height:42px}@media(max-width:760px){.cl-layout{grid-template-columns:1fr}.cl-rail{order:2}.cl-main{order:1}.cl-rail{padding:12px}.cl-mission{min-height:48px}.cl-hero{padding:17px}.cl-progress-row{align-items:flex-start;flex-direction:column}.cl-progress{width:100%;flex:none}.cl-outcome-actions{display:grid;grid-template-columns:1fr}.cl-btn{width:100%}}@media(prefers-reduced-motion:reduce){.cl-lab *{scroll-behavior:auto!important;transition:none!important}}</style>'+
 '<div class="cl-lab"><div class="crumb"><button class="secondary" onclick="go(\'lesson\','+chapter+')">بازگشت به درس</button>　/　تمرین عملی فصل '+(chapter+1).toLocaleString("fa-IR")+'</div>'+
 '<section class="cl-hero"><span class="cl-kicker">آزمایشگاه گام‌به‌گام</span><h1>'+chapterLabEsc(c.title)+'</h1><p>این بخش مثل یک راهنمای کار در محل نصب است: مشکل را بخوان، یک بخش را بررسی کن، نتیجه را ثبت کن و بعد تصمیم بگیر. لازم نیست اصطلاحات را از قبل بلد باشی؛ معنی واژه‌های مهم در دسترس است.</p><div class="cl-progress-row"><b>'+completed.toLocaleString("fa-IR")+' از ۵ تمرین حل شده</b><div class="cl-progress"><i style="width:'+(completed*20)+'%"></i></div></div></section>'+
 '<div class="cl-layout"><aside class="cl-rail"><h2>تمرین‌های این فصل</h2><p>هر تمرین را جداگانه انجام بده؛ برای مرور دوباره می‌توانی به آن برگردی.</p>'+tabs+'</aside>'+
 '<article class="cl-main"><div class="cl-meta"><span class="cl-chip">تمرین '+(idx+1).toLocaleString("fa-IR")+' از ۵</span><span class="cl-chip">مرحله ۱: فهم مشکل</span></div><h2>'+chapterLabEsc(s.title)+'</h2><div class="cl-context"><b>چه اتفاقی افتاده؟</b>'+chapterLabEsc(s.context)+'</div>'+chapterLabGlossary(s)+
 chapterLabSimulatorHTML(s,idx)+
 '<div class="cl-meta"><span class="cl-chip">مرحله ۲: انتخاب تصمیم</span></div><fieldset class="cl-answers" '+(answered?'disabled':'')+'><legend>اگر در محل نصب بودی، اول کدام کار را انجام می‌دادی؟</legend>'+options+'</fieldset>'+
 '<div class="cl-actions">'+(answered?'<button class="primary" onclick="retryChapterLabScenario('+idx+')">تمرین دوباره از اول</button>':'<button class="primary" onclick="runChapterLabScenario()">بررسی تصمیم من</button>')+'<button class="secondary" onclick="openChapterLabScenario('+((idx+1)%5)+')">'+(idx===4?'رفتن به تمرین ۱':'تمرین بعدی')+' ←</button></div>'+feedback+
 '<div class="cl-bottom"><button class="secondary" onclick="go(\'chapterQuiz\','+chapter+')">رفتن به آزمون فصل</button><button class="secondary" onclick="go(\'lesson\','+chapter+')">بازگشت به آموزش فصل</button></div></article></div></div>';
}
function openChapterLabScenario(index){
 state.labScenario=Math.max(0,Math.min(4,Number(index)||0));
 state.labDraft=null;state.labSimNode=0;state.labSimOutcome="";
 render();
 if(typeof window!=="undefined"&&window.scrollTo)window.scrollTo({top:0,behavior:"smooth"});
}
function selectChapterLabAnswer(value){state.labDraft=Number(value);}
function runChapterLabScenario(){
 if(!Number.isInteger(state.labDraft)||state.labDraft<0||state.labDraft>2){alert("اول یکی از سه گزینه را انتخاب کن.");return;}
 var chapter=state.chapter,idx=state.labScenario,s=window.CCTVChapterLabs[chapter][idx],correct=state.labDraft===s.answer,key=chapter+":"+idx,old=state.progress.labs[key];
 state.progress.labs[key]={answer:state.labDraft,checked:true,correct:correct,attempts:(old&&old.attempts||0)+1,at:new Date().toISOString()};
 if(correct){
  var count=window.CCTVChapterLabs[chapter].filter(function(item,i){var r=state.progress.labs[chapter+":"+i];return (r&&r.checked&&r.correct)||i===idx;}).length;
  if(count===5&&state.progress.done.indexOf(chapter)===-1)state.progress.done.push(chapter);
 }
 saveProgress();state.labDraft=null;render();
}
function retryChapterLabScenario(index){
 var key=state.chapter+":"+index;delete state.progress.labs[key];saveProgress();state.labScenario=index;state.labDraft=null;state.labSimNode=0;state.labSimOutcome="";render();
}
function selectLabSimulatorNode(index){state.labSimNode=Number(index)||0;state.labSimOutcome="";render();}
function setLabSimulatorOutcome(outcome){if(outcome!=="fault"&&outcome!=="ok")return;state.labSimOutcome=outcome;render();}
function resetLabSimulator(){state.labSimNode=0;state.labSimOutcome="";render();}
