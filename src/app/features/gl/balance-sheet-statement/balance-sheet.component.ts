import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type BSCategory = 'Assets' | 'Liabilities' | 'Equity';

interface Account {
  acc: string;      // account code
  name: string;     // account name
  category: BSCategory;
}

interface LedgerPost {
  date: string;     // yyyy-MM-dd
  acc: string;      // account code
  debit: number;    // >= 0
  credit: number;   // >= 0
}

interface Line {
  acc: string;
  name: string;
  amount: number;   // signed by category rule (Assets debit-normal; L/E credit-normal)
}

@Component({
  selector: 'app-balance-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './balance-sheet.component.html',
  styleUrls: ['./balance-sheet.component.scss'],
})
export class BalanceSheetComponent {
  // ===== Filters =====
  asOf = this.todayISO(); // "As of" date
  q = '';
  includeZero = true;

  // Collapse state
  categories: BSCategory[] = ['Assets', 'Liabilities', 'Equity'];
  labels: Record<BSCategory, string> = {
    Assets: 'Assets',
    Liabilities: 'Liabilities',
    Equity: 'Equity',
  };
  collapsed: Record<BSCategory, boolean> = {
    Assets: false,
    Liabilities: false,
    Equity: false,
  };

  // ===== Master Accounts =====
  accounts: Account[] = [
    { acc:'1000-000', name:'Cash in Hand',              category:'Assets' },
    { acc:'1100-000', name:'Cash at Bank - Main',       category:'Assets' },
    { acc:'1200-000', name:'Accounts Receivable',       category:'Assets' },
    { acc:'1300-000', name:'Inventory',                 category:'Assets' },

    { acc:'2000-000', name:'Accounts Payable',          category:'Liabilities' },
    { acc:'2200-000', name:'Accrued Expenses',          category:'Liabilities' },

    { acc:'3000-000', name:'Share Capital',             category:'Equity' },
    { acc:'3100-000', name:'Retained Earnings',         category:'Equity' },
  ];

  // ===== Sample Ledger Postings (demo) =====
  // Bao gồm một số bút toán tháng 7 (opening) & tháng 8 để có số dư đến "asOf"
  posts: LedgerPost[] = [
    // Opening (July)
    { date:'2025-07-31', acc:'1000-000', debit:1500, credit:0 },
    { date:'2025-07-31', acc:'1100-000', debit:12000, credit:0 },
    { date:'2025-07-31', acc:'1200-000', debit:3500, credit:0 },
    { date:'2025-07-31', acc:'1300-000', debit:5000, credit:0 },
    { date:'2025-07-31', acc:'2000-000', debit:0, credit:2100 },
    { date:'2025-07-31', acc:'2200-000', debit:0, credit:900 },
    { date:'2025-07-31', acc:'3000-000', debit:0, credit:15000 },
    { date:'2025-07-31', acc:'3100-000', debit:0, credit:3000 },

    // August movement
    // Bán hàng thu tiền: AR giảm, Bank tăng
    { date:'2025-08-03', acc:'1200-000', debit:0,    credit:1200 }, // AR settle
    { date:'2025-08-03', acc:'1100-000', debit:1200, credit:0 },    // Bank in

    // Mua hàng trả tiền: AP giảm, Bank giảm
    { date:'2025-08-08', acc:'2000-000', debit:2100, credit:0 },    // Pay AP
    { date:'2025-08-08', acc:'1100-000', debit:0,    credit:2100 }, // Bank out

    // Ghi nhận lãi/lỗ giữ lại cuối kỳ (ví dụ), ở đây +500 vào Retained Earnings
    { date:'2025-08-20', acc:'3100-000', debit:0, credit:500 },
  ];

  // ===== Utils =====
  private todayISO(): string {
    const t = new Date();
    const d = new Date(t.getTime() - t.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 10);
  }

  private textOk(acc: string, name: string): boolean {
    const s = this.q.trim().toLowerCase();
    if (!s) return true;
    return (acc + ' ' + name).toLowerCase().includes(s);
  }

  // Net balance up to asOf for an account (Debit - Credit)
  private netUpTo(accCode: string, upTo: string): number {
    const rows = this.posts.filter(p => p.acc === accCode && p.date <= upTo);
    const dr = rows.reduce((t, r) => t + (r.debit || 0), 0);
    const cr = rows.reduce((t, r) => t + (r.credit || 0), 0);
    return +(dr - cr).toFixed(2);
  }

  // For display: Assets use debit-normal (positive if dr>cr)
  // Liabilities & Equity use credit-normal (positive if cr>dr)
  private displayAmount(cat: BSCategory, netDrMinusCr: number): number {
    if (cat === 'Assets') {
      return +netDrMinusCr.toFixed(2); // Assets: show as positive when dr>cr
    } else {
      // Liabilities/Equity: positive when credit > debit
      return +(-netDrMinusCr).toFixed(2);
    }
  }

  // Build lines for a category
  group(cat: BSCategory): { lines: Line[]; total: number } {
    const upTo = this.asOf || '9999-12-31';
    const list: Line[] = [];

    for (const a of this.accounts) {
      if (a.category !== cat) continue;
      if (!this.textOk(a.acc, a.name)) continue;

      const net = this.netUpTo(a.acc, upTo);
      const amt = this.displayAmount(cat, net);

      if (!this.includeZero && amt === 0) continue;
      list.push({ acc: a.acc, name: a.name, amount: amt });
    }

    const lines = list.sort((x, y) => x.acc.localeCompare(y.acc));
    const total = +lines.reduce((t, r) => t + r.amount, 0).toFixed(2);
    return { lines, total };
  }

  // Totals & Check
  totalAssets() { return this.group('Assets').total; }
  totalLiabEq() { return +(this.group('Liabilities').total + this.group('Equity').total).toFixed(2); }
  difference()  { return +(this.totalAssets() - this.totalLiabEq()).toFixed(2); }

  // Actions
  toggle(cat: BSCategory) { this.collapsed[cat] = !this.collapsed[cat]; }
  isCollapsed(cat: BSCategory) { return this.collapsed[cat]; }
  setToday() { this.asOf = this.todayISO(); }
  onRefresh() { /* demo only */ }
  onExport() { alert('Demo: Export not implemented.'); }
  onPrint() { window.print(); }

  // trackBy
  trackLine(_i: number, l: Line) { return l.acc; }
}
