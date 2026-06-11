import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { isNativePlatform } from "./capacitor-init";

/**
 * Kamma Voice — Unified Haptic Feedback System
 * 
 * Provides native tactile feedback using the Capacitor Haptics plugin.
 * Automatically falls back to the HTML5 Vibration API on supporting browsers
 * and performs no-ops when not supported.
 */

/**
 * Light tap feedback for standard button taps, menu selections, and toggles.
 */
export async function triggerLightTap(): Promise<void> {
  if (isNativePlatform) {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (err) {
      console.warn("[Haptics] Light impact failed:", err);
    }
  } else if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(12);
    } catch {
      // Ignored (browsers block vibration without user gesture)
    }
  }
}

/**
 * Medium tap feedback for larger gestures or distinct actions.
 */
export async function triggerMediumTap(): Promise<void> {
  if (isNativePlatform) {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (err) {
      console.warn("[Haptics] Medium impact failed:", err);
    }
  } else if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(25);
    } catch {}
  }
}

/**
 * Success notification haptic feedback (double pulse).
 * Used when a magazine download finishes, translation completes, etc.
 */
export async function triggerSuccessHaptic(): Promise<void> {
  if (isNativePlatform) {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (err) {
      console.warn("[Haptics] Success notification failed:", err);
    }
  } else if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate([40, 50, 40]);
    } catch {}
  }
}

/**
 * Error notification haptic feedback (heavy vibration).
 * Used for network disconnection errors, failed downloads, etc.
 */
export async function triggerErrorHaptic(): Promise<void> {
  if (isNativePlatform) {
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (err) {
      console.warn("[Haptics] Error notification failed:", err);
    }
  } else if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate([100, 50, 100]);
    } catch {}
  }
}

/**
 * Selection tick haptic feedback (micro-vibration).
 * Used for scroll wheel ticks, carousel page turns, or fast adjustments.
 */
export async function triggerSelectionHaptic(): Promise<void> {
  if (isNativePlatform) {
    try {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
    } catch (err) {
      console.warn("[Haptics] Selection haptic failed:", err);
    }
  } else if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(8);
    } catch {}
  }
}
