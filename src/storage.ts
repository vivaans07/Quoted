import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Company, Customer, Quote } from './types';
import type { Status } from './theme';
import { EMPTY_COMPANY, SEED_CUSTOMERS, SEED_QUOTES } from './seed';
import * as Cloud from './cloud';

const K = {
  company: 'quoted.company',
  customers: 'quoted.customers',
  quotes: 'quoted.quotes',
};

// Cloud keys mirror the local model 1:1 (see cloud.ts).
const CK = {
  company: 'company',
  customers: 'customers',
  quotes: 'quotes',
} as const;

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
async function write<T>(key: string, val: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore — device storage failure is non-fatal for the demo
  }
}

// Load local first, then prefer a cloud copy when one exists. The cloud copy
// is written back into the local cache so the app stays fast and offline-safe.
async function loadSynced<T>(localKey: string, cloudKey: string, fallback: T): Promise<T> {
  const local = await read<T>(localKey, fallback);
  if (!Cloud.cloudEnabled) return local;
  const remote = await Cloud.pull<T>(cloudKey);
  if (remote == null) return local;
  await write(localKey, remote);
  return remote;
}

export const Store = {
  async loadCompany(): Promise<Company> {
    return loadSynced<Company>(K.company, CK.company, EMPTY_COMPANY);
  },
  async saveCompany(c: Company): Promise<void> {
    await write(K.company, c);
    Cloud.push(CK.company, c); // fire-and-forget mirror
  },

  async loadCustomers(): Promise<Customer[]> {
    return loadSynced<Customer[]>(K.customers, CK.customers, SEED_CUSTOMERS);
  },
  async saveCustomers(list: Customer[]): Promise<void> {
    await write(K.customers, list);
    Cloud.push(CK.customers, list);
  },

  async loadQuotes(): Promise<Quote[]> {
    return loadSynced<Quote[]>(K.quotes, CK.quotes, SEED_QUOTES);
  },
  async saveQuotes(list: Quote[]): Promise<void> {
    await write(K.quotes, list);
    Cloud.push(CK.quotes, list);
  },

  async resetAll(): Promise<void> {
    await AsyncStorage.multiRemove([K.company, K.customers, K.quotes]);
    Cloud.clearCloud();
  },

  /**
   * Checks Supabase for any live shares and advances quote status as the
   * customer opens / accepts the estimate, and pulls in any question they left.
   * Only quotes still in flight (sent/opened) are advanced — won/lost are never
   * downgraded. Returns an updated array if anything changed, else null.
   */
  async syncOpenedStatus(quotes: Quote[]): Promise<Quote[] | null> {
    // Rank so we never move a quote backwards.
    const rank: Record<string, number> = { sent: 0, opened: 1, accepted: 2 };
    const inFlight = quotes.filter((q) => q.shareId && (q.status === 'sent' || q.status === 'opened'));
    if (!inFlight.length || !Cloud.cloudEnabled) return null;

    const shareIds = inFlight.map((q) => q.shareId!);
    const states = await Cloud.getShareStates(shareIds);
    if (!states.length) return null;

    const byQuote = new Map(states.map((s) => [s.quoteId, s]));
    let changed = false;
    const updated = quotes.map((q) => {
      const s = byQuote.get(q.id);
      if (!s) return q;
      if (q.status !== 'sent' && q.status !== 'opened') return q;
      const next: Partial<Quote> = {};
      if (rank[s.status] > (rank[q.status] ?? 0)) next.status = s.status as Status;
      if (s.message && s.message !== q.customerMessage) next.customerMessage = s.message;
      if (Object.keys(next).length === 0) return q;
      changed = true;
      return { ...q, ...next };
    });
    if (!changed) return null;
    await write(K.quotes, updated);
    return updated;
  },

  cloudEnabled: Cloud.cloudEnabled,
};
