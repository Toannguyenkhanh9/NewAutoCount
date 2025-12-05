import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';

type ReportingCat = 'Balance Sheet Type' | 'Profit and Loss Type';

export interface AccTypeRow {
  code: string; // AccType
  description: string; // Description
  secondDesc?: string; // 2nd Description
  category: ReportingCat; // Reporting Category
  system: boolean; // System/User Defined  (true = System)
}

@Component({
  selector: 'app-account-type-maintenance',
  templateUrl: './account-type-maintenance.component.html',
  styleUrls: ['./account-type-maintenance.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class AccountTypeMaintenanceComponent {
  // ---- mock data ----
  rows: AccTypeRow[] = [
    {
      code: 'CP',
      description: 'CAPITAL',
      secondDesc: '',
      category: 'Balance Sheet Type',
      system: true,
    },
    {
      code: 'RE',
      description: 'RETAINED EARNING',
      secondDesc: '',
      category: 'Balance Sheet Type',
      system: true,
    },
    {
      code: 'FA',
      description: 'FIXED ASSETS',
      secondDesc: '',
      category: 'Balance Sheet Type',
      system: true,
    },
    {
      code: 'OA',
      description: 'OTHER ASSETS',
      secondDesc: '',
      category: 'Balance Sheet Type',
      system: true,
    },
    {
      code: 'CA',
      description: 'CURRENT ASSETS',
      secondDesc: '',
      category: 'Balance Sheet Type',
      system: true,
    },
    {
      code: 'CL',
      description: 'CURRENT LIABILITIES',
      secondDesc: '',
      category: 'Balance Sheet Type',
      system: true,
    },
    {
      code: 'LL',
      description: 'LONG TERM LIABILITIES',
      secondDesc: '',
      category: 'Balance Sheet Type',
      system: true,
    },
    {
      code: 'OL',
      description: 'OTHER LIABILITIES',
      secondDesc: '',
      category: 'Balance Sheet Type',
      system: true,
    },
    {
      code: 'SL',
      description: 'SALES',
      secondDesc: '',
      category: 'Profit and Loss Type',
      system: true,
    },
    {
      code: 'SA',
      description: 'SALES ADJUSTMENTS',
      secondDesc: '',
      category: 'Profit and Loss Type',
      system: true,
    },
    {
      code: 'CO',
      description: 'COST OF GOODS SOLD',
      secondDesc: '',
      category: 'Profit and Loss Type',
      system: true,
    },
    {
      code: 'OI',
      description: 'OTHER INCOMES',
      secondDesc: '',
      category: 'Profit and Loss Type',
      system: true,
    },
    {
      code: 'EI',
      description: 'EXTRA-ORDINARY INCOME',
      secondDesc: '',
      category: 'Profit and Loss Type',
      system: true,
    },
    {
      code: 'EP',
      description: 'EXPENSES',
      secondDesc: '',
      category: 'Profit and Loss Type',
      system: true,
    },
    {
      code: 'TX',
      description: 'TAXATION',
      secondDesc: '',
      category: 'Profit and Loss Type',
      system: true,
    },
    {
      code: 'AP',
      description: 'APPROPRIATION A/C',
      secondDesc: '',
      category: 'Profit and Loss Type',
      system: true,
    },
  ];

  // ---- UI state ----
  q = '';
  page = 1;
  pageSize = 12;
  selected: AccTypeRow | null = null;
  showDeleteConfirm = false;

  // dialog
  showDialog = false;
  editMode = false;
  form: AccTypeRow = this.blank();

  blank(): AccTypeRow {
    return {
      code: '',
      description: '',
      secondDesc: '',
      category: 'Balance Sheet Type',
      system: false,
    };
  }

  filtered(): AccTypeRow[] {
    const k = this.q.trim().toLowerCase();
    const list = !k
      ? this.rows
      : this.rows.filter(
          (r) =>
            r.code.toLowerCase().includes(k) ||
            r.description.toLowerCase().includes(k) ||
            (r.secondDesc ?? '').toLowerCase().includes(k) ||
            r.category.toLowerCase().includes(k)
        );
    return [...list].sort((a, b) => a.code.localeCompare(b.code));
  }

  pageCount(): number {
    const n = this.filtered().length;
    return n === 0 ? 1 : Math.ceil(n / this.pageSize);
  }

  // toolbar
  openNew() {
    this.editMode = false;
    this.form = {
      code: '',
      description: '',
      secondDesc: '',
      category: 'Balance Sheet Type',
      system: false, // <-- luôn là User
    };
    this.showDialog = true;
  }
  openEdit() {
    if (!this.selected) return;
    this.editMode = true;
    this.form = { ...this.selected }; // <-- chắc chắn vẫn là User
    this.showDialog = true;
  }
  canDelete(): boolean {
    return !!this.selected && !this.selected.system;
  }
  onDelete() {
    if (!this.selected) return;
    this.showDeleteConfirm = true;
  }
  delete(): void {
    if (!this.selected) return;

    if (this.selected.system) {
      alert('System-defined account type cannot be deleted.');
      return;
    }
    const idx = this.rows.findIndex((x) => x.code === this.selected!.code);
    if (idx > -1) {
      this.rows.splice(idx, 1);
      this.selected = null;

      // chỉnh lại trang nếu cần
      const max = this.pageCount();
      if (this.page > max) this.page = max;
    }
    this.closeDeleteConfirm();
  }
  submitted = false;
  save(isInvalid: boolean | null) {
    this.submitted = true;
    if (
      isInvalid ||
      !this.form.code?.trim() ||
      !this.form.description?.trim()
    ) {
      return;
    }
    if (this.editMode) {
      const idx = this.rows.findIndex((r) => r.code === this.form.code);
      if (idx >= 0) this.rows[idx] = JSON.parse(JSON.stringify(this.form));
      else this.rows.push(JSON.parse(JSON.stringify(this.form)));
    } else {
      if (this.rows.some((r) => r.code === this.form.code)) {
        alert('AccType ' + '"' + this.form.code + '"' + ' already exists.');
        return;
      }
      this.rows.push(JSON.parse(JSON.stringify(this.form)));
    }
    this.submitted = false;
    this.closeDialog();
    const msg = this.editMode
      ? 'Updated successfully.'
      : 'Created successfully.';
    this.openSuccess(msg);
  }
  closeDialog() {
    this.showDialog = false;
  }
  closeDeleteConfirm() {
    this.showDeleteConfirm = false;
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
