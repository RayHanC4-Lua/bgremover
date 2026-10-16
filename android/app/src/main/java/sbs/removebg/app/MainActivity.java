package sbs.removebg.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;

import java.io.OutputStream;

public class MainActivity extends Activity {
    private static final String HOST = "removebg.sbs";
    private static final String START_URL = "https://removebg.sbs/?source=app";
    private static final String OFFLINE_URL = "file:///android_asset/offline.html";
    private static final int REQ_PICK = 41;
    private static final int REQ_SAVE = 42;

    private FrameLayout root;
    private WebView web;
    private ValueCallback<Uri[]> pendingPick;
    private byte[] pendingBytes;
    private OnBackInvokedCallback backCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        root = new FrameLayout(this);
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(root);

        if (Build.VERSION.SDK_INT >= 35) {
            root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
                @Override
                public WindowInsets onApplyWindowInsets(View v, WindowInsets insets) {
                    Insets i = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                    v.setPadding(i.left, i.top, i.right, i.bottom);
                    return WindowInsets.CONSUMED;
                }
            });
        }

        int night = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        applyTheme(night == Configuration.UI_MODE_NIGHT_YES);

        setupWebView();
        setupBack();

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            web.loadUrl(START_URL);
        }
    }

    private void setupWebView() {
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setUserAgentString(s.getUserAgentString() + " BGRemoverApp/" + versionName());

        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setLongClickable(false);
        web.setHapticFeedbackEnabled(false);
        web.setOnLongClickListener(new View.OnLongClickListener() {
            @Override
            public boolean onLongClick(View v) {
                return true;
            }
        });

        web.addJavascriptInterface(new Bridge(), "AndroidApp");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if ("https".equals(u.getScheme()) && HOST.equals(u.getHost())) {
                    return false;
                }
                openExternal(u);
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    view.loadUrl(OFFLINE_URL);
                }
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (pendingPick != null) {
                    pendingPick.onReceiveValue(null);
                }
                pendingPick = callback;
                Intent intent;
                if (Build.VERSION.SDK_INT >= 33) {
                    intent = new Intent(MediaStore.ACTION_PICK_IMAGES);
                    intent.setType("image/*");
                } else {
                    intent = new Intent(Intent.ACTION_GET_CONTENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType("image/*");
                }
                try {
                    startActivityForResult(intent, REQ_PICK);
                } catch (ActivityNotFoundException e) {
                    pendingPick = null;
                    callback.onReceiveValue(null);
                    return false;
                }
                return true;
            }
        });
    }

    private void setupBack() {
        if (Build.VERSION.SDK_INT >= 33) {
            backCallback = new OnBackInvokedCallback() {
                @Override
                public void onBackInvoked() {
                    goBackOrFinish();
                }
            };
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    OnBackInvokedDispatcher.PRIORITY_DEFAULT, backCallback);
        }
    }

    private void goBackOrFinish() {
        String url = web.getUrl();
        if (web.canGoBack() && !OFFLINE_URL.equals(url)) {
            web.goBack();
        } else {
            finish();
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        goBackOrFinish();
    }

    private void openExternal(Uri u) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, u));
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "No app can open this link", Toast.LENGTH_SHORT).show();
        }
    }

    @SuppressWarnings("deprecation")
    private void applyTheme(boolean dark) {
        int bg = dark ? 0xFF0F1115 : 0xFFFFFFFF;
        root.setBackgroundColor(bg);
        web.setBackgroundColor(bg);
        Window w = getWindow();
        if (Build.VERSION.SDK_INT < 35) {
            w.setStatusBarColor(bg);
            w.setNavigationBarColor(bg);
        }
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = w.getInsetsController();
            if (c != null) {
                int mask = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                        | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                c.setSystemBarsAppearance(dark ? 0 : mask, mask);
            }
        } else {
            View d = w.getDecorView();
            int flags = d.getSystemUiVisibility();
            int light = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= 26) {
                light |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
            flags = dark ? (flags & ~light) : (flags | light);
            d.setSystemUiVisibility(flags);
        }
    }

    private String versionName() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "1";
        }
    }

    private void saveImage(byte[] bytes, String mime, String name) {
        if (Build.VERSION.SDK_INT >= 29) {
            ContentResolver r = getContentResolver();
            ContentValues v = new ContentValues();
            v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
            v.put(MediaStore.MediaColumns.MIME_TYPE, mime);
            v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/BG Remover");
            v.put(MediaStore.MediaColumns.IS_PENDING, 1);
            Uri uri = null;
            try {
                uri = r.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);
                if (uri == null) throw new Exception("insert failed");
                OutputStream out = r.openOutputStream(uri);
                if (out == null) throw new Exception("stream failed");
                out.write(bytes);
                out.close();
                v.clear();
                v.put(MediaStore.MediaColumns.IS_PENDING, 0);
                r.update(uri, v, null, null);
                notifyWeb(true);
                Toast.makeText(this, "Saved to Gallery (Pictures/BG Remover)", Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                if (uri != null) r.delete(uri, null, null);
                notifyWeb(false);
                Toast.makeText(this, "Could not save image", Toast.LENGTH_SHORT).show();
            }
        } else {
            pendingBytes = bytes;
            Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.setType(mime);
            i.putExtra(Intent.EXTRA_TITLE, name);
            try {
                startActivityForResult(i, REQ_SAVE);
            } catch (ActivityNotFoundException e) {
                pendingBytes = null;
                notifyWeb(false);
            }
        }
    }

    private void notifyWeb(boolean ok) {
        web.evaluateJavascript("window.dispatchEvent(new CustomEvent('app-saved',{detail:" + ok + "}))", null);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_PICK) {
            Uri[] result = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                result = new Uri[]{data.getData()};
            }
            if (pendingPick != null) {
                pendingPick.onReceiveValue(result);
                pendingPick = null;
            }
        } else if (requestCode == REQ_SAVE) {
            byte[] bytes = pendingBytes;
            pendingBytes = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null && bytes != null) {
                try {
                    OutputStream out = getContentResolver().openOutputStream(data.getData());
                    if (out == null) throw new Exception("stream failed");
                    out.write(bytes);
                    out.close();
                    notifyWeb(true);
                    Toast.makeText(this, "Image saved", Toast.LENGTH_SHORT).show();
                } catch (Exception e) {
                    notifyWeb(false);
                    Toast.makeText(this, "Could not save image", Toast.LENGTH_SHORT).show();
                }
            } else {
                notifyWeb(false);
            }
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }

    @Override
    protected void onPause() {
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (Build.VERSION.SDK_INT >= 33 && backCallback != null) {
            getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback(backCallback);
        }
        web.destroy();
        super.onDestroy();
    }

    public class Bridge {
        @JavascriptInterface
        public void saveImage(String base64, String mime, String name) {
            final byte[] bytes;
            try {
                bytes = Base64.decode(base64, Base64.DEFAULT);
            } catch (IllegalArgumentException e) {
                return;
            }
            final String m = mime == null || mime.isEmpty() ? "image/png" : mime;
            final String n = name == null || name.isEmpty() ? "bg-remover.png" : name;
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    MainActivity.this.saveImage(bytes, m, n);
                }
            });
        }

        @JavascriptInterface
        public void setTheme(final String theme) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    applyTheme("dark".equals(theme));
                }
            });
        }

        @JavascriptInterface
        public String version() {
            return versionName();
        }
    }
}
