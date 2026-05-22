# Kamma Voice — Mobile App Testing Checklist

This checklist contains all verification steps that must be executed to ensure the native Android shell and bridge behave flawlessly on physical devices and emulators.

---

## 1. Offline Handling & Resilience
* [ ] **Verify Flight Mode / Disconnect**: Turn off Wi-Fi/data. Open the app. Verify that the custom premium offline screen matching the dark luxury brand theme (#0A0A0A) appears instantly.
* [ ] **Verify Reconnect Button**: Turn Wi-Fi/data back on. Click the "Retry Connection" button. Verify the app reloads and successfully mounts the live webview.
* [ ] **No Default Browser Error**: Ensure that raw Chromium/system browser "No Internet Connection" or "DNS_PROBE_FINISHED_NO_INTERNET" screens never show.

---

## 2. Status Bar & UI Aesthetics
* [ ] **Theme Uniformity**: Check that the status bar has a dark background (`#0A0A0A`) with light/white icons to prevent visual jarring against the dark luxury interface.
* [ ] **Viewport Fit**: Verify that the Next.js header and contents do not clip beneath notched screens or status bars (ensured by `viewport-fit=cover` and CSS safe-area padding).
* [ ] **Tap Highlight**: Tap on interactive list items or cards. Confirm that the default blue Android tap highlight is absent (`-webkit-tap-highlight-color: transparent` optimization).

---

## 3. Back Button Navigation (Smart Exit)
* [ ] **History Traversal**: Navigate into multiple articles. Press the hardware back button. Verify the app navigates back through the history stack one step at a time.
* [ ] **Root Exit Toast**: Navigate to the homepage (root stack). Press the back button once. Verify that a custom toast message appears saying "Press back again to exit" and the app does not close.
* [ ] **Double-Tap Exit**: Tap back again within 2 seconds of the toast message. Verify that the app exits cleanly.

---

## 4. Pull-to-Refresh Gesture
* [ ] **Top Scroll Behavior**: Scroll to the absolute top of the page.
* [ ] **Trigger Reload**: Pull downward dynamically. Verify that the native reload is triggered, updating the feed with the latest content.

---

## 5. Magazine Immersive Reader
* [ ] **Fullscreen Immersive**: Open a magazine issue. Verify that the status bar hides automatically to enable fullscreen immersive reading.
* [ ] **Page Flip Physics**: Flip pages in the magazine. Verify that hardware acceleration (`android:hardwareAccelerated="true"`) is active and page-flipping transitions feel fluid.
* [ ] **Translation Overlays**: Toggle AI translation overlay. Verify that translations align correctly with the underlying columns and are responsive to zoom/pan.
* [ ] **Status Bar Restore**: Close the magazine reader. Verify that the status bar re-appears with the dark luxury branding.

---

## 6. Deep Linking (App Links)
Verify that deep links open the native app directly instead of launching the mobile browser. Run these commands using ADB:

### Verify News Article Link:
```bash
adb shell am start -W -a android.intent.action.VIEW -d "https://kammavoicemmag.vercel.app/news/sample-slug" com.kammavoice.app
```
* **Expected Result**: The Kamma Voice app launches and opens the news article details page directly.

### Verify Magazine Issue Link:
```bash
adb shell am start -W -a android.intent.action.VIEW -d "https://kammavoicemmag.vercel.app/magazine/sample-id" com.kammavoice.app
```
* **Expected Result**: The Kamma Voice app launches and opens the magazine reader view directly.

---

## 7. Versioning & Package Compliance
* [ ] **Unique Identifier**: Check that the build namespace is `com.kammavoice.app` (as specified in Gradle and AndroidManifest).
* [ ] **Version Code Alignment**: Verify `versionCode` in `build.gradle` is incremented.
* [ ] **ProGuard Minification**: Build the release variant and check that the generated `.aab` file size is minimized and optimized.
