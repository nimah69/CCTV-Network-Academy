# Design System سبک آکادمی

این راهنما قراردادهای CSS قابل استفادهٔ مجدد را توضیح می‌دهد. این مرحله فقط لایهٔ نمایش را اضافه می‌کند؛ بانک سؤال، داده‌های فصل‌ها، محاسبات و ذخیرهٔ پیشرفت را تغییر نمی‌دهد.

## توکن‌های طراحی

- رنگ‌های معنایی: `--success` / `--success-bg`، `--warning` / `--warning-bg`، `--error` / `--error-bg`، `--info` / `--info-bg`
- فاصله‌ها: `--space-1` تا `--space-6` بر پایهٔ مقیاس ۴ و ۸ پیکسلی
- شعاع گوشه‌ها: `--radius-sm`، `--radius-md`، `--radius-lg`
- تایپوگرافی: `--text-base` و `--line-height-reading`
- سایهٔ کارت: `--shadow-card`

توکن‌های معنایی با تم تاریک فعلی تنظیم شده‌اند تا متن و سطح کارت‌ها خوانا بمانند.

## اجزای پایه

### MissionCard

کلاس ریشه: `.mission-card`

کلاس‌های اختیاری:
- `.mission-card__eyebrow` برای نوع مأموریت
- `.mission-card__title` برای عنوان
- `.mission-card__section` و `.mission-card__label` برای موقعیت، نشانه و توضیح
- `.mission-card__choices` و `.mission-card__choice` برای گزینه‌ها
- `.mission-card__outcome` برای پیامد؛ مقدار `data-status="success|warning|error"` رنگ وضعیت را تعیین می‌کند.

نمونهٔ ساختار:

```html
<article class="mission-card">
  <span class="mission-card__eyebrow">مأموریت عملی</span>
  <h3 class="mission-card__title">تصویر دوربین در NVR دیده نمی‌شود</h3>
  <div class="mission-card__section">
    <span class="mission-card__label">نشانه</span>
    <p>چراغ شبکه روشن است اما تصویر نمایش داده نمی‌شود.</p>
  </div>
  <div class="mission-card__section">
    <span class="mission-card__label">انتخاب اقدام</span>
    <div class="mission-card__choices">
      <button class="mission-card__choice" type="button">بررسی آدرس IP و دسترسی شبکه</button>
      <button class="mission-card__choice" type="button">تعویض فوری دوربین</button>
    </div>
  </div>
  <div class="mission-card__outcome" data-status="warning">
    <strong>پیامد و دلیل</strong>
    <p>ابتدا دسترسی IP را بررسی کن؛ تعویض سخت‌افزار بدون تشخیص زودهنگام است.</p>
  </div>
</article>
```

توجه: این کلاس‌ها ظاهر را فراهم می‌کنند؛ منطق انتخاب، بازخورد و ذخیره‌سازی باید در مرحلهٔ پیاده‌سازی درس جداگانه اضافه شود.

### StepList

از `<ol class="step-list">` برای مراحل ترتیبی استفاده کن. شماره‌ها با CSS ساخته می‌شوند؛ شماره‌گذاری دستی داخل متن لازم نیست. برای عنوان و جزئیات هر مرحله می‌توان از `.step-list__title` و `.step-list__detail` استفاده کرد.

### CompareCard

ریشه `.compare-card` و هر مورد `.compare-card__item` است. هر مورد می‌تواند نام، «کار اصلی»، «چه کاری نمی‌کند» و «چه زمانی نیاز داریم» را با `.compare-card__name` و `.compare-card__field` نمایش دهد. در موبایل کارت‌ها تک‌ستونه و در عرض بیشتر دو ستونه‌اند.

### Callout

کلاس پایه `.callout` و گونه‌ها:
- `.callout--tip`: نکته
- `.callout--warning`: هشدار
- `.callout--example`: مثال
- `.callout--mistake`: اشتباه رایج

برای عنوان داخلی از `.callout__title` استفاده کن.

## اصول استفاده

- متن‌ها فارسی و راست‌چین بمانند.
- گزینه‌ها حداقل ۴۴ پیکسل ارتفاع داشته باشند.
- محتوا نباید عرض صفحه را افزایش دهد یا اسکرول افقی کل صفحه ایجاد کند.
- اجزا ابتدا روی فصل «مبانی شبکه» استفاده و آزمایش شوند؛ افزودن کلاس‌ها به‌تنهایی به معنی بازطراحی محتوای فصل نیست.
- از وابستگی، فونت یا CDN خارجی استفاده نشود.
