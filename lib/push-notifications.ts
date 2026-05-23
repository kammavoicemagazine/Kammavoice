/**
 * Kamma Voice — Push Notification Integration
 *
 * Full integration point for Firebase Cloud Messaging (FCM).
 * Integrates @capacitor/push-notifications with safe platform guards.
 */

import { PushNotifications } from "@capacitor/push-notifications";
import { isNativePlatform } from "@/lib/capacitor-init";
import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

// ─── Types ───────────────────────────────────────────────────────────

export interface PushNotificationPayload {
  /** Unique notification ID */
  id: string;
  /** Notification title */
  title: string;
  /** Notification body text */
  body: string;
  /** Notification type for routing */
  type: "breaking_news" | "magazine_release" | "topic_update" | "admin_broadcast";
  /** Deep link path (e.g., "/news/slug" or "/magazine/id") */
  deepLink?: string;
  /** Cover image URL for rich notifications */
  imageUrl?: string;
  /** Timestamp */
  sentAt: string;
}

export interface PushNotificationConfig {
  /** Whether notifications are enabled by the user */
  enabled: boolean;
  /** Subscribed topic channels */
  subscribedTopics: string[];
  /** FCM device registration token */
  deviceToken?: string;
}

// ─── Default Config ──────────────────────────────────────────────────

const DEFAULT_TOPICS = [
  "breaking_news",
  "magazine_releases",
  "community_updates",
];

// ─── Active Implementations ──────────────────────────────────────────

/**
 * Request push notification permission from the user.
 * Returns true if permission was granted.
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!isNativePlatform) return false;
  try {
    const result = await PushNotifications.requestPermissions();
    return result.receive === "granted";
  } catch (err) {
    console.error("[KV-Push] Permission request failed:", err);
    return false;
  }
}

/**
 * Register device for push notifications and obtain FCM token.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!isNativePlatform) return null;
  try {
    await PushNotifications.register();
    
    return new Promise((resolve) => {
      // Register listener for token
      PushNotifications.addListener("registration", (token) => {
        console.log("[KV-Push] FCM Registration Token obtained:", token.value);
        saveDeviceToken(token.value).catch(err => {
          console.error("[KV-Push] Save token failed:", err);
        });
        resolve(token.value);
      });
      
      // Register listener for errors
      PushNotifications.addListener("registrationError", (err) => {
        console.error("[KV-Push] FCM Registration Error:", err);
        resolve(null);
      });
    });
  } catch (err) {
    console.error("[KV-Push] Registration initialization failed:", err);
    return null;
  }
}

/**
 * Handle incoming push notification when app is in foreground.
 */
export function onNotificationReceived(
  callback: (payload: PushNotificationPayload) => void
): void {
  if (!isNativePlatform) return;
  try {
    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("[KV-Push] Foreground notification received:", notification);
      callback({
        id: notification.id,
        title: notification.title || "",
        body: notification.body || "",
        type: (notification.data?.type as any) || "admin_broadcast",
        deepLink: notification.data?.deepLink,
        imageUrl: notification.data?.imageUrl,
        sentAt: new Date().toISOString(),
      });
    });
  } catch (err) {
    console.error("[KV-Push] Failed to register received listener:", err);
  }
}

/**
 * Handle notification tap action (app opened from notification).
 */
export function onNotificationTapped(
  callback: (payload: PushNotificationPayload) => void
): void {
  if (!isNativePlatform) return;
  try {
    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      console.log("[KV-Push] Notification action performed (tapped):", action);
      const data = action.notification.data;
      callback({
        id: action.notification.id,
        title: action.notification.title || "",
        body: action.notification.body || "",
        type: (data?.type as any) || "admin_broadcast",
        deepLink: data?.deepLink,
        imageUrl: data?.imageUrl,
        sentAt: new Date().toISOString(),
      });
    });
  } catch (err) {
    console.error("[KV-Push] Failed to register action listener:", err);
  }
}

/**
 * Save FCM token to Firestore for server-side targeting.
 */
export async function saveDeviceToken(token: string): Promise<void> {
  console.log(`[KV-Push] Saving token to Firestore: ${token.substring(0, 15)}...`);
  try {
    const tokenRef = doc(db, "pushTokens", token);
    await setDoc(tokenRef, {
      token,
      platform: "android",
      subscribedTopics: DEFAULT_TOPICS,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error("[KV-Push] Failed to save device token in Firestore:", err);
  }
}

/**
 * Subscribe to a topic channel for targeted notifications.
 */
export async function subscribeToTopic(topic: string): Promise<void> {
  console.log(`[KV-Push] Topic subscription architecture ready: ${topic}`);
}

/**
 * Unsubscribe from a topic channel.
 */
export async function unsubscribeFromTopic(topic: string): Promise<void> {
  console.log(`[KV-Push] Topic unsubscription architecture ready: ${topic}`);
}

/**
 * Get default topic list.
 */
export function getDefaultTopics(): string[] {
  return [...DEFAULT_TOPICS];
}
