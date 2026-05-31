// ── RevenueCat in-app subscriptions (fail-soft wrapper) ─────────────────────
//
// Mirrors the cloud.ts philosophy: everything degrades gracefully.
//   - When the platform's public key is absent OR the native module isn't
//     present (e.g. running in Expo Go), `billingEnabled` is false and every
//     function is a safe no-op. The Settings screen falls back to the static
//     trial card. Nothing crashes.
//   - Real purchases require a development build (EAS Build / expo prebuild).
//     RevenueCat's IAP cannot run in Expo Go.
//
// Fill in to go live:
//   1. EXPO_PUBLIC_REVENUECAT_IOS_KEY / _ANDROID_KEY in mobile/.env
//   2. An entitlement (default id "pro") + a product/offering in the dashboard
//   3. Build a dev client:  eas build --profile development --platform ios
import { Platform } from 'react-native';
import {
  REVENUECAT_IOS_KEY,
  REVENUECAT_ANDROID_KEY,
  REVENUECAT_ENTITLEMENT,
} from './config';

// Load the SDK defensively. In Expo Go the JS resolves but the native module is
// missing, so any call throws — we guard every call below and treat throws as
// "billing unavailable".
let Purchases: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Purchases = require('react-native-purchases').default;
} catch {
  Purchases = null;
}

const platformKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;

/** True only when we have a key for this platform AND the SDK module loaded. */
export const billingConfigured = Boolean(platformKey && Purchases);

let configured = false;

export interface PlanOption {
  id: string;            // RevenueCat package identifier
  title: string;        // e.g. "Quoted Pro"
  priceString: string;  // localized, e.g. "$49.00"
  period: string;       // "month" | "year" | ""
  raw: any;             // the underlying PurchasesPackage (passed back to purchase)
}

/** Configure the SDK once. Safe to call when billing is off (no-op). */
export async function init(appUserId?: string | null): Promise<void> {
  if (!billingConfigured || configured) return;
  try {
    await Purchases.configure({ apiKey: platformKey, appUserID: appUserId || undefined });
    configured = true;
  } catch {
    // leave configured=false; app continues in trial-card mode
  }
}

/** Tie RevenueCat's customer to the signed-in user so entitlements follow them. */
export async function identify(appUserId: string): Promise<void> {
  if (!billingConfigured || !configured) return;
  try { await Purchases.logIn(appUserId); } catch { /* ignore */ }
}

export async function signOut(): Promise<void> {
  if (!billingConfigured || !configured) return;
  try { await Purchases.logOut(); } catch { /* ignore */ }
}

/** True when the customer currently owns the "pro" entitlement. */
export async function isPro(): Promise<boolean> {
  if (!billingConfigured) return false;
  try {
    if (!configured) await init();
    const info = await Purchases.getCustomerInfo();
    return Boolean(info?.entitlements?.active?.[REVENUECAT_ENTITLEMENT]);
  } catch {
    return false;
  }
}

/** Fetch the purchasable plans from the current offering. */
export async function getPlans(): Promise<PlanOption[]> {
  if (!billingConfigured) return [];
  try {
    if (!configured) await init();
    const offerings = await Purchases.getOfferings();
    const current = offerings?.current;
    if (!current) return [];
    return (current.availablePackages || []).map((p: any) => ({
      id: p.identifier,
      title: p.product?.title || 'Quoted Pro',
      priceString: p.product?.priceString || '',
      period: normalizePeriod(p.product?.subscriptionPeriod),
      raw: p,
    }));
  } catch {
    return [];
  }
}

/** Purchase a plan. Returns true if the user ends up Pro. */
export async function purchase(plan: PlanOption): Promise<{ ok: boolean; cancelled: boolean }> {
  if (!billingConfigured) return { ok: false, cancelled: false };
  try {
    const { customerInfo } = await Purchases.purchasePackage(plan.raw);
    return { ok: Boolean(customerInfo?.entitlements?.active?.[REVENUECAT_ENTITLEMENT]), cancelled: false };
  } catch (e: any) {
    return { ok: false, cancelled: Boolean(e?.userCancelled) };
  }
}

/** Restore previous purchases (App Store / Play requirement). */
export async function restore(): Promise<boolean> {
  if (!billingConfigured) return false;
  try {
    const info = await Purchases.restorePurchases();
    return Boolean(info?.entitlements?.active?.[REVENUECAT_ENTITLEMENT]);
  } catch {
    return false;
  }
}

/** Subscribe to entitlement changes. Returns an unsubscribe function. */
export function onProChange(cb: (pro: boolean) => void): () => void {
  if (!billingConfigured) return () => {};
  try {
    const listener = (info: any) => cb(Boolean(info?.entitlements?.active?.[REVENUECAT_ENTITLEMENT]));
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => { try { Purchases.removeCustomerInfoUpdateListener(listener); } catch { /* ignore */ } };
  } catch {
    return () => {};
  }
}

function normalizePeriod(iso?: string | null): string {
  if (!iso) return '';
  if (iso.endsWith('Y')) return 'year';
  if (iso.endsWith('M')) return 'month';
  if (iso.endsWith('W')) return 'week';
  if (iso.endsWith('D')) return 'day';
  return '';
}
