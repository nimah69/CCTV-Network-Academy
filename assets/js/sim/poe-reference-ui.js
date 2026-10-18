import { POE_TYPES, POE_CLASSES, solveLink, budgetCheck } from "./calc/poe.js";
(() => {
 const root=document.getElementById("poeReferenceLab"); if(!root)return;
 const $=id=>root.querySelector("#"+id);
 const digits=s=>String(s??"").replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[٫،]/g,".").replace(/٬/g,"").trim();
 const num=id=>{const v=Number(digits($(id).value));if(!Number.isFinite(v))throw Error("مقدار عددی معتبر وارد کن.");return v};
 const fmt=n=>Number.isFinite(n)?n.toLocaleString("fa-IR",{maximumFractionDigits:3}):"—";
 const statusText={ok:"مناسب",marginal:"مرزی",fail:"ناموفق"};
 function calculate(){
  const type=$("refPoeType").value, pdW=num("poeLoad"), lengthM=num("poeLength"),tempC=num("poeTemp"),switchBudgetW=num("poeBudget"),marginPct=num("poeMargin"),count=num("poeCount"),material=$("refPoeMaterial").value,allocation=$("refPoeAllocation").value;
  if(lengthM<0||pdW<=0||count<1||!Number.isInteger(count)||tempC < -40||tempC>100)throw Error("توان باید مثبت، طول نامنفی، تعداد صحیح و دما بین ‎−40 تا 100°C باشد.");
  const link=solveLink({type,pdW,lengthM,material,tempC});
  const selectedClass=Object.entries(POE_CLASSES).find(([,c])=>pdW<=c.pdW);
  const classEntry=selectedClass?selectedClass[1]:POE_CLASSES[8];
  const allocations=Array.from({length:count},()=>allocation==="class"?classEntry.pseW:link.pseW);
  const budget=budgetCheck({switchBudgetW,marginPct,allocationsW:allocations});
  const failed=link.status==="fail"||budget.status==="fail"||(allocation==="class"&&!selectedClass),marginal=!failed&&(link.status==="marginal"||budget.status==="marginal");
  const status=failed?"fail":marginal?"marginal":"ok";
  const reasons=[...link.reasons,...link.warnings,...(allocation==="class"?["تخصیص ایستا بر اساس کلاس "+(selectedClass?selectedClass[0]:"۸ (حداکثر)")+"؛ رزرو هر پورت "+fmt(classEntry.pseW)+" وات."]:[]),...(!selectedClass?["توان دوربین از بیشترین توان PD کلاس ۸ بیشتر است."]:[]),...(budget.status!=="ok"?["بودجه سوئیچ: "+statusText[budget.status]]:[])];
  $("refPoeResult").className="output "+(status==="ok"?"good":status==="marginal"?"warn":"bad");
  $("refPoeResult").innerHTML="<b>"+statusText[status]+"</b><div class='sim-grid'><div class='sim-stat'>مقاومت حلقه R<b>"+fmt(link.resistanceOhm)+" Ω</b></div><div class='sim-stat'>جریان I<b>"+fmt(link.currentA)+" A</b></div><div class='sim-stat'>افت توان I²R<b>"+fmt(link.lossW)+" W</b></div><div class='sim-stat'>توان سمت PSE<b>"+fmt(link.pseW)+" W</b></div><div class='sim-stat'>ولتاژ سمت PD<b>"+fmt(link.vPdV)+" V</b></div><div class='sim-stat'>حد جریان مدل<b>"+fmt(link.iMaxA)+" A</b></div><div class='sim-stat'>مصرف تخصیص‌شده سوئیچ<b>"+fmt(budget.totalW)+" W</b></div><div class='sim-stat'>بودجه قابل استفاده<b>"+fmt(budget.usableW)+" W</b></div></div><p><b>فرمول‌ها</b></p><p dir='ltr'>R = 0.0938 × L × k_material × [1 + 0.00393 × (T − 20)] / (pairs = 4 ? 2 : 1)</p><p dir='ltr'>I = (V − √(V² − 4RP_PD)) / (2R)</p><p dir='ltr'>P_PSE = P_PD + I²R ; V_PD = V − IR</p><p><b>فرض‌های مدل:</b> ولتاژ حداقل PSE برای "+type+" برابر "+fmt(({af:44,at:50,bt3:50,bt4:52.3})[type])+" V؛ دما "+fmt(tempC)+"°C؛ جنس "+(material==="cca"?"CCA با ضریب فرضی 1.55":"مس")+". CCA_FACTOR فرض آموزشی است و باید با دیتاشیت کابل جایگزین/تأیید شود.</p>"+(reasons.length?"<b>دلایل و هشدارها</b><ul>"+reasons.map(x=>"<li>"+x+"</li>").join("")+"</ul>":"<p>دلیل هشدار فعالی در این مدل ثبت نشد.</p>")+"<p class='help'>برآورد آموزشی؛ به دیتاشیت و استاندارد مراجعه کنید.</p>";
 }
 $("refPoeRun").addEventListener("click",()=>{try{calculate()}catch(e){$("refPoeResult").className="output bad";$("refPoeResult").textContent=e.message}});
 $("refPoeReset").addEventListener("click",()=>{ $("refPoeType").value="at";$("refPoeLoad").value="12";$("refPoeLength").value="100";$("refPoeTemp").value="20";$("refPoeMaterial").value="cu";$("refPoeBudget").value="120";$("refPoeMargin").value="20";$("refPoeCount").value="8";$("refPoeAllocation").value="actual";$("refPoeResult").className="output";$("refPoeResult").textContent="ورودی‌ها بازنشانی شدند؛ برای محاسبه دوباره دکمه اجرا را بزن."});
})();
