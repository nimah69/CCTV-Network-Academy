/* ریزدرس‌های آکادمی؛ بدون وابستگی خارجی و بر پایه محتوای هر فصل. */
(function(){
  function exampleFor(title){
    const t=String(title||"").toLowerCase();
    if(/ip|آدرس|dhcp|dns|شبکه|ping|لینک|پروتکل/.test(t)) return "در یک فروشگاه، دوربین روشن است اما NVR آن را پیدا نمی‌کند. وضعیت لینک، آدرس IP، Subnet و سرویس موردنیاز را به‌ترتیب بررسی کن؛ یک Ping موفق به‌تنهایی سلامت جریان تصویر را ثابت نمی‌کند.";
    if(/poe|برق|کابل|سوئیچ|تغذیه|اتصال/.test(t)) return "پس از نصب دوربین ورودی، چراغ لینک خاموش است. پیش از تغییر تنظیمات نرم‌افزاری، برق یا PoE، کابل و سوکت، پورت سوئیچ و سازگاری تجهیزات را بررسی کن.";
    if(/ذخیره|هارد|ضبط|backup|بازیابی|raid/.test(t)) return "برای فروشگاهی با چند دوربین، مدت نگهداری را مشخص کن و برآورد را با تعداد دوربین، نرخ بیت و ساعات ضبط بسنج؛ سپس ظرفیت قابل‌استفاده و آزمون بازیابی را جداگانه بررسی کن.";
    if(/امنیت|دسترسی|رمز|حساب|firmware|سایبری|حمله/.test(t)) return "نصاب برای پشتیبانی به سامانه نیاز دارد. به‌جای اشتراک حساب مدیر یا بازکردن مستقیم پورت‌ها، حساب جداگانه با حداقل دسترسی و مسیر اتصال کنترل‌شده تعریف کن.";
    if(/لنز|نور|تصویر|رزولوشن|فشرده|فریم|دید|اپتیک|wdr|ir/.test(t)) return "برای دوربین ورودی، ابتدا هدف تصویر و فاصله را تعیین کن. سپس زاویه دید، لنز، نور پس‌زمینه و تنظیمات را آزمایش کن؛ افزایش مگاپیکسل به‌تنهایی تضمین‌کننده شناسایی نیست.";
    if(/ریسک|محیط|نصب|فیزیک|حفاظت|بازدید/.test(t)) return "در بازدید محل، یک نقطه کور یا کابل در دسترس را ثبت کن و برای هر یافته، پیامد و اقدام اصلاحی مشخص بنویس؛ صرف نصب و روشن‌شدن تصویر پایان تحویل نیست.";
    return "در یک سامانه واقعی CCTV، این مفهوم را روی یک دوربین، سوئیچ یا NVR مشخص دنبال کن. وضعیت فعلی را ثبت کن، یک فرضیه بساز و آن را با آزمونی کم‌هزینه بررسی کن؛ نتیجه را با حدس جایگزین نکن.";
  }
  function build(chapter){
    let sections=(Array.isArray(chapter.sections)?chapter.sections:[]).map(s=>({title:String(s[0]||"مرور مفهوم"),body:String(s[1]||"")})).filter(s=>s.body);
    if(sections.length>5){const groups=[],size=Math.ceil(sections.length/5);for(let i=0;i<sections.length;i+=size){const part=sections.slice(i,i+size);groups.push({title:part.map(s=>s.title).join(" و "),body:part.map(s=>s.title+" — "+s.body).join("\n\n")})}sections=groups.slice(0,5)}
    while(sections.length<3){sections.push(sections.length===0?{title:"نقشه فصل",body:String(chapter.intro||"موضوع فصل و نقش آن در سامانه CCTV.")}:sections.length===1?{title:"نمونه کاربردی",body:String(chapter.tips||"مفهوم را در یک سناریوی نصب یا عیب‌یابی بررسی کن.")}:{title:"ارتباط با سامانه کامل",body:"این مفهوم را در کنار دوربین، شبکه، NVR، ضبط، امنیت و نگهداری ببین؛ نتیجه هر بخش می‌تواند بر بخش‌های دیگر اثر بگذارد."})}
    const bank=Array.isArray(chapter.quiz)?chapter.quiz:[];
    return sections.map((s,index)=>({index,title:s.title,definition:s.body,why:"این موضوع در فصل «"+chapter.title+"» به تصمیم درست هنگام طراحی، نصب یا عیب‌یابی کمک می‌کند. نادیده‌گرفتن آن می‌تواند کیفیت، ارتباط، ضبط یا امنیت سامانه را کاهش دهد.",example:exampleFor(s.title),tip:String(chapter.tips||"نتیجه را با آزمون واقعی و مشخصات سازنده بررسی کن."),question:bank.length?bank[index%bank.length]:null,minutes:4}));
  }
  window.CCTVMicroLessons={build};
})();