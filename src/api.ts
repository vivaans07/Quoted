import { API_URL } from './config';
import type { Company, Estimate } from './types';

// Local fallback so the flow always completes even if the backend is unreachable.
function localDemo(): Estimate {
  const items = [
    { description: '40-gal gas water heater (Bradford White)', quantity: 1, unit: 'ea', unit_price: 780, type: 'material' as const },
    { description: 'Thermal expansion tank (code upgrade)', quantity: 1, unit: 'ea', unit_price: 95, type: 'material' as const },
    { description: 'Flexible water & gas connector set', quantity: 1, unit: 'set', unit_price: 64, type: 'material' as const },
    { description: 'Install labor & connection', quantity: 3, unit: 'hr', unit_price: 165, type: 'labor' as const },
    { description: 'Old unit removal & haul-away', quantity: 1, unit: 'job', unit_price: 85, type: 'labor' as const },
  ].map((i) => ({ ...i, total: i.quantity * i.unit_price }));
  const materials_subtotal = items.filter((i) => i.type !== 'labor').reduce((s, i) => s + i.total, 0);
  const labor_subtotal = items.filter((i) => i.type === 'labor').reduce((s, i) => s + i.total, 0);
  const total = materials_subtotal + labor_subtotal;
  return {
    job_summary: 'Replace a failed 40-gallon gas water heater including code upgrades and haul-away of the old unit.',
    line_items: items,
    materials_subtotal,
    labor_subtotal,
    total_estimate: total,
    estimate_range: { low: Math.round((total * 0.92) / 10) * 10, high: Math.round((total * 1.12) / 10) * 10 },
    notes: 'Price includes permit coordination and a 6-year tank warranty. Final cost confirmed on-site after an access check.',
    photo_requests: ['A photo of the current water heater and its connections'],
    follow_up_sequence: [
      { delay_hours: 24, message_text: "Hi — just checking you got the estimate I sent over. Happy to answer any questions." },
      { delay_hours: 72, message_text: "Following up on your estimate. I can usually get these scheduled within a few days. Want me to hold a slot?" },
      { delay_hours: 120, message_text: "Last check-in — no pressure at all. If now's not the time, just let me know. Thanks!" },
    ],
  };
}

export async function generateEstimate(jobText: string, company: Company): Promise<{ estimate: Estimate; source: string }> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
    const res = await fetch(`${API_URL}/api/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobText,
        trade: company.trade,
        laborRate: company.laborRate,
        markup: company.markup,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data?.estimate?.line_items?.length) throw new Error('bad shape');
    return { estimate: data.estimate as Estimate, source: data.source || 'ai' };
  } catch (e) {
    return { estimate: localDemo(), source: 'offline' };
  }
}

export async function pingBackend(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Send an SMS via the backend Twilio integration.
 * Returns true if sent via Twilio, false if the backend isn't configured
 * (caller should fall back to native sms: URI in that case).
 */
export async function sendSMS(to: string, body: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: to.replace(/[^\d+]/g, ''), body }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.ok);
  } catch {
    return false;
  }
}
