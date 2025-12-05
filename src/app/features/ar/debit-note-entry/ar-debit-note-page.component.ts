import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidatorFn,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AmountInputDirective } from '../../../_share/directives';
import { JournalType } from '../../../_share/models/general-maintenance';
import { DebtorRow } from '../../../_share/models/ar';

type Status = 'OPEN' | 'POSTED' | 'VOID';

interface ItemRef {
  code: string;
  name: string;
  uom: string;
  price: number;
  tax: 'SR' | 'ZR';
}

interface InvoiceLine {
  item: string;
  description: string;
  uom: string;
  qty: number;
  unitPrice: number;
  tax: 'SR' | 'ZR';
  amount: number;
  taxAmt: number;
  total: number;
}

interface Invoice {
  docNo: string;
  docDate: string;
  dueDate: string;
  debtor: string;
  debtorName: string;
  currency: 'MYR' | 'USD' | 'SGD';
  rate: number;
  description?: string;
  agent?: string;
  lines: InvoiceLine[];
  subTotal: number;
  taxTotal: number;
  grandTotal: number;
  outstanding: number;
}
type Option = { code: string; name: string };
type PaymentLine = {
  type: 'RP' | 'CN' | 'JV';
  no: string;
  description?: string;
  date: string;
  amount: number;
};

@Component({
  selector: 'app-ar-debit-note-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AmountInputDirective,
  ],
  templateUrl: './ar-debit-note-page.component.html',
  styleUrls: ['./ar-debit-note-page.component.scss'],
})
export class ArDebitNotePageComponent {
  dnTypes: Array<'OMIT' | 'UNDERC'> = ['OMIT', 'UNDERC'];
  debtors: DebtorRow[] = [
    {
      debtorAccount: '300-B001',
      companyName: 'BEST PHONE SDN BHD',
      type: '',
      phone: '09356952663',
      currency: '',
      creditTerm: '',
      creditLimit: 0,
      active: true,
      groupCompany: true,
      registrationNo: '',
      billAddress: '175 KLCC Maylaysia',
      fax: '',
      email: '',
      website: '',
      deliveryAddress: '',
      deliveryPostCode: '',
    },
    {
      debtorAccount: '300-C001',
      companyName: 'IPHONE SDN BHD',
      type: '',
      phone: '09356952663',
      currency: '',
      creditTerm: '',
      creditLimit: 0,
      active: true,
      groupCompany: true,
      registrationNo: '',
      billAddress: '175 KLCC Maylaysia',
      fax: '',
      email: '',
      website: '',
      deliveryAddress: '',
      deliveryPostCode: '',
    },
    {
      debtorAccount: '300-D001',
      companyName: 'FLC PHONE SDN BHD',
      type: '',
      phone: '09356952663',
      currency: '',
      creditTerm: '',
      creditLimit: 0,
      active: true,
      groupCompany: true,
      registrationNo: '',
      billAddress: '175 KLCC Maylaysia',
      fax: '',
      email: '',
      website: '',
      deliveryAddress: '',
      deliveryPostCode: '',
    },
    {
      debtorAccount: '300-E001',
      companyName: 'NVL BHD',
      type: '',
      phone: '09356952663',
      currency: '',
      creditTerm: '',
      creditLimit: 0,
      active: true,
      groupCompany: true,
      registrationNo: '',
      billAddress: '',
      fax: '',
      email: '',
      website: '',
      deliveryAddress: '',
      deliveryPostCode: '',
    },
    {
      debtorAccount: '300-F001',
      companyName: 'NOV Group',
      type: '',
      phone: '09356952663',
      currency: '',
      creditTerm: '',
      creditLimit: 0,
      active: true,
      groupCompany: true,
      registrationNo: '',
      billAddress: '175 KLCC Maylaysia',
      fax: '',
      email: '',
      website: '',
      deliveryAddress: '',
      deliveryPostCode: '',
    },
  ];
  creditTerms: Option[] = [
    { code: 'N0', name: 'C.O.D' },
    { code: 'N30', name: '5% 7, Net 30 days' },
    { code: 'N45', name: 'Net 45 days' },
    { code: 'N60', name: 'Net 60 days' },
    { code: 'N90', name: 'Net 90 days' },
    { code: 'N30', name: 'Net 31th Next Month' },
  ];
  journalTypes: JournalType[] = [
    {
      typeCode: 'BANK-B',
      description: 'BANK RECEIPTS AND PAYMENT',
      description2ND: '',
      entrytypeId: 0,
    },
    {
      typeCode: 'CASH-B',
      description: 'CASH RECEIPTS AND PAYMENT',
      description2ND: '',
      entrytypeId: 0,
    },
    {
      typeCode: 'GENERAL-J',
      description: 'GENERAL JOURNAL',
      description2ND: '',
      entrytypeId: 0,
    },
    {
      typeCode: 'SALE-J',
      description: 'SALES JOURNAL',
      description2ND: '',
      entrytypeId: 0,
    },
    {
      typeCode: 'PURCHASE-J',
      description: 'PURCHASE JOURNAL',
      description2ND: '',
      entrytypeId: 0,
    },
  ];
  items: ItemRef[] = [
    {
      code: 'IPH-14P-256',
      name: 'iPhone 14 Pro 256GB',
      uom: 'UNIT',
      price: 4999,
      tax: 'SR',
    },
    {
      code: 'S24U-512',
      name: 'Galaxy S24 Ultra 512GB',
      uom: 'UNIT',
      price: 3999,
      tax: 'SR',
    },
    {
      code: 'A54-128',
      name: 'Samsung A54 128GB',
      uom: 'UNIT',
      price: 899,
      tax: 'SR',
    },
    {
      code: 'CASE-01',
      name: 'Protective Case',
      uom: 'UNIT',
      price: 49,
      tax: 'ZR',
    },
  ];
  showDebtorPicker = false;
  debtorQuery = '';
  debtorFiltered: DebtorRow[] = [];
  openDebtorDropdown() {
    this.debtorQuery = '';
    this.debtorFiltered = [...(this.debtors ?? [])];
    this.showDebtorPicker = true;
  }
  filterDebtors() {
    const q = (this.debtorQuery || '').toLowerCase().trim();
    const src = this.debtors ?? [];
    this.debtorFiltered = !q
      ? [...src]
      : src.filter(
          (d) =>
            (d.debtorAccount || '').toLowerCase().includes(q) ||
            (d.companyName || '').toLowerCase().includes(q) ||
            (d.billAddress || '').toLowerCase().includes(q) ||
            (d.phone || '').toLowerCase().includes(q)
        );
  }
  pickDebtor(d: DebtorRow) {
    this.invForm.patchValue({ debtor: d.debtorAccount });
    this.onDebtorPicked(d); // đã có sẵn – set agent/terms/due date nếu cần
    this.showDebtorPicker = false;
  }

  // Khi đổi select debtor
  onDebtorChanged() {
    const code = this.invForm.value.debtor;
    const d = (this.debtors ?? []).find((x) => x.debtorAccount === code);
    if (d) this.onDebtorPicked(d as DebtorRow);
  }
  ngOnInit() {
    if (this.acLinesFA.length === 0) this.addAcLine();
  }
  trackByIndex(index: number, _item: any): number {
    return index;
  }
  // Debtor đang chọn + text To:
  get selectedDebtor(): DebtorRow | undefined {
    const code = this.invForm?.value?.debtor;
    return (this.debtors ?? []).find((d) => d.debtorAccount === code) as
      | DebtorRow
      | undefined;
  }
  get debtorToText(): string {
    const d = this.selectedDebtor;
    if (!d) return '';
    return [d.companyName, d.billAddress, d.phone].filter(Boolean).join('\n');
  }
  // ===== sample invoices =====
  invoices: Invoice[] = [
    this.mkInvoice(
      'DN-0001',
      '10/9/2025',
      '300-B001',
      [
        { item: 'IPH-14P-256', qty: 1 },
        { item: 'CASE-01', qty: 2 },
      ],
      '2025-12-07'
    ),
    this.mkInvoice(
      'DN-0002',
      '8/6/2025',
      '300-C001',
      [{ item: 'S24U-512', qty: 1 }],
      '2025-11-07'
    ),
    this.mkInvoice(
      'DN-0003',
      '10/7/2025',
      '300-D001',
      [{ item: 'A54-128', qty: 3 }],
      '2025-10-07'
    ),
  ];

  constructor(private fb: FormBuilder) {
    this.buildForms();
      const dnPaid = this.mkInvoice(
    'DN-0004',                // số chứng từ mẫu
    '10/15/2025',             // ngày chứng từ
    '300-B001',               // debtor
    [{ item: 'CASE-01', qty: 10 }], // dòng chi tiết
    '2025-12-15'              // due date
  );
  dnPaid.outstanding = 0;      // đã thanh toán đủ
  this.invoices.push(dnPaid);
  }

  private mkInvoice(
    docNo: string,
    date: string,
    debtor: string,
    lines: Array<{ item: string; qty: number }>,
    dueDate: string
  ): Invoice {
    const debtorName =
      this.debtors.find((d) => d.debtorAccount === debtor)?.companyName ||
      debtor;
    const docDate = date;
    const dets: InvoiceLine[] = lines.map((l) => {
      const itm = this.items.find((i) => i.code === l.item)!;
      const amount = +(l.qty * itm.price).toFixed(2);
      const taxAmt = +(amount * (itm.tax === 'SR' ? 0.06 : 0)).toFixed(2);
      const total = +(amount + taxAmt).toFixed(2);
      return {
        item: itm.code,
        description: itm.name,
        uom: itm.uom,
        qty: l.qty,
        unitPrice: itm.price,
        tax: itm.tax,
        amount,
        taxAmt,
        total,
      };
    });
    const subTotal = +dets.reduce((s, x) => s + x.amount, 0).toFixed(2);
    const taxTotal = +dets.reduce((s, x) => s + x.taxAmt, 0).toFixed(2);
    const grandTotal = +(subTotal + taxTotal).toFixed(2);
    return {
      docNo,
      docDate,
      dueDate,
      debtor,
      debtorName,
      currency: 'MYR',
      rate: 1,
      description: 'SALE',
      agent: '',
      lines: dets,
      subTotal,
      taxTotal,
      grandTotal,
      outstanding: grandTotal,
    };
  }
  private addDays(dateISO: string, d: number) {
    const dt = new Date(dateISO);
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().slice(0, 10);
  }
  private toYMD(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  private todayYMD(): string {
    return this.toYMD(new Date());
  }
  private addDaysYMD(date: Date | string, days: number): string {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    d.setDate(d.getDate() + days);
    return this.toYMD(d);
  }

  // ===== list state =====
  selected?: Invoice;
  q = '';
  sortBy: keyof Invoice = 'docDate';
  sortDir: 'asc' | 'desc' = 'desc';
  page = 1;
  pageSize = 8;

  // ===== forms/dialogs =====
  showForm = false;
  formMode: 'new' | 'edit' | 'view' = 'new';
  invForm!: FormGroup;
  get linesFA(): FormArray<FormGroup> {
    return this.invForm.get('lines') as FormArray<FormGroup>;
  }

  showFind = false;
  findForm!: FormGroup;
  findResults: Invoice[] = [];
  showPrint = false;
  printForm!: FormGroup;
  showPreview = false;

  buildForms() {
    this.invForm = this.fb.group({
      // header
      debtor: ['', Validators.required],
      journalType: ['SALES'],
      dnType: ['OMIT', Validators.required],
      isDebitJournal: [false],
      agent: [''],
      ref: [''],
      ref2: [''],
      autoNumbering: [true], // điều khiển Invoice No
      docNo: ['', Validators.required],
      docDate: [this.todayYMD()],
      terms: ['N30'],
      dueDate: [this.addDaysYMD(new Date(), 30)],
      description: [''],

      // lines + totals
      lines: this.fb.array([]),
      grandTotal: [0],
      outstanding: [0],
      continueNew: [true],
    });
    if (this.acLinesFA.length === 0) this.addAcLine();
    this.findForm = this.fb.group({
      from: [''],
      to: [''],
      debtor: [''],
      status: ['all' as 'all' | Status],
      min: [''],
      max: [''],
    });

    this.printForm = this.fb.group({
      from: [''],
      to: [''],
      debtor: [''],
      status: ['all' as 'all' | Status],
      sort: ['docDate' as keyof Invoice],
    });
  }
  addAcLine() {
    this.acLinesFA.push(this.createLine());
    this.accNoSugs.push([]);
  }

  recalcLine(i: number) {
    // nếu cần auto điền mô tả từ accNo thì xử lý ở đây
    this.recalcTotals();
  }
  get acLinesFA(): FormArray {
    return this.invForm.get('lines') as FormArray;
  }
  private createLine(): FormGroup {
    return this.fb.group({
      accNo: [this.nextAccNo()],
      toAccRate: [1], //
      lineDesc: [''], //
      amount: [0], //
    });
  }
  private accPrefix = '500-';
  private accPad = 4; // => 0001, 0002,...
  accNoSugs: string[][] = []; // mảng gợi ý theo từng dòng
  private fmtAcc(n: number): string {
    return `${this.accPrefix}${String(n).padStart(this.accPad, '0')}`;
  }

  // lấy suffix số từ accNo hiện có (không hợp lệ => -1)
  private suffixOf(s: string): number {
    const m = s?.match(/^500-(\d{1,})$/);
    return m ? parseInt(m[1], 10) : -1;
  }

  // tìm suffix lớn nhất trên tất cả dòng hiện có
  private currentMaxSuffix(): number {
    const arr = (this.acLinesFA?.controls ?? []) as FormGroup[];
    let max = 0;
    for (const fg of arr) {
      const v = String(fg.get('accNo')?.value || '');
      const n = this.suffixOf(v);
      if (n > max) max = n;
    }
    return max;
  }

  // gợi ý cho dòng i (ví dụ 10 số kế tiếp)
  prepAccNoSuggestions(i: number) {
    const start = this.currentMaxSuffix() + 1; // số tiếp theo
    const count = 10; // số lượng gợi ý
    const list = Array.from({ length: count }, (_, k) =>
      this.fmtAcc(start + k)
    );
    this.accNoSugs[i] = list;
  }

  // sinh mã kế tiếp để auto-fill khi thêm dòng
  private nextAccNo(): string {
    return this.fmtAcc(this.currentMaxSuffix() + 1);
  }
  get acLineGroups(): FormGroup[] {
    return this.acLinesFA.controls as FormGroup[];
  }
  removeAcLine(i: number) {
    this.acLinesFA.removeAt(i);
    this.accNoSugs.splice(i, 1);
    this.recalcTotals();
  }

  // debtor change -> fill name/agent/terms
  onDebtorPicked(d: DebtorRow) {
    this.invForm.patchValue({
      debtor: d.debtorAccount || '',
      terms: d.creditTerm || this.invForm.value.terms,
    });
    this.recalcDue();
  }
  openAccountLookup(i: number) {
    /* mở dialog chọn tài khoản kế toán cho dòng i */
  }

  // ======= Lưu chứng từ =======
  nextRunningNo(): string {
    // TODO: gọi API lấy số chạy tự động; tạm thời mock
    const n = Math.floor(Math.random() * 9000) + 1000;
    return `I-${n.toString().padStart(6, '0')}`;
  }
  // auto/manual doc no
  toggleManualDocNo() {
    const auto = !this.invForm.value.autoNumbering;
    this.invForm.patchValue({ autoNumbering: auto });
    if (auto) this.invForm.patchValue({ docNo: '' }); // trả về <<new>>
  }
  // ======= Debtor lookup stubs (để compile; sau này nối với dialog/service của bạn) =======
  lookupDebtor() {
    /* gõ để lọc/lookup – tự nối service nếu cần */
  }
  openDebtorList() {
    /* mở dialog chọn debtor */
  }
  // due date calc
  recalcDue() {
    const terms = this.invForm.value.terms || 'N0';
    const days = Number(String(terms).replace(/\D/g, '') || 0);
    const d = this.invForm.value.docDate || this.todayYMD();
    this.invForm.patchValue(
      { dueDate: this.addDaysYMD(d, days) },
      { emitEvent: false }
    );
  }

  // totals
  recalcTotals() {
    const sum = this.acLinesFA.controls
      .map((fg) => +((fg as FormGroup).value.amount || 0))
      .reduce((a, b) => a + b, 0);
    this.invForm.patchValue(
      { grandTotal: sum, outstanding: sum },
      { emitEvent: false }
    );
  }
  private today() {
    return new Date().toISOString().slice(0, 10);
  }

  // ===== list helpers =====
  get filtered() {
    const q = this.q.trim().toLowerCase();
    let list = !q
      ? this.invoices
      : this.invoices.filter(
          (i) =>
            i.docNo.toLowerCase().includes(q) ||
            i.debtor.toLowerCase().includes(q) ||
            i.debtorName.toLowerCase().includes(q) ||
            i.description?.toLowerCase().includes(q)
        );
    list = [...list].sort((a, b) => {
      const va = String(a[this.sortBy] ?? '').toLowerCase();
      const vb = String(b[this.sortBy] ?? '').toLowerCase();
      if (va < vb) return this.sortDir === 'asc' ? -1 : 1;
      if (va > vb) return this.sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }
  get totalPages() {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }
  get paged() {
    const s = (this.page - 1) * this.pageSize;
    return this.filtered.slice(s, s + this.pageSize);
  }
  setSort(k: keyof Invoice) {
    if (this.sortBy === k)
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else {
      this.sortBy = k;
      this.sortDir = 'asc';
    }
  }
  select(inv: Invoice) {
    this.selected = inv;
    this.loadPaymentHistory(inv);
  }

  // ==== Pager methods (thay cho Math.* trong template) ====
  goFirst() {
    this.page = 1;
  }
  goPrev() {
    this.page = Math.max(1, this.page - 1);
  }
  goNext() {
    this.page = Math.min(this.totalPages, this.page + 1);
  }
  goLast() {
    this.page = this.totalPages;
  }

  // ===== CRUD =====
  newInvoice() {
    this.formMode = 'new';
    const jtDefault = this.journalTypes?.[0]?.typeCode ?? '';
    const termsDefault = this.creditTerms?.[0]?.code ?? '';
    this.invForm.reset({
      docNo: this.nextNumber(),
      docDate: this.today(),
      dueDate: this.addDays(this.today(), 0),
      debtor: '',
      debtorName: '',
      currency: 'MYR',
      rate: 1,
      description: '',
      status: 'OPEN',
      subTotal: 0,
      taxTotal: 0,
      grandTotal: 0,
      outstanding: 0,
      journalType: jtDefault,
      terms: termsDefault,
      dnType: 'OMIT',
      isDebitJournal: false,
    });
    this.acLinesFA.clear();
    this.addAcLine();
    this.showForm = true;
  }
  viewInvoice() {
    if (!this.selected) return;
    this.formMode = 'view';
    this.patchInvoice(this.selected);
    this.showForm = true;
  }
  editInvoice() {
    if (!this.selected) return;
    this.formMode = 'edit';
    this.patchInvoice(this.selected);
    this.showForm = true;
  }
  deleteInvoice() {
    if (!this.selected) return;
    this.openDeleteInvoiceConfirm();
  }

  private patchInvoice(inv: Invoice) {
    this.invForm.patchValue({
      docNo: inv.docNo,
      docDate: inv.docDate,
      dueDate: inv.dueDate,
      debtor: inv.debtor,
      debtorName: inv.debtorName,
      currency: inv.currency,
      rate: inv.rate,
      description: inv.description,
      agent: inv.agent,
      subTotal: inv.subTotal,
      taxTotal: inv.taxTotal,
      grandTotal: inv.grandTotal,
      outstanding: inv.grandTotal,
    });
    this.acLinesFA.clear();
    // map tạm: mô tả lấy description, số tiền lấy total (hoặc amount tùy bạn)
    inv.lines.forEach((l) => {
      const fg = this.createLine();
      fg.patchValue({
        accNo: '', // chưa có account -> để trống cho user chọn
        toAccRate: 1,
        lineDesc: l.description || '',
        amount: l.total ?? l.amount ?? 0,
      });
      this.acLinesFA.push(fg);
    });
  }
  submitted = false;

  /** Doc No validator:
   *  - Cho phép rỗng (để auto)
   *  - Nếu có giá trị: chỉ cho [A–Z,a–z,0–9,-,_ ,/]
   *  - Không được trùng với invoice đã có
   */
  docNoValidator: ValidatorFn = (ctrl: AbstractControl) => {
    const v = (ctrl.value ?? '').trim();
    if (!v) return null; // rỗng = dùng auto, hợp lệ
    if (!/^[A-Za-z0-9\-_\/]+$/.test(v)) return { pattern: true };
    const dup = this.invoices.some(
      (x) => (x.docNo || '').toLowerCase() === v.toLowerCase()
    );
    return dup ? { duplicate: true } : null;
  };

  isInvalid(name: string): boolean {
    const c = this.invForm?.get(name);
    return !!(c && c.invalid && (c.touched || this.submitted));
  }
  saveInvoice() {
    this.submitted = true;
    if (this.invForm.invalid) return; // chặn Save nếu form lỗi
    localStorage.setItem(
      'ar_inv_last_desc',
      this.invForm.value.description || ''
    );
    const v = this.invForm.getRawValue();
    const docNo = v.autoNumbering && !v.docNo ? this.nextRunningNo() : v.docNo;

    const payload = { ...v, docNo };
    // TODO: call API create invoice

    if (v.continueNew) {
      // reset form cho chứng từ mới
      this.invForm.reset({
        debtor: '',
        journalType: 'SALES',
        agent: '',
        ref: '',
        ref2: '',
        autoNumbering: true,
        docNo: '',
        docDate: this.todayYMD(),
        terms: 'N30',
        dueDate: this.addDaysYMD(new Date(), 30),
        description: localStorage.getItem('ar_inv_last_desc') || '',
        grandTotal: 0,
        outstanding: 0,
        continueNew: true,
      });
      while (this.acLinesFA.length) this.acLinesFA.removeAt(0);
      this.addAcLine();
    }
    this.showForm = false;
    this.openSuccess(
      (this.formMode === 'new' ? 'Create' : 'Edit') +
        ' debit note successfully.'
    );
  }
  private valueFromForm(): Invoice {
    const fv = this.invForm.getRawValue();
    // LẤY DÒNG VỚI KIỂU RÕ RÀNG
    const lines: InvoiceLine[] = this.linesFA.controls.map(
      (fg) => fg.getRawValue() as InvoiceLine
    );
    const subTotal = +lines.reduce((s, l) => s + l.amount, 0).toFixed(2);
    const taxTotal = +lines.reduce((s, l) => s + l.taxAmt, 0).toFixed(2);
    const grandTotal = +(subTotal + taxTotal).toFixed(2);
    const debtorName =
      this.debtors.find((d) => d.debtorAccount === fv.debtor)?.companyName ||
      '';
    return {
      docNo: fv.docNo,
      docDate: fv.docDate,
      dueDate: fv.dueDate,
      debtor: fv.debtor,
      debtorName,
      currency: fv.currency,
      rate: fv.rate,
      description: fv.description,
      agent: fv.agent,
      lines,
      subTotal,
      taxTotal,
      grandTotal,
      outstanding: grandTotal,
    };
  }

  refresh() {
    this.q = '';
    this.page = 1;
    this.sortBy = 'docDate';
    this.sortDir = 'desc';
  }

  removeLine(i: number) {
    this.linesFA.removeAt(i);
    this.recalcTotals();
  }
  // ===== find =====
  openFind() {
    this.showFind = true;
    this.findResults = [];
  }
  runFind() {
    const f = this.findForm.value;
    const from = f.from ? new Date(f.from as string) : undefined;
    const to = f.to ? new Date(f.to as string) : undefined;
    const min = f.min ? +f.min! : undefined;
    const max = f.max ? +f.max! : undefined;
    this.findResults = this.invoices.filter((x) => {
      const dt = new Date(x.docDate);
      const inDate = (!from || dt >= from) && (!to || dt <= to);
      const debtHit = !f.debtor || x.debtor === f.debtor;
      const statusHit = f.status === 'all';
      const amtHit =
        (!min || x.grandTotal >= min) && (!max || x.grandTotal <= max);
      return inDate && debtHit && statusHit && amtHit;
    });
  }
  pickFromFind(inv: Invoice) {
    this.selected = inv;
    this.showFind = false;
  }

  // ===== print listing =====
  openPrint() {
    this.showPrint = true;
    this.showPreview = false;
  }
  buildListing(): Invoice[] {
    const f = this.printForm.value;
    const from = f.from ? new Date(f.from as string) : undefined;
    const to = f.to ? new Date(f.to as string) : undefined;
    const status = f.status as 'all' | Status;
    const sortKey = (f.sort ?? 'docDate') as keyof Invoice;
    return this.invoices
      .filter((x) => {
        const dt = new Date(x.docDate);
        const inDate = (!from || dt >= from) && (!to || dt <= to);
        const debtHit = !f.debtor || x.debtor === f.debtor;
        const statusHit = status === 'all';
        return inDate && debtHit && statusHit;
      })
      .sort((a, b) =>
        String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''))
      );
  }

  // utils
  private nextNumber() {
    const seq = (this.invoices.length + 1).toString().padStart(4, '0');
    return `DN-${seq}`;
  }
  // ==== Delete confirm state ====
  showDeleteInvoiceConfirm = false;

  openDeleteInvoiceConfirm(inv?: Invoice) {
    if (inv) this.selected = inv;
    this.showDeleteInvoiceConfirm = true;
  }

  closeDeleteInvoiceConfirm() {
    this.showDeleteInvoiceConfirm = false;
  }

  confirmDeleteInvoice() {
    if (!this.selected) return;
    this.invoices = this.invoices.filter((x) => x !== this.selected);
    this.selected = undefined;
    this.showDeleteInvoiceConfirm = false;
    this.openSuccess(`Debit Note deleted successfully.`);
  }
  showSuccess = false;
  successMsg = '';
  openSuccess(msg: string) {
    this.successMsg = msg;
    this.showSuccess = true;
  }
  closeSuccess() {
    this.showSuccess = false;
  }
  paymentHistory: PaymentLine[] = [];
  private loadPaymentHistory(inv: Invoice) {
    const total = +(inv.grandTotal ?? 0);
    const out = +(inv.outstanding ?? total);
    const paid = +(total - out).toFixed(2);

    // 1) Chưa thanh toán: không hiển thị dòng nào
    if (paid <= 0) {
      this.paymentHistory = [];
      return;
    }

    // 2) Đã thanh toán (hết hoặc một phần): 1 dòng RP
    const rpNo = `OR-${inv.docNo.replace(/\D/g, '').padStart(4, '0')}`;
    const payDate = new Date(inv.docDate).toLocaleDateString();

    this.paymentHistory = [
      {
        type: 'RP',
        no: rpNo,
        description: 'Official receipt',
        date: payDate,
        amount: paid, // full = total, partial = total - outstanding
      },
    ];
  }
  isOverdue(inv: Invoice): boolean {
    if (!inv) return false;
    const today = new Date().toISOString().slice(0, 10);
    return inv.outstanding > 0 && (inv.dueDate ?? '') < today;
  }
  toggleSelect(inv: Invoice) {
    if (this.selected === inv) {
      this.selected = undefined;
      this.paymentHistory = [];
    } else {
      this.select(inv); // vẫn dùng select(...) để nạp history
    }
  }
}
