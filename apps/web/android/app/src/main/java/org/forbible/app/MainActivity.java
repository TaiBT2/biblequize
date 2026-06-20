package org.forbible.app;

import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /**
     * Clear the WebView HTTP cache on every cold start.
     *
     * <p>Capacitor serves the bundled web app from local assets. The Android
     * WebView can keep an old copy of {@code index.html} + hashed CSS/JS in its
     * HTTP cache across app updates, so a fresh APK would occasionally render a
     * stale bundle (e.g. the previous layout) until the cache was cleared by
     * hand. Wiping the cache here guarantees each launch loads the shipped
     * assets. Runs on cold start only (onCreate), not on background resume, and
     * the assets are local so the re-read is cheap; within-session caching
     * still works normally.
     */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.clearCache(true);
        }
    }
}
