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
  page = 1;
  pageSize = 8;
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

private openingSeed: ObRow[] = [
  { accountCode: '1000-000', accountName: 'Cash on Hand', asOf: '2025-01-01', openingDebit: 5000, openingCredit: 0, remark: '' },
  { accountCode: '1010-000', accountName: 'Cash at Bank - Main', asOf: '2025-01-01', openingDebit: 20000, openingCredit: 0, remark: 'B/F' },
  { accountCode: '1100-000', accountName: 'Accounts Receivable', asOf: '2025-01-01', openingDebit: 15000, openingCredit: 0, remark: '' },
  { accountCode: '2000-000', accountName: 'Accounts Payable', asOf: '2025-01-01', openingDebit: 0, openingCredit: 12000, remark: '' },
  { accountCode: '3000-000', accountName: 'Share Capital', asOf: '2025-01-01', openingDebit: 0, openingCredit: 8000, remark: '' },
];

// dữ liệu grid (list tất cả account code)
rows: ObRow[] = [];

constructor() {
  this.rows = this.buildRowsFromAccounts();
}
private buildRowsFromAccounts(): ObRow[] {
  const seedMap = new Map(this.openingSeed.map(x => [x.accountCode, x]));

  return this.accounts.map(a => {
    const ob = seedMap.get(a.code);
    return {
      accountCode: a.code,
      accountName: a.name,
      asOf: ob?.asOf || '2025-01-01',
      openingDebit: Number(ob?.openingDebit || 0),
      openingCredit: Number(ob?.openingCredit || 0),
      remark: ob?.remark || '',
    };
  });
}
editingRowCode: string | null = null;
editDraft: { openingDebit: number; openingCredit: number } = {
  openingDebit: 0,
  openingCredit: 0,
};
isRowEditing(r: ObRow): boolean {
  return this.editingRowCode === r.accountCode;
}

startRowEdit(r: ObRow) {
  this.editingRowCode = r.accountCode;
  this.editDraft = {
    openingDebit: Number(r.openingDebit || 0),
    openingCredit: Number(r.openingCredit || 0),
  };
}

cancelRowEdit() {
  this.editingRowCode = null;
  this.editDraft = { openingDebit: 0, openingCredit: 0 };
}

onInlineAmountChange(which: 'debit' | 'credit') {
  if (which === 'debit') {
    this.editDraft.openingDebit = Number(this.editDraft.openingDebit) || 0;
    if (this.editDraft.openingDebit > 0) {
      this.editDraft.openingCredit = 0;
    }
  } else {
    this.editDraft.openingCredit = Number(this.editDraft.openingCredit) || 0;
    if (this.editDraft.openingCredit > 0) {
      this.editDraft.openingDebit = 0;
    }
  }
}

saveRowEdit(r: ObRow) {
  r.openingDebit = Number(this.editDraft.openingDebit) || 0;
  r.openingCredit = Number(this.editDraft.openingCredit) || 0;

  this.editingRowCode = null;
  this.editDraft = { openingDebit: 0, openingCredit: 0 };

  this.openSuccess(`Saved ${r.accountCode} successfully.`);
}

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
  totalDebit() { return this.filtered().reduce((t, r) => t + (r.openingDebit || 0), 0); }
  totalCredit() { return this.filtered().reduce((t, r) => t + (r.openingCredit || 0), 0); }
  totalNet() { return this.filtered().reduce((t, r) => t + this.netOf(r), 0); }

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
    this.showDeleteConfirm = false;

    this.openSuccess(`Deleted successfully.`);
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
    this.openSuccess(this.isEdit ? `Save successfully.` : 'Create successfully.');
  }
  showSuccess = false;
  successMsg = '';
  private openSuccess(msg: string) {
    this.successMsg = msg;
    this.showSuccess = true;
  }
  closeSuccess() {
    this.showSuccess = false;
  }
  showDeleteConfirm = false;
  cancelDelete() {
    this.showDeleteConfirm = false;
  }
  askDelete() {
    if (!this.selected) return;
    this.showDeleteConfirm = true;
  }
  showSaveConfirm = false;
  confirmMsg = '';
  askSave() {
    // có thể gọi validate trước nếu muốn, nhưng vì nút đã disabled theo canSave() nên thường không cần
    this.confirmMsg = this.isEdit
      ? 'Are you sure you want to update this Opening Balance Maintenance ?'
      : 'Are you sure you want to create this Opening Balance Maintenance ?';
    this.showSaveConfirm = true;
  }

  cancelConfirmSave() {
    this.showSaveConfirm = false;
  }

  doConfirmSave() {
    this.showSaveConfirm = false;
    this.save(); // gọi save thật
  }
}
