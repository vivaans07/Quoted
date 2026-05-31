// ── Supabase cloud sync, auth, and estimate sharing ────────────────────────
//
// All calls are fail-soft: any network/auth failure quietly returns null/false
// so the app keeps working entirely from local AsyncStorage.
//
// Auth notes:
//   - When SUPABASE_ANON_KEY is absent, cloudEnabled = false and every function
//     is a no-op. The app runs local-only with no errors.
//   - Once the key is set and a user signs in, every push/pull is scoped to
//     that user's rows via RLS (auth.uid() = user_id).
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, DEMO_EMAIL, DEMO_PASSWORD } from './config';

export const cloudEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Demo auto-login is available only when cloud is on AND demo creds are set.
export const demoLoginEnabled = Boolean(cloudEnabled && DEMO_EMAIL && DEMO_PASSWORD);

const APP_STATE_TABLE = 'app_state';
const SHARES_TABLE = 'shared_estimates';

const supabase: SupabaseClient | null = cloudEnabled
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}

/** Subscribe to auth state changes. Returns an unsubscribe function. */
export function onAuthChange(cb: (session: Session | null) => void): () => void {
  if (!supabase) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(session);
  });
  return () => subscription.unsubscribe();
}

export async function signIn(email: string, password: string): Promise<Session | null> {
  if (!supabase) throw new Error('Cloud not configured — add EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile/.env');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signUp(email: string, password: string): Promise<Session | null> {
  if (!supabase) throw new Error('Cloud not configured — add EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile/.env');
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    // If the only problem is email delivery (confirmation email), the account was
    // still created — just sign in directly instead of surfacing a confusing error.
    const msg = (error.message ?? '').toLowerCase();
    if (msg.includes('email') || msg.includes('confirmation') || msg.includes('smtp')) {
      return signIn(email, password);
    }
    throw error;
  }

  // Account created but email confirmation is still ON (no session yet) — sign in
  // so the user lands in the app immediately without needing to check their inbox.
  if (!data.session && data.user) {
    try { return await signIn(email, password); } catch { return null; }
  }

  return data.session;
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/**
 * Silently sign into the demo account so a public demo skips the login screen.
 * Returns true on success. Never throws — falls back to the normal login flow.
 */
export async function tryDemoLogin(): Promise<boolean> {
  if (!supabase || !demoLoginEnabled) return false;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    return !error && Boolean(data.session);
  } catch {
    return false;
  }
}

// ── App-state sync ────────────────────────────────────────────────────────────

/** Fetch a single key's JSON from the cloud. Returns null when unavailable. */
export async function pull<T>(key: string): Promise<T | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(APP_STATE_TABLE)
      .select('data')
      .eq('key', key)
      .maybeSingle();
    if (error || !data) return null;
    return (data.data as T) ?? null;
  } catch {
    return null;
  }
}

/** Upsert a key's JSON to the cloud. Fire-and-forget; never throws. */
export async function push<T>(key: string, value: T): Promise<void> {
  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // unauthenticated — skip silently
    await supabase
      .from(APP_STATE_TABLE)
      .upsert(
        { user_id: user.id, key, data: value, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,key' },
      );
  } catch {
    // local storage remains source of truth
  }
}

/** Remove all synced rows (used by "Reset app"). */
export async function clearCloud(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase
      .from(APP_STATE_TABLE)
      .delete()
      .in('key', ['company', 'customers', 'quotes']);
  } catch {
    // ignore
  }
}

// ── Estimate sharing ──────────────────────────────────────────────────────────

export async function createShare(params: {
  shareId: string;
  quoteId: string;
  estimate: object;
  customerName?: string | null;
  companyName: string;
  companyPhone?: string | null;
  companyOwner?: string | null;
}): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from(SHARES_TABLE).insert({
      id: params.shareId,
      user_id: user?.id ?? null,
      quote_id: params.quoteId,
      estimate: params.estimate,
      customer_name: params.customerName ?? null,
      company_name: params.companyName,
      company_phone: params.companyPhone ?? null,
      company_owner: params.companyOwner ?? null,
      status: 'sent',
    });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Given a list of shareIds, returns the set of quote IDs whose estimate has
 * been opened by the customer. Used to flip quotes from 'sent' → 'opened'.
 */
export async function getOpenedQuoteIds(shareIds: string[]): Promise<Set<string>> {
  if (!supabase || !shareIds.length) return new Set();
  try {
    const { data } = await supabase
      .from(SHARES_TABLE)
      .select('quote_id')
      .in('id', shareIds)
      .not('opened_at', 'is', null);
    return new Set((data || []).map((r) => r.quote_id as string));
  } catch {
    return new Set();
  }
}

export interface ShareState {
  quoteId: string;
  status: 'sent' | 'opened' | 'accepted';
  message: string | null; // customer question, if any
}

/**
 * Richer sync: for each share, report whether the customer opened it, accepted
 * it, and whether they left a question. Used to advance quote status and surface
 * customer messages back to the contractor.
 */
export async function getShareStates(shareIds: string[]): Promise<ShareState[]> {
  if (!supabase || !shareIds.length) return [];
  try {
    const { data } = await supabase
      .from(SHARES_TABLE)
      .select('quote_id, status, opened_at, accepted_at, customer_message')
      .in('id', shareIds);
    return (data || []).map((r) => {
      const accepted = !!r.accepted_at || r.status === 'accepted';
      const opened = accepted || !!r.opened_at || r.status === 'opened';
      return {
        quoteId: r.quote_id as string,
        status: accepted ? 'accepted' : opened ? 'opened' : 'sent',
        message: (r.customer_message as string) ?? null,
      };
    });
  } catch {
    return [];
  }
}
