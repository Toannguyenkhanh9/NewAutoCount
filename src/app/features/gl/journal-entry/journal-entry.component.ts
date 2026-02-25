import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideIconsModule } from '../../../_share/lucide-icons';
import { AmountInputDirective } from '../../../_share/directives';
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
  voucher?: Voucher; // ✅ thêm snapshot để Edit
};

@Component({
  selector: 'app-journal-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideIconsModule, AmountInputDirective],
  templateUrl: './journal-entry.component.html',
  styleUrls: ['./journal-entry.component.scss'],
})
export class JournalEntryComponent {
  proceedWithNew = false;
  page = 1;
  pageSize = 8;
    q = '';
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
    { key: 'type', name: 'Type', checked: true },
    { key: 'docNo', name: 'No.', checked: true },
    { key: 'docDate', name: 'Date', checked: true },
    { key: 'description', name: 'Description', checked: true },
    { key: 'netTotal', name: 'Net Total', checked: true },
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
    this.proceedWithNew = false;
    // ✅ auto fill số khi Add New
    this.seedDocNoIfEmpty();
    this.seedSecondNoIfEmpty();
  }
  removeLine(i: number) {
  this.v.lines.splice(i, 1);
}
  openEdit(row: ListRow) {
    this.proceedWithNew = false;
    if (!row) return;

    this.editingId = row.id;

    // lấy snapshot voucher nếu có, nếu không thì dựng tối thiểu từ list
    const base: Voucher = row.voucher
      ? JSON.parse(JSON.stringify(row.voucher))
      : {
        ...this.makeEmptyVoucher(),
        description: row.description || '',
        docNo: row.docNo || '',
        docDate: row.docDate || this.today(),
        secondNo: '', // nếu không có snapshot
      };

    // hydrate đảm bảo header khớp list
    base.docNo = row.docNo || base.docNo || '';
    base.docDate = row.docDate || base.docDate || this.today();
    base.description = row.description || base.description || '';
    base.secondNo = base.secondNo || ''; // giữ nguyên nếu có

    this.v = base;
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

  // nếu user xoá docNo/secondNo thì generate lại trước khi lưu
  if (!String(this.v.docNo || '').trim()) this.seedDocNoIfEmpty();
  if (!String(this.v.secondNo || '').trim()) this.seedSecondNoIfEmpty();

  const net = this.totalDR(); // = totalCR
  const docNo = this.v.docNo; // giữ lại để show message sau khi reset/back

  const row: ListRow = {
    id: this.editingId ?? crypto.randomUUID?.() ?? String(Date.now()),
    docNo: this.v.docNo,
    docDate: this.v.docDate,
    description: this.v.description || '(No description)',
    netTotal: net,
    cancelled: false,
    voucher: JSON.parse(JSON.stringify(this.v)),
  };

  const isEdit = !!this.editingId;

  if (isEdit) {
    const i = this.rows.findIndex((x) => x.id === this.editingId);
    if (i >= 0) this.rows[i] = row;

    this.backToList();
    this.openSuccess(`Update Journal Entry ${docNo} successfully.`);
    return;
  }

  // Create
  this.rows.unshift(row);

  // ✅ Proceed with new (chỉ áp dụng khi Create)
  if (this.proceedWithNew) {
    this.openSuccess(`Create Journal Entry ${docNo} successfully.`);

    this.resetForNextNew({
      journalType: this.v.journalType,
      postDetailToGL: this.v.postDetailToGL,
      // description: this.v.description, // nếu muốn giữ
    });

    return;
  }

  // bình thường: đóng form về list
  this.backToList();
  this.openSuccess(`Create Journal Entry ${docNo} successfully.`);
}

  onDocDateChanged() {
    if (this.editingId) return; // Edit mode: không auto
    const cur = String(this.v.docNo || '').trim();
    const parsed = this.parseJV(cur);

    // nếu docNo đang là auto format thì cho chạy lại theo tháng mới
    if (!cur || parsed) {
      this.v.docNo = '';
      this.seedDocNoIfEmpty();

      // secondNo đang auto theo docNo thì update theo
      const s2 = String(this.v.secondNo || '').trim();
      if (!s2 || s2 === cur) {
        this.v.secondNo = '';
        this.seedSecondNoIfEmpty();
      }
    }
  }

  private nextRunningNo(): string {
    // demo: JV-YYYYMM-xxxx
    const y = new Date().toISOString().slice(0, 7).replace('-', '');
    const seq = (this.rows.length + 1).toString().padStart(4, '0');
    return `JV-${y}-${seq}`;
  }
  showAddRowMenu = false;
  toggleAddRowMenu() {
    this.showAddRowMenu = !this.showAddRowMenu;
  }

  closeAddRowMenu() {
    this.showAddRowMenu = false;
  }
  addRows(count: number) {
    for (let i = 0; i < count; i++) {
      this.addLine();
    }
  }
  showAddMethodMenu = false;
  toggleAddMethodMenu() {
    this.showAddMethodMenu = !this.showAddMethodMenu;
  }

  closeAddMethodMenu() {
    this.showAddMethodMenu = false;
  }
  addMethods(count: number) {
    for (let i = 0; i < count; i++) {
      this.addLine();
    }
  }
  private readonly DOC_PAD = 4;

  private parseJV(v: string): { yyyymm: string; seq: number } | null {
    const s = String(v || '').trim().toUpperCase();
    const m = /^JV-(\d{6})-(\d{4})$/.exec(s);
    if (!m) return null;
    return { yyyymm: m[1], seq: Number(m[2]) };
  }

  private yyyymmFromDate(docDate?: string): string {
    const d = docDate ? new Date(docDate) : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}${m}`;
  }

  private jvSeqKey(yyyymm: string) {
    return `journal_seq_JV_${yyyymm}`;
  }

  private nextJVNo(docDate?: string): string {
    const yyyymm = this.yyyymmFromDate(docDate);

    // 1) max trong rows
    let maxSeq = 0;
    for (const r of this.rows ?? []) {
      const p = this.parseJV(r.docNo);
      if (!p) continue;
      if (p.yyyymm === yyyymm && p.seq > maxSeq) maxSeq = p.seq;
    }

    // 2) max trong localStorage
    const key = this.jvSeqKey(yyyymm);
    const saved = Number(localStorage.getItem(key) || 0);
    if (saved > maxSeq) maxSeq = saved;

    // 3) next
    const next = maxSeq + 1;
    localStorage.setItem(key, String(next));

    return `JV-${yyyymm}-${String(next).padStart(this.DOC_PAD, '0')}`;
  }

  private seedDocNoIfEmpty() {
    const cur = String(this.v.docNo || '').trim();
    if (cur) return;
    this.v.docNo = this.nextJVNo(this.v.docDate);
  }

  private seedSecondNoIfEmpty() {
    const cur = String(this.v.secondNo || '').trim();
    if (cur) return;

    // giống page trước: secondNo = docNo
    this.v.secondNo = this.v.docNo || '';
  }
  private resetForNextNew(keep?: { description?: string; journalType?: string; postDetailToGL?: boolean }) {
    const keepProceed = this.proceedWithNew; // giữ tick
    const keepDate = this.v.docDate;         // thường giữ ngày để nhập nhanh (tuỳ bạn)

    this.editingId = null;
    this.v = this.makeEmptyVoucher();

    // giữ vài field nếu muốn nhập nhanh
    this.v.docDate = keepDate || this.today();
    if (keep?.journalType) this.v.journalType = keep.journalType;
    if (typeof keep?.postDetailToGL === 'boolean') this.v.postDetailToGL = keep.postDetailToGL;
    if (keep?.description) this.v.description = keep.description;

    // giữ tick
    this.proceedWithNew = keepProceed;

    // seed lại số
    this.seedDocNoIfEmpty();
    this.seedSecondNoIfEmpty();

    // form vẫn mở, không đóng voucherOpen
    this.voucherOpen = true;
  }
showSaveConfirm = false;
confirmMsg = '';

askSave() {
  // có thể gọi validate trước nếu muốn, nhưng vì nút đã disabled theo canSave() nên thường không cần
  this.confirmMsg = this.editingId
    ? 'Are you sure you want to update this Journal Entry ?'
    : 'Are you sure you want to create this Journal Entry ?';
  this.showSaveConfirm = true;
}

cancelConfirmSave() {
  this.showSaveConfirm = false;
}

doConfirmSave() {
  this.showSaveConfirm = false;
  this.saveVoucher(); // gọi save thật
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

askDelete() {
  if (!this.selected) return;
  this.showDeleteConfirm = true;
}

cancelDelete() {
  this.showDeleteConfirm = false;
}

doDelete() {
  if (!this.selected) return;

  const docNo = this.selected.docNo;
  this.rows = this.rows.filter(r => r.id !== this.selected!.id);
  this.selected = null;

  this.showDeleteConfirm = false;
  this.openSuccess(`Deleted Journal Entry ${docNo} successfully.`);
}
}
