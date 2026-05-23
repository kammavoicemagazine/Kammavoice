# Kamma Voice — Premium Mobile App Testing Checklist

This checklist contains all verification steps that must be executed to ensure the native Android shell, bottom navigation app shell, service worker caching, and native plugins behave flawlessly on physical devices and emulators.

---

## 1. Cinematic Animated Splash Screen
* [ ] **Intro Flow Validation**: Force close and relaunch the app. Verify that the client-side animated intro splash screen mounts immediately with a gold gradient brand logo (`KV`), slow-glow ambient pulsing, and loading text.
* [ ] **Native Hand-off**: Verify that the native Android launch screen hides within `100ms`, passing control to the smooth client-side CSS/Framer-motion intro.
* [ ] **Auto Dismiss**: Confirm that the intro fades out beautifully after exactly `2.5 seconds` with a smooth transition, revealing the Home screen.

---

## 2. Persistent Bottom Navigation App Shell
* [ ] **Native Bar Visibility**: Confirm that the Bottom Navigation Bar (Home, Magazines, News, Videos, Menu) is visible on mobile viewport sizes (< 1024px) and native platform wrappers.
* [ ] **Tab Navigation Transitions**: Tap each tab. Verify that the active tab indicator line glows gold and animates smoothly to the clicked tab position.
* [ ] **Haptic Feedbacks**: Verify that tapping tabs triggers a light native haptic vibration on real Android devices.
* [ ] **Bottom Sheet Drawer**: Tap the "Menu" tab. Verify that a premium, gesture-friendly dark luxury modal slides up from the bottom with options for About Us, Privacy, and Admin Dashboard. Verify tapping backdrop closes it.

---

## 3. Offline Service Worker Caching
* [ ] **Offline Loading**: Load the app with internet active, then enable Flight Mode. Reload the app. Verify that the homepage, cached scripts, and CSS load from the Service Worker cache.
* [ ] **Native Offline Alert Screen**: Disconnect internet and navigate to an uncached path. Verify that the custom premium offline screen with the gold-glowing retry button appears instead of Chromium's default browser errors.
* [ ] **Cache Reconnection**: Re-enable Wi-Fi/data. Click "Retry Connection". Verify that the app refreshes, queries Firestore, and restores normal functionality.

---

## 4. Native Plugins Verification
* [ ] **Native Sharing Dialog**: Open any news article page. Tap the share icon. Verify that the native Android Share sheet pops up displaying the article title, excerpt, and URL.
* [ ] **Push Notification Permissions**: Launch the app for the first time. Confirm that the native Android push notification permission prompt is displayed.
* [ ] **FCM Token Registration**: Verify that granting permission registers the device with Firebase Cloud Messaging, prints the FCM token in logs, and saves the token securely into the Firestore `pushTokens` collection.

---

## 5. Viewport Fit & Safe Areas
* [ ] **Camera Cutouts / Notches**: Verify that neither the top header nor the bottom navigation bar overlaps with camera notches, status indicators, or system navigation bars.
* [ ] **Tap Highlight Override**: Tap elements rapidly. Confirm that the default blue webview highlight is disabled (`-webkit-tap-highlight-color: transparent`).
* [ ] **Text Selection Prevention**: Attempt to long-press text on lists, buttons, or navigation tabs. Verify that text selection is disabled globally to retain a native app feel.

---

## 6. Magazine Flipbook & Video players
* [ ] **Frame Rate Performance**: View a magazine issue. Verify that the page-flip animation runs at a stable 60 FPS under native hardware acceleration.
* [ ] **Immersive Viewport**: Open a magazine. Check that the Android status bar auto-hides for fullscreen reading, and re-appears when closing the magazine reader.
