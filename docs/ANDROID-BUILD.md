# ساخت و رفتار نسخه اندروید آفلاین

## ساخت در CI

روش پیشنهادی برای کسی که فقط گوشی در اختیار دارد، دریافت Artifact با نام CCTV-Network-Academy-Offline-APK از اجرای موفق workflow «Build Offline Android APK» در GitHub Actions است.

## ساخت محلی روی Linux/macOS یا محیط WSL

پیش‌نیازها:
- JDK 17
- Android SDK با platform 35 و build-tools 35.0.0
- Gradle 8.7
- Node.js 20 برای اجرای تست‌ها

از ریشه مخزن اجرا کن:

```bash
for f in tests/*.mjs; do node "$f" || exit 1; done
bash scripts/bundle-android-assets.sh
gradle -p android --no-daemon clean assembleDebug
```

خروجی: android/app/build/outputs/apk/debug/app-debug.apk

اسکریپت bundle، فایل‌های HTML، آیکن‌ها و تمام ماژول‌های JavaScript را در android/app/src/main/assets/academy/ کپی می‌کند و حضور و یکسان‌بودن فایل‌های محلی را بررسی می‌کند. Workflow ساخت APK همین اسکریپت را اجرا می‌کند تا ساخت CI و روش محلی از هم جدا نشوند.

## رفتار WebView و امنیت

- مسیرهای file:///android_asset/academy/ داخل WebView می‌مانند؛ پیوندهای HTTP/HTTPS بیرونی با Intent در مرورگر دستگاه باز می‌شوند. Schemeهای ناشناخته مسدود می‌شوند.
- پشتیبان‌گیری خودکار Android غیرفعال است تا داده محلی برنامه ناخواسته در Backup سیستمی قرار نگیرد. کاربر می‌تواند از بخش «ادامه یادگیری» خروجی JSON پیشرفت بگیرد.
- targetSdk روی 34 قرار دارد و compileSdk روی 35 باقی می‌ماند؛ این انتخاب از فعال‌کردن اجباری رفتار edge-to-edge مربوط به target 35 در این پوسته تمام‌صفحه WebView اجتناب می‌کند. ارتقای بیشتر نیازمند آزمون چیدمان insetها روی Android جدید است.
- فونت Vazirmatn به‌صورت فایل محلی اضافه نشده است: مخزن منبع فونت و مجوز همراه آن را نداشت و برای پرهیز از افزودن فایل بدون تأیید مجوز، زنجیره فونت سیستمی حفظ شده است.
- Service Worker در حالت file:// اجرا نمی‌شود؛ ثبت آن در سایت HTTPS باقی می‌ماند. حضور فایل در APK برای نسخه وب بی‌ضرر است و روی رفتار آفلاین WebView تکیه نمی‌شود.
- موفقیت ساخت APK و بررسی امضای Debug در CI، جای آزمون نصب روی گوشی، حالت پرواز، Back و بازشدن پیوند بیرونی را نمی‌گیرد.
