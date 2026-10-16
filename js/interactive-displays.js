/* سه نمایش آموزشی سبک، بدون SVG و کتابخانه بیرونی. */
(function(){
  "use strict";
  let pathState={layer:"data",cut:false,poe:true};
  let treeState={step:0,answers:{}};
  function pathHTML(){
    pathState={layer:"data",cut:false,poe:true};
    return '<section class="interactive-display" aria-labelledby="path-lab-title"><header class="display-head"><span>نمایش تعاملی ۱</span><h2 id="path-lab-title">مسیر داده و برق</h2><p>لایه را عوض کن یا کابل بین دوربین و سوئیچ را قطع کن تا اثر آن را ببینی.</p></header><div class="display-controls"><button type="button" class="display-toggle active" onclick="CCTVInteractiveDisplays.setLayer(\'data\')">لایه داده</button><button type="button" class="display-toggle" onclick="CCTVInteractiveDisplays.setLayer(\'power\')">لایه برق</button><label class="display-check"><input type="checkbox" checked onchange="CCTVInteractiveDisplays.togglePoE(this.checked)"> تغذیه PoE از سوئیچ</label></div><div class="display-path" id="display-path-nodes"><div class="display-node" id="display-camera"><b>◉ دوربین IP</b><small>تولید جریان تصویر</small></div><div class="display-link" id="display-link-camera">← <span>داده</span> →</div><div class="display-node"><b>▦ سوئیچ</b><small>اتصال شبکه و در صورت PoE، تغذیه</small></div><div class="display-link"><span>شبکه</span> →</div><div class="display-node"><b>▣ NVR</b><small>دریافت و ضبط تصویر</small></div></div><div class="display-status" id="display-path-status" role="status">در لایه داده، جریان تصویر از دوربین به سوئیچ و سپس NVR می‌رسد.</div><button type="button" class="display-danger" onclick="CCTVInteractiveDisplays.toggleCable()">قطع / وصل کابل دوربین</button><p class="display-note">این نمایش شبیه‌سازی است و وضعیت تجهیزات واقعی را نمی‌خواند. اگر PoE فعال باشد، همان کابل هم داده و هم برق را حمل می‌کند.</p></section>';
  }
  function setLayer(layer){
    pathState.layer=layer==="power"?"power":"data";
    document.querySelectorAll(".display-toggle").forEach(b=>b.classList.toggle("active",b.textContent.includes(pathState.layer==="power"?"برق":"داده")));
    updatePath();
  }
  function toggleCable(){pathState.cut=!pathState.cut;updatePath()}
  function togglePoE(enabled){pathState.poe=!!enabled;updatePath()}
  function updatePath(){
    const link=document.getElementById("display-link-camera"),camera=document.getElementById("display-camera"),out=document.getElementById("display-path-status");
    if(!link||!out)return;
    link.classList.toggle("is-cut",pathState.cut);
    camera.classList.toggle("is-off",pathState.cut&&pathState.layer==="power"&&pathState.poe);
    if(pathState.layer==="data"){
      link.innerHTML=pathState.cut?'× <span>کابل قطع</span> ×':'← <span>داده</span> →';
      out.textContent=pathState.cut?"کابل قطع است: جریان داده از دوربین به سوئیچ نمی‌رسد و NVR تصویر تازه دریافت نمی‌کند.":"لایه داده فعال است: دوربین جریان تصویر را از طریق سوئیچ به NVR می‌فرستد.";
    }else if(pathState.cut&&pathState.poe){
      link.innerHTML='× <span>برق و داده قطع</span> ×';out.textContent="PoE فعال است و کابل قطع شده؛ برق دوربین و مسیر داده هر دو قطع می‌شوند.";
    }else if(pathState.cut&&!pathState.poe){
      link.innerHTML='× <span>داده قطع</span> ×';out.textContent="PoE خاموش است و منبع برق جدا فرض شده؛ قطع کابل شبکه داده را قطع می‌کند اما الزاماً برق دوربین را نه.";
    }else{
      link.innerHTML='← <span>'+(pathState.poe?"PoE + داده":"داده؛ برق جدا")+'</span> →';out.textContent=pathState.poe?"سوئیچ PoE از کابل مشترک برای تغذیه دوربین و انتقال داده استفاده می‌کند.":"در این فرض، برق از منبع جدا تأمین می‌شود و کابل شبکه مسیر داده است.";
    }
  }
  function poeHTML(){
    return '<section class="interactive-display" aria-labelledby="poe-lab-title"><header class="display-head"><span>نمایش تعاملی ۲</span><h2 id="poe-lab-title">بودجه توان PoE</h2><p>تعداد دوربین و توان تخمینی را تغییر بده؛ محاسبه از ماژول رسمی محاسبات آکادمی استفاده می‌کند.</p></header><div class="display-inputs"><label>تعداد دوربین<input id="display-poe-count" type="number" min="1" max="256" value="8" oninput="CCTVInteractiveDisplays.calculatePoE()"></label><label>توان هر دوربین (وات)<input id="display-poe-watts" type="number" min="0.1" max="200" step="0.1" value="8" oninput="CCTVInteractiveDisplays.calculatePoE()"></label><label>حاشیه طراحی (%)<input id="display-poe-reserve" type="number" min="0" max="100" value="20" oninput="CCTVInteractiveDisplays.calculatePoE()"></label><label>بودجه سوئیچ (وات)<input id="display-poe-budget" type="number" min="1" max="5000" value="120" oninput="CCTVInteractiveDisplays.calculatePoE()"></label></div><div class="display-result" id="display-poe-result" role="status">برای دیدن برآورد، مقادیر را بررسی کن.</div><p class="display-note">فرض‌ها: توان واردشده برای هر دوربین ثابت است و مقدار حاشیه به جمع مصرف اضافه می‌شود. این برآورد جایگزین دیتاشیت، سقف توان هر پورت، کلاس PoE یا بررسی مصرف شبانه نیست.</p></section>';
  }
  function calculatePoE(){
    const out=document.getElementById("display-poe-result");
    if(!out)return;
    try{
      const count=Number(document.getElementById("display-poe-count").value),watts=Number(document.getElementById("display-poe-watts").value),reserve=Number(document.getElementById("display-poe-reserve").value),budget=Number(document.getElementById("display-poe-budget").value);
      const calc=window.CCTVCalculations.poe(count,watts,reserve);
      if(!Number.isFinite(budget)||budget<=0)throw new Error("بودجه سوئیچ باید بزرگ‌تر از صفر باشد.");
      const status=budget>=calc.total*1.15?["کافی","status-good","بودجه سوئیچ از برآورد به‌همراه حاشیه پیشنهادی بیشتر است."]:budget>=calc.total?["مرزی","status-warn","ظرفیت نزدیک به برآورد است؛ مصرف بیشینه و رشد احتمالی را بررسی کن."]:["ناکافی","status-bad","بودجه توان سوئیچ از برآورد موردنیاز کمتر است؛ سوئیچ یا توزیع توان را بازبینی کن."];
      out.innerHTML='<strong class="'+status[1]+'">وضعیت: '+status[0]+'</strong><p>مصرف پایه: <b>'+calc.base.toFixed(1)+' W</b> · با حاشیه واردشده: <b>'+calc.total.toFixed(1)+' W</b> · بودجه سوئیچ: <b>'+budget.toFixed(1)+' W</b></p><p>'+status[2]+'</p><p><b>اقدام پیشنهادی:</b> بودجه کل و سقف هر پورت را از دیتاشیت سوئیچ و مصرف بیشینه دوربین‌ها تطبیق بده.</p>';
    }catch(error){out.textContent=error.message||"ورودی‌ها را بررسی کن."}
  }
  function treeHTML(){
    treeState={step:0,answers:{}};
    return '<section class="interactive-display" aria-labelledby="tree-lab-title"><header class="display-head"><span>نمایش تعاملی ۳</span><h2 id="tree-lab-title">درخت تشخیص «تصویر نیست»</h2><p>هر بار فقط یک لایه را بررسی کن. پاسخ تو مسیر آزمون بعدی را تعیین می‌کند.</p></header><div id="display-tree-stage" class="display-tree"></div><p class="display-note">این درخت راهنمای شروع عیب‌یابی است، نه تشخیص قطعی. نتیجه را با شواهد واقعی دستگاه بررسی کن.</p></section>';
  }
  const steps=[
    {title:"۱. برق و لینک فیزیکی",question:"آیا دوربین برق دارد و لینک شبکه برقرار است؟",options:[["no","خیر / مطمئن نیستم"],["yes","بله، هر دو برقرارند"]]},
    {title:"۲. دسترسی IP",question:"آیا از شبکه مجاز می‌توان IP دوربین را آزمایش کرد؟",options:[["no","خیر؛ پاسخ IP ندارم"],["yes","بله؛ پاسخ IP دارم"]]},
    {title:"۳. سرویس تصویر",question:"با وجود دسترسی IP، آیا سرویس/جریان تصویر در دسترس است؟",options:[["no","خیر؛ تصویر هنوز نیست"],["yes","بله؛ تصویر برقرار شد"]]}
  ];
  function renderTree(){
    const host=document.getElementById("display-tree-stage");if(!host)return;
    const step=steps[treeState.step];
    if(!step){host.innerHTML='<div class="display-tree-result"><b>پایان بررسی مرحله‌ای</b><p>ثبت نتیجه را کامل کن و اقدام اصلاحی را مستند کن.</p><button type="button" onclick="CCTVInteractiveDisplays.resetTree()">شروع دوباره</button></div>';return}
    const answer=treeState.answers[treeState.step];
    const advice=answer===undefined?"":treeState.step===0?(answer==="no"?"دلیل: بدون برق یا لینک، آزمایش IP زودهنگام است. اقدام: منبع تغذیه/PoE، کابل، سوکت و پورت سوئیچ را بررسی کن.":"دلیل: لایه فیزیکی پاسخ اولیه را داده است. مرحله بعد، بررسی دسترسی IP است."):treeState.step===1?(answer==="no"?"دلیل: مسیر شبکه یا تنظیمات IP هنوز مشکوک است. اقدام: IP و Subnet، VLAN، تداخل آدرس و ACL را بررسی کن.":"دلیل: پاسخ IP فقط دسترس‌پذیری شبکه را نشان می‌دهد و سلامت سرویس تصویر را ثابت نمی‌کند. مرحله بعد، سرویس و جریان ویدئو است."):answer==="no"?"دلیل: شبکه پاسخ می‌دهد اما تصویر نیست. اقدام: پورت/سرویس ویدئو، اعتبارنامه، سازگاری جریان، کانال NVR و ظرفیت رمزگشایی را بررسی کن.":"دلیل: تصویر برقرار شده است. اقدام: Live، ضبط، بازپخش و زمان را نیز آزمایش و ثبت کن.";
    host.innerHTML='<div class="display-tree-step"><span>مرحله '+(treeState.step+1)+' از ۳</span><h3>'+step.title+'</h3><p>'+step.question+'</p><div class="display-tree-options">'+step.options.map(o=>'<button type="button" class="display-tree-option '+(answer===o[0]?"active":"")+'" onclick="CCTVInteractiveDisplays.chooseTree(\''+o[0]+'\')">'+o[1]+'</button>').join("")+'</div>'+(answer!==undefined?'<div class="display-tree-result" role="status">'+advice+'</div><div class="display-tree-actions"><button type="button" onclick="CCTVInteractiveDisplays.previousTree()" '+(treeState.step===0?"disabled":"")+'>مرحله قبل</button><button type="button" class="primary" onclick="CCTVInteractiveDisplays.nextTree()">'+(treeState.step===2?"پایان بررسی":"مرحله بعد ←")+'</button></div>':'<p class="display-note">یک پاسخ را انتخاب کن تا دلیل و قدم بعدی نمایش داده شود.</p>')+'</div>';
  }
  function chooseTree(value){treeState.answers[treeState.step]=value;renderTree()}
  function nextTree(){if(treeState.answers[treeState.step]===undefined)return;if(treeState.step<2)treeState.step++;else treeState.step=3;renderTree()}
  function previousTree(){treeState.step=Math.max(0,treeState.step-1);renderTree()}
  function resetTree(){treeState={step:0,answers:{}};renderTree()}
  function renderForChapter(index){
    let html="";
    if(index===0||index===2)html+=pathHTML();
    if(index===2)html+=poeHTML();
    if(index===8)html+=treeHTML();
    return html;
  }
  window.CCTVInteractiveDisplays={renderForChapter,setLayer,toggleCable,togglePoE,calculatePoE,chooseTree,nextTree,previousTree,resetTree};
})();