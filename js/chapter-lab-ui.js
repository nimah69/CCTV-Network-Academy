/* کارگاه مبتدی: فهم وضعیت، بررسی یک مورد، خواندن نتیجه */
function chapterLabEsc(value){return String(value==null?"":value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
function chapterLabGlossary(s){
 var text=[s.title,s.context,s.check,s.why].join(" ").toLowerCase();
 var terms=[["IP","نشانی دستگاه در شبکه"],["PoE","برق‌رسانی از راه کابل شبکه در تجهیزات سازگار"],["NVR","دستگاه ضبط دوربین‌های تحت شبکه"],["DVR","دستگاه ضبط برخی دوربین‌های آنالوگ"],["ping","آزمون پاسخ‌گویی دستگاه در شبکه"],["VLAN","جداکردن منطقی بخش‌های شبکه"],["DHCP","سرویسی که به دستگاه آدرس شبکه می‌دهد"],["Gateway","دروازه ارتباط با شبکه‌های دیگر"],["Bitrate","حجم داده تصویر در هر ثانیه"],["H.265","روش فشرده‌سازی تصویر که باید در دو طرف پشتیبانی شود"],["IR","نور مادون‌قرمز برای دید در تاریکی"],["WDR","کمک به دیدن صحنه‌هایی با اختلاف روشنایی"],["HLC","قابلیت کاهش اثر نور خیلی شدید"],["NTP","هماهنگ‌کردن ساعت دستگاه‌ها"],["RAID","چند هارد با هم؛ جای نسخه پشتیبان جدا نیست"],["HDD","هارد ذخیره فیلم"],["Uplink","اتصال اصلی سوئیچ به شبکه"],["SFP","درگاه ماژول فیبر در بعضی تجهیزات"],["VPN","ارتباط امن از راه دور"],["RTSP","روش ارسال تصویر زنده"],["ACL","قواعد اجازه یا منع ارتباط"],["Playback","بازپخش فیلم ضبط‌شده"],["UPS","برق پشتیبان هنگام قطعی برق"],["FPS","تعداد فریم تصویر در هر ثانیه"],["Firmware","نرم‌افزار داخلی دستگاه"]];
 var found=terms.filter(function(p){return text.indexOf(p[0].toLowerCase())!==-1;}).slice(0,3);
 if(!found.length)return "";
 return '<details class="cl-glossary"><summary>معنی اصطلاحات این تمرین</summary><div>'+found.map(function(p){return '<p><b>'+chapterLabEsc(p[0])+' یعنی:</b> '+chapterLabEsc(p[1])+'</p>';}).join("")+'</div></details>';
}
function chapterLabDecisionFeedback(s,index){
 var option=String((s.options||[])[index]||"");
 if(index===s.answer)return s.why;
 var text=option.toLowerCase(),kind="general";
 if(/تعویض|فرمت|ریست|بازنشانی|حذف|پاک کن/.test(text))kind="destructive";
 else if(/رزولوشن|لنز|bitrate|کدک|فشرده|تصویر/.test(text))kind="image";
 else if(/هارد|دیسک|ذخیره|ضبط|raid/.test(text))kind="storage";
 else if(/ip|آدرس|نشانی|dhcp|gateway|vlan|dns/.test(text))kind="network";
 else if(/ping|پینگ|شبکه کاملاً سالم|همه چیز/.test(text))kind="overclaim";
 else if(/رمز|گذرواژه|حساب|اینترنت عمومی|همه کاربران/.test(text))kind="security";
 else if(/کابل|سوئیچ|پورت|فیبر|uplink|اتصال/.test(text))kind="physical";
 var reasons={
  destructive:[
   "پیش از مشخص‌شدن علت، داده یا تنظیمات را تغییر می‌دهد و ممکن است شواهد عیب‌یابی را پاک کند.",
   "اقدام برگشت‌پذیر و محدود نیست؛ اگر فرض اولیه اشتباه باشد، یک مشکل تازه به خرابی اصلی اضافه می‌شود.",
   "این کار علت را از روی شواهد جدا نمی‌کند؛ ابتدا وضعیت فعلی را ثبت و یک آزمون کم‌خطر اجرا کن."
  ],
  image:[
   "به کیفیت یا تنظیم تصویر می‌پردازد، اما هنوز معلوم نیست نشانهٔ گزارش‌شده از تصویر ناشی شده باشد.",
   "با تغییر این پارامتر، علت اصلی از علت‌های دیگر تفکیک نمی‌شود؛ ابتدا نتیجهٔ آزمون مرتبط با سناریو را بگیر.",
   "این تنظیم می‌تواند علامت را تغییر دهد بی‌آنکه ریشهٔ مشکل را برطرف کند؛ تغییر را تا تأیید فرضیه عقب بینداز."
  ],
  storage:[
   "مسیر ضبط و دیسک را هدف می‌گیرد، درحالی‌که باید ابتدا شواهدی از خرابی ذخیره‌سازی وجود داشته باشد.",
   "تغییر در ذخیره‌سازی ممکن است روی ضبط موجود اثر بگذارد؛ قبل از آن، وضعیت خطا و امکان بازپخش را ثبت کن.",
   "این گزینه هنوز ارتباط مشکل با ظرفیت یا سلامت دیسک را ثابت نمی‌کند؛ آزمون ذخیره‌سازی باید بر اساس نشانه انجام شود."
  ],
  network:[
   "تنظیم شبکه را تغییر می‌دهد، بی‌آنکه مقدار فعلی و محدودهٔ آدرس‌دهی ثبت شده باشد.",
   "ممکن است دسترسی دستگاه‌های دیگر را مختل کند؛ اول با آزمون محدود، تداخل آدرس یا مسیر ارتباط را بررسی کن.",
   "این تغییر قبل از اثبات مشکل آدرس‌دهی انجام می‌شود؛ وضعیت IP، Subnet و مسیر را جداگانه مقایسه کن."
  ],
  overclaim:[
   "نتیجه‌گیری کلی از یک نشانهٔ محدود است؛ پاسخ‌گویی IP به‌تنهایی سلامت سرویس ویدئو یا ضبط را ثابت نمی‌کند.",
   "این گزینه یک آزمون را جایگزین بررسی کل زنجیره می‌کند؛ مرحلهٔ معیوب هنوز مشخص نشده است.",
   "حتی اگر این نشانه طبیعی باشد، احراز هویت، جریان تصویر و ضبط ممکن است جداگانه مشکل داشته باشند."
  ],
  security:[
   "سطح دسترسی یا محرمانگی را تضعیف می‌کند و برای عیب‌یابی، ریسک غیرضروری به وجود می‌آورد.",
   "دسترسی را بیش از نیاز گسترش می‌دهد؛ به‌جای آن باید حساب، مجوز و مسیر ارتباطی مشخص بررسی شود.",
   "این کار امکان دسترسی ناخواسته را افزایش می‌دهد و علت فنی را هم با یک آزمون کنترل‌شده مشخص نمی‌کند."
  ],
  physical:[
   "اتصال را تغییر می‌دهد، اما هنوز محل قطعی یا خرابی لینک مشخص نشده است.",
   "با جابه‌جایی هم‌زمان اتصال، تشخیص اینکه کدام بخش مشکل داشته دشوار می‌شود؛ یک بخش را در هر مرحله آزمایش کن.",
   "این گزینه بدون مقایسه با کابل یا پورت سالم، علت را اثبات نمی‌کند و می‌تواند عیب را فقط موقتاً پنهان کند."
  ],
  general:[
   "رابطهٔ مستقیمی میان این اقدام و نشانهٔ ثبت‌شده نشان داده نشده است؛ ابتدا فرضیه را به یک آزمون قابل مشاهده تبدیل کن.",
   "این گزینه پیش از تفکیک علت‌های محتمل انتخاب می‌شود؛ نتیجهٔ آن لزوماً مشخص نمی‌کند مشکل از کدام بخش بوده است.",
   "اقدام پیشنهادی، شواهد لازم برای تصمیم بعدی را فراهم نمی‌کند؛ آزمونی را انتخاب کن که یک علت مشخص را تأیید یا رد کند."
  ]
 };
 var reason=reasons[kind][Math.max(0,Math.min(2,index> s.answer ? index-1 : index))];
 var framing=[
  "دلیل رد گزینهٔ «"+option+"»: ",
  "این گزینه با وضعیت «"+s.context+"» سازگاری کافی ندارد. ",
  "با توجه به نشانهٔ «"+s.check+"»، "
 ];
 return framing[index%3]+reason+" گام مناسب‌تر برای این سناریو: "+s.clue;
}
function chapterLabHTML(){
 var chapter=state.chapter,bank=window.CCTVChapterLabs||[],scenarios=bank[chapter]||[],c=(typeof chapters!=="undefined"&&chapters[chapter])||{title:"فصل "+(chapter+1)};
 if(scenarios.length!==5)return '<section class="panel"><h2>تمرین‌های این فصل</h2><p>تمرین‌ها بارگذاری نشدند؛ صفحه را تازه‌سازی کن.</p><button class="secondary" onclick="go(\'lesson\','+chapter+')">بازگشت به درس</button></section>';
 var idx=Math.max(0,Math.min(4,Number(state.labScenario)||0)),s=scenarios[idx],key=chapter+":"+idx,saved=state.progress.labs[key]||null,answered=!!(saved&&saved.checked),chosen=state.labDraft!==null&&state.labDraft!==undefined?state.labDraft:(saved?saved.answer:null);
 var completed=scenarios.filter(function(item,i){var r=state.progress.labs[chapter+":"+i];return r&&r.checked&&r.correct;}).length;
 var tabs=scenarios.map(function(item,i){var r=state.progress.labs[chapter+":"+i];return '<button type="button" class="cl-mission '+(i===idx?'is-active':'')+'" onclick="openChapterLabScenario('+i+')" aria-current="'+(i===idx?'step':'false')+'"><span class="cl-mission-number">'+(i+1).toLocaleString("fa-IR")+'</span><span><b>'+chapterLabEsc(item.title)+'</b><small>'+(r&&r.checked?(r.correct?'✓ یاد گرفته شده':'پاسخ ثبت شده؛ دوباره تمرین کن'):'شروع نشده')+'</small></span></button>';}).join("");
 var options=s.options.map(function(o,i){return '<label class="cl-answer '+(String(chosen)===String(i)?'is-chosen':'')+'"><input type="radio" name="chapterLabAnswer" value="'+i+'" '+(String(chosen)===String(i)?'checked':'')+' '+(answered?'disabled':'')+' onchange="selectChapterLabAnswer(this.value)"><span><b>'+String.fromCharCode(65+i)+'.</b> '+chapterLabEsc(o)+'</span></label>';}).join("");
 var optionAnalysis=answered?'<details class="cl-option-analysis"><summary>تحلیل گزینه‌ها و دلیل انتخاب</summary><ol>'+s.options.map(function(option,i){var best=i===s.answer;return '<li class="'+(best?'is-best':'')+'"><b>'+String.fromCharCode(65+i)+'. '+chapterLabEsc(best?'بهترین اقدام اولیه':'گزینه جایگزین')+'</b><p>'+chapterLabEsc(chapterLabDecisionFeedback(s,i))+'</p></li>';}).join("")+'</ol></details>':'';
 var simulatorKey=chapter+":"+idx,simResult=state.labSimulatorResults&&state.labSimulatorResults[simulatorKey],sim=s.simulator||{};
 var simulatorHTML='<section class="cl-simulator" aria-labelledby="cl-simulator-title"><h3 id="cl-simulator-title">شبیه‌ساز تصمیم‌گیری</h3><p><b>بررسی پیشنهادی:</b> '+chapterLabEsc(sim.prompt||s.check)+'</p><p>بررسی را در ذهن اجرا کن؛ سپس نتیجهٔ فرضی را انتخاب کن تا پیامد و گام بعدی را ببینی.</p><div class="cl-simulator-actions"><button type="button" class="secondary" onclick="runChapterLabSimulator(\'pass\')">نتیجه طبیعی بود</button><button type="button" class="secondary" onclick="runChapterLabSimulator(\'fail\')">نشانه مشکل دیده شد</button></div>'+(simResult?'<div class="cl-simulator-result" role="status"><p>'+chapterLabEsc(simResult==="pass"?(sim.pass||"نتیجه فرضی طبیعی است."): (sim.fail||"نتیجه فرضی غیرعادی است."))+'</p><p><b>گام دوم انتخاب اقدام:</b> '+chapterLabEsc(sim.next||s.clue)+'</p><p class="cl-simulator-note">'+chapterLabEsc(sim.note||"نتیجه صرفاً آموزشی و فرضی است.")+'</p></div>':'<p class="cl-simulator-empty">هنوز نتیجه‌ای انتخاب نشده است؛ برای مشاهده مسیر بعدی یکی از دو نتیجه را انتخاب کن.</p>')+'</section>';
 var feedback=answered?'<section class="cl-feedback '+(saved.correct?'is-correct':'is-incorrect')+'" aria-live="polite"><h3>'+(saved.correct?'✓ انتخاب درست':'↻ این گزینه بهترین قدم اول نبود')+'</h3><p><b>انتخاب تو:</b> '+chapterLabEsc(s.options[saved.answer]||"")+'</p><p>'+chapterLabEsc(chapterLabDecisionFeedback(s,saved.answer))+'</p><p><b>قدم بعدی:</b> '+chapterLabEsc(s.clue)+'</p>'+(saved.correct?'<p>پیشرفت این تمرین ثبت شد.</p>':'<p>توضیح این تمرین را مرور کن و دوباره تلاش کن.</p>')+'</section>':'<p class="cl-hint"><b>روش کار:</b> وضعیت را بخوان، گزینه‌ها را مقایسه کن و اقدامی را برگزین که علت را با کمترین تغییر و آزمونی روشن بررسی کند.</p>';
 return '<style>.cl-lab{color:var(--ink);margin:0 auto;max-width:1100px;min-width:0;direction:rtl;text-align:right;overflow-wrap:anywhere;word-break:normal}.cl-lab *{box-sizing:border-box;min-width:0}.cl-hero{direction:rtl;text-align:right;unicode-bidi:plaintext;overflow-wrap:anywhere;word-break:normal;padding:20px;border:1px solid #28516b;border-radius:16px;background:linear-gradient(130deg,#0b1a2b,#12334b);color:#e7f2ff;margin:12px 0 16px}.cl-kicker{display:block;direction:rtl;text-align:right;unicode-bidi:plaintext;overflow-wrap:anywhere;font-size:10px;color:#73e6df;font-weight:900}.cl-hero h1{direction:rtl;text-align:right;unicode-bidi:plaintext;overflow-wrap:anywhere;word-break:normal;font-size:clamp(21px,3vw,28px);line-height:1.65;margin:7px 0}.cl-hero p{direction:rtl;text-align:right;unicode-bidi:plaintext;overflow-wrap:anywhere;word-break:normal;font-size:13px;line-height:2;color:#c0d3e5;margin:0}.cl-progress-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;min-width:0;margin-top:14px;font-size:12px}.cl-progress-row>b{line-height:1.8;overflow-wrap:anywhere}.cl-progress{height:7px;border-radius:99px;background:#263d55;overflow:hidden;flex:1}.cl-progress i{display:block;height:100%;background:#43d7c8}.cl-layout{display:grid;grid-template-columns:minmax(210px,.7fr) minmax(0,1.8fr);gap:14px;align-items:start}.cl-rail,.cl-main{min-width:0;border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:14px}.cl-rail h2{font-size:15px;margin:0 0 4px}.cl-rail>p{font-size:11px;color:var(--muted);margin:0 0 12px}.cl-mission{display:flex;align-items:flex-start;gap:9px;width:100%;padding:9px;margin:7px 0;text-align:right;border:1px solid var(--line);border-radius:10px;background:transparent;color:var(--ink);min-height:52px}.cl-mission.is-active{border-color:#39c9d1;background:#103044}.cl-mission-number{display:grid;place-items:center;flex:0 0 28px;height:28px;border-radius:8px;background:#17364d;color:#8ee8e9;font-weight:bold}.cl-mission b,.cl-mission small{display:block}.cl-mission b{font-size:11px;line-height:1.7}.cl-mission small{font-size:10px;color:var(--muted);margin-top:3px}.cl-main h2{font-size:19px;line-height:1.7;margin:8px 0}.cl-meta{display:flex;flex-wrap:wrap;gap:6px}.cl-chip{font-size:10px;border:1px solid #31516a;background:#10273a;color:#9be9e8;border-radius:99px;padding:4px 8px}.cl-context{border-right:3px solid #3bbfc8;background:var(--bg);padding:12px 14px;border-radius:9px;font-size:13px;line-height:2;white-space:normal}.cl-context b{display:block;margin-bottom:4px}.cl-glossary{border:1px solid var(--line);border-radius:10px;padding:9px 12px;margin:12px 0;background:var(--bg)}.cl-glossary summary{font-size:12px;font-weight:bold;cursor:pointer}.cl-glossary p{font-size:12px;line-height:1.8;margin:7px 0}.cl-glossary b{color:#75e2df}.cl-answers{border:0;padding:0;margin:16px 0}.cl-answers legend{font-size:14px;font-weight:bold;margin-bottom:9px}.cl-answer{display:flex;align-items:flex-start;gap:10px;border:1px solid var(--line);border-radius:10px;padding:10px;margin:8px 0;background:var(--panel);font-size:12px;line-height:1.9;cursor:pointer}.cl-answer.is-chosen{border-color:#3dbdc8;background:#103044}.cl-answer input{margin-top:6px;accent-color:#3dd4d0;flex:0 0 auto}.cl-answer span{overflow-wrap:anywhere}.cl-answer span b{color:#6de2de;margin-left:4px}.cl-actions{display:flex;gap:8px;flex-wrap:wrap;margin:13px 0}.cl-actions button{min-height:43px}.cl-feedback{padding:12px;border-radius:10px;margin:12px 0;font-size:12px;line-height:2}.cl-feedback h3{font-size:14px;margin:0 0 8px}.cl-feedback p{margin:6px 0}.cl-feedback.is-correct{background:#10372f;border:1px solid #277b64;color:#d8fff0}.cl-feedback.is-incorrect{background:#39232b;border:1px solid #9b4b5a;color:#ffe1e5}.cl-hint{padding:10px 12px;background:var(--bg);border-radius:9px;font-size:12px;line-height:2}.cl-option-analysis{border:1px solid var(--line);border-radius:10px;padding:11px 13px;margin:12px 0;background:var(--bg);font-size:12px;line-height:1.9}.cl-option-analysis>summary{font-weight:800;cursor:pointer}.cl-option-analysis ol{padding-right:22px;margin:10px 0 0}.cl-option-analysis li{margin:10px 0;padding:8px 10px;border-radius:8px;background:var(--panel)}.cl-option-analysis li.is-best{border-right:3px solid #43d7c8}.cl-option-analysis li p{margin:4px 0 0}.cl-simulator{margin:14px 0;padding:14px;border:1px solid #2b6574;border-radius:12px;background:linear-gradient(140deg,#0c2233,#102b3c);color:#e6f6ff;font-size:12px;line-height:1.9}.cl-simulator h3{margin:0 0 8px;font-size:15px;color:#8ce7e5}.cl-simulator p{margin:7px 0}.cl-simulator-actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.cl-simulator-actions button{min-height:42px}.cl-simulator-result{margin-top:10px;padding:10px;border:1px solid #376477;border-radius:9px;background:#0a1a28}.cl-simulator-note,.cl-simulator-empty{color:#a9c7d8;font-size:11px}.cl-option-analysis{border:1px solid var(--line);border-radius:10px;padding:11px 13px;margin:12px 0;background:var(--bg);font-size:12px;line-height:1.9}.cl-option-analysis>summary{font-weight:800;cursor:pointer}.cl-option-analysis ol{padding-right:22px;margin:10px 0 0}.cl-option-analysis li{margin:10px 0;padding:8px 10px;border-radius:8px;background:var(--panel)}.cl-option-analysis li.is-best{border-right:3px solid #43d7c8}.cl-option-analysis li p{margin:4px 0 0}.cl-bottom{display:flex;gap:8px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:13px;margin-top:17px}.cl-bottom button{min-height:41px}@media(max-width:760px){.cl-layout{grid-template-columns:1fr}.cl-rail{order:2}.cl-main{order:1}.cl-progress-row{align-items:flex-start;flex-direction:column}.cl-progress{width:100%;flex:none}}@media(prefers-reduced-motion:reduce){.cl-lab *{scroll-behavior:auto!important;transition:none!important}}</style>'+
 '<div class="cl-lab"><div class="crumb"><button class="secondary" onclick="go(\'lesson\','+chapter+')">بازگشت به درس</button>　/　تمرین عملی فصل '+(chapter+1).toLocaleString("fa-IR")+'</div>'+
 '<section class="cl-hero"><span class="cl-kicker">از صفر شروع کن</span><h1>'+chapterLabEsc(c.title)+'</h1><p>وضعیت را بخوان، گزینه‌ها را مقایسه کن و بهترین اقدام اولیه را با دلیل انتخاب کن.</p><div class="cl-progress-row"><b>'+completed.toLocaleString("fa-IR")+' از ۵ تمرین حل شده</b><div class="cl-progress"><i style="width:'+(completed*20)+'%"></i></div></div></section>'+
 '<div class="cl-layout"><aside class="cl-rail"><h2>تمرین‌های این فصل</h2><p>هر تمرین را جداگانه انجام بده.</p>'+tabs+'</aside><article class="cl-main"><div class="cl-meta"><span class="cl-chip">تمرین '+(idx+1).toLocaleString("fa-IR")+' از ۵</span><span class="cl-chip">تمرین تصمیم‌گیری</span></div><h2>'+chapterLabEsc(s.title)+'</h2><div class="cl-context"><b>چه اتفاقی افتاده؟</b>'+chapterLabEsc(s.context)+'</div>'+chapterLabGlossary(s)+
 '<div class="cl-meta"><span class="cl-chip">انتخاب اقدام</span></div><fieldset class="cl-answers" '+(answered?'disabled':'')+'><legend>اول کدام کار منطقی‌تر است؟</legend>'+options+'</fieldset><div class="cl-actions">'+(answered?'<button class="primary" onclick="retryChapterLabScenario('+idx+')">تمرین دوباره</button>':'<button class="primary" onclick="runChapterLabScenario()">بررسی پاسخ من</button>')+'<button class="secondary" onclick="openChapterLabScenario('+((idx+1)%5)+')">'+(idx===4?'تمرین ۱':'تمرین بعدی')+' ←</button></div>'+feedback+optionAnalysis+simulatorHTML+
 '<div class="cl-bottom"><button class="secondary" onclick="go(\'chapterQuiz\','+chapter+')">رفتن به آزمون فصل</button><button class="secondary" onclick="go(\'lesson\','+chapter+')">بازگشت به آموزش فصل</button></div></article></div></div>';
}
function openChapterLabScenario(index){state.labScenario=Math.max(0,Math.min(4,Number(index)||0));state.labDraft=null;render();if(typeof window!=="undefined"&&window.scrollTo)window.scrollTo({top:0,behavior:"smooth"});}
function selectChapterLabAnswer(value){state.labDraft=Number(value);}
function runChapterLabScenario(){
 if(!Number.isInteger(state.labDraft)||state.labDraft<0||state.labDraft>3){alert("اول یکی از چهار گزینه را انتخاب کن.");return;}
 var chapter=state.chapter,idx=state.labScenario,s=window.CCTVChapterLabs[chapter][idx],correct=state.labDraft===s.answer,key=chapter+":"+idx,old=state.progress.labs[key];
 state.progress.labs[key]={answer:state.labDraft,checked:true,correct:correct,attempts:(old&&old.attempts||0)+1,at:new Date().toISOString()};
 if(correct){var count=window.CCTVChapterLabs[chapter].filter(function(item,i){var r=state.progress.labs[chapter+":"+i];return(r&&r.checked&&r.correct)||i===idx;}).length;if(count===5&&state.progress.done.indexOf(chapter)===-1)state.progress.done.push(chapter);}
 saveProgress();state.labDraft=null;render();
}
function runChapterLabSimulator(outcome){if(outcome!=="pass"&&outcome!=="fail")return;state.labSimulatorResults=state.labSimulatorResults||{};state.labSimulatorResults[state.chapter+":"+state.labScenario]=outcome;render();}
function retryChapterLabScenario(index){var key=state.chapter+":"+index;delete state.progress.labs[key];saveProgress();state.labScenario=index;state.labDraft=null;render();}
