// ── PDF generation: estimate export + invoice from a won quote ──────────────
//
// Builds print-ready HTML on-device and hands it to expo-print, then opens the
// share sheet so the contractor can email/AirDrop/save the PDF. All failures
// are surfaced through the caller's onError so the UI can toast.
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Company, Customer, Quote } from './types';

const fmt = (n: number) => '$' + Math.round(n || 0).toLocaleString('en-US');
const esc = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function lineItemsHtml(quote: Quote): string {
  const items = quote.estimate?.line_items ?? [];
  if (!items.length) {
    return `<tr><td class="desc">${esc(quote.job)}</td><td class="meta"></td><td class="amt">${fmt(quote.amount)}</td></tr>`;
  }
  return items
    .map(
      (it) => `
      <tr>
        <td class="desc">${esc(it.description)}</td>
        <td class="meta">${it.type === 'labor' ? 'Labor' : 'Material'} · ${it.quantity} ${esc(it.unit)} × ${fmt(it.unit_price)}</td>
        <td class="amt">${fmt(it.total || it.quantity * it.unit_price)}</td>
      </tr>`,
    )
    .join('');
}

const BASE_CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;color:#0F1E3C;padding:40px}
  .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0F1E3C;padding-bottom:18px;margin-bottom:24px}
  .co{font-size:22px;font-weight:800}
  .co-sub{font-size:12px;color:#6B7280;margin-top:4px;line-height:1.5}
  .doc-type{font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#F97316;text-align:right}
  .doc-meta{font-size:12px;color:#6B7280;text-align:right;margin-top:6px;line-height:1.6}
  .billto-label{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9CA3AF;margin-bottom:6px}
  .billto{font-size:14px;line-height:1.6;margin-bottom:26px}
  table{width:100%;border-collapse:collapse;margin-bottom:18px}
  th{text-align:left;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9CA3AF;padding:0 0 8px;border-bottom:1px solid #E8E4DC}
  th.r,td.amt{text-align:right}
  td{padding:12px 0;border-bottom:1px solid #F3F0EB;vertical-align:top}
  .desc{font-size:14px;font-weight:600}
  .meta{font-size:12px;color:#9CA3AF;padding-left:14px}
  .amt{font-size:14px;font-weight:600;white-space:nowrap}
  .totals{margin-left:auto;width:44%;margin-top:8px}
  .trow{display:flex;justify-content:space-between;font-size:13px;color:#6B7280;padding:6px 0}
  .grand{display:flex;justify-content:space-between;font-size:18px;font-weight:800;color:#0F1E3C;border-top:2px solid #0F1E3C;margin-top:8px;padding-top:12px}
  .notes{margin-top:30px;font-size:12px;color:#6B7280;line-height:1.7;border-top:1px solid #E8E4DC;padding-top:16px}
  .pay{margin-top:18px;font-size:13px;color:#0F1E3C;font-weight:600}
  .foot{margin-top:34px;text-align:center;font-size:10px;color:#C4BBAC}
`;

function buildHtml(opts: {
  docType: 'Estimate' | 'Invoice';
  docNo: string;
  quote: Quote;
  company: Company;
  customer: Customer | null;
  dueLine?: string;
}): string {
  const { docType, docNo, quote, company, customer } = opts;
  const est = quote.estimate;
  const materials = est?.materials_subtotal ?? 0;
  const labor = est?.labor_subtotal ?? 0;
  const total = est?.total_estimate ?? quote.amount;
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const coSub = [company.license, company.phone, company.email, company.city]
    .filter(Boolean)
    .map(esc)
    .join(' · ');

  const billTo = [customer?.name, customer?.address, customer?.phone, customer?.email]
    .filter(Boolean)
    .map((l) => esc(l!))
    .join('<br>') || 'Customer';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_CSS}</style></head><body>
    <div class="top">
      <div>
        <div class="co">${esc(company.name || 'Your Company')}</div>
        <div class="co-sub">${coSub}</div>
      </div>
      <div>
        <div class="doc-type">${docType}</div>
        <div class="doc-meta">${docType} #${esc(docNo)}<br>${today}${opts.dueLine ? `<br>${esc(opts.dueLine)}` : ''}</div>
      </div>
    </div>

    <div class="billto-label">${docType === 'Invoice' ? 'Bill to' : 'Prepared for'}</div>
    <div class="billto">${billTo}</div>

    <table>
      <thead><tr><th>Description</th><th>Detail</th><th class="r">Amount</th></tr></thead>
      <tbody>${lineItemsHtml(quote)}</tbody>
    </table>

    <div class="totals">
      ${materials > 0 ? `<div class="trow"><span>Materials</span><span>${fmt(materials)}</span></div>` : ''}
      ${labor > 0 ? `<div class="trow"><span>Labor</span><span>${fmt(labor)}</span></div>` : ''}
      <div class="grand"><span>${docType === 'Invoice' ? 'Total due' : 'Total estimate'}</span><span>${fmt(total)}</span></div>
    </div>

    ${docType === 'Invoice'
      ? `<div class="pay">Please remit payment to ${esc(company.name || 'us')}${company.phone ? ` · ${esc(company.phone)}` : ''}.</div>`
      : ''}
    ${est?.notes ? `<div class="notes">${esc(est.notes)}</div>` : ''}

    <div class="foot">Generated with Quoted</div>
  </body></html>`;
}

async function shareHtml(html: string, onError: (msg: string) => void): Promise<boolean> {
  try {
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    }
    return true;
  } catch {
    onError('Could not create PDF');
    return false;
  }
}

/** Short human-readable document number derived from the quote id + date. */
function docNumber(quote: Quote): string {
  const tail = quote.id.replace(/\D/g, '').slice(-4) || '0001';
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${tail}`;
}

export async function exportEstimatePdf(
  quote: Quote, company: Company, customer: Customer | null, onError: (msg: string) => void,
): Promise<boolean> {
  const html = buildHtml({ docType: 'Estimate', docNo: docNumber(quote), quote, company, customer });
  return shareHtml(html, onError);
}

export async function exportInvoicePdf(
  quote: Quote, company: Company, customer: Customer | null, onError: (msg: string) => void,
): Promise<boolean> {
  const due = new Date();
  due.setDate(due.getDate() + 14);
  const dueLine = `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const html = buildHtml({ docType: 'Invoice', docNo: docNumber(quote), quote, company, customer, dueLine });
  return shareHtml(html, onError);
}
