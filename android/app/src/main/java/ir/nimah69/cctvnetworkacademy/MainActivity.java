package ir.nimah69.cctvnetworkacademy;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import androidx.webkit.WebViewAssetLoader;
import org.json.JSONArray;
import org.json.JSONException;
import android.webkit.WebBackForwardList;
import android.widget.Toast;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final int REQUEST_CREATE_DOCUMENT = 501;
    private static final int REQUEST_FILE_CHOOSER = 502;
    private static final String APP_ASSET_HOST = "appassets.androidplatform.net";
    private static final String APP_ASSET_BASE_URL = "https://" + APP_ASSET_HOST + "/assets/academy/";
    private static final String MIGRATION_PREFS = "academy_progress_migration";
    private static final String MIGRATION_COMPLETE = "legacy_progress_migration_complete";
    private static final String MIGRATION_DATA = "legacy_progress_migration_data";
    private static final String PROGRESS_KEY_PREFIX = "cctvAcademyProgress";

    private WebView webView;
    private WebViewAssetLoader assetLoader;
    private volatile boolean migrationMode;
    private volatile boolean trustedAppPage;
    private String pendingFileContent;
    private ValueCallback<Uri[]> fileChooserCallback;

    public final class AndroidBridge {
        private SharedPreferences migrationPreferences() {
            return getSharedPreferences(MIGRATION_PREFS, MODE_PRIVATE);
        }

        @JavascriptInterface
        public boolean isLegacyProgressMigrationNeeded() {
            return trustedAppPage && !migrationPreferences().getBoolean(MIGRATION_COMPLETE, false);
        }

        @JavascriptInterface
        public String getPendingLegacyProgress() {
            return trustedAppPage ? migrationPreferences().getString(MIGRATION_DATA, null) : null;
        }

        @JavascriptInterface
        public void storeLegacyProgress(final String rawJson) {
            if (!trustedAppPage) return;
            JSONArray safeEntries = new JSONArray();
            try {
                JSONArray entries = new JSONArray(rawJson == null ? "[]" : rawJson);
                for (int i = 0; i < entries.length(); i++) {
                    JSONArray entry = entries.optJSONArray(i);
                    if (entry == null || entry.length() < 2) continue;
                    String key = entry.optString(0, "");
                    Object value = entry.opt(1);
                    if (key.startsWith(PROGRESS_KEY_PREFIX) && value instanceof String) {
                        JSONArray safeEntry = new JSONArray();
                        safeEntry.put(key);
                        safeEntry.put(value);
                        safeEntries.put(safeEntry);
                    }
                }
            } catch (JSONException ignored) {
                safeEntries = new JSONArray();
            }
            migrationPreferences().edit().putString(MIGRATION_DATA, safeEntries.toString()).apply();
        }

        @JavascriptInterface
        public void clearPendingLegacyProgress() {
            if (!trustedAppPage) return;
            migrationPreferences().edit().remove(MIGRATION_DATA).apply();
        }

        @JavascriptInterface
        public void finishLegacyProgressMigration() {
            if (!trustedAppPage) return;
            runOnUiThread(() -> {
                migrationPreferences().edit().putBoolean(MIGRATION_COMPLETE, true).apply();
                migrationMode = false;
                trustedAppPage = true;
                if (webView != null) {
                    webView.getSettings().setAllowFileAccess(false);
                    webView.loadUrl(APP_ASSET_BASE_URL + "index.html");
                }
            });
        }

        @JavascriptInterface
        public void saveTextFile(final String fileName, final String mimeType, final String content) {
            if (!trustedAppPage) return;
            runOnUiThread(() -> {
                String safeName = (fileName == null || fileName.trim().isEmpty())
                        ? "download.txt" : fileName.replace("/", "_").replace("\\", "_");
                String safeMimeType = (mimeType == null || mimeType.trim().isEmpty())
                        ? "application/octet-stream" : mimeType;
                pendingFileContent = content == null ? "" : content;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType(safeMimeType);
                intent.putExtra(Intent.EXTRA_TITLE, safeName);
                try {
                    startActivityForResult(intent, REQUEST_CREATE_DOCUMENT);
                } catch (ActivityNotFoundException exception) {
                    pendingFileContent = null;
                    Toast.makeText(MainActivity.this, "ذخیره فایل در این دستگاه در دسترس نیست.", Toast.LENGTH_LONG).show();
                }
            });
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        webView = new WebView(this);
        setContentView(webView);

        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        boolean migrationPending = !getSharedPreferences(MIGRATION_PREFS, MODE_PRIVATE).getBoolean(MIGRATION_COMPLETE, false);
        migrationMode = migrationPending;
        webView.getSettings().setAllowFileAccess(migrationPending);
        webView.getSettings().setAllowFileAccessFromFileURLs(false);
        webView.getSettings().setAllowUniversalAccessFromFileURLs(false);
        webView.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        webView.getSettings().setAllowContentAccess(false);
        webView.getSettings().setSupportZoom(false);
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams fileChooserParams) {
                if (fileChooserCallback != null) {
                    fileChooserCallback.onReceiveValue(null);
                    fileChooserCallback = null;
                }
                fileChooserCallback = callback;
                try {
                    Intent intent = fileChooserParams.createIntent();
                    startActivityForResult(intent, REQUEST_FILE_CHOOSER);
                    return true;
                } catch (RuntimeException exception) {
                    fileChooserCallback.onReceiveValue(null);
                    fileChooserCallback = null;
                    return false;
                }
            }
        });
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                boolean secureAssetPage = url != null && url.startsWith(APP_ASSET_BASE_URL);
                boolean allowedLegacyMigrationPage = migrationMode && url != null && url.startsWith("file:///android_asset/academy/");
                trustedAppPage = secureAssetPage || allowedLegacyMigrationPage;
            }

            @Override
            public android.webkit.WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                String path = url.getPath();
                if (APP_ASSET_HOST.equalsIgnoreCase(url.getHost())
                        && path != null && path.startsWith("/assets/") && !path.contains("..")) {
                    return assetLoader.shouldInterceptRequest(url);
                }
                return null;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri target = request.getUrl();
                String scheme = target.getScheme();
                String path = target.getPath();
                if ("https".equalsIgnoreCase(scheme)
                        && APP_ASSET_HOST.equalsIgnoreCase(target.getHost())
                        && path != null && path.startsWith("/assets/academy/")
                        && !path.contains("..")) {
                    return false;
                }
                if ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme)) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, target));
                    } catch (ActivityNotFoundException exception) {
                        Toast.makeText(MainActivity.this, "مرورگر مناسبی برای بازکردن لینک پیدا نشد.", Toast.LENGTH_SHORT).show();
                    }
                }
                return true;
            }
        });

        if (migrationPending) {
            // Use the exact legacy URL once so its localStorage can be copied before switching origins.
            webView.loadUrl("file:///android_asset/academy/index.html");
        } else if (savedInstanceState != null) {
            WebBackForwardList restored = webView.restoreState(savedInstanceState);
            String restoredUrl = webView.getUrl();
            if (restored == null || restored.getSize() == 0
                    || restoredUrl == null || !restoredUrl.startsWith(APP_ASSET_BASE_URL)) {
                webView.loadUrl(APP_ASSET_BASE_URL + "index.html");
            }
        } else {
            webView.loadUrl(APP_ASSET_BASE_URL + "index.html");
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_FILE_CHOOSER) {
            if (fileChooserCallback != null) {
                Uri[] results = resultCode == RESULT_OK && data != null
                        ? WebChromeClient.FileChooserParams.parseResult(resultCode, data) : null;
                fileChooserCallback.onReceiveValue(results);
                fileChooserCallback = null;
            }
            return;
        }
        if (requestCode == REQUEST_CREATE_DOCUMENT) {
            String content = pendingFileContent;
            pendingFileContent = null;
            if (resultCode != RESULT_OK || data == null || data.getData() == null) return;
            try (OutputStream output = getContentResolver().openOutputStream(data.getData())) {
                if (output == null) throw new IOException("Unable to open selected document");
                output.write((content == null ? "" : content).getBytes(StandardCharsets.UTF_8));
                Toast.makeText(this, "فایل پیشرفت ذخیره شد.", Toast.LENGTH_SHORT).show();
            } catch (IOException | SecurityException exception) {
                Toast.makeText(this, "ذخیره فایل انجام نشد؛ دوباره تلاش کن.", Toast.LENGTH_LONG).show();
            }
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView == null) {
            super.onBackPressed();
            return;
        }
        String currentUrl = webView.getUrl();
        if (currentUrl != null && currentUrl.startsWith(APP_ASSET_BASE_URL)
                && !currentUrl.endsWith("/workshops.html")) {
            webView.evaluateJavascript(
                    "(function(){return window.CCTVAcademyHandleBack ? window.CCTVAcademyHandleBack() : false})()",
                    value -> {
                        if ("true".equals(value)) return;
                        if (webView != null && webView.canGoBack()) webView.goBack();
                        else MainActivity.super.onBackPressed();
                    });
            return;
        }
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (fileChooserCallback != null) {
            fileChooserCallback.onReceiveValue(null);
            fileChooserCallback = null;
        }
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
