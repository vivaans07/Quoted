// Where the Expo app reaches the Express AI backend.
// On a real iPhone via Expo Go, localhost won't work — point at the Mac's LAN IP.
// Override at runtime by setting EXPO_PUBLIC_API_URL in mobile/.env.

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://192.168.4.75:4000';

// ── Supabase cloud sync ────────────────────────────────────────────────
// URL + anon public key come from mobile/.env. When the anon key is empty
// the app stays local-only (AsyncStorage) and cloud calls are skipped.
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// ── RevenueCat in-app subscriptions ────────────────────────────────────
// Public SDK keys come from mobile/.env. There is one key per store — the
// iOS (Apple) key and the Android (Google) key are different. When the key
// for the running platform is empty, billing stays OFF and the app shows the
// static trial card (no crash, useful in Expo Go where IAP can't run anyway).
//
// RevenueCat Dashboard → Project Settings → API keys → "Public app-specific
// API keys". Use the Apple key for iOS, the Google key for Android.
export const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
export const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

// The entitlement identifier you create in RevenueCat (Dashboard → Entitlements).
// A customer who owns this entitlement is "Quoted Pro".
export const REVENUECAT_ENTITLEMENT =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT || 'pro';
