import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type EntryType = 'Receipt' | 'Payment';

interface BankEntry {
  id: string;
  docNo: string;
  docDate: string;     // yyyy-MM-dd
  type: EntryType;
  description: string;
  amount: number;      // + for receipt, - for payment
  cleared: boolean;
  clearedDate?: string;
}

@Component({
  selector: 'app-bank-reconciliation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bank-reconciliation.component.html',
  styleUrls: ['./bank-reconciliation.component.scss'],
})
export class BankReconciliationComponent {

  // Header selections
  bankAccounts = [
    'Cash at Bank - Main',
    'Cash at Bank - Payroll',
    'Cash at Bank - USD'
  ];
  bankAccount = this.bankAccounts[0];

  statementEndDate = this.todayISO();
  statementEndingBalance = 15000; // giả lập số dư cuối sao kê

  // Search & filters
  q = '';
  typeFilter: EntryType | 'All' = 'All';

  // Demo opening book balance at period start
  openingBookBalance = 12000;

  // Sample entries
  rows: BankEntry[] = [
    { id:'R-20240801-001', docNo:'CR-00021', docDate:'2024-08-01', type:'Receipt', description:'Customer receipt INV S-10021', amount: 3200,  cleared: true,  clearedDate:'2024-08-03' },
    { id:'P-20240802-009', docNo:'PV-00102', docDate:'2024-08-02', type:'Payment', description:'Supplier payment P-8841',      amount: -2100, cleared: false },
    { id:'R-20240805-014', docNo:'CR-00037', docDate:'2024-08-05', type:'Receipt', description:'Counter sales',                 amount: 450,   cleared: true,  clearedDate:'2024-08-06' },
    { id:'P-20240808-011', docNo:'PV-00118', docDate:'2024-08-08', type:'Payment', description:'Rental August',                 amount: -3000, cleared: false },
    { id:'R-20240812-003', docNo:'CR-00052', docDate:'2024-08-12', type:'Receipt', description:'Misc income',                   amount: 200,   cleared: false },
    { id:'P-20240815-006', docNo:'PV-00134', docDate:'2024-08-15', type:'Payment', description:'Utilities',                     amount: -380,  cleared: true,  clearedDate:'2024-08-16' },
  ];

  // Selection
  selected: BankEntry | null = null;

  // Modal states
  showModal = false;
  isEdit = false;

  // Form model for modal
  form: BankEntry = this.emptyEntry();

  // ===== Utils =====
  private todayISO(): string {
    const t = new Date();
    const d = new Date(t.getTime() - t.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 10);
  }

  private genId(prefix: string) {
    const stamp = Date.now().toString(36);
    const rnd = (Math.random() * 10000 | 0).toString().padStart(4,'0');
    return `${prefix}-${stamp}-${rnd}`;
  }

  emptyEntry(): BankEntry {
    return {
      id: '',
      docNo: '',
      docDate: this.todayISO(),
      type: 'Receipt',
      description: '',
      amount: 0,
      cleared: false,
      clearedDate: undefined
    };
  }

  // ===== Filters / view data =====
  filtered(): BankEntry[] {
    const s = this.q.trim().toLowerCase();
    return this.rows.filter(r => {
      const matchType = this.typeFilter === 'All' ? true : r.type === this.typeFilter;
      const hay = (r.docNo + ' ' + r.docDate + ' ' + r.description).toLowerCase();
      const matchText = !s || hay.includes(s);
      return matchType && matchText;
    }).sort((a,b) => a.docDate.localeCompare(b.docDate) || a.docNo.localeCompare(b.docNo));
  }

  // Summary calculations
  clearedReceipts() {
    return this.filtered().filter(r => r.cleared && r.amount > 0)
      .reduce((t, r) => t + r.amount, 0);
  }
  clearedPayments() {
    return this.filtered().filter(r => r.cleared && r.amount < 0)
      .reduce((t, r) => t + r.amount, 0);
  }
  clearedNet() { return +(this.clearedReceipts() + this.clearedPayments()).toFixed(2); }

  clearedBalance() {
    // Cleared balance = OpeningBookBalance + ClearedNet (đến ngày sao kê)
    return +(this.openingBookBalance + this.clearedNet()).toFixed(2);
  }

  difference() {
    // Difference = StatementEndingBalance - ClearedBalance
    return +(this.statementEndingBalance - this.clearedBalance()).toFixed(2);
  }

  // ===== Toolbar actions =====
  onNew() {
    this.isEdit = false;
    this.form = this.emptyEntry();
    this.openModal();
  }

  onEdit() {
    if (!this.selected) return;
    this.isEdit = true;
    this.form = { ...this.selected };
    this.openModal();
  }

  onDelete() {
    if (!this.selected) return;
    this.rows = this.rows.filter(r => r !== this.selected);
    this.selected = null;
  }

  onRefresh() { /* demo no-op */ }
  onPrint()   { window.print(); }

  clearAll() {
    this.rows = this.rows.map(r => ({ ...r, cleared: true, clearedDate: this.statementEndDate }));
  }
  unclearAll() {
    this.rows = this.rows.map(r => ({ ...r, cleared: false, clearedDate: undefined }));
  }
  autoClearUpToDate() {
    const end = this.statementEndDate;
    this.rows = this.rows.map(r => {
      if (r.docDate <= end) {
        return { ...r, cleared: true, clearedDate: end };
      }
      return r;
    });
  }

  // ===== Row selection & toggle =====
  pick(r: BankEntry) { this.selected = r; }
  isPicked(r: BankEntry) { return this.selected === r; }
  toggleCleared(r: BankEntry) {
    r.cleared = !r.cleared;
    r.clearedDate = r.cleared ? this.statementEndDate : undefined;
  }
  trackById(_: number, r: BankEntry) { return r.id; }

  // ===== Modal =====
  openModal() { this.showModal = true; }
  closeModal() { this.showModal = false; }

  normalizeAmount() {
    // Nếu chọn Receipt mà amount âm -> đổi dấu; Payment mà dương -> đổi dấu
    if (this.form.type === 'Receipt' && this.form.amount < 0) this.form.amount = Math.abs(this.form.amount);
    if (this.form.type === 'Payment' && this.form.amount > 0) this.form.amount = -Math.abs(this.form.amount);
  }

  save() {
    if (!this.form.docNo.trim()) { alert('Document No is required'); return; }
    if (!this.form.docDate) { alert('Document Date is required'); return; }
    if (!this.form.description.trim()) { alert('Description is required'); return; }
    if (!this.form.amount || isNaN(Number(this.form.amount))) { alert('Amount is required'); return; }

    this.normalizeAmount();

    if (this.isEdit) {
      const idx = this.rows.findIndex(r => r.id === this.form.id);
      if (idx >= 0) this.rows[idx] = { ...this.form };
    } else {
      const id = this.genId(this.form.type === 'Receipt' ? 'R' : 'P');
      this.rows = [...this.rows, { ...this.form, id }];
    }
    this.closeModal();
  }
  abs(n: number) { return n < 0 ? -n : n; }
}
