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
