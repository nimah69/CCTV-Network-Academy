# ساخت نسخه آفلاین اندروید

## ساخت خودکار
GitHub Actions در گردش‌کار offline-apk-ci.yml تست‌های tests/*.mjs را اجرا می‌کند، سپس scripts/bundle-android-assets.sh را برای کپی دقیق فایل‌های سایت به Android assets اجرا می‌کند و APK را می‌سازد و اعتبارسنجی می‌کند.

## ساخت محلی
پیش‌نیازها: JDK 17، Android SDK با platform 35 و build-tools 35.0.0، Gradle سازگار با Android Gradle Plugin موجود، و Node.js 20 برای اجرای تست‌ها.

از ریشه مخزن:
1. اجرای تست‌ها: for f in tests/*.mjs; do node "$f" || exit 1; done
2. اجرای بسته‌بندی: bash scripts/bundle-android-assets.sh
3. ورود به پوشه android و اجرای gradle assembleDebug
4. فایل معمولاً در android/app/build/outputs/apk/debug/app-debug.apk تولید می‌شود.

دستور محلی فقط وقتی معتبر است که Gradle و Android SDK نصب و متغیرهای محیطی آن‌ها تنظیم شده باشند؛ CI مسیر مرجع ساخت است.

## تصمیم‌های Android
- targetSdk به 34 ارتقا یافته است؛ این نسخه نسبت به target 35 ریسک تغییر اجباری edge-to-edge در Android 15 را کمتر می‌کند. رفتار نهایی باید روی WebView واقعی آزمایش شود.
- allowBackup=false است؛ پیشرفت در WebView محلی نگه‌داری می‌شود و برای انتقال باید از خروجی JSON داخل برنامه استفاده کرد.
- لینک‌های file:///android_asset/academy/ داخل WebView می‌مانند؛ لینک‌های HTTP/HTTPS با Intent در مرورگر خارجی باز می‌شوند. طرح‌های ناشناخته مسدود می‌شوند.
- Service Worker در file:// برای APK آفلاین مبنای cache نیست؛ فایل آن برای نسخه وب باقی مانده و در بسته فعلی بی‌ضرر است.
- آزمون روی گوشی واقعی و حالت پرواز از راه دور قابل انجام نیست و باید طبق چک‌لیست پذیرش اجرا شود.
