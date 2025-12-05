import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type YesNo = 'Yes' | 'No';

interface DocType {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  expanded: boolean;
  types: DocType[];
}

interface FormatDef {
  id: string;
  name: string;
  docTypeId: string; // vẫn giữ để lọc theo DocType đang chọn (không hiển thị trên UI)
  format: string; // ví dụ: 'INV-{yy}{MM}-<00000>'
  digits: number;
  monthly: boolean;
  year: number;
  nextNo: number;
  monthNext: number[];
  sample?: string;
  active: YesNo;
  isDefault?: boolean; // <-- NEW
  monthMap?: Record<number, number[]>; // { 2025: [12 ô], 2026: [12 ô], ... }
}

@Component({
  selector: 'app-document-numbering-format-pro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-numbering-format.component.html',
  styleUrls: ['./document-numbering-format.component.scss'],
})
export class DocumentNumberingFormatProComponent {
  showDeleteConfirm = false;
  deleteTarget: FormatDef | null = null;
  showSetDefaultConfirm = false;
  setDefTarget: {
    row: FormatDef;
    desired: boolean;
    fromModal: boolean;
  } | null = null;
  years: number[] = [];
  selectedYearIdx = 0;
  get selectedYear(): number {
    return this.years[this.selectedYearIdx] ?? this.form.year;
  }
  // ====== Tree data (mock) ======
  cats: Category[] = [
    {
      id: 'sales',
      name: 'Category: Sales',
      expanded: true,
      types: [
        { id: 'IV', name: 'Invoice' },
        { id: 'QT', name: 'Quotation' },
        { id: 'SO', name: 'Sales Order' },
      ],
    },
    {
      id: 'purchase',
      name: 'Category: Purchase',
      expanded: false,
      types: [
        { id: 'PV', name: 'Purchase Voucher' },
        { id: 'PO', name: 'Purchase Order' },
      ],
    },
    {
      id: 'gl',
      name: 'Category: G/L',
      expanded: false,
      types: [{ id: 'JV', name: 'Journal Voucher' }],
    },
  ];

  formats: FormatDef[] = [
    {
      id: 'iv-default',
      name: 'IV Default',
      docTypeId: 'IV',
      format: 'INV-{yy}{MM}-<00001>',
      digits: 5,
      monthly: true,
      year: new Date().getFullYear(),
      nextNo: 1,
      monthNext: Array.from({ length: 12 }, (_, i) => (i + 1) * 1000 + 1),
      active: 'Yes',
      isDefault: true, // <-- có 1 default
    },
    {
      id: 'iv-2',
      name: 'IV2',
      docTypeId: 'IV',
      format: 'INV-{yy}{MM}-<00000>',
      digits: 5,
      monthly: true,
      year: new Date().getFullYear(),
      nextNo: 1,
      monthNext: Array.from({ length: 12 }, () => 1),
      active: 'Yes',
      isDefault: false,
    },
  ];

  // ====== selection trong cây ======
  selectedDoc?: DocType;
  pickDoc(t: DocType, ev?: MouseEvent) {
    if (ev) ev.stopPropagation();
    this.selectedDoc = t;
  }

  // ====== toolbar actions ======
  q = '';

  get visibleFormats(): FormatDef[] {
    const s = (this.q || '').trim().toLowerCase();

    // cache để TS hiểu đã được narrow
    const doc = this.selectedDoc;
    if (!doc) return []; // chưa chọn DocType thì không hiển thị gì

    let list = this.formats.filter((x) => x.docTypeId === doc.id);
    if (s) {
      list = list.filter((x) =>
        (x.name + ' ' + x.format).toLowerCase().includes(s)
      );
    }
    return list;
  }

  // ====== modal New/Edit ======
  showModal = false;
  isEdit = false;
  form: FormatDef = this.blankForm();

  blankForm(): FormatDef {
    return {
      id: '',
      name: '',
      docTypeId: this.selectedDoc?.id || '',
      format: '',
      digits: 5,
      monthly: false,
      year: new Date().getFullYear(),
      nextNo: 1,
      monthNext: Array.from({ length: 12 }, () => 1),
      active: 'Yes',
      isDefault: false, // <-- NEW
    };
  }

  openNew() {
    if (!this.selectedDoc) {
      alert('Hãy chọn 1 DocType ở panel bên trái trước.');
      return;
    }

    this.isEdit = false;
    this.form = this.blankForm();
    this.form.docTypeId = this.selectedDoc.id;

    // ---- Gợi ý Name + Format như trước ----
    const prefix = this.selectedDoc.id;
    const nextIdx = (() => {
      const nums = this.formats
        .filter((f) => f.docTypeId === prefix)
        .map((f) => {
          const m = /^([A-Z0-9]+)-(\d+)$/.exec(f.name?.trim() || '');
          return m ? +m[2] : NaN;
        })
        .filter((n) => !Number.isNaN(n));
      return nums.length ? Math.max(...nums) + 1 : 1;
    })();
    this.form.name = `${prefix}-${nextIdx}`;
    this.form.format =
      prefix === 'IV'
        ? 'INV-<00000>'
        : prefix === 'JV'
        ? 'JV-<000000>'
        : `${prefix}-<00000>`;

    // ==== NEW: tự tạo list year với năm hiện tại ====
    const y = new Date().getFullYear();
    this.form.monthMap = { [y]: Array(12).fill(1) }; // 12 ô mặc định = 1
    this.years = [y];
    this.selectedYearIdx = 0;
    this.form.year = y;
    this.form.monthNext = [...this.form.monthMap[y]]; // nạp vào 12 ô đang hiển thị
    // ================================================

    this.updateDigitsFromFormat();
    this.updateSample();
    this.showModal = true;
  }

  openEdit(row: FormatDef) {
    this.isEdit = true;
    this.form = JSON.parse(JSON.stringify(row));

    if (!this.form.monthMap) {
      const y = this.form.year || new Date().getFullYear();
      this.form.monthMap = {
        [y]:
          this.form.monthNext?.length === 12
            ? [...this.form.monthNext]
            : Array(12).fill(1),
      };
    }
    this.refreshYearList();
    const y =
      this.form.year && this.years.includes(this.form.year)
        ? this.form.year
        : this.years[0];
    this.form.year = y;
    this.form.monthNext = [...(this.form.monthMap![y] ?? Array(12).fill(1))];

    // ⬇️ Chuẩn hoá format theo trạng thái Monthly của bản ghi đang edit
    this.onMonthlyChange(this.form.monthly);

    this.updateDigitsFromFormat();
    this.updateSample();
    this.showModal = true;
  }

  // ===== helpers cho danh sách năm
  private refreshYearList() {
    this.years = Object.keys(this.form.monthMap || {})
      .map((n) => +n)
      .sort((a, b) => a - b);
    this.selectedYearIdx = Math.max(0, this.years.indexOf(this.form.year));
  }

  private syncMonthIntoMap() {
    if (!this.form.monthMap) this.form.monthMap = {};
    this.form.monthMap[this.selectedYear] = [
      ...(this.form.monthNext ?? Array(12).fill(1)),
    ];
  }

  selectYearIndex(i: number) {
    this.syncMonthIntoMap();
    this.selectedYearIdx = i;
    this.form.year = this.selectedYear;
    this.form.monthNext = [
      ...(this.form.monthMap![this.form.year] ?? Array(12).fill(1)),
    ];
    this.updateSample();
  }
  get currentYear(): number {
    return new Date().getFullYear();
  }

  // GIỮ nguyên: this.years, selectedYearIdx, selectedYear, refreshYearList(), syncMonthIntoMap()

  addYear(): void {
    this.syncMonthIntoMap();

    // 1) nếu chưa có năm hiện tại -> thêm năm hiện tại trước
    const cy = this.currentYear;
    if (!this.form.monthMap) this.form.monthMap = {};
    if (!this.years.includes(cy)) {
      this.form.monthMap[cy] = Array(12).fill(1);
      this.refreshYearList();
      this.selectYearIndex(this.years.indexOf(cy));
      return;
    }

    // 2) đã có năm hiện tại -> thêm năm kế tiếp sau năm lớn nhất
    const y = Math.max(...this.years) + 1;
    this.form.monthMap[y] = Array(12).fill(1);
    this.refreshYearList();
    this.selectYearIndex(this.years.indexOf(y));
  }

  removeYear(): void {
    if (!this.years.length) return;

    const cy = this.currentYear;
    const ySel = this.selectedYear;

    // không cho xóa năm hiện tại
    if (ySel === cy) {
      alert('Cannot delete the current year.');
      return;
    }
    if (this.years.length <= 1) return;

    this.syncMonthIntoMap();
    delete this.form.monthMap![ySel];
    this.refreshYearList();
    this.form.year = this.selectedYear;
    this.form.monthNext = [
      ...(this.form.monthMap![this.form.year] ?? Array(12).fill(1)),
    ];
    this.updateSample();
  }

  // nhập ô tháng -> lưu lại map + update sample
  syncAndUpdateSample() {
    this.syncMonthIntoMap();
    this.updateSample();
  }
  onToggleDefault(row: FormatDef, ev: Event) {
    ev.stopPropagation();
    const el = ev.target as HTMLInputElement;
    const want = el.checked;

    const msg = want
      ? `Set "${row.name}" as the default format for ${row.docTypeId}? This will replace the current default.`
      : `Remove the default flag from "${row.name}"?`;

    if (!confirm(msg)) {
      // revert cả view lẫn model
      el.checked = !want;
      row.isDefault = !want;
      return;
    }

    if (want) {
      // chỉ cho 1 default trên mỗi DocType
      this.formats.forEach((f) => {
        if (f.docTypeId === row.docTypeId) f.isDefault = false;
      });
      row.isDefault = true;
    } else {
      row.isDefault = false;
    }
  }
  openDelete(row: FormatDef, _fromBtn?: boolean) {
    this.deleteTarget = row;
    this.showDeleteConfirm = true;
  }

  // đóng popup
  closeDeleteConfirm() {
    this.showDeleteConfirm = false;
    this.deleteTarget = null;
  }

  // xác nhận xóa
  confirmDelete() {
    if (!this.deleteTarget) return;
    this.formats = this.formats.filter((f) => f.id !== this.deleteTarget!.id);
    this.closeDeleteConfirm();
  }
  delete(row: FormatDef) {
    if (!confirm(`Delete format "${row.name}"?`)) return;

    // nếu xóa format đang là default, bỏ luôn trạng thái default
    const wasDefault = row.isDefault;
    this.formats = this.formats.filter((f) => f.id !== row.id);

    // nếu vừa xóa default và còn lại item cùng docType => set item đầu tiên làm default
    if (wasDefault) {
      const same = this.formats.filter((f) => f.docTypeId === row.docTypeId);
      if (same.length) {
        same.forEach((f, i) => (f.isDefault = i === 0));
        this.formats = [...this.formats]; // trigger change detection
      }
    }
  }

  setDefault(row: FormatDef) {
    // chỉ 1 default / mỗi DocType
    this.formats
      .filter((f) => f.docTypeId === row.docTypeId)
      .forEach((f) => (f.isDefault = f.id === row.id));
    this.formats = [...this.formats];
  }
  askSetDefault(row: FormatDef, ev: MouseEvent) {
    ev.preventDefault(); // chặn UI đổi check
    ev.stopPropagation();
    this.setDefTarget = { row, desired: !row.isDefault, fromModal: false };
    this.showSetDefaultConfirm = true;
  }
  askSetDefaultInModal(ev: MouseEvent) {
    ev.preventDefault(); // chặn UI đổi check
    this.setDefTarget = {
      row: this.form,
      desired: !this.form.isDefault,
      fromModal: true,
    };
    this.showSetDefaultConfirm = true;
  }

  closeSetDefaultConfirm() {
    this.showSetDefaultConfirm = false;
    this.setDefTarget = null;
  }

  // Đảm bảo chỉ 1 default / DocType
  private enforceUniqueDefault(docTypeId: string, keepId?: string) {
    this.formats = this.formats.map((f) =>
      f.docTypeId === docTypeId && f.id !== keepId
        ? { ...f, isDefault: false }
        : f
    );
  }

  confirmSetDefault() {
    if (!this.setDefTarget) return;
    const { row, desired, fromModal } = this.setDefTarget;

    if (desired) {
      // Nếu set default = true -> bỏ default các format khác cùng DocType
      // - Nếu đang EDIT 1 row có id -> enforce ngay
      // - Nếu đang NEW (chưa có id), cứ set form.isDefault=true; enforce khi Save
      if (fromModal) {
        this.form.isDefault = true;
        if (this.isEdit && this.form.id)
          this.enforceUniqueDefault(this.form.docTypeId, this.form.id);
      } else {
        row.isDefault = true;
        if (row.id) this.enforceUniqueDefault(row.docTypeId, row.id);
      }
    } else {
      // Cho phép tắt default (nếu muốn)
      if (fromModal) this.form.isDefault = false;
      else row.isDefault = false;
    }

    this.closeSetDefaultConfirm();
  }

  save() {
    if (!this.form.name.trim()) {
      alert('Name is required');
      return;
    }
    if (!this.form.format.trim()) {
      alert('Format is required');
      return;
    }
    if (!this.form.digits || this.form.digits < 1) {
      alert('Digits must be >= 1');
      return;
    }

    // nếu monthly, chốt lại 12 ô của năm đang chọn để tương thích field monthNext/year
    if (this.form.monthly) {
      this.syncMonthIntoMap();
      this.form.year = this.selectedYear;
      this.form.monthNext = [
        ...(this.form.monthMap![this.form.year] ?? Array(12).fill(1)),
      ];
    }
    if (!this.form.name.trim()) {
      alert('Name is required');
      return;
    }
    if (!this.selectedDoc?.id && !this.form.docTypeId) {
      alert('Document Type is required');
      return;
    }
    if (!this.form.format.trim()) {
      alert('Format is required');
      return;
    }
    if (!this.form.digits || this.form.digits < 1) {
      alert('Digits must be >= 1');
      return;
    }

    // đảm bảo docTypeId được set theo DocType đang chọn (vì đã ẩn khỏi UI)
    if (!this.form.docTypeId && this.selectedDoc?.id) {
      this.form.docTypeId = this.selectedDoc.id;
    }

    if (this.isEdit) {
      const idx = this.formats.findIndex((f) => f.id === this.form.id);
      if (idx >= 0)
        this.formats[idx] = { ...this.form, sample: this.sampleOf(this.form) };
      // Nếu sau edit mà isDefault = true -> enforce
      if (this.form.isDefault)
        this.enforceUniqueDefault(this.form.docTypeId, this.form.id);
    } else {
      const id = (this.form.docTypeId + '-' + this.form.name)
        .toLowerCase()
        .replace(/\s+/g, '-');
      if (this.formats.some((f) => f.id === id)) {
        alert(
          'Name ' +
            '"' +
            this.form.name +
            '"' +
            ' already exists in the system, please create a new name.'
        );
        return;
      }
      const row: FormatDef = {
        ...this.form,
        id,
        sample: this.sampleOf(this.form),
      };
      // Thêm vào list
      this.formats = [row, ...this.formats];
      // Nếu NEW và isDefault = true -> enforce sau khi có id
      if (row.isDefault) this.enforceUniqueDefault(row.docTypeId, row.id);
    }
    this.showModal = false;
        const msg = this.isEdit
      ? 'Updated successfully.'
      : 'Created successfully.';
    this.openSuccess(msg);
  }
  updateDigitsFromFormat() {
    const m = this.form.format.match(/<0+>/);
    if (m) this.form.digits = m[0].length - 2;
  }
  pad(n: number, d: number) {
    const s = String(n);
    return s.length >= d ? s : '0'.repeat(d - s.length) + s;
  }
  tok(s: string, d = new Date()) {
    return (s || '')
      .replace(/{yyyy}/g, String(d.getFullYear()))
      .replace(/{yy}/g, String(d.getFullYear()).slice(-2))
      .replace(/{MM}/g, this.pad(d.getMonth() + 1, 2))
      .replace(/{dd}/g, this.pad(d.getDate(), 2));
  }
  sampleOf(f: FormatDef) {
    const now = new Date();
    const num = f.monthly ? f.monthNext[now.getMonth()] || 1 : f.nextNo;
    const pad = this.pad(num, f.digits);
    let out = this.tok(f.format, now);
    if (/<0+>/.test(out)) out = out.replace(/<0+>/, pad);
    else out += pad;
    return out;
  }
  updateSample() {
    this.form.sample = this.sampleOf(this.form);
  }
  incYear(delta: number) {
    this.form.year += delta;
  }
  nextNumPreview(r: FormatDef): number | string {
    if (!r) return '';
    if (r.monthly) {
      const m = new Date().getMonth(); // 0..11
      return r.monthNext?.[m] ?? r.nextNo ?? 1;
    }
    return r.nextNo ?? 1;
  }
  onNameInput() {
    this.syncFormatPrefixFromName();
    this.updateSample();
  }
  private syncFormatPrefixFromName() {
    const name = (this.form.name || '').trim();
    const m = name.match(/^[A-Za-z0-9]+/); // lấy prefix chữ/số đầu
    if (!m) return;

    const newPrefix = m[0].toUpperCase();
    let f = (this.form.format || '').trim();

    // Nếu chưa có format -> tạo format mặc định với prefix
    if (!f) {
      const digits = Math.max(1, this.form.digits || 5);
      this.form.format = `${newPrefix}-{yy}{MM}-<${'0'.repeat(digits)}>`;
      return;
    }

    // Nếu format đang bắt đầu bằng chữ/số + '-' thì thay prefix đó
    if (/^[A-Za-z0-9]+-/.test(f)) {
      this.form.format = f.replace(/^[A-Za-z0-9]+-/, `${newPrefix}-`);
    } else {
      // Nếu không phải dạng trên, prepend prefix vào đầu cho chắc
      this.form.format = `${newPrefix}-${f}`;
    }
  }
  // chạy số: <00000> / <0...>
  private readonly RUN_RE = /<0+>/;
  // token năm/tháng (để xóa)
  private readonly YM_TOKENS_RE = /\{yyyy\}|\{yy\}|\{MM\}/g;

  private splitBeforeRun(fmt: string) {
    const m = fmt.match(this.RUN_RE);
    if (!m) return { head: fmt, marker: '', tail: '' };
    const i = fmt.indexOf(m[0]);
    return { head: fmt.slice(0, i), marker: m[0], tail: fmt.slice(i) };
  }

  private stripYmTokens(head: string) {
    // bỏ {yyyy}/{yy}/{MM}, gom dấu gạch
    return head
      .replace(this.YM_TOKENS_RE, '')
      .replace(/--+/g, '-') // nhiều '-' -> một '-'
      .replace(/-+$/, ''); // bỏ '-' thừa cuối
  }

  private ensureTrailingDash(s: string) {
    return s && !s.endsWith('-') ? s + '-' : s;
  }

  /** Bật/tắt monthly: thêm/bỏ {yy}{MM} trước <00000>, đồng thời update Sample */
  onMonthlyChange(isMonthly: boolean) {
    let fmt = (this.form.format || '').trim();
    if (!fmt) return;

    // đảm bảo có placeholder chạy số
    if (!this.RUN_RE.test(fmt)) {
      fmt = this.ensureTrailingDash(fmt) + '<00000>';
    }

    const { head: rawHead, marker, tail } = this.splitBeforeRun(fmt);
    let head = rawHead;

    if (isMonthly) {
      // Nếu thiếu {yy} hoặc {MM} thì gợi ý chèn vào trước <00000>
      const hasYY = /\{yy\}|\{yyyy\}/.test(head);
      const hasMM = /\{MM\}/.test(head);
      if (!hasYY || !hasMM) {
        head = this.stripYmTokens(head); // bỏ các token rải rác nếu có
        head = this.ensureTrailingDash(head) + '{yy}{MM}-';
      }
    } else {
      // Không monthly: bỏ hẳn token năm/tháng
      head = this.stripYmTokens(head);
    }

    this.form.format =
      head + (marker || '<00000>') + tail.replace(this.RUN_RE, ''); // giữ 1 marker
    this.updateDigitsFromFormat();
    this.updateSample(); // Sample hiển thị đúng ngay khi đổi
  }
  blockNonInteger(ev: KeyboardEvent) {
    // chặn ký tự số mũ và dấu
    if (['e', 'E', '+', '-', '.'].includes(ev.key)) {
      ev.preventDefault();
    }
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
