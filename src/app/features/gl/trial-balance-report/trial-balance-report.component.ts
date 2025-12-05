import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Account { code: string; name: string; }
interface LedgerRow {
  acc: string;           // account code
  date: string;          // yyyy-MM-dd
  docNo: string;
  description: string;
  debit: number;         // >=0
  credit: number;        // >=0
}

interface TrialLine {
  acc: Account;
  openingDr: number;
  openingCr: number;
  periodDr: number;
  periodCr: number;
  closingDr: number;
  closingCr: number;
}

@Component({
  selector: 'app-trial-balance-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trial-balance-report.component.html',
  styleUrls: ['./trial-balance-report.component.scss'],
})
export class TrialBalanceReportComponent {
  // ===== Filters =====
  dateFrom = this.firstDayOfMonth();
  dateTo   = this.todayISO();
  q = '';
  includeZero = true;

  accounts: Account[] = [
    { code: '1000-000', name: 'Cash in Hand' },
    { code: '1100-000', name: 'Cash at Bank - Main' },
    { code: '1200-000', name: 'Accounts Receivable' },
    { code: '2000-000', name: 'Accounts Payable' },
    { code: '3000-000', name: 'Capital & Reserves' },
    { code: '4000-000', name: 'Sales' },
    { code: '5000-000', name: 'Rent Expense' },
  ];

  accFrom = '1000-000';
  accTo   = '9999-999';

  // ===== Sample ledger data (cân đối) =====
  rows: LedgerRow[] = [
    // Opening (tháng 7) – cân đối
    { acc:'1000-000', date:'2025-07-28', docNo:'JV-0001', description:'Opening cash',       debit:1500,  credit:0 },
    { acc:'1100-000', date:'2025-07-31', docNo:'JV-0002', description:'Opening bank',       debit:12000, credit:0 },
    { acc:'1200-000', date:'2025-07-31', docNo:'JV-0003', description:'Opening AR',         debit:3500,  credit:0 },
    { acc:'2000-000', date:'2025-07-31', docNo:'JV-0004', description:'Opening AP',         debit:0,     credit:2100 },
    { acc:'3000-000', date:'2025-07-31', docNo:'JV-0005', description:'Opening equity',     debit:0,     credit:14900 },

    // Period (tháng 8)
    { acc:'4000-000', date:'2025-08-01', docNo:'S-10001', description:'Sales invoice',      debit:0,     credit:1200 },
    { acc:'1200-000', date:'2025-08-01', docNo:'S-10001', description:'AR for S-10001',     debit:1200,  credit:0 },
    { acc:'1100-000', date:'2025-08-03', docNo:'CR-00021',description:'Customer receipt',   debit:1200,  credit:0 },
    { acc:'1200-000', date:'2025-08-03', docNo:'CR-00021',description:'Settle S-10001',     debit:0,     credit:1200 },
    { acc:'2000-000', date:'2025-08-05', docNo:'P-88011', description:'AP invoice',         debit:0,     credit:2100 },
    { acc:'1100-000', date:'2025-08-08', docNo:'PV-00118',description:'Supplier payment',   debit:0,     credit:2100 },
    { acc:'5000-000', date:'2025-08-10', docNo:'JV-0010', description:'Rent expense',       debit:300,   credit:0 },
    { acc:'1100-000', date:'2025-08-10', docNo:'JV-0010', description:'Pay rent',           debit:0,     credit:300 },
  ];

  // ===== Utils =====
  private todayISO(): string {
    const t = new Date();
    const d = new Date(t.getTime() - t.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 10);
  }
  private firstDayOfMonth(): string {
    const t = new Date();
    const d = new Date(Date.UTC(t.getFullYear(), t.getMonth(), 1));
    return d.toISOString().slice(0, 10);
  }

  // ===== Filters helpers =====
  private accInRange(code: string): boolean {
    const from = (this.accFrom || '').trim();
    const to   = (this.accTo   || '').trim();
    const c    = code.trim();
    if (from && c < from) return false;
    if (to && c > to) return false;
    return true;
  }
  private textMatch(acc: Account): boolean {
    const s = this.q.trim().toLowerCase();
    if (!s) return true;
    return (acc.code + ' ' + acc.name).toLowerCase().includes(s);
    }

  // ===== Compute Trial Balance =====
  trial(): TrialLine[] {
    const from = this.dateFrom || '0000-01-01';
    const to   = this.dateTo   || '9999-12-31';

    const out: TrialLine[] = [];

    for (const acc of this.accounts) {
      if (!this.accInRange(acc.code)) continue;
      if (!this.textMatch(acc)) continue;

      const accRows = this.rows
        .filter(r => r.acc === acc.code)
        .sort((a,b)=> a.date.localeCompare(b.date) || a.docNo.localeCompare(b.docNo));

      // Opening = sum(debit - credit) trước from
      const openNet = accRows
        .filter(r => r.date < from)
        .reduce((t, r) => t + (r.debit || 0) - (r.credit || 0), 0);

      const openingDr = openNet > 0 ? +openNet.toFixed(2) : 0;
      const openingCr = openNet < 0 ? +(-openNet).toFixed(2) : 0;

      // Period movement trong [from, to]
      const periodRows = accRows.filter(r => r.date >= from && r.date <= to);
      const periodDr = +periodRows.reduce((t,r)=> t + (r.debit  || 0), 0).toFixed(2);
      const periodCr = +periodRows.reduce((t,r)=> t + (r.credit || 0), 0).toFixed(2);

      // Closing = opening + (Dr - Cr)
      const closeNet = openNet + (periodDr - periodCr);
      const closingDr = closeNet > 0 ? +closeNet.toFixed(2) : 0;
      const closingCr = closeNet < 0 ? +(-closeNet).toFixed(2) : 0;

      const hasAny = (openingDr+openingCr+periodDr+periodCr+closingDr+closingCr) !== 0;
      if (!this.includeZero && !hasAny) continue;

      out.push({ acc, openingDr, openingCr, periodDr, periodCr, closingDr, closingCr });
    }

    // ổn định theo mã tài khoản
    return out.sort((a,b)=> a.acc.code.localeCompare(b.acc.code));
  }

  // Totals
  total(field: keyof TrialLine): number {
    return +this.trial().reduce((t, r) => t + (r[field] as number), 0).toFixed(2);
  }

  // Toolbar actions
  setThisMonth() { this.dateFrom = this.firstDayOfMonth(); this.dateTo = this.todayISO(); }
  onRefresh() { /* demo */ }
  onExport() { alert('Demo: Export not implemented.'); }
  onPrint() { window.print(); }

  // trackBy
  trackAcc(_i: number, r: TrialLine) { return r.acc.code; }
}
