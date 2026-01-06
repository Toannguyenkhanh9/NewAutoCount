import { CommonModule, } from '@angular/common';
import { Component, computed, effect, signal,inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { CompanyContextService } from '../../../core/services/company-context.service';
type Bucket = {
  cur: number;
  m1: number;
  m2: number;
  m3: number;
  m4: number;
  over5: number;
  balance: number;
  totalOverDue: number;
};
type Txn = {
  debtorCode: string;
  debtorName: string;
  debtorType: 'RETAIL' | 'TRADING';
  agent: string;
  phone: string;
  currency: string;
  docDate: string; // yyyy-mm-dd
  dueDate: string; // yyyy-mm-dd
  docType: 'IN' | 'DN';
  docNo: string;
  amount: number; // outstanding
  isOverDue?: boolean;
  buckets?: Bucket;
  runBalance?: number;
};

type RowView = {
  expanded?: boolean;
  debtorCode: string;
  debtorName: string;
  debtorType: 'RETAIL' | 'TRADING';
  agent: string;
  phone: string;
  currency: string;
  txns: Txn[];
  totals: Bucket;
};

@Component({
  selector: 'app-creditor-aging-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './creditor-aging-report.component.html',
  styleUrls: ['./creditor-aging-report.component.scss']
})
export class CreditorAgingReportComponent  {
   private companyContext = inject(CompanyContextService);
       companyName$ = this.companyContext.companyName$;
      companyName = this.readCompanyName();
  fg!: FormGroup;
   constructor(private fb: FormBuilder) {
     this.fg = this.fb.group({
       fromDate: [this.startOfMonthYmd(this.maxDocDate(this.masterTxns) || this.today())],
       toDate: [this.maxDocDate(this.masterTxns) || this.today()],
       debtor: ['ALL'], // All
       debtorType: ['ALL'], // All
       agingMonths: [6], // 4 hoặc 6
       groupBy: ['none'], // 'none' | 'debtorType'
     });

     this.fg.valueChanges.subscribe(() => this.inquiry());
     this.inquiry();
   }

   // ======= Danh mục demo =======
   debtors = [
     { code: '300-A001', name: 'CARE PHONE SDN' },
     { code: '300-B001', name: 'BEST PHONE SDN BHD' },
     { code: '300-L001', name: 'LGH ENTERPRISE' },
   ];

   debtorTypes: Array<'RETAIL' | 'TRADING'> = ['RETAIL', 'TRADING'];
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
   private masterTxns: Txn[] = [
     // CARE PHONE SDN (RETAIL) — 1 chứng từ => 5+ OVER 1,250.00
     {
       debtorCode: '400-A001',
       debtorName: 'CARE PHONE SDN',
       debtorType: 'RETAIL',
       agent: 'TEH',
       phone: '0925145321',
       currency: 'MYR',
       docDate: '2025-05-05',
       dueDate: '2025-06-04',
       docType: 'IN',
       docNo: 'INV 0801',
       amount: 1250,
     },

     // BEST PHONE SDN BHD (TRADING) — đúng 3 dòng như hình:
     // 1) DN 120.00 -> CURRENT
     {
       debtorCode: '400-B001',
       debtorName: 'BEST PHONE SDN BHD',
       debtorType: 'TRADING',
       agent: 'TEH',
       phone: '0925145321',
       currency: 'MYR',
       docDate: '2025-10-05',
       dueDate: '2025-11-04',
       docType: 'DN',
       docNo: 'DN-000001',
       amount: 120,
     },
     // 2) IN 2,150.00 -> 1 MONTH
     {
       debtorCode: '400-B001',
       debtorName: 'BEST PHONE SDN BHD',
       debtorType: 'TRADING',
       agent: 'TEH',
       phone: '0925145321',
       currency: 'MYR',
       docDate: '2025-09-23',
       dueDate: '2025-10-23',
       docType: 'IN',
       docNo: 'I-000001',
       amount: 3549,
     },
     // 3) IN 3,549.00 -> 2 MONTHS
     {
       debtorCode: '400-B001',
       debtorName: 'BEST PHONE SDN BHD',
       debtorType: 'TRADING',
       agent: 'TEH',
       phone: '0925145321',
       currency: 'MYR',
       docDate: '2025-10-05',
       dueDate: '2025-11-04',
       docType: 'IN',
       docNo: 'I-000002',
       amount: 2150,
     },

     // LGH ENTERPRISE (TRADING) — 1 chứng từ => 3 MONTHS 9,500.00
     {
       debtorCode: '400-L001',
       debtorName: 'LGH ENTERPRISE',
       debtorType: 'TRADING',
       agent: 'JLO',
       phone: '0925145321',
       currency: 'MYR',
       docDate: '2025-07-23',
       dueDate: '2025-08-23',
       docType: 'IN',
       docNo: 'INV 0803',
       amount: 9500,
     },
   ];

   // ======= state =======
   private _rows = signal<RowView[]>([]);
   rows = computed(() => {
     const list = [...this._rows()];
     const k = this._sortKey();
     const d = this._sortDir();
     const cmp = (a: any, b: any) => {
       const va = k === 'balance' ? a.totals.balance : (a as any)[k];
       const vb = k === 'balance' ? b.totals.balance : (b as any)[k];
       if (typeof va === 'number' && typeof vb === 'number')
         return d === 'asc' ? va - vb : vb - va;
       return d === 'asc'
         ? ('' + va).localeCompare('' + vb)
         : ('' + vb).localeCompare('' + va);
     };
     return list.sort(cmp);
   });

   // group view
   groups = computed(() => {
     if (this.fg.value.groupBy !== 'debtorType') return [];
     const m = new Map<string, RowView[]>();
     for (const r of this.rows()) {
       const key = r.debtorType;
       if (!m.has(key)) m.set(key, []);
       m.get(key)!.push(r);
     }
     return Array.from(m.entries()).map(([key, items]) => ({ key, items }));
   });

   showGrouped = () => this.fg.value.groupBy !== 'none';

   // ======= sort state =======
   private _sortKey = signal<'debtorCode' | 'debtorName' | 'agent' | 'balance'>(
     'debtorCode'
   );
   private _sortDir = signal<'asc' | 'desc'>('asc');


   // ======= view state =======
   private _view = signal<'list' | 'detail'>('list');
   private _selected = signal<RowView | null>(null);

   viewMode = () => this._view();
   selected = () => this._selected();

   openDetail(r: RowView) {
     this._selected.set(r);
     this._view.set('detail');
   }

   backToList() {
     this._view.set('list');
     this._selected.set(null);
   }

   sortKey = () => this._sortKey();
   sortDir = () => this._sortDir();

   onHeaderSort(key: 'debtorCode' | 'debtorName' | 'agent' | 'balance') {
     if (this._sortKey() === key) {
       this._sortDir.set(this._sortDir() === 'asc' ? 'desc' : 'asc');
     } else {
       this._sortKey.set(key);
       this._sortDir.set('asc');
     }
   }

   // ======= UI helpers =======
   colShown(which: 'm4' | 'over5') {
     const months = this.fg.value.agingMonths ?? 6;
     if (which === 'm4') return true; // luôn hiện 4M
     if (which === 'over5') return months >= 6; // chỉ hiện khi 6 months
     return true;
   }

   fullColSpan() {
     // 14 cột khi có cả 4M + 5+M
     let c = 14;
     if (!this.colShown('m4')) c--;
     if (!this.colShown('over5')) c--;
     return c;
   }

   toggle(r: RowView) {
     r.expanded = !r.expanded;
   }

   // ======= core =======
   inquiry() {

     this.backToList();
// đọc form
     const v = this.fg.getRawValue();

     let fromYmd = v.fromDate || this.startOfMonthYmd(this.maxDocDate(this.masterTxns) || this.today());
     let toYmd = v.toDate || this.maxDocDate(this.masterTxns) || this.today();

     // Nếu user chọn ngược (From > To) thì swap lại cho hợp lý
     if (fromYmd && toYmd && fromYmd > toYmd) {
       const tmp = fromYmd;
       fromYmd = toYmd;
       toYmd = tmp;
       this.fg.patchValue({ fromDate: fromYmd, toDate: toYmd }, { emitEvent: false });
     }

     // Aging tính "as at" theo To Date
     const asOf = new Date(toYmd || this.today());

     // filter theo date range + creditor / creditorType
     let rows = this.masterTxns
       .filter((t) => !fromYmd || t.docDate >= fromYmd)
       .filter((t) => !toYmd || t.docDate <= toYmd)
       .filter((t) => v.debtor === 'ALL' || t.debtorCode === v.debtor)
       .filter((t) => v.debtorType === 'ALL' || t.debtorType === v.debtorType)
       .map((t) => this.withBuckets(t, asOf, v.agingMonths ?? 6));

     // gộp theo debtor
     const map = new Map<string, RowView>();
     for (const t of rows) {
       const key = t.debtorCode;
       if (!map.has(key)) {
         map.set(key, {
           debtorCode: t.debtorCode,
           debtorName: t.debtorName,
           debtorType: t.debtorType,
           agent: t.agent,
           phone: t.phone,
           currency: t.currency,
           txns: [],
           totals: this.zeroBucket(),
           expanded: false,
         });
       }
       const r = map.get(key)!;
       r.txns.push(t);
       this.addBucket(r.totals, t.buckets!);
     }
     for (const r of map.values()) {
       // (nếu muốn cộng dồn theo thứ tự riêng, có thể sort r.txns ở đây)
       // r.txns.sort((a, b) => a.docDate.localeCompare(b.docDate)); // ví dụ

       let run = 0;
       for (const t of r.txns) {
         run += t.buckets?.balance ?? 0;
         t.runBalance = run; // ⬅️ gán cộng dồn
       }
     }
     this._rows.set(Array.from(map.values()));
   }

   // ======= bucket helpers =======
   private withBuckets(t: Txn, asOf: Date, agingMonths: 4 | 6): Txn {
     const b = this.zeroBucket();

     const due = new Date(t.dueDate);
     const diffM = this.monthDiff(due, asOf); // số tháng overdue (âm/0 => current)
     t.isOverDue = diffM > 0;

     const amount = t.amount;

     if (diffM <= 0) b.cur += amount;
     else if (diffM === 1) b.m1 += amount;
     else if (diffM === 2) b.m2 += amount;
     else if (diffM === 3) b.m3 += amount;
     else if (diffM === 4) b.m4 += amount;
     else b.over5 += amount;

     b.balance = b.cur + b.m1 + b.m2 + b.m3 + b.m4 + b.over5;
     b.totalOverDue = b.m1 + b.m2 + b.m3 + b.m4 + b.over5;

     // nếu chọn 4 months: gộp 5+ vào 4M cho dễ nhìn (cột 5+ bị ẩn)
     if (agingMonths === 4 && b.over5) {
       b.m4 += b.over5;
       b.over5 = 0;
     }

     t.buckets = b;
     return t;
   }

   private zeroBucket(): Bucket {
     return {
       cur: 0,
       m1: 0,
       m2: 0,
       m3: 0,
       m4: 0,
       over5: 0,
       balance: 0,
       totalOverDue: 0,
     };
   }
   private addBucket(dst: Bucket, src: Bucket) {
     dst.cur += src.cur;
     dst.m1 += src.m1;
     dst.m2 += src.m2;
     dst.m3 += src.m3;
     dst.m4 += src.m4;
     dst.over5 += src.over5;
     dst.balance += src.balance;
     dst.totalOverDue += src.totalOverDue;
   }

   private monthDiff(a: Date, b: Date) {
     const months =
       (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
     // nếu cùng tháng nhưng b ngày <= a ngày thì coi như chưa qua thêm 1 tháng
     return b.getDate() > a.getDate() ? months : months;
   }
   // ======= Date helpers (From/To) =======
   private maxDocDate(list: Txn[]): string {
     let max = '';
     for (const t of list || []) {
       if (t?.docDate && t.docDate > max) max = t.docDate;
     }
     return max;
   }

   private startOfMonthYmd(ymd: string): string {
     if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
       const t = this.today();
       return t.slice(0, 8) + '01';
     }
     return ymd.slice(0, 8) + '01';
   }

   private formatLongYmd(ymd: string): string {
     if (!ymd) return '';
     const dt = new Date(ymd);
     if (isNaN(dt.getTime())) return ymd;
     return new Intl.DateTimeFormat('en-GB', {
       day: 'numeric',
       month: 'long',
       year: 'numeric',
     }).format(dt);
   }

   get periodLabel(): string {
     const v = this.fg.getRawValue();
     const from = v.fromDate || '';
     const to = v.toDate || '';
     if (!from && !to) return '';
     if (from && to) return `For the period ${this.formatLongYmd(from)} to ${this.formatLongYmd(to)}`;
     if (to) return `As at ${this.formatLongYmd(to)}`;
     return `From ${this.formatLongYmd(from)}`;
   }

today() {
     const d = new Date();
     const m = String(d.getMonth() + 1).padStart(2, '0');
     const day = String(d.getDate()).padStart(2, '0');
     return `${d.getFullYear()}-${m}-${day}`;
   }
   // Đặt trong class DebtorAgingReportComponent
   get totalsAll() {
     const init = {
       cur: 0,
       m1: 0,
       m2: 0,
       m3: 0,
       m4: 0,
       over5: 0,
       totalOverDue: 0,
       balance: 0,
     };

     return this.rows().reduce((acc: any, r: any) => {
       const t = r?.totals ?? init;

       acc.cur += t.cur ?? 0;
       acc.m1 += t.m1 ?? 0;
       acc.m2 += t.m2 ?? 0;
       acc.m3 += t.m3 ?? 0;
       acc.m4 += t.m4 ?? 0;
       acc.over5 += t.over5 ?? 0;

       // totalOverDue: nếu đã có sẵn thì lấy, không thì tự cộng các bucket
       const sumOverDue =
         t.totalOverDue != null
           ? t.totalOverDue
           : (t.cur ?? 0) +
             (t.m1 ?? 0) +
             (t.m2 ?? 0) +
             (t.m3 ?? 0) +
             (t.m4 ?? 0) +
             (t.over5 ?? 0);

       acc.totalOverDue += sumOverDue;
       acc.balance += t.balance ?? sumOverDue; // hoặc t.balance ?? 0 nếu bạn tách balance riêng

       return acc;
     }, init);
   }
 }
