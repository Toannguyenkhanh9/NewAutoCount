import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AmountInputDirective } from '../../../_share/directives';
type ISODate = string; // 'YYYY-MM-DD'

export interface CurrencyRow {
  code: string; // USD
  word1: string; // US Dollar
  word2: string; // US Dollar
  symbol: string; // USD / $
  bankBuyRate: number; // 1.0000
  bankSellRate: number; // 1.0000
  gainAcc: string; // 530-0000
  lossAcc: string; // 908-0000
  journal: string; // GENERAL
}

export interface CurrencyRate {
  from: ISODate;
  to?: ISODate;
  buy: number;
  sell: number;
}

@Component({
  selector: 'app-currency-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule,AmountInputDirective],
  templateUrl: './currency-maintenance.component.html',
  styleUrls: ['./currency-maintenance.component.scss'],
})
export class CurrencyMaintenanceComponent {
  q = '';

  /** Demo danh mục tài khoản & journal */
  accounts = ['530-0000', '531-0000', '908-0000', '909-0000'];
  journals = ['GENERAL', 'SALES', 'PURCHASE', 'CASH'];

  /** Dữ liệu lưới */
  rows: CurrencyRow[] = [
    {
      code: 'MYR',
      word1: 'RINGGIT MALAYSIA',
      word2: '',
      symbol: 'MYR',
      bankBuyRate: 1.0,
      bankSellRate: 1.0,
      gainAcc: '530-0000',
      lossAcc: '908-0000',
      journal: 'GENERAL',
    },
    {
      code: 'USD',
      word1: 'US Dollar',
      word2: '',
      symbol: 'USD',
      bankBuyRate: 3.5,
      bankSellRate: 3.6,
      gainAcc: '530-0000',
      lossAcc: '908-0000',
      journal: 'GENERAL',
    },
  ];

  /** Tỷ giá theo mã */
  ratesByCode: Record<string, CurrencyRate[]> = {
    USD: [
      { from: '2025-01-01', to: '2025-03-31', buy: 3.48, sell: 3.59 },
      { from: '2025-04-01', buy: 3.5, sell: 3.6 },
    ],
  };

  // selection
  selected: CurrencyRow | null = null;
  showDeleteConfirm = false;
  // paging
  page = 1;
  pageSize = 12;
  // modal Currency edit
  showModal = false;
  isEdit = false;
  form: CurrencyRow = this.blank();

  showRateDeleteConfirm = false;
  rateDeleteIdx: number | null = null;
  rateToDeletePreview?: CurrencyRate;

  // modal Currency Rate
  showRateMgr = false;
  rateForCode = '';
  rateRows: CurrencyRate[] = []; // làm việc tạm thời

  // small dialog Add/Edit Rate
  showRateForm = false;
  rateFormIdx: number | null = null;
  rateForm: CurrencyRate = {
    from: this.today(),
    to: undefined,
    buy: 0,
    sell: 0,
  };
  baseCurrencyCode = 'MYR';

  // 2) Helper kiểm tra
  isBase = (r?: { code?: string }) =>
    !!r && (r.code || '').toUpperCase() === this.baseCurrencyCode;
  // ---------- helpers ----------
  blank(): CurrencyRow {
    return {
      code: '',
      word1: '',
      word2: '',
      symbol: '',
      bankBuyRate: 1,
      bankSellRate: 1,
      gainAcc: this.accounts[0],
      lossAcc: this.accounts[0],
      journal: this.journals[0],
    };
  }
  today(): ISODate {
    return new Date().toISOString().slice(0, 10);
  }

  filteredRows(): CurrencyRow[] {
    const s = this.q.trim().toLowerCase();
    if (!s) return this.rows;
    return this.rows.filter((r) =>
      (r.code + ' ' + r.word1 + ' ' + r.symbol).toLowerCase().includes(s)
    );
  }

  pageCount(): number {
    const n = this.filteredRows().length;
    return n === 0 ? 1 : Math.ceil(n / this.pageSize);
  }
  pick(r: CurrencyRow) {
    this.selected = r;
  }
  isPicked(r: CurrencyRow) {
    return this.selected === r;
  }
  trackByCode(_: number, r: CurrencyRow) {
    return r.code;
  }

  // ---------- toolbar ----------
  onNew() {
    this.isEdit = false;
    this.form = this.blank();
    this.showModal = true;
  }
  onEdit() {
    if (!this.selected) return;
    this.isEdit = true;
    this.form = { ...this.selected };
    this.showModal = true;
  }
  onDelete() {
    if (!this.selected) return;
    if (this.isBase(this.selected)) {
      this.successMsg = `Cannot delete the base currency (${this.baseCurrencyCode}).`;
      this.showSuccess = true; // dùng popup “Success” sẵn có như 1 thông báo
      return;
    }
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

  // ---------- save currency ----------
  closeModal() {
    this.showModal = false;
  }
  save() {
    if (!this.form.code.trim()) {
      alert('Currency Code is required');
      return;
    }
    if (!this.form.word1.trim()) {
      alert('Currency Word is required');
      return;
    }
    if (!this.form.symbol.trim()) {
      alert('Currency Symbol is required');
      return;
    }

    if (this.isEdit) {
      const idx = this.rows.findIndex((r) => r.code === this.form.code);
      if (idx >= 0) this.rows[idx] = { ...this.form };
    } else {
      if (
        this.rows.some(
          (r) => r.code.toUpperCase() === this.form.code.toUpperCase()
        )
      ) {
        alert(
          'Currency Code ' + '"' + this.form.code + '"' + ' already exists.'
        );
        return;
      }
      this.rows = [...this.rows, { ...this.form }];
    }
    this.closeModal();
    this.selected = null;
    const msg = this.isEdit ? 'Updated successfully.' : 'Created successfully.';
    this.openSuccess(msg);
  }

  // ---------- Currency Rate manager ----------
  openRateManager() {
    if (!this.selected) {
      alert('Please select a currency first.');
      return;
    }
    this.rateForCode = this.selected.code;
    this.rateRows = JSON.parse(
      JSON.stringify(this.ratesByCode[this.rateForCode] || [])
    );
    this.showRateMgr = true;
  }
  closeRateMgr() {
    this.showRateMgr = false;
    this.rateForCode = '';
    this.rateRows = [];
  }

  addRate() {
    this.rateFormIdx = null;
    this.rateForm = { from: this.today(), to: undefined, buy: 0, sell: 0 };
    this.showRateForm = true;
  }
  editRate(i: number) {
    this.rateFormIdx = i;
    this.rateForm = { ...this.rateRows[i] };
    this.showRateForm = true;
  }
  askDeleteRate(i: number) {
    this.rateDeleteIdx = i;
    this.rateToDeletePreview = this.rateRows[i];
    this.showRateDeleteConfirm = true;
  }
  confirmDeleteRate() {
    if (this.rateDeleteIdx == null) return;
    this.rateRows.splice(this.rateDeleteIdx, 1);
    this.cancelDeleteRate();
  }

  // Hủy confirm
  cancelDeleteRate() {
    this.showRateDeleteConfirm = false;
    this.rateDeleteIdx = null;
    this.rateToDeletePreview = undefined;
  }
  deleteRate(i: number) {
    this.rateRows.splice(i, 1);
  }
  saveRateForm() {
    if (!this.rateForm.from) {
      alert('From Date is required');
      return;
    }
    if (!this.rateForm.buy || !this.rateForm.sell) {
      alert('Buy/Sell rate is required');
      return;
    }

    if (this.rateFormIdx === null) this.rateRows.push({ ...this.rateForm });
    else this.rateRows[this.rateFormIdx] = { ...this.rateForm };

    // sắp theo from date
    this.rateRows.sort((a, b) => (a.from > b.from ? 1 : -1));
    this.showRateForm = false;
  }
  commitRates() {
    this.ratesByCode[this.rateForCode] = JSON.parse(
      JSON.stringify(this.rateRows)
    );
    this.closeRateMgr();
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
