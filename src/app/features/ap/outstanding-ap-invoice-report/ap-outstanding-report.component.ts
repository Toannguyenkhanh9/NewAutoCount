import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormGroup } from '@angular/forms';

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

  showOptions = true;
   isPreview = false;
   fg!: FormGroup;

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
       asOf: [this.today()],
       debtor: [''], // '' = All
       dueType: 'ALL',
       groupBy: 'none',
     });

     this.inquiry();
     this.fg.valueChanges.subscribe(() => {
       this.isPreview = false;
       this.inquiry();
     });
   }

   // ===== Demo data =====
   raw: Row[] = [
     {
       debtorCode: '300-B001',
       debtorName: 'BEST PHONE SDN BHD',
       docNo: 'DN-000001',
       docDate: '2009-10-05',
       dueDate: '2009-11-04',
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
       debtorCode: '300-B001',
       debtorName: 'BEST PHONE SDN BHD',
       docNo: 'I-000001',
       docDate: '2009-09-23',
       dueDate: '2009-10-23',
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
       debtorCode: '300-C001',
       debtorName: 'CARE PHONE SDN BHD',
       docNo: 'I-000003',
       docDate: '2009-11-03',
       dueDate: '2009-12-03',
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
       docDate: '2009-05-05',
       dueDate: '2009-06-04',
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
       docDate: '2008-12-15',
       dueDate: '2009-01-14',
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
     const asOf = new Date(v.asOf!);

     // 1) tính age + copy dữ liệu
     let rows = this.raw.map((r) => ({
       ...r,
       age: Math.floor(
         (asOf.getTime() - new Date(r.dueDate).getTime()) / 86400000
       ),
     }));

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
     if (v.dueType === 'ON_DUE') rows = rows.filter((r) => r.dueDate === v.asOf);

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

   private today() {
     const d = new Date();
     const m = (d.getMonth() + 1).toString().padStart(2, '0');
     const day = d.getDate().toString().padStart(2, '0');
     return `${d.getFullYear()}-${m}-${day}`;
   }
 }
