# Capacitor ProGuard Rules
-keep class com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keep class * extends com.getcapacitor.BridgeActivity { *; }
-keep class * extends com.getcapacitor.Bridge { *; }

# Cordova plugin support
-keep class org.apache.cordova.** { *; }
-keep class org.apache.cordova.Plugin { *; }

# Keep JavaScript Interface methods
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep reflection/metadata fields
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Suppress warnings
-dontwarn com.getcapacitor.**
-dontwarn org.apache.cordova.**

