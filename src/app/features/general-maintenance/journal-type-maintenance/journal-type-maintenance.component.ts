import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  JournalType,
} from '../../../_share/models/general-maintenance';

export interface EntryType {
  id: number;
  name: string;
}
@Component({
  selector: 'app-journal-type-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './journal-type-maintenance.component.html',
  styleUrls: ['./journal-type-maintenance.component.scss'],
})
export class JournalTypeMaintenanceComponent {
  q = '';
  showDeleteConfirm = false;
  // paging
  page = 1;
  pageSize = 10;
  /** Danh sách Entry Type (dropdown) */
  entryTypes: EntryType[] = [
    { id: 1, name: 'Payment Method' },
    { id: 2, name: 'Journal Entry Only' },
    { id: 3, name: 'A/R Entry or Sales Entry' },
    { id: 4, name: 'A/P Entry or Sales Entry' },
  ];

  /** Dữ liệu mẫu */
  rows: JournalType[] = [
    {
      typeCode: 'BANK-B',
      description: 'BANK RECEIPTS AND PAYMENT',
      description2ND: '',
      entrytypeId: 1,
    },
    {
      typeCode: 'CASH-B',
      description: 'CASH RECEIPTS AND PAYMENT',
      description2ND: '',
      entrytypeId: 1,
    },
    {
      typeCode: 'GENERAL-J',
      description: 'GENERAL JOURNAL',
      description2ND: '',
      entrytypeId: 2,
    },
    {
      typeCode: 'SALE-J',
      description: 'SALES JOURNAL',
      description2ND: '',
      entrytypeId: 3,
    },
    {
      typeCode: 'PURCHASE-J',
      description: 'PURCHASE JOURNAL',
      description2ND: '',
      entrytypeId: 4,
    },
  ];

  /** selection */
  selected: JournalType | null = null;

  /** modal */
  showModal = false;
  isEdit = false;

  /** model form */
  form: JournalType = this.empty();

  empty(): JournalType {
    return {
      typeCode: '',
      description: '',
      description2ND: '',
      entrytypeId: this.entryTypes[0].id,
    };
  }

  /** lọc bảng */
  filteredRows(): JournalType[] {
    const s = this.q.trim().toLowerCase();
    if (!s) return this.rows;
    return this.rows.filter((r) =>
      (r.typeCode + ' ' + r.description + ' ' + (r.description2ND ?? ''))
        .toLowerCase()
        .includes(s)
    );
  }

  /** helpers */
  getEntryName(id: number): string {
    return this.entryTypes.find((t) => t.id === id)?.name ?? '';
  }
  pick(row: JournalType) {
    this.selected = row;
  }
  isPicked(row: JournalType) {
    return this.selected === row;
  }
  trackByCode(_: number, r: JournalType) {
    return r.typeCode;
  }

  pageCount(): number {
    return Math.max(1, Math.ceil(this.filteredRows().length / this.pageSize));
  }

  /** toolbar */
  onNew() {
    this.isEdit = false;
    this.form = this.empty();
    this.open();
  }
  onEdit() {
    if (!this.selected) return;
    this.isEdit = true;
    this.form = { ...this.selected };
    this.open();
  }
  onDelete() {
    if (!this.selected) return;
    this.showDeleteConfirm = true;
  }
  Delete() {
    if (!this.selected) return;
    this.rows = this.rows.filter((r) => r !== this.selected);
    this.selected = null;
    this.closeDeleteConfirm();
  }
  closeDeleteConfirm() {
    this.showDeleteConfirm = false;
  }
  onRefresh() {
    /* mock */
  }
  onPrint() {
    window.print();
  }

  /** modal */
  open() {
    this.showModal = true;
  }
  close() {
    this.showModal = false;
  }

  save() {
    if (!this.form.typeCode.trim()) {
      alert('Journal Type is required');
      return;
    }
    if (!this.form.description.trim()) {
      alert('Description is required');
      return;
    }

    if (this.isEdit) {
      const idx = this.rows.findIndex((r) => r.typeCode === this.form.typeCode);
      if (idx >= 0) this.rows[idx] = { ...this.form };
    } else {
      const exists = this.rows.some(
        (r) => r.typeCode.toUpperCase() === this.form.typeCode.toUpperCase()
      );
      if (exists) {
        alert('Journal Type ' + '"' + this.form.typeCode + '"' + ' already exists');
        return;
      }
      this.rows = [...this.rows, { ...this.form }];
    }
    this.selected = null;
    this.close();
    const msg = this.isEdit ? 'Updated successfully.' : 'Created successfully.';
    this.openSuccess(msg);
  }
  showSuccess = false;
  successMsg = 'Saved successfully.';

  openSuccess(msg = 'Saved successfully.') {
    this.successMsg = msg;
    this.showSuccess = true;
    // tự tắt sau 1500ms (có thể chỉnh)
    setTimeout(() => (this.showSuccess = false), 1500);
  }
  closeSuccess() {
    this.showSuccess = false;
  }
}
