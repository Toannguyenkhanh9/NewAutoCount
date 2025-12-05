import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type JournalLine = {
  accNo: string;
  accName: string;
  desc: string;
  ref2: string;
  dr: number;
  cr: number;
};
type ColumnKey = 'type' | 'docNo' | 'docDate' | 'description' | 'netTotal' | 'cancelled';
interface ColumnConf { key: ColumnKey; name: string; checked: boolean; }
type Voucher = {
  description: string;
  docNo: string;
  docDate: string;
  secondNo: string;
  journalType: string;
  postDetailToGL: boolean;
  lines: JournalLine[];
};

type ListRow = {
  id: string;
  docNo: string;
  docDate: string;
  description: string;
  netTotal: number;
  cancelled: boolean;
};

@Component({
  selector: 'app-journal-entry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './journal-entry.component.html',
  styleUrls: ['./journal-entry.component.scss'],
})
export class JournalEntryComponent {
  // ================== LIST ==================
  rows: ListRow[] = [
    {
      id: 'JV-202511-0001',
      docNo: 'JV-202511-0001',
      docDate: '2025-11-05',
      description: 'Posted from A/R and A/P Contra',
      netTotal: 8800,
      cancelled: false,
    },
    {
      id: 'JV-202511-0002',
      docNo: 'JV-202511-0002',
      docDate: '2025-11-09',
      description: 'Tax',
      netTotal: 1000,
      cancelled: false,
    },
    {
      id: 'JV-202511-0003',
      docNo: 'JV-202511-0003',
      docDate: '2025-11-10',
      description: 'DISPOSAL OF MOTOR VEHICLES',
      netTotal: 70700,
      cancelled: false,
    },
    {
      id: 'JV-202511-0004',
      docNo: 'JV-202511-0004',
      docDate: '2025-11-12',
      description: 'DEPRECIATION 09/2009',
      netTotal: 900,
      cancelled: false,
    },
  ];

  selected: ListRow | null = null;

  filtered() {
    return this.rows; // chỗ này có thể thêm filter/search nếu cần
  }
  totalNet() {
    return this.filtered().reduce((s, r) => s + (r.netTotal || 0), 0);
  }
  trackById(_: number, r: ListRow) {
    return r.id;
  }
  pick(r: ListRow) {
    this.selected = r;
  }
  isPicked(r: ListRow) {
    return this.selected?.id === r.id;
  }
 columnsDrawerOpen = false;
  columns: ColumnConf[] = [
    { key: 'type',        name: 'Type',        checked: true },
    { key: 'docNo',       name: 'No.',         checked: true },
    { key: 'docDate',     name: 'Date',        checked: true },
    { key: 'description', name: 'Description', checked: true },
    { key: 'netTotal',    name: 'Net Total',   checked: true },
  ];

  get col(): Record<ColumnKey, boolean> {
    const m = {} as Record<ColumnKey, boolean>;
    this.columns.forEach(c => (m[c.key] = c.checked));
    return m;
  }
  get viewAll(): boolean { return this.columns.every(c => c.checked); }
  set viewAll(v: boolean) { this.columns.forEach(c => (c.checked = v)); }

  visibleColsCount() { return this.columns.filter(c => c.checked).length; }
  openCols() { this.columnsDrawerOpen = true; }
  closeCols() { this.columnsDrawerOpen = false; }
  // ================== EDITOR (FULL PAGE) ==================
  voucherOpen = false;
  editingId: string | null = null;

  v: Voucher = this.makeEmptyVoucher();

  journalTypes = [
    { code: 'GEN', name: 'General Journal' },
    { code: 'ADJ', name: 'Adjusting Journal' },
  ];

  accounts = [
    { code: '903-0000', name: 'DEPRECIATION OF FIXED ASSETS' },
    { code: '200-5000', name: 'ACCUM. DEPRN. - FURNITURES & FITTINGS' },
    { code: '200-3005', name: 'ACCUM. DEPRN. - OFFICE EQUIPMENT' },
    { code: '200-1005', name: 'ACCUM. DEPRN. MOTOR VEHICLES' },
  ];

  private today() {
    return new Date().toISOString().slice(0, 10);
  }
  private makeEmptyVoucher(): Voucher {
    return {
      description: '',
      docNo: '',
      docDate: this.today(),
      secondNo: '',
      journalType: 'GEN',
      postDetailToGL: true,
      lines: [
        { accNo: '', accName: '', desc: '', ref2: '', dr: 0, cr: 0 },
        { accNo: '', accName: '', desc: '', ref2: '', dr: 0, cr: 0 },
      ],
    };
  }

  // --- Buttons in header ---
  openNew() {
    // -> gọi từ nút "+ New" trên header (đã gắn trong HTML)
    this.editingId = null;
    this.v = this.makeEmptyVoucher();
    this.voucherOpen = true;
  }

  backToList() {
    this.voucherOpen = false;
    this.editingId = null;
  }
  cancelEdit() {
    this.backToList();
  }

  // --- Lines ---
  addLine() {
    this.v.lines.push({ accNo: '', accName: '', desc: '', ref2: '', dr: 0, cr: 0 });
  }
  confirmLineOpen = false;
  removeIndex: number | null = null;
  askRemoveLine(i: number) {
    this.removeIndex = i;
    this.confirmLineOpen = true;
  }
  doRemoveLine() {
    if (this.removeIndex != null) {
      this.v.lines.splice(this.removeIndex, 1);
    }
    this.removeIndex = null;
    this.confirmLineOpen = false;
  }

  fillAccName(d: JournalLine) {
    const found = this.accounts.find((a) => a.code === d.accNo);
    if (found && !d.accName) d.accName = found.name;
    if (!d.desc && this.v.description) d.desc = this.v.description;
  }

  onAmountEdit(d: JournalLine, side: 'dr' | 'cr') {
    const value = Number(d[side] || 0);
    if (side === 'dr' && value !== 0) d.cr = 0;
    if (side === 'cr' && value !== 0) d.dr = 0;
  }

  totalDR() {
    return this.v.lines.reduce((s, l) => s + (Number(l.dr) || 0), 0);
  }
  totalCR() {
    return this.v.lines.reduce((s, l) => s + (Number(l.cr) || 0), 0);
  }
  diff() {
    return this.totalDR() - this.totalCR();
  }
  balanced() {
    return Math.abs(this.diff()) <= 0.005;
  }

  // --- Validate + Save ---
  errors: { mismatch?: string; anyBothSides?: string; noAmount?: string } = {};

  private resetErrors() {
    this.errors = {};
  }
  private validate(): boolean {
    this.resetErrors();

    // Ít nhất một dòng có số tiền
    const hasAmt = this.v.lines.some((l) => (l.dr || 0) !== 0 || (l.cr || 0) !== 0);
    if (!hasAmt) this.errors.noAmount = 'Enter at least one DR/CR amount.';

    // Không để 1 dòng vừa DR vừa CR khác 0
    const anyBoth = this.v.lines.some((l) => (l.dr || 0) !== 0 && (l.cr || 0) !== 0);
    if (anyBoth) this.errors.anyBothSides = 'A line cannot have both DR and CR amounts.';

    // Tổng phải cân
    if (!this.balanced()) this.errors.mismatch = 'Total DR and CR must be equal.';

    return !this.errors.mismatch && !this.errors.anyBothSides && !this.errors.noAmount;
  }

  canSave() {
    // Cho phép nút Save sáng khi đã nhập mô tả hoặc có số dòng + cân
    return this.v.description?.trim()?.length > 0 && this.validate();
  }

  saveVoucher() {
    if (!this.validate()) return;

    const net = this.totalDR(); // = totalCR
    const row: ListRow = {
      id: this.editingId ?? crypto.randomUUID?.() ?? String(Date.now()),
      docNo: this.v.docNo || this.nextRunningNo(),
      docDate: this.v.docDate,
      description: this.v.description || '(No description)',
      netTotal: net,
      cancelled: false,
    };

    if (this.editingId) {
      const i = this.rows.findIndex((x) => x.id === this.editingId);
      if (i >= 0) this.rows[i] = row;
    } else {
      this.rows.unshift(row);
    }

    this.backToList();
  }

  private nextRunningNo(): string {
    // demo: JV-YYYYMM-xxxx
    const y = new Date().toISOString().slice(0, 7).replace('-', '');
    const seq = (this.rows.length + 1).toString().padStart(4, '0');
    return `JV-${y}-${seq}`;
  }
}
