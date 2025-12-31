import { CommonModule } from '@angular/common';
import { Component,inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { CompanyContextService } from '../../../core/services/company-context.service';
type SortBy =
  | 'docNo'
  | 'docDate'
  | 'dueDate'
  | 'debtorCode'
  | 'debtorName'
  | 'salesAgent';
type GroupBy = 'none' | 'debtorCode' | 'salesAgent';

interface Row {
  debtorCode: string;
  debtorName: string;
  docNo: string;
  docDate: string; // yyyy-mm-dd
  dueDate: string; // yyyy-mm-dd
  docType: 'IN' | 'DN';
  salesAgent: string;
  currency: string;
  term: number;
  amount: number;
  localAmount: number;
  outstanding: number;
  localOutstanding: number;
  age?: number; // computed
}

@Component({
  selector: 'app-ap-outstanding-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ap-outstanding-report.component.html',
  styleUrls: ['./ap-outstanding-report.component.scss']
})
export class ApOutstandingReportComponent  {

   private companyContext = inject(CompanyContextService);
    showOptions = true;
    isPreview = false;
    fg!: FormGroup;
  
    
  
    // Header lines (report)
    reportTitle = 'Outstanding A/P Invoice Report';
    companyName$ = this.companyContext.companyName$;
      companyName = this.readCompanyName();
    periodLabel = '';
  // Sort trạng thái (bấm header)
    currentSort: SortBy = 'docNo';
    sortDir: 'asc' | 'desc' = 'asc';
  
    // Debtor list cho multi-select
    debtorList = [
      { code: '300-B001', name: 'BEST PHONE SDN BHD' },
      { code: '300-C001', name: 'CARE PHONE SDN BHD' },
      { code: '300-A001', name: 'AAA' },
      { code: '300-L001', name: 'LGH ENTERPRISE' },
    ];
  
    constructor(private fb: FormBuilder) {
      this.fg = this.fb.group({
        fromDate: [this.startOfMonth()],
        toDate: [this.today()],
        debtor: [''], // '' = All
        dueType: 'ALL',
        groupBy: 'none',
      });
  
  
      // Seed demo data so it matches the default date range
      this.raw = this.seedDemoRows();
      this.updatePeriodLabel();
      this.inquiry();
      this.fg.valueChanges.subscribe(() => {
        this.isPreview = false;
        this.updatePeriodLabel();
        this.inquiry();
      });
  
    }
  
    // ===== Demo data =====
    raw: Row[] = [];
  
    // View data
    filteredRows: Row[] = []; // không group
    groupedBlocks: Array<{
      key: string;
      items: Row[];
      totals: { localAmount: number; localOutstanding: number };
    }> = [];
  
    // Tổng cộng cuối bảng (overall)
    totals = { localAmount: 0, localOutstanding: 0 };
  
    // ====== UI actions ======
    toggleOptions() {
      this.showOptions = !this.showOptions;
    }
    preview() {
      this.isPreview = true;
    }
    print() {
      window.print();
    }
    close() {
      /* hook vào router nếu cần */
    }
  
    // ====== Inquiry ======
    inquiry() {
      const v = this.fg.value;
      const from = this.parseYmd(v.fromDate);
      const to = this.parseYmd(v.toDate);
      const asOf = to || new Date();
  
      // Header: khoảng thời gian
      this.periodLabel = this.buildPeriodLabel(v.fromDate, v.toDate);
  
  // 1) tính age + copy dữ liệu
      let rows = this.raw.map((r) => ({
        ...r,
        age: Math.floor(
          (asOf.getTime() - new Date(r.dueDate).getTime()) / 86400000
        ),
      }));
  
      
      // 1.1) Lọc theo khoảng thời gian (Doc Date)
      if (from) rows = rows.filter((r) => new Date(r.docDate).getTime() >= from.getTime());
      if (to) rows = rows.filter((r) => new Date(r.docDate).getTime() <= to.getTime());
  
  // 2) lọc debtor
    if (v.debtor) {
      rows = rows.filter(r => r.debtorCode === v.debtor);
    }
  
      // 3) lọc theo Due Type (chỉ lấy các dòng còn outstanding)
      rows = rows.filter((r) => r.localOutstanding > 0);
      if (v.dueType === 'UNDUE')
        rows = rows.filter((r) => new Date(r.dueDate) > asOf);
      if (v.dueType === 'OVERDUE')
        rows = rows.filter((r) => new Date(r.dueDate) < asOf);
      if (v.dueType === 'ON_DUE') rows = rows.filter((r) => r.dueDate === v.toDate);
  
      // 4) tổng cộng overall
      this.totals = {
        localAmount: rows.reduce((s, r) => s + (r.localAmount || 0), 0),
        localOutstanding: rows.reduce((s, r) => s + (r.localOutstanding || 0), 0),
      };
  
      // 5) group / flat
      if (v.groupBy === 'none') {
        this.groupedBlocks = [];
        this.filteredRows = rows;
      } else {
        const map = new Map<string, Row[]>();
        for (const r of rows) {
          const key = v.groupBy === 'debtorCode' ? r.debtorCode : r.salesAgent;
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(r);
        }
        this.groupedBlocks = Array.from(map.entries()).map(([key, items]) => ({
          key,
          items,
          totals: {
            localAmount: items.reduce((s, r) => s + (r.localAmount || 0), 0),
            localOutstanding: items.reduce(
              (s, r) => s + (r.localOutstanding || 0),
              0
            ),
          },
        }));
        this.filteredRows = [];
      }
  
      // 6) áp sort hiện tại
      this.applySort();
    }
  
    // ====== Sorting (header click) ======
    setSort(by: SortBy) {
      if (this.currentSort === by) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.currentSort = by;
        this.sortDir = 'asc';
      }
      this.applySort();
    }
  
    private applySort() {
      const dir = this.sortDir === 'asc' ? 1 : -1;
      const by = this.currentSort;
  
      if (this.fg.value.groupBy === 'none') {
        this.filteredRows = [...this.filteredRows].sort((a, b) => {
          const va = this.sortVal(a, by);
          const vb = this.sortVal(b, by);
          return va < vb ? -1 * dir : va > vb ? 1 * dir : 0;
        });
        return;
      }
  
      this.groupedBlocks = this.groupedBlocks.map((g) => ({
        ...g,
        items: [...g.items].sort((a, b) => {
          const va = this.sortVal(a, by);
          const vb = this.sortVal(b, by);
          return va < vb ? -1 * dir : va > vb ? 1 * dir : 0;
        }),
      }));
    }
  
    private sortVal(r: Row, by: SortBy) {
      if (by === 'docDate' || by === 'dueDate')
        return new Date((r as any)[by]).getTime();
      const v = (r as any)[by];
      return typeof v === 'string' ? v.toLowerCase() : v ?? '';
    }
  
    // ====== Footer totals (getter) ======
    get totalLocalAmount(): number {
      if (this.groupedBlocks.length) {
        return this.groupedBlocks.reduce((s, g) => s + g.totals.localAmount, 0);
      }
      return this.filteredRows.reduce(
        (s, r) => s + (Number(r.localAmount) || 0),
        0
      );
    }
    get totalLocalOutstanding(): number {
      if (this.groupedBlocks.length) {
        return this.groupedBlocks.reduce(
          (s, g) => s + g.totals.localOutstanding,
          0
        );
      }
      return this.filteredRows.reduce(
        (s, r) => s + (Number(r.localOutstanding) || 0),
        0
      );
    }
  
    // ====== Helpers ======
    get criteriaDebtorText(): string {
      const v = this.fg.value;
      if (v.debtorMode === 'range')
        return `${v.debtorFrom || '…'} – ${v.debtorTo || '…'}`;
      if (v.debtorMode === 'multi') return (v.debtorMulti || []).join(', ');
      return 'No filter';
    }
  
    openSource(r: Row) {
      alert(`Open source document: ${r.docNo}`);
    }
    private startOfMonth() {
      const d = new Date();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      return `${d.getFullYear()}-${m}-01`;
    }
  
    /** Parse YYYY-MM-DD into Date at local midnight. Return null if invalid. */
    private parseYmd(v: any): Date | null {
      if (!v) return null;
      const s = String(v).trim();
      if (!s) return null;
      // accept ISO date
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const d = new Date(s + 'T00:00:00');
        return isNaN(d.getTime()) ? null : d;
      }
      // accept dd/mm/yyyy or d/m/yyyy
      const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (m) {
        const dd = String(+m[1]).padStart(2, '0');
        const mm = String(+m[2]).padStart(2, '0');
        const yy = m[3];
        const d = new Date(`${yy}-${mm}-${dd}T00:00:00`);
        return isNaN(d.getTime()) ? null : d;
      }
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }
  
    private formatLongYmd(ymd: any): string {
      const d = this.parseYmd(ymd);
      if (!d) return '';
      try {
        return new Intl.DateTimeFormat('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(d);
      } catch {
        // fallback
        const mm = (d.getMonth() + 1).toString().padStart(2, '0');
        const dd = d.getDate().toString().padStart(2, '0');
        return `${dd}/${mm}/${d.getFullYear()}`;
      }
    }
  
    private buildPeriodLabel(fromYmd: any, toYmd: any): string {
      const f = this.formatLongYmd(fromYmd);
      const t = this.formatLongYmd(toYmd);
      if (f && t) return `For the period ${f} to ${t}`;
      if (t) return `As at ${t}`;
      return '';
    }
  
    private updatePeriodLabel() {
      const v = this.fg?.value;
      if (!v) return;
      this.periodLabel = this.buildPeriodLabel(v.fromDate, v.toDate);
    }
  
    private readCompanyName(): string {
      var comname : string | null = null;
      this.companyName$.subscribe((name) => {
        comname = name || null;
      });
      // tuỳ dự án bạn lưu company ở đâu; ưu tiên localStorage/sessionStorage
      return (
        comname ||
        'Company'
      );
    }
  
  /** Demo: tạo dữ liệu theo thời điểm hiện tại để luôn có dòng hiển thị với From/To mặc định (tháng hiện tại) */
  private seedDemoRows(): Row[] {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
  
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const addDays = (d: Date, n: number) => {
      const x = new Date(d);
      x.setDate(x.getDate() + n);
      return x;
    };
  
    // Đảm bảo có data trong "tháng hiện tại"
    const dA = new Date(y, m, Math.max(1, today.getDate() - 10));
    const dB = new Date(y, m, Math.max(1, today.getDate() - 7));
    const dC = new Date(y, m, Math.max(1, today.getDate() - 3));
    const dD = new Date(y, m, today.getDate());
  
    return [
      {
        debtorCode: '300-B001',
        debtorName: 'BEST PHONE SDN BHD',
        docNo: 'I-000001',
        docDate: iso(dB),
        dueDate: iso(addDays(dB, 30)),
        docType: 'IN',
        salesAgent: 'TEH',
        currency: 'MYR',
        term: 30,
        amount: 4440,
        localAmount: 4440,
        outstanding: 3549,
        localOutstanding: 3549,
      },
      {
        debtorCode: '300-B001',
        debtorName: 'BEST PHONE SDN BHD',
        docNo: 'DN-000001',
        docDate: iso(dC),
        dueDate: iso(addDays(dC, 30)),
        docType: 'DN',
        salesAgent: 'TEH',
        currency: 'MYR',
        term: 30,
        amount: 120,
        localAmount: 120,
        outstanding: 120,
        localOutstanding: 120,
      },
      {
        debtorCode: '300-C001',
        debtorName: 'CARE PHONE SDN BHD',
        docNo: 'I-000003',
        docDate: iso(dA),
        dueDate: iso(addDays(dA, 30)),
        docType: 'IN',
        salesAgent: 'FION',
        currency: 'MYR',
        term: 30,
        amount: 2550,
        localAmount: 2550,
        outstanding: 2550,
        localOutstanding: 2550,
      },
      {
        debtorCode: '300-A001',
        debtorName: 'AAA',
        docNo: 'INV 0801',
        docDate: iso(addDays(dD, -1)),
        dueDate: iso(addDays(addDays(dD, -1), 30)),
        docType: 'IN',
        salesAgent: 'TEH',
        currency: 'MYR',
        term: 30,
        amount: 1250,
        localAmount: 1250,
        outstanding: 1250,
        localOutstanding: 1250,
      },
      {
        debtorCode: '300-L001',
        debtorName: 'LGH ENTERPRISE',
        docNo: 'INV 0803',
        docDate: iso(dD),
        dueDate: iso(addDays(dD, 30)),
        docType: 'IN',
        salesAgent: 'JLO',
        currency: 'MYR',
        term: 30,
        amount: 9500,
        localAmount: 9500,
        outstanding: 9500,
        localOutstanding: 9500,
      },
    ];
  }
    private today() {
      const d = new Date();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${d.getFullYear()}-${m}-${day}`;
    }
  }