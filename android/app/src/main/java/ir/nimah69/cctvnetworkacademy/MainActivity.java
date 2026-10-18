package ir.nimah69.cctvnetworkacademy;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
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

    private WebView webView;
    private WebViewAssetLoader assetLoader;
    private String pendingFileContent;
    private ValueCallback<Uri[]> fileChooserCallback;

    public final class AndroidBridge {
        @JavascriptInterface
        public void saveTextFile(final String fileName, final String mimeType, final String content) {
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
        webView.getSettings().setAllowFileAccess(false);
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

        if (savedInstanceState != null) {
            WebBackForwardList restored = webView.restoreState(savedInstanceState);
            if (restored == null || restored.getSize() == 0) {
                webView.loadUrl(APP_ASSET_BASE_URL + "index.html");
            }
        } else {
            webView.loadUrl("file:///android_asset/academy/index.html");
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
