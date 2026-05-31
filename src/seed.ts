import type { Company, Customer, Quote, Trade } from './types';

export const TRADE_DEFAULTS: Record<Trade, number> = {
  Plumbing: 165,
  Electrical: 145,
  HVAC: 155,
  Roofing: 95,
  General: 125,
};

export const EMPTY_COMPANY: Company = {
  name: '',
  owner: '',
  license: '',
  phone: '',
  email: '',
  city: '',
  logoUri: null,
  trade: 'Plumbing',
  laborRate: 165,
  markup: 35,
  accent: '#F97316',
  twilioNumber: null,
  onboarded: false,
};

export const SEED_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Sarah Chen', phone: '(650) 555-0188', email: 'sarah.chen@gmail.com', address: '418 Hamilton Ave, Palo Alto', initials: 'SC' },
  { id: 'c2', name: 'Dave Reyes', phone: '(650) 555-0231', email: 'dreyes@outlook.com', address: '1290 Beech St, Redwood City', initials: 'DR' },
  { id: 'c3', name: 'The Mariani Family', phone: '(408) 555-0119', email: 'marianihome@gmail.com', address: '77 Glenwood Dr, Mountain View', initials: 'MF' },
  { id: 'c4', name: 'Westside Cafe', phone: '(650) 555-0307', email: 'ops@westsidecafe.co', address: '2201 Broadway, Redwood City', initials: 'WC' },
  { id: 'c5', name: 'Janet Wu', phone: '(415) 555-0164', email: 'janet.wu@icloud.com', address: '930 Cowper St, Palo Alto', initials: 'JW' },
  { id: 'c6', name: 'Coastal Property Mgmt', phone: '(650) 555-0420', email: 'maint@coastalpm.com', address: '88 Marsh Rd, Menlo Park', initials: 'CP' },
];

export const SEED_QUOTES: Quote[] = [
  { id: 'q1', customerId: 'c1', job: 'Water Heater Replacement', type: 'Water Heater', amount: 1840, status: 'opened', sentAt: 'Opened 2h ago', created: 'May 28' },
  { id: 'q2', customerId: 'c2', job: 'Leaky Faucet Repair', type: 'Repair', amount: 285, status: 'won', sentAt: 'Won yesterday', created: 'May 27' },
  { id: 'q3', customerId: 'c3', job: 'Toilet Rebuild', type: 'Repair', amount: 420, status: 'draft', sentAt: 'Draft', created: 'May 29' },
  { id: 'q4', customerId: 'c4', job: 'Backflow Test & Certification', type: 'Inspection', amount: 310, status: 'sent', sentAt: 'Sent 1d ago', created: 'May 26' },
  { id: 'q5', customerId: 'c6', job: 'Garbage Disposal Install', type: 'Install', amount: 290, status: 'sent', sentAt: 'Sent 3d ago', created: 'May 24' },
  { id: 'q6', customerId: 'c5', job: 'Sewer Line Camera Inspection', type: 'Inspection', amount: 375, status: 'lost', sentAt: 'Lost · went w/ other bid', created: 'May 20' },
];

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'NEW';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
