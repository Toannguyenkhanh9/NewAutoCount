import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type PLCategory = 'Revenue' | 'COGS' | 'Expenses' | 'OtherIncome' | 'OtherExpenses';

interface PLPost {
  date: string;         // yyyy-MM-dd
  acc: string;          // account code
  name: string;         // account name
  category: PLCategory; // P&L section
  amount: number;       // positive value
}

interface GroupLine {
  acc: string;
  name: string;
  period: number;
  ytd: number;
}

@Component({
  selector: 'app-profit-and-loss',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profit-and-loss.component.html',
  styleUrls: ['./profit-and-loss.component.scss'],
})
export class ProfitAndLossComponent {
  // ===== Filters =====
  dateFrom = this.firstDayOfMonth();
  dateTo   = this.todayISO();
  q = '';
  includeZero = true;

  // Danh sách category (đúng kiểu) để *ngFor dùng không lỗi
  categories: PLCategory[] = ['Revenue','COGS','Expenses','OtherIncome','OtherExpenses'];

  // Nhãn hiển thị
  labels: Record<PLCategory, string> = {
    Revenue: 'Revenue',
    COGS: 'Cost of Sales',
    Expenses: 'Expenses',
    OtherIncome: 'Other Income',
    OtherExpenses: 'Other Expenses',
  };

  // collapse state
  collapsed: Record<PLCategory, boolean> = {
    Revenue: false,
    COGS: false,
    Expenses: false,
    OtherIncome: false,
    OtherExpenses: false,
  };

  // ===== Sample P&L postings (demo) =====
  posts: PLPost[] = [
    // July (để có YTD)
    { date:'2025-07-01', acc:'4000-100', name:'Product Sales A', category:'Revenue', amount: 8000 },
    { date:'2025-07-01', acc:'5000-100', name:'Cost of Sales A', category:'COGS',    amount: 4200 },
    { date:'2025-07-05', acc:'6100-100', name:'Salaries',        category:'Expenses',amount: 1500 },
    { date:'2025-07-08', acc:'6200-200', name:'Rent',            category:'Expenses',amount: 900  },
    { date:'2025-07-10', acc:'4300-100', name:'Service Income',  category:'Revenue', amount: 1200 },
    { date:'2025-07-22', acc:'8100-300', name:'Interest Income', category:'OtherIncome', amount: 120 },
    { date:'2025-07-25', acc:'8300-300', name:'Bank Charges',    category:'OtherExpenses', amount: 60 },

    // August (mặc định lọc)
    { date:'2025-08-01', acc:'4000-100', name:'Product Sales A', category:'Revenue', amount: 9200 },
    { date:'2025-08-03', acc:'4000-200', name:'Product Sales B', category:'Revenue', amount: 2400 },
    { date:'2025-08-02', acc:'5000-100', name:'Cost of Sales A', category:'COGS',    amount: 5100 },
    { date:'2025-08-06', acc:'5000-200', name:'Cost of Sales B', category:'COGS',    amount: 900  },
    { date:'2025-08-07', acc:'4300-100', name:'Service Income',  category:'Revenue', amount: 700  },
    { date:'2025-08-08', acc:'6100-100', name:'Salaries',        category:'Expenses',amount: 1600 },
    { date:'2025-08-10', acc:'6200-200', name:'Rent',            category:'Expenses',amount: 900  },
    { date:'2025-08-11', acc:'6400-100', name:'Utilities',       category:'Expenses',amount: 260  },
    { date:'2025-08-12', acc:'8100-300', name:'Interest Income', category:'OtherIncome', amount: 100 },
    { date:'2025-08-15', acc:'8300-300', name:'Bank Charges',    category:'OtherExpenses', amount: 40 },
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
  private ytdFrom(): string {
    const t = new Date(this.dateTo || this.todayISO());
    const d = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return d.toISOString().slice(0, 10);
  }

  // ===== Filtering helpers =====
  private textOk(acc: string, name: string): boolean {
    const s = this.q.trim().toLowerCase();
    if (!s) return true;
    return (acc + ' ' + name).toLowerCase().includes(s);
  }
  private sum(posts: PLPost[], from: string, to: string): number {
    return posts
      .filter(p => p.date >= from && p.date <= to)
      .reduce((t, p) => t + p.amount, 0);
  }

  // Gom nhóm theo category
  group(category: PLCategory): { lines: GroupLine[]; totalPeriod: number; totalYtd: number } {
    const from = this.dateFrom || '0000-01-01';
    const to   = this.dateTo   || '9999-12-31';
    const yFrom = this.ytdFrom();

    const catPosts = this.posts.filter(p => p.category === category);

    const map: Record<string, GroupLine> = {};
    for (const p of catPosts) {
      if (!this.textOk(p.acc, p.name)) continue;
      if (!map[p.acc]) map[p.acc] = { acc: p.acc, name: p.name, period: 0, ytd: 0 };
    }
    for (const k of Object.keys(map)) {
      const accPosts = catPosts.filter(p => p.acc === k);
      const period = this.sum(accPosts, from, to);
      const ytd    = this.sum(accPosts, yFrom, to);
      map[k].period = +period.toFixed(2);
      map[k].ytd    = +ytd.toFixed(2);
    }

    let lines = Object.values(map).sort((a,b)=> a.acc.localeCompare(b.acc));
    if (!this.includeZero) {
      lines = lines.filter(l => (l.period !== 0 || l.ytd !== 0));
    }

    const totalPeriod = +lines.reduce((t,l)=> t + l.period, 0).toFixed(2);
    const totalYtd    = +lines.reduce((t,l)=> t + l.ytd, 0).toFixed(2);

    return { lines, totalPeriod, totalYtd };
  }

  // Ký hiệu dấu ảnh hưởng P&L
  private signed(cat: PLCategory, v: number): number {
    const positive = (cat === 'Revenue' || cat === 'OtherIncome') ? 1 : -1;
    return positive * v;
  }

  // KPIs
  grossPeriod() {
    const rev  = this.signed('Revenue', this.group('Revenue').totalPeriod);
    const cogs = this.signed('COGS',    this.group('COGS').totalPeriod);
    return +(rev + cogs).toFixed(2);
  }
  grossYtd() {
    const rev  = this.signed('Revenue', this.group('Revenue').totalYtd);
    const cogs = this.signed('COGS',    this.group('COGS').totalYtd);
    return +(rev + cogs).toFixed(2);
  }
  netPeriod() {
    const gp   = this.grossPeriod();
    const exp  = this.signed('Expenses',     this.group('Expenses').totalPeriod);
    const oi   = this.signed('OtherIncome',  this.group('OtherIncome').totalPeriod);
    const oe   = this.signed('OtherExpenses',this.group('OtherExpenses').totalPeriod);
    return +(gp + exp + oi + oe).toFixed(2);
  }
  netYtd() {
    const gp   = this.grossYtd();
    const exp  = this.signed('Expenses',     this.group('Expenses').totalYtd);
    const oi   = this.signed('OtherIncome',  this.group('OtherIncome').totalYtd);
    const oe   = this.signed('OtherExpenses',this.group('OtherExpenses').totalYtd);
    return +(gp + exp + oi + oe).toFixed(2);
  }

  // UI actions
  toggle(cat: PLCategory) { this.collapsed[cat] = !this.collapsed[cat]; }
  isCollapsed(cat: PLCategory) { return this.collapsed[cat]; }

  setThisMonth() { this.dateFrom = this.firstDayOfMonth(); this.dateTo = this.todayISO(); }
  setThisYear()  { const t = new Date(); this.dateFrom = `${t.getFullYear()}-01-01`; this.dateTo = this.todayISO(); }
  onRefresh() { /* demo */ }
  onExport()  { alert('Demo: Export not implemented.'); }
  onPrint()   { window.print(); }

  // trackBy
  trackLine(_i: number, l: GroupLine) { return l.acc; }
}
