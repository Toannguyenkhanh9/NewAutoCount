import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type YesNo = 'Yes' | 'No';

export interface DebtorTypeRow {
  typeCode: string;
  description: string;
  description2nd: string;
  active: YesNo;
}

@Component({
  selector: 'app-debtor-type-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './debtor-type-maintenance.component.html',
  styleUrls: ['./debtor-type-maintenance.component.scss'],
})
export class DebtorTypeMaintenanceComponent {
  showDeleteConfirm = false;
  selectedIndex: number | null = null;
  // filter
  q = '';
  // paging
  page = 1;
  pageSize = 10;

  // mock data
  rows: DebtorTypeRow[] = [
    {
      typeCode: 'LOCAL',
      description: 'LOCAL USER',
      description2nd: '',
      active: 'Yes',
    },
    {
      typeCode: 'TRADER',
      description: 'TRADER AND REDISTRIBUTOR',
      description2nd: '',
      active: 'Yes',
    },
    {
      typeCode: 'EXPORT',
      description: 'EXPORTER',
      description2nd: '',
      active: 'Yes',
    },
  ];

  // selection
  selected: DebtorTypeRow | null = null;

  // modal states
  showModal = false;
  isEdit = false;

  // form model
  form: DebtorTypeRow = this.emptyRow();

  emptyRow(): DebtorTypeRow {
    return { typeCode: '', description: '', description2nd: '', active: 'Yes' };
  }

  filteredRows(): DebtorTypeRow[] {
    const s = this.q.trim().toLowerCase();
    if (!s) return this.rows;
    return this.rows.filter((r) =>
      (r.typeCode + ' ' + r.description).toLowerCase().includes(s)
    );
  }

  pageCount(): number {
    return Math.max(1, Math.ceil(this.filteredRows().length / this.pageSize));
  }

  // toolbar
  onNew() {
    this.isEdit = false;
    this.form = this.emptyRow();
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
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm() {
    this.showDeleteConfirm = false;
  }

  confirmDelete() {
    if (!this.selected) return;

    // xóa theo typeCode cho an toàn
    const code = this.selected.typeCode;
    this.rows = this.rows.filter((r) => r.typeCode !== code);

    // reset selection + đóng modal
    this.selected = null;
    this.showDeleteConfirm = false;
  }

  onRefresh() {
    /* mock */
  }
  onPrint() {
    window.print();
  }

  // modal
  openModal() {
    this.showModal = true;
  }
  closeModal() {
    this.showModal = false;
  }

  save() {
    if (!this.form.typeCode?.trim()) {
      alert('Debtor Type is required');
      return;
    }

    if (this.isEdit) {
      const idx = this.rows.findIndex(
        (r) => r.typeCode === this.selected?.typeCode
      );
      if (idx >= 0) this.rows[idx] = { ...this.form };
    } else {
      const exists = this.rows.some(
        (r) => r.typeCode.toUpperCase() === this.form.typeCode.toUpperCase()
      );
      if (exists) {
        alert(
          'Debtor Type ' + '"' + this.form.typeCode + '"' + ' already exists.'
        );
        return;
      }
      this.rows = [...this.rows, { ...this.form }];
    }

    this.closeModal();
    this.selected = null;
    const msg = this.isEdit
      ? 'Updated successfully.'
      : 'Created successfully.';
    this.openSuccess(msg);
  }

  // table helpers
  pick(r: any) {
    // bấm lại cùng dòng thì bỏ chọn
    this.selected = this.selected === r ? null : r;
  }

  isPicked(r: any): boolean {
    return this.selected === r;
  }
  trackByType(_: number, r: DebtorTypeRow) {
    return r.typeCode;
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
