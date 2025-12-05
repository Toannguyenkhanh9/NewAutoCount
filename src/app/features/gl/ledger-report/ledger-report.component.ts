import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Account {
  code: string;
  name: string;
}
interface LedgerRow {
  acc: string; // account code
  date: string; // yyyy-MM-dd
  docNo: string;
  source?: string; // module/source (AR/AP/GL/BNK...)
  description: string;
  debit: number; // >=0
  credit: number; // >=0
}

type ViewLine = LedgerRow & { runBal: number };

@Component({
  selector: 'app-ledger-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ledger-report.component.html',
  styleUrls: ['./ledger-report.component.scss'],
})
export class LedgerReportComponent {
  // ===== Filters =====
  dateFrom = this.firstDayOfMonth();
  dateTo = this.todayISO();
  q = '';
  includeZero = true;

  accounts: Account[] = [
    { code: '1000-000', name: 'Cash in Hand' },
    { code: '1100-000', name: 'Cash at Bank - Main' },
    { code: '1200-000', name: 'Accounts Receivable' },
    { code: '2000-000', name: 'Accounts Payable' },
    { code: '4000-000', name: 'Sales' },
    { code: '5000-000', name: 'Rent Expense' },
  ];

  accFrom = '1000-000';
  accTo = '9999-999';

  // ===== Sample Ledger Data =====
  rows: LedgerRow[] = [
    // July (để có opening)
    {
      acc: '1000-000',
      date: '2025-07-28',
      docNo: 'JV-0001',
      source: 'GL',
      description: 'Opening cash',
      debit: 1500,
      credit: 0,
    },
    {
      acc: '1100-000',
      date: '2025-07-31',
      docNo: 'JV-0002',
      source: 'GL',
      description: 'Opening bank',
      debit: 12000,
      credit: 0,
    },
    {
      acc: '1200-000',
      date: '2025-07-31',
      docNo: 'JV-0003',
      source: 'GL',
      description: 'Opening AR',
      debit: 3500,
      credit: 0,
    },
    {
      acc: '2000-000',
      date: '2025-07-31',
      docNo: 'JV-0004',
      source: 'GL',
      description: 'Opening AP',
      debit: 0,
      credit: 2100,
    },
    // August
    {
      acc: '4000-000',
      date: '2025-08-01',
      docNo: 'S-10001',
      source: 'AR',
      description: 'Sales invoice S-10001',
      debit: 0,
      credit: 1200,
    },
    {
      acc: '1200-000',
      date: '2025-08-01',
      docNo: 'S-10001',
      source: 'AR',
      description: 'AR for S-10001',
      debit: 1200,
      credit: 0,
    },
    {
      acc: '1100-000',
      date: '2025-08-03',
      docNo: 'CR-00021',
      source: 'BANK',
      description: 'Customer receipt',
      debit: 1200,
      credit: 0,
    },
    {
      acc: '1200-000',
      date: '2025-08-03',
      docNo: 'CR-00021',
      source: 'BANK',
      description: 'Settle S-10001',
      debit: 0,
      credit: 1200,
    },
    {
      acc: '2000-000',
      date: '2025-08-05',
      docNo: 'P-88011',
      source: 'AP',
      description: 'AP invoice P-88011',
      debit: 0,
      credit: 2100,
    },
    {
      acc: '1100-000',
      date: '2025-08-08',
      docNo: 'PV-00118',
      source: 'BANK',
      description: 'Supplier payment',
      debit: 0,
      credit: 2100,
    },
    {
      acc: '5000-000',
      date: '2025-08-10',
      docNo: 'JV-0010',
      source: 'GL',
      description: 'Rent expense',
      debit: 300,
      credit: 0,
    },
    {
      acc: '1100-000',
      date: '2025-08-10',
      docNo: 'JV-0010',
      source: 'GL',
      description: 'Pay rent',
      debit: 0,
      credit: 300,
    },
  ];

  // collapse state per account
  collapsed: Record<string, boolean> = {};

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

  // ===== Helpers for template =====
  abs(n: number) {
    return n < 0 ? -n : n;
  }

  // ===== Filtering =====
  private accInRange(code: string): boolean {
    const from = (this.accFrom || '').trim();
    const to = (this.accTo || '').trim();
    const c = code.trim();
    if (from && c < from) return false;
    if (to && c > to) return false;
    return true;
  }

  private textMatch(r: LedgerRow): boolean {
    const s = this.q.trim().toLowerCase();
    if (!s) return true;
    const hay = (
      r.acc +
      ' ' +
      r.docNo +
      ' ' +
      (r.source || '') +
      ' ' +
      r.description
    ).toLowerCase();
    return hay.includes(s);
  }

  // ===== Build grouped view =====
  view() {
    const from = this.dateFrom || '0000-01-01';
    const to = this.dateTo || '9999-12-31';

    // group by account listed in "accounts" (để có thứ tự & tên)
    const result = [];
    for (const acc of this.accounts) {
      if (!this.accInRange(acc.code)) continue;

      const allRows = this.rows
        .filter((r) => r.acc === acc.code)
        .sort(
          (a, b) =>
            a.date.localeCompare(b.date) || a.docNo.localeCompare(b.docNo)
        );

      if (allRows.length === 0) {
        if (this.includeZero) {
          result.push({
            acc,
            opening: 0,
            lines: [] as ViewLine[],
            totalDebit: 0,
            totalCredit: 0,
            closing: 0,
          });
        }
        continue;
      }

      // opening = sum(debit-credit) trước dateFrom
      const opening = allRows
        .filter((r) => r.date < from)
        .reduce((t, r) => t + (r.debit || 0) - (r.credit || 0), 0);

      // lines trong khoảng lọc và theo text
      const inRange = allRows.filter(
        (r) => r.date >= from && r.date <= to && this.textMatch(r)
      );
      let run = opening;
      const lines: ViewLine[] = inRange.map((r) => {
        run += (r.debit || 0) - (r.credit || 0);
        return { ...r, runBal: +run.toFixed(2) };
      });

      const totalDebit = inRange.reduce((t, r) => t + (r.debit || 0), 0);
      const totalCredit = inRange.reduce((t, r) => t + (r.credit || 0), 0);
      const closing = +(opening + totalDebit - totalCredit).toFixed(2);

      if (!this.includeZero) {
        const hasMovement =
          totalDebit !== 0 ||
          totalCredit !== 0 ||
          opening !== 0 ||
          closing !== 0;
        if (!hasMovement) continue;
      }

      result.push({
        acc,
        opening: +opening.toFixed(2),
        lines,
        totalDebit: +totalDebit.toFixed(2),
        totalCredit: +totalCredit.toFixed(2),
        closing,
      });
    }
    return result;
  }

  toggle(accCode: string) {
    this.collapsed[accCode] = !this.collapsed[accCode];
  }

  // report totals
  reportTotalDebit() {
    return this.view().reduce((t: number, g: any) => t + g.totalDebit, 0);
  }
  reportTotalCredit() {
    return this.view().reduce((t: number, g: any) => t + g.totalCredit, 0);
  }

  // toolbar actions
  setThisMonth() {
    this.dateFrom = this.firstDayOfMonth();
    this.dateTo = this.todayISO();
  }
  onRefresh() {
    /* demo no-op */
  }
  onExport() {
    alert('Demo: Export not implemented.');
  }
  onPrint() {
    window.print();
  }
  trackRow(_i: number, r: { docNo: string; date: string }) {
    return r.docNo + '|' + r.date;
  }
}
