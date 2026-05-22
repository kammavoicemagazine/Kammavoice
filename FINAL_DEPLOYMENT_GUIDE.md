# Kamma Voice — Production Android & Vercel Deployment Guide

This guide details the complete deployment process for the Kamma Voice platform, including the live Vercel web application and the native Android wrapper configuration.

---

## 1. Web Application Deployment (Vercel)

The Capacitor Android application acts as a high-performance shell that loads the live web application. Therefore, your Vercel deployment must be fully configured and optimized.

### Recommended Environment Variables (Vercel Dashboard)

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API Key | `AIzaSyA1...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `kammavoice-app.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID | `kammavoice-app` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `kammavoice-app.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Sender ID (FCM) | `8471928471...` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID | `1:8471928471:web:a1b2c3d4` |
| `GEMINI_API_KEY` | Google Gemini AI Key | `AIzaSyD...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Name | `kammavoice-media` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `1847192847...` |
| `CLOUDINARY_API_SECRET` | Cloudinary Secret | `a1b2c3d4e5...` |
| `ADMIN_SECRET_KEY` | Admin Secret Key (Auth) | `YOUR_SECURE_TOKEN` |

### Production Deployment Command
To deploy changes to the live URL:
```bash
# Push changes to GitHub main branch to trigger Vercel deployment
git add .
git commit -m "chore: android app compilation fixes and native bridge optimizations"
git push origin main
```

---

## 2. Deep Linking Verification (App Links)

To support deep linking (opening `https://kammavoicemmag.vercel.app/news/*` or `https://www.kammavoice.com/magazine/*` directly in the Android app instead of the web browser), you must host an `assetlinks.json` file.

### Step 1: Generate SHA-256 fingerprint
Generate your release SHA-256 fingerprint from your keystore:
```bash
keytool -list -v -keystore /path/to/kammavoice-release.keystore -alias kammavoice -storepass YOUR_STORE_PASS
```

### Step 2: Configure `public/.well-known/assetlinks.json`
Update the file in your Next.js project's `public/.well-known/assetlinks.json` to include the fingerprint:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.kammavoice.app",
      "sha256_cert_fingerprints": [
        "YOUR_RELEASE_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

---

## 3. Automation Cron Jobs

The Kamma Voice platform contains background workers that run automatically. You must configure external cron triggers (like Vercel Cron or a third-party scheduler) to query the aggregation and social automation API endpoints.

### 1. News Aggregation Cron
- **Endpoint**: `https://kammavoicemmag.vercel.app/api/cron/aggregate`
- **Schedule**: Every 30 minutes (`*/30 * * * *`)
- **Headers**: Authorization header matching your `ADMIN_SECRET_KEY` if secured.

### 2. AI Social Publishing Cron
- **Endpoint**: `https://kammavoicemmag.vercel.app/api/cron/social-publishing`
- **Schedule**: Every 2 hours (`0 */2 * * *`)

---

## 4. WebView Custom Configurations

Capacitor configures the WebView automatically, but we have injected custom optimizations in `android/app/src/main/AndroidManifest.xml` and `capacitor.config.ts`:

1. **Hardware Acceleration**: Enabled natively (`android:hardwareAccelerated="true"`) to make magazine page-flip transitions run at a buttery 60 FPS.
2. **Offline Resilience**: Built-in connectivity listener detects offline status and displays a premium ambient-glow retry interface instead of default webview browser errors.
3. **No Cleartext Traffic**: Block all non-HTTPS requests (`android:usesCleartextTraffic="false"`) for robust security.
