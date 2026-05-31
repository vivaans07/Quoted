import type { Status } from './theme';

export type Trade = 'Plumbing' | 'Electrical' | 'HVAC' | 'Roofing' | 'General';

export interface Company {
  name: string;
  owner: string;
  license: string;
  phone: string;
  email: string;
  city: string;
  logoUri?: string | null;
  trade: Trade;
  laborRate: number;
  markup: number;
  accent: string;
  twilioNumber?: string | null;
  onboarded: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  initials: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  type: 'material' | 'labor';
}

export interface FollowUp {
  delay_hours: number;
  message_text: string;
}

export interface Estimate {
  job_summary: string;
  line_items: LineItem[];
  materials_subtotal: number;
  labor_subtotal: number;
  total_estimate: number;
  estimate_range: { low: number; high: number };
  notes: string;
  photo_requests: string[];
  follow_up_sequence: FollowUp[];
  trade?: string;
}

export interface Quote {
  id: string;
  customerId: string;
  job: string;
  type: string;
  amount: number;
  status: Status;
  sentAt: string;
  created: string;
  estimate?: Estimate;
  shareId?: string; // ID in shared_estimates — set when sent, used for opened-status sync
  customerMessage?: string; // question the customer left on the estimate page
  photos?: string[]; // local URIs of job-site photos attached to the quote
}
