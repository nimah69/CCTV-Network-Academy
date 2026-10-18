import { POE_TYPES, solveLink, budgetCheck } from "./calc/poe.js";
(() => {
 const root=document.getElementById("poeReferenceLab"); if(!root)return;
 const $=id=>root.querySelector("#"+id);
 const digits=s=>String(s??"").replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[٫،]/g,".").replace(/٬/g,"").trim();
 const num=id=>{const v=Number(digits($(id).value));if(!Number.isFinite(v))throw Error("مقدار عددی معتبر وارد کن.");return v};
 const fmt=n=>Number.isFinite(n)?n.toLocaleString("fa-IR",{maximumFractionDigits:3}):"—";
 const statusText={ok:"مناسب",marginal:"مرزی",fail:"ناموفق"};
 function calculate(){
  const type=$("poeType").value, pdW=num("poeLoad"), lengthM=num("poeLength"),tempC=num("poeTemp"),switchBudgetW=num("poeBudget"),marginPct=num("poeMargin"),count=num("poeCount"),material=$("poeMaterial").value,allocation=$("poeAllocation").value;
  if(lengthM<0||pdW<=0||count<1||!Number.isInteger(count)||tempC < -40||tempC>100)throw Error("توان باید مثبت، طول نامنفی، تعداد صحیح و دما بین ‎−40 تا 100°C باشد.");
  const link=solveLink({type,pdW,lengthM,material,tempC});
  const allocations=Array.from({length:count},()=>allocation==="class"?POE_TYPES[type].pseW:link.pseW);
  const budget=budgetCheck({switchBudgetW,marginPct,allocationsW:allocations});
  const failed=link.status==="fail"||budget.status==="fail",marginal=!failed&&(link.status==="marginal"||budget.status==="marginal");
  const status=failed?"fail":marginal?"marginal":"ok";
  const reasons=[...link.reasons,...link.warnings,...(budget.status!=="ok"?["بودجه سوئیچ: "+statusText[budget.status]]:[])];
  $("poeResult").className="output "+(status==="ok"?"good":status==="marginal"?"warn":"bad");
  $("poeResult").innerHTML="<b>"+statusText[status]+" — "+status+"</b><div class='sim-grid'><div class='sim-stat'>مقاومت حلقه R<b>"+fmt(link.resistanceOhm)+" Ω</b></div><div class='sim-stat'>جریان I<b>"+fmt(link.currentA)+" A</b></div><div class='sim-stat'>افت توان I²R<b>"+fmt(link.lossW)+" W</b></div><div class='sim-stat'>توان سمت PSE<b>"+fmt(link.pseW)+" W</b></div><div class='sim-stat'>ولتاژ سمت PD<b>"+fmt(link.vPdV)+" V</b></div><div class='sim-stat'>حد جریان مدل<b>"+fmt(link.iMaxA)+" A</b></div><div class='sim-stat'>مصرف تخصیص‌شده سوئیچ<b>"+fmt(budget.totalW)+" W</b></div><div class='sim-stat'>بودجه قابل استفاده<b>"+fmt(budget.usableW)+" W</b></div></div><p><b>فرمول‌ها</b></p><p dir='ltr'>R = 0.0938 × L × k_material × [1 + 0.00393 × (T − 20)] / (pairs = 4 ? 2 : 1)</p><p dir='ltr'>I = (V − √(V² − 4RP_PD)) / (2R)</p><p dir='ltr'>P_PSE = P_PD + I²R ; V_PD = V − IR</p><p><b>فرض‌های مدل:</b> ولتاژ حداقل PSE برای "+type+" برابر "+fmt(({af:44,at:50,bt3:50,bt4:52.3})[type])+" V؛ دما "+fmt(tempC)+"°C؛ جنس "+(material==="cca"?"CCA با ضریب فرضی 1.55":"مس")+". CCA_FACTOR فرض آموزشی است و باید با دیتاشیت کابل جایگزین/تأیید شود.</p>"+(reasons.length?"<b>دلایل و هشدارها</b><ul>"+reasons.map(x=>"<li>"+x+"</li>").join("")+"</ul>":"<p>دلیل هشدار فعالی در این مدل ثبت نشد.</p>")+"<p class='help'>برآورد آموزشی؛ به دیتاشیت و استاندارد مراجعه کنید.</p>";
 }
 $("poeRun").addEventListener("click",()=>{try{calculate()}catch(e){$("poeResult").className="output bad";$("poeResult").textContent=e.message}});
 $("poeReset").addEventListener("click",()=>{ $("poeType").value="at";$("poeLoad").value="25.5";$("poeLength").value="100";$("poeTemp").value="20";$("poeMaterial").value="cu";$("poeBudget").value="120";$("poeMargin").value="20";$("poeCount").value="8";$("poeAllocation").value="actual";$("poeResult").className="output";$("poeResult").textContent="ورودی‌ها بازنشانی شدند؛ برای محاسبه دوباره دکمه اجرا را بزن."});
})();
