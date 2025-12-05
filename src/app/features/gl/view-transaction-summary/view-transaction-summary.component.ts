import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type ModuleCode = 'AR' | 'AP' | 'GL' | 'BANK' | 'STOCK';
type DocType = 'Invoice' | 'Credit Note' | 'Debit Note' | 'Payment' | 'Receipt' | 'Journal';

interface Txn {
  id: string;
  docDate: string;     // yyyy-MM-dd
  module: ModuleCode;
  type: DocType;
  docNo: string;
  partyCode?: string;
  partyName?: string;
  description: string;
  debit: number;       // >=0
  credit: number;      // >=0
  currency: 'MYR' | 'USD';
}

@Component({
  selector: 'app-view-transaction-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './view-transaction-summary.component.html',
  styleUrls: ['./view-transaction-summary.component.scss'],
})
export class ViewTransactionSummaryComponent {
  // ===== Filters =====
  dateFrom = this.firstDayOfMonth();
  dateTo   = this.todayISO();
  moduleFilter: ModuleCode | 'All' = 'All';
  typeFilter: DocType | 'All' = 'All';
  q = '';

  modules: (ModuleCode | 'All')[] = ['All', 'AR', 'AP', 'GL', 'BANK', 'STOCK'];
  types: (DocType | 'All')[] = ['All', 'Invoice', 'Credit Note', 'Debit Note', 'Payment', 'Receipt', 'Journal'];

  // ===== Sample Data =====
  rows: Txn[] = [
    { id:'AR-INV-0001', docDate:'2025-08-01', module:'AR',   type:'Invoice',     docNo:'S-10001', partyCode:'C0001', partyName:'Alpha Trading',  description:'AR Invoice S-10001',   debit:1200,  credit:0,    currency:'MYR' },
    { id:'AR-RC-0001',  docDate:'2025-08-03', module:'AR',   type:'Receipt',     docNo:'CR-00021', partyCode:'C0001', partyName:'Alpha Trading',  description:'Receipt for S-10001',  debit:0,     credit:1200, currency:'MYR' },
    { id:'AP-INV-0004', docDate:'2025-08-05', module:'AP',   type:'Invoice',     docNo:'P-88011', partyCode:'V0008',  partyName:'Mobile Parts',   description:'AP Invoice P-88011',  debit:0,     credit:2100, currency:'MYR' },
    { id:'AP-PV-0011',  docDate:'2025-08-08', module:'AP',   type:'Payment',     docNo:'PV-00118', partyCode:'V0008',  partyName:'Mobile Parts',   description:'Payment PV-00118',    debit:2100,  credit:0,    currency:'MYR' },
    { id:'GL-JV-0015',  docDate:'2025-08-10', module:'GL',   type:'Journal',     docNo:'JV-00015', description:'Adjusting entry',               debit:300,   credit:300,  currency:'MYR' },
    { id:'BNK-RC-0002', docDate:'2025-08-12', module:'BANK', type:'Receipt',     docNo:'CR-00052', description:'Bank interest',                 debit:200,   credit:0,    currency:'MYR' },
    { id:'BNK-PY-0003', docDate:'2025-08-15', module:'BANK', type:'Payment',     docNo:'PV-00134', description:'Bank charges',                  debit:0,     credit:38,   currency:'MYR' },
    { id:'STK-ADJ-0001',docDate:'2025-08-18', module:'STOCK',type:'Journal',     docNo:'ST-ADJ01', description:'Stock write-off',               debit:0,     credit:450,  currency:'MYR' },
    { id:'AR-CN-0002',  docDate:'2025-08-20', module:'AR',   type:'Credit Note', docNo:'SCN-0002', partyCode:'C0002', partyName:'Beta Retail',    description:'Return goods',          debit:0,     credit:150,  currency:'MYR' },
    { id:'AP-DN-0001',  docDate:'2025-08-22', module:'AP',   type:'Debit Note',  docNo:'PDN-0001', partyCode:'V0010', partyName:'Delta Supply',   description:'Undercharge fix',       debit:80,    credit:0,    currency:'MYR' },
  ];

  // ===== Selection & Modal (detail view) =====
  selected: Txn | null = null;
  showDetail = false;

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
  abs(n: number) { return n < 0 ? -n : n; }

  // ===== Filtering & Totals =====
  filtered(): Txn[] {
    const from = this.dateFrom || '0000-01-01';
    const to   = this.dateTo   || '9999-12-31';
    const s = this.q.trim().toLowerCase();

    return this.rows.filter(r => {
      const inDate = r.docDate >= from && r.docDate <= to;
      const inMod  = this.moduleFilter === 'All' ? true : r.module === this.moduleFilter;
      const inType = this.typeFilter === 'All' ? true : r.type === this.typeFilter;
      const hay = (r.docNo + ' ' + (r.partyCode||'') + ' ' + (r.partyName||'') + ' ' + r.description).toLowerCase();
      const inText = !s || hay.includes(s);
      return inDate && inMod && inType && inText;
    }).sort((a,b)=> a.docDate.localeCompare(b.docDate) || a.docNo.localeCompare(b.docNo));
  }

  totalDebit()  { return this.filtered().reduce((t,r)=> t + (r.debit  || 0), 0); }
  totalCredit() { return this.filtered().reduce((t,r)=> t + (r.credit || 0), 0); }
  totalNet()    { return +(this.totalDebit() - this.totalCredit()).toFixed(2); }

  totalsByType(): { type: DocType, debit: number, credit: number, net: number }[] {
    const map = new Map<DocType, { debit:number; credit:number }>();
    for (const r of this.filtered()) {
      const o = map.get(r.type) || { debit:0, credit:0 };
      o.debit  += r.debit  || 0;
      o.credit += r.credit || 0;
      map.set(r.type, o);
    }
    return (['Invoice','Credit Note','Debit Note','Payment','Receipt','Journal'] as DocType[])
      .filter(t => map.has(t))
      .map(t => {
        const m = map.get(t)!;
        return { type: t, debit: +m.debit.toFixed(2), credit: +m.credit.toFixed(2), net: +(m.debit - m.credit).toFixed(2) };
      });
  }

  // ===== Toolbar actions =====
  quickThisMonth() {
    this.dateFrom = this.firstDayOfMonth();
    this.dateTo = this.todayISO();
  }
  quickLastMonth() {
    const t = new Date();
    const first = new Date(Date.UTC(t.getFullYear(), t.getMonth()-1, 1));
    const last  = new Date(Date.UTC(t.getFullYear(), t.getMonth(), 0));
    this.dateFrom = first.toISOString().slice(0,10);
    this.dateTo   = last.toISOString().slice(0,10);
  }
  quickThisYear() {
    const t = new Date();
    const first = new Date(Date.UTC(t.getFullYear(), 0, 1));
    this.dateFrom = first.toISOString().slice(0,10);
    this.dateTo   = this.todayISO();
  }

  onRefresh() { /* demo no-op */ }
  onExport() { alert('Demo: Export not implemented.'); }
  onPrint()  { window.print(); }

  // ===== Row selection & detail =====
  pick(r: Txn) { this.selected = r; }
  isPicked(r: Txn) { return this.selected === r; }
  trackById(_: number, r: Txn) { return r.id; }

  openDetail() {
    if (!this.selected) return;
    this.showDetail = true;
  }
  closeDetail() { this.showDetail = false; }

  // demo: generate lines for selected document
  detailLines() {
    if (!this.selected) return [];
    const r = this.selected;
    // tạo vài dòng minh hoạ
    return [
      { acc: '1100-000', accName: 'Accounts Receivable', remark: r.description, debit: r.debit, credit: 0 },
      { acc: '4000-000', accName: 'Sales',               remark: r.description, debit: 0,        credit: r.credit },
    ].filter(x => (x.debit||0) + (x.credit||0) > 0);
  }
  detailTotal(side: 'debit'|'credit') {
    return this.detailLines().reduce((t:any, l:any)=> t + (l[side] || 0), 0);
  }
}
