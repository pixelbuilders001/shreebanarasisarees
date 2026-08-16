import { getFirebaseApp } from "./config";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import { isSupported } from "firebase/messaging";
import { supabase } from "../../data/supabase";

/**
 * Checks if the current browser environment supports Push Notifications and Firebase Messaging.
 */
export const isMessagingSupported = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!("PushManager" in window)) return false;

  try {
    const supported = await isSupported();
    return supported;
  } catch (e) {
    return false;
  }
};

/**
 * Safely retrieves the Firebase Messaging instance if supported.
 */
export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  const supported = await isMessagingSupported();
  if (!supported) return null;
  
  const app = getFirebaseApp();
  if (!app) return null;

  try {
    return getMessaging(app);
  } catch (err) {
    console.error("[FCM] Error initializing Firebase Messaging:", err);
    return null;
  }
};

/**
 * Generates an FCM registration token using the active service worker registration.
 */
export const getFCMToken = async (registration: ServiceWorkerRegistration): Promise<string | null> => {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.warn("[FCM] Messaging not supported on this browser.");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token;
  } catch (err) {
    console.error("[FCM] Error generating FCM token:", err);
    return null;
  }
};

/**
 * Subscribes to foreground push notifications.
 */
export const registerForegroundMessageHandler = async (
  onMsg: (payload: any) => void
): Promise<(() => void) | null> => {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("[FCM] Foreground message received:", payload);
      onMsg(payload);
    });
    return unsubscribe;
  } catch (err) {
    console.error("[FCM] Error registering foreground message handler:", err);
    return null;
  }
};

/**
 * Saves or updates an FCM token in Supabase associated with the optional user ID.
 */
export const saveFCMTokenToSupabase = async (token: string, userId: string | null): Promise<boolean> => {
  try {
    const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : "";
    const isMobile = /Mobi|Android|iPhone/i.test(userAgent);
    const deviceType = isMobile ? "mobile" : "desktop";

    // Check if token already exists in the database
    const { data: existing, error: selectError } = await supabase
      .from("push_tokens")
      .select("*")
      .eq("fcm_token", token)
      .maybeSingle();

    if (selectError) {
      console.error("[FCM] Error checking existing token in Supabase:", selectError);
    }

    const now = new Date().toISOString();

    if (existing) {
      // Update token row to associate with user, mark as active, and update device info
      const { error: updateError } = await supabase
        .from("push_tokens")
        .update({
          user_id: userId || existing.user_id || null,
          is_active: true,
          device_type: deviceType,
          user_agent: userAgent,
          updated_at: now,
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("[FCM] Error updating existing token in Supabase:", updateError);
        return false;
      }
    } else {
      // Insert a new token record
      const { error: insertError } = await supabase
        .from("push_tokens")
        .insert({
          id: crypto.randomUUID(),
          user_id: userId || null,
          fcm_token: token,
          device_type: deviceType,
          user_agent: userAgent,
          is_active: true,
          created_at: now,
          updated_at: now,
        });

      if (insertError) {
        console.error("[FCM] Error inserting new token in Supabase:", insertError);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error("[FCM] Exception in saveFCMTokenToSupabase:", err);
    return false;
  }
};

/**
 * Disables a token in Supabase by setting is_active = false.
 */
export const disableFCMTokenInSupabase = async (token: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("push_tokens")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("fcm_token", token);

    if (error) {
      console.error("[FCM] Error disabling token in Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[FCM] Exception in disableFCMTokenInSupabase:", err);
    return false;
  }
};

/**
 * Disassociates an FCM token from a user (e.g. on logout) to prevent notifications going to wrong sessions.
 */
export const disassociateFCMTokenInSupabase = async (token: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("push_tokens")
      .update({
        user_id: null,
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("fcm_token", token);

    if (error) {
      console.error("[FCM] Error disassociating token in Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[FCM] Exception in disassociateFCMTokenInSupabase:", err);
    return false;
  }
};
