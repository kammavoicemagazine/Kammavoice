# Kamma Voice — Android App Build & Play Store Deployment Guide

## Prerequisites

- **Node.js**: v18+ installed
- **Android Studio**: Latest stable version installed
- **Java JDK**: 17+ (bundled with Android Studio or installed separately)
- **Android SDK**: API 34 (installed via Android Studio SDK Manager)

---

## 1. Development Setup

### Install Dependencies
```bash
npm install
```

### Sync Capacitor with Android
```bash
npm run cap:sync
```

### Open in Android Studio
```bash
npm run cap:open
```

### Run on Connected Device / Emulator
```bash
npm run cap:run
```

---

## 2. Testing the App

### On Android Emulator
1. Open Android Studio
2. Create an AVD (Android Virtual Device) with **API 34** and **Google Play Services**
3. Run `npm run cap:run` or click the green play button in Android Studio

### On Physical Device
1. Enable **Developer Options** on your Android device
2. Enable **USB Debugging**
3. Connect via USB
4. Run `npm run cap:run`

### Live URL Verification Checklist
- [ ] Homepage loads with cinematic dark luxury UI
- [ ] Magazine reader opens and flipbook works
- [ ] AI translation overlays display correctly
- [ ] Admin dashboard is accessible at `/admin`
- [ ] Article detail pages render with full content
- [ ] Offline screen appears when internet is disconnected
- [ ] Back button navigates correctly (double-tap to exit at root)
- [ ] Pull-to-refresh reloads the page
- [ ] Status bar matches dark theme
- [ ] Splash screen displays and auto-hides

---

## 3. Generating a Release Keystore

**IMPORTANT**: Keep your keystore file safe. If you lose it, you cannot update your app on Google Play.

```bash
keytool -genkeypair -v -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -alias kammavoice \
  -keystore kammavoice-release.keystore \
  -dname "CN=Kamma Voice, OU=Engineering, O=Kamma Voice Media, L=Vijayawada, ST=Andhra Pradesh, C=IN"
```

Place the keystore file somewhere secure (NOT inside the repository).

---

## 4. Configuring Signing in Gradle

Edit `android/app/build.gradle` and add your signing config:

```groovy
android {
    signingConfigs {
        release {
            storeFile file('/path/to/kammavoice-release.keystore')
            storePassword 'YOUR_STORE_PASSWORD'
            keyAlias 'kammavoice'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

> **Security Note**: For CI/CD, use environment variables or a `keystore.properties` file (excluded from git) instead of hardcoding passwords.

---

## 5. Building the Release Bundle (.aab)

### Option A: Command Line
```bash
# Navigate to android directory
cd android

# Build release AAB
./gradlew bundleRelease

# The signed AAB will be at:
# android/app/build/outputs/bundle/release/app-release.aab
```

### Option B: Android Studio
1. Open the `android/` project in Android Studio
2. Go to **Build → Generate Signed App Bundle / APK**
3. Select **Android App Bundle**
4. Choose your keystore and enter credentials
5. Select **release** build variant
6. Click **Finish**

---

## 6. Google Play Console Submission

### Required Assets
- **App Icon**: 512x512 PNG (high-res)
- **Feature Graphic**: 1024x500 PNG
- **Screenshots**: At least 2 phone screenshots (minimum 320px, maximum 3840px per side)
- **Short Description**: Max 80 characters
- **Full Description**: Max 4000 characters

### Suggested Store Listing

**App Name**: Kamma Voice

**Short Description**: 
AI-powered Telugu media platform with multilingual magazines, news & community stories.

**Full Description**:
Kamma Voice is a premium AI-powered digital media platform serving the Telugu-speaking community worldwide.

Features:
• Multilingual Magazine Reader — Read Telugu magazines with instant AI translations to English, Kannada, and Tamil
• Breaking News & Community Stories — Stay updated with the latest Telugu community news from Andhra Pradesh, Telangana, and the NRI diaspora
• AI-Powered Translations — Gemini AI automatically translates magazine pages with high-accuracy OCR
• Cinematic Dark Theme — Premium, immersive reading experience designed for extended sessions
• Community Directory — Discover leaders, businesses, and events across districts
• Completely Free — No login required, no paywalls, fully open access

**Category**: News & Magazines

**Content Rating**: Everyone

**Privacy Policy URL**: https://kammavoicemmag.vercel.app/privacy

---

## 7. App Versioning

Update version numbers before each release in two places:

### package.json
```json
{
  "version": "1.0.0"
}
```

### android/app/build.gradle
```groovy
android {
    defaultConfig {
        versionCode 1        // Increment by 1 for each Play Store upload
        versionName "1.0.0"  // Human-readable version
    }
}
```

---

## 8. Release Checklist

- [ ] Privacy policy is live at `/privacy`
- [ ] App icon is configured (adaptive icon with foreground + background layers)
- [ ] Splash screen shows dark luxury branding
- [ ] All Capacitor plugins are synced (`npm run cap:sync`)
- [ ] Release keystore is generated and securely stored
- [ ] `build.gradle` signing config points to the correct keystore
- [ ] `versionCode` is incremented from the last upload
- [ ] Release AAB is built and tested on a physical device
- [ ] Store listing assets (icon, screenshots, feature graphic) are prepared
- [ ] Short and full descriptions are finalized
- [ ] Content rating questionnaire is completed in Play Console
- [ ] App is tested on at least 2 different Android versions (API 24+ recommended)

---

## Quick Reference Commands

| Command | Description |
| :--- | :--- |
| `npm run cap:sync` | Sync web assets + plugins to Android project |
| `npm run cap:open` | Open Android Studio with the project |
| `npm run cap:run` | Build and run on connected device/emulator |
| `npm run cap:build` | Sync + open Android Studio for building |
| `cd android && ./gradlew bundleRelease` | Build signed release AAB |
| `cd android && ./gradlew assembleDebug` | Build debug APK for testing |
