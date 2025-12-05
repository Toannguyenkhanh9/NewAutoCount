import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ObRow {
  accountCode: string;
  accountName: string;
  asOf: string;           // yyyy-MM-dd (ngày bắt đầu năm tài chính hoặc ngày mang số dư)
  openingDebit: number;
  openingCredit: number;
  remark?: string;
}

@Component({
  selector: 'app-opening-balance-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './opening-balance-maintenance.component.html',
  styleUrls: ['./opening-balance-maintenance.component.scss'],
})
export class OpeningBalanceMaintenanceComponent {
  // tìm kiếm
  q = '';

  // danh mục tài khoản demo
  accounts = [
    { code: '1000-000', name: 'Cash on Hand' },
    { code: '1010-000', name: 'Cash at Bank - Main' },
    { code: '1100-000', name: 'Accounts Receivable' },
    { code: '1200-000', name: 'Inventory' },
    { code: '2000-000', name: 'Accounts Payable' },
    { code: '3000-000', name: 'Share Capital' },
    { code: '4000-000', name: 'Sales' },
    { code: '5000-000', name: 'Cost of Goods Sold' },
    { code: '6000-000', name: 'Operating Expenses' },
  ];

  // dữ liệu mẫu Opening Balance
  rows: ObRow[] = [
    { accountCode: '1000-000', accountName: 'Cash on Hand',        asOf: '2025-01-01', openingDebit: 5000,  openingCredit: 0,     remark: '' },
    { accountCode: '1010-000', accountName: 'Cash at Bank - Main', asOf: '2025-01-01', openingDebit: 20000, openingCredit: 0,     remark: 'B/F' },
    { accountCode: '1100-000', accountName: 'Accounts Receivable', asOf: '2025-01-01', openingDebit: 15000, openingCredit: 0,     remark: '' },
    { accountCode: '2000-000', accountName: 'Accounts Payable',    asOf: '2025-01-01', openingDebit: 0,     openingCredit: 12000, remark: '' },
    { accountCode: '3000-000', accountName: 'Share Capital',       asOf: '2025-01-01', openingDebit: 0,     openingCredit: 8000,  remark: '' },
  ];

  // chọn dòng
  selected: ObRow | null = null;

  // modal state
  showModal = false;
  isEdit = false;

  // form
  form: ObRow = this.empty();

  private todayISO(): string {
    const t = new Date();
    const d = new Date(t.getTime() - t.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 10);
  }

  empty(): ObRow {
    return {
      accountCode: '',
      accountName: '',
      asOf: this.todayISO(),
      openingDebit: 0,
      openingCredit: 0,
      remark: '',
    };
  }

  filtered(): ObRow[] {
    const s = this.q.trim().toLowerCase();
    if (!s) return this.rows;
    return this.rows.filter(r =>
      (r.accountCode + ' ' + r.accountName + ' ' + (r.remark || '')).toLowerCase().includes(s)
    );
  }

  netOf(r: ObRow) { return (r.openingDebit || 0) - (r.openingCredit || 0); }
  totalDebit()  { return this.filtered().reduce((t, r) => t + (r.openingDebit  || 0), 0); }
  totalCredit() { return this.filtered().reduce((t, r) => t + (r.openingCredit || 0), 0); }
  totalNet()    { return this.filtered().reduce((t, r) => t + this.netOf(r), 0); }

  // toolbar actions
  onNew() { this.isEdit = false; this.form = this.empty(); this.openModal(); }
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
  onImport() { alert('Demo: Import not implemented.'); }
  onExport() { alert('Demo: Export not implemented.'); }
  onRefresh() { /* no-op */ }
  onPrint() { window.print(); }

  pick(r: ObRow) { this.selected = r; }
  isPicked(r: ObRow) { return this.selected === r; }
  trackByCode(_: number, r: ObRow) { return r.accountCode; }

  // modal
  openModal() { this.showModal = true; }
  closeModal() { this.showModal = false; }

  onAccountChange() {
    const a = this.accounts.find(x => x.code === this.form.accountCode);
    this.form.accountName = a?.name || '';
  }

  normalizeAmount(which: 'debit' | 'credit') {
    if (which === 'debit') {
      this.form.openingDebit = Number(this.form.openingDebit) || 0;
      if (this.form.openingDebit > 0) this.form.openingCredit = 0;
    } else {
      this.form.openingCredit = Number(this.form.openingCredit) || 0;
      if (this.form.openingCredit > 0) this.form.openingDebit = 0;
    }
  }

  save() {
    if (!this.form.accountCode) { alert('Account Code is required'); return; }
    if (!this.form.asOf) { alert('As of Date is required'); return; }

    if (!this.isEdit && this.rows.some(r => r.accountCode === this.form.accountCode)) {
      // tuỳ hệ thống cho phép 1 account nhiều lần theo ngày; ở demo này chặn trùng account
      alert('This account already has Opening Balance.');
      return;
    }

    if (this.isEdit) {
      const idx = this.rows.findIndex(r => r.accountCode === this.form.accountCode);
      if (idx >= 0) this.rows[idx] = { ...this.form };
    } else {
      this.rows = [...this.rows, { ...this.form }];
    }
    this.closeModal();
  }
}
