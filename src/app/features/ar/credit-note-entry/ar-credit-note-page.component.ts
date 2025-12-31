import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { AmountInputDirective } from '../../../_share/directives';
import { LucideIconsModule } from '../../../_share/lucide-icons';
import { JournalType } from '../../../_share/models/general-maintenance';
import { DebtorRow } from '../../../_share/models/ar';
type Status = 'OPEN' | 'POSTED' | 'VOID';

interface KnockRow {
  type: 'RI' | 'RD';
  date: string;
  no: string;
  orgAmt: number;
  outstanding: number;
  pay: number;
  sel?: boolean;
}
interface ReceivePaymentRow {
  receiptNo: string;
  date: string;
  debtor: string;
  debtorName: string;
  description?: string;
  amount: number;
  paidAmt: number;
  outstanding: number;
  payload?: any;
}
type PayMethod = {
  value: string;
  label: string;
  payBy: string;
  chargeFee?: number;
};
type PaidLine = {
  type: 'RI' | 'RD';
  date: string;
  no: string;
  orgAmt: number;
  outstanding: number;
  paid: number;
};

@Component({
  selector: 'app-ar-credit-note-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideIconsModule,
    AmountInputDirective,
  ],
  templateUrl: './ar-credit-note-page.component.html',
  styleUrls: ['./ar-credit-note-page.component.scss'],
})
export class ArCreditNotePageComponent {
  dnTypes: Array<'RETURN' | 'UNDERC'> = ['RETURN', 'UNDERC'];
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
  // ====== master ======
  currencies: Array<'MYR' | 'USD' | 'SGD'> = ['MYR', 'USD', 'SGD'];

  // helper: lấy text Payment By cho 1 method

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

  openDocsByDebtor = new Map<string, KnockRow[]>([
    [
      '300-B001',
      [
        {
          type: 'RD',
          date: '2025-10-10',
          no: 'DN-0801',
          orgAmt: 500,
          outstanding: 500,
          pay: 0,
        },
        {
          type: 'RD',
          date: '2025-11-18',
          no: 'DN-0801',
          orgAmt: 600,
          outstanding: 600,
          pay: 0,
        },
        {
          type: 'RD',
          date: '2025-10-19',
          no: 'DN-0801',
          orgAmt: 700,
          outstanding: 700,
          pay: 0,
        },
        {
          type: 'RD',
          date: '2025-10-20',
          no: 'DN-0801',
          orgAmt: 800,
          outstanding: 800,
          pay: 0,
        },
      ],
    ],
    [
      '300-C001',
      [
        {
          type: 'RI',
          date: '2025-10-20',
          no: 'INV-0007',
          orgAmt: 706.49,
          outstanding: 706.49,
          pay: 0,
        },
        {
          type: 'RI',
          date: '2025-10-30',
          no: 'INV-0009',
          orgAmt: 2119.47,
          outstanding: 2119.47,
          pay: 0,
        },
      ],
    ],
    [
      '300-D001',
      [
        {
          type: 'RI',
          date: '2025-08-21',
          no: 'INV-0010',
          orgAmt: 1059.73,
          outstanding: 1059.73,
          pay: 0,
        },
      ],
    ],
  ]);

  // ====== list ======
  rows: ReceivePaymentRow[] = [
    {
      receiptNo: 'CN-000002',
      date: '2025-10-30',
      debtor: '300-B001',
      debtorName: 'CARE PHONE SDN BHD',
      description: 'GOODS RETURN',
      amount: 230.00,
      paidAmt: 706.49,
      outstanding: 100,
    },
    {
      receiptNo: 'CN-000001',
      date: '2025-08-20',
      debtor: '300-D001',
      debtorName: 'BEST PHONE SDN BHD',
      description: 'GOODS RETURN',
      amount: 250.00,
      paidAmt: 706.49,
      outstanding: 100,
    },
  ];

  q = '';
  sortBy: keyof ReceivePaymentRow = 'date';
  sortDir: 'asc' | 'desc' = 'desc';
  page = 1;
  pageSize = 10;
  get filtered() {
    const k = this.q.trim().toLowerCase();
    let arr = !k
      ? this.rows
      : this.rows.filter(
          (r) =>
            r.receiptNo.toLowerCase().includes(k) ||
            r.debtor.toLowerCase().includes(k) ||
            r.debtorName.toLowerCase().includes(k) ||
            (r.description || '').toLowerCase().includes(k)
        );
    arr = [...arr].sort((a, b) => {
      const va = String(a[this.sortBy] ?? '').toLowerCase();
      const vb = String(b[this.sortBy] ?? '').toLowerCase();
      if (va < vb) return this.sortDir === 'asc' ? -1 : 1;
      if (va > vb) return this.sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }
  get totalPages() {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }
  get paged() {
    const s = (this.page - 1) * this.pageSize;
    return this.filtered.slice(s, s + this.pageSize);
  }
  setSort(k: keyof ReceivePaymentRow) {
    if (this.sortBy === k)
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else {
      this.sortBy = k;
      this.sortDir = 'asc';
    }
  }
  selected?: ReceivePaymentRow;
    /** DocNo hiện đang sửa (để ignore duplicate khi Edit) */
  editingDocNo: string | null = null;
select(r: ReceivePaymentRow) {
    this.selected = r;
  }
  first() {
    this.page = 1;
  }
  prev() {
    this.page = Math.max(1, this.page - 1);
  }
  next() {
    this.page = Math.min(this.totalPages, this.page + 1);
  }
  last() {
    this.page = this.totalPages;
  }

  // ====== form ======
  showForm = false;
  showDeleteConfirm = false;
  formMode: 'new' | 'edit' | 'view' = 'new';

  rpForm: FormGroup;
  get methodsFA(): FormArray {
    return this.rpForm.get('methods') as FormArray;
  }
  get knockFA(): FormArray {
    return this.rpForm.get('knockOff') as FormArray;
  }

  totalAmount = 0;
  netTotal = 0;
  unappliedAmount = 0;
  get canAllocate() {
    return this.totalAmount > 0;
  }

  // Add rows dropdown (Debit A/C)
  showAddRowMenu = false;
  toggleAddRowMenu() { this.showAddRowMenu = !this.showAddRowMenu; }
  closeAddRowMenu() { this.showAddRowMenu = false; }
  addRows(n: number) {
    const count = Math.max(1, Number(n) || 1);
    for (let i = 0; i < count; i++) this.addMethod();
    this.recalcTotals();
  }


  constructor(private fb: FormBuilder) {
    this.rpForm = this.fb.group({
      debtor: ['', Validators.required],
      journalType: ['SALES'],
      dnType: ['RETURN', Validators.required],
      isDebitJournal: [false],
      agent: [''],
      ref: [''],
      ref2: [''],
      autoNumbering: [true], // điều khiển Invoice No
      docNo: [''],
      docDate: [this.todayYMD()],
      description: [''],
      // lines + totals
      lines: this.fb.array([]),
      grandTotal: [0],
      outstanding: [0],
      methods: this.fb.array([]),
      knockOff: this.fb.array([]),
      continueNew: [false],
    });
    // default: continueNew luôn false khi load page
    this.rpForm.get('continueNew')?.setValue(false, { emitEvent: false });
    this.addMethod();
    this.recalcTotals();
  }

  private createMethodRow(): FormGroup {
    return this.fb.group({
      debitAc: [this.nextAccNo()],
      decs: [''],
      amount: [0],
    });
  }
  private nextAccNo(): string {
    return this.fmtAcc(this.currentMaxSuffix() + 1);
  }
  private accPrefix = '500-';
  private accPad = 4; // => 0001, 0002,...
  private fmtAcc(n: number): string {
    return `${this.accPrefix}${String(n).padStart(this.accPad, '0')}`;
  }
  private suffixOf(s: string): number {
    const m = s?.match(/^500-(\d{1,})$/);
    return m ? parseInt(m[1], 10) : -1;
  }
  private currentMaxSuffix(): number {
    const arr = (this.methodsFA?.controls ?? []) as FormGroup[];
    let max = 0;
    for (const fg of arr) {
      const v = String(fg.get('debitAc')?.value || '');
      const n = this.suffixOf(v);
      if (n > max) max = n;
    }
    return max;
  }
  addMethod() {
    const fg = this.createMethodRow();
    this.methodsFA.push(fg);
    this.wireMethodRow(fg); // <— gắn watcher
    this.recalcTotals();
  }
  removeMethod(i: number) {
    this.methodsFA.removeAt(i);
    this.recalcTotals();
    this.normalizeAllocationsToTotal();
  }
  private normalizeAllocationsToTotal(): void {
    const allowed = +this.totalAmount.toFixed(2);

    // ❌ cũ
    // let paySum = this.knockFA.controls.map(fg => +fg.get('pay')!.value || 0).reduce((a,b)=>a+b,0);

    // ✅ mới
    let paySum = (this.knockFA.getRawValue() as Array<{ pay: number }>).reduce(
      (s, r) => s + (+r.pay || 0),
      0
    );
    paySum = +paySum.toFixed(2);

    if (paySum <= allowed) return;

    let over = +(paySum - allowed).toFixed(2);
    for (let i = this.knockFA.length - 1; i >= 0 && over > 0; i--) {
      const fg = this.knockFA.at(i) as FormGroup;
      let p = +fg.get('pay')!.value || 0;
      if (p <= 0) continue;

      const reduce = Math.min(p, over);
      const p0 = +(p - reduce).toFixed(2);
      const org = +fg.get('orgAmt')!.value || 0;
      const outstanding = +(org - p0).toFixed(2);

      fg.patchValue(
        { sel: p0 > 0, pay: p0, outstanding },
        { emitEvent: false }
      );
      over = +(over - reduce).toFixed(2);
    }
    this.recalcTotals();
  }

  private createKnockRow(r: KnockRow): FormGroup {
    return this.fb.group({
      type: [r.type],
      date: [r.date],
      no: [r.no],
      orgAmt: [r.orgAmt],
      outstanding: [r.outstanding],
      pay: [r.pay],
      sel: [!!r.sel],
    });
  }
  private loadKnockRows(debtor: string) {
    this.knockFA.clear();
    (this.openDocsByDebtor.get(debtor) || []).forEach((x) =>
      this.knockFA.push(
        this.createKnockRow({
          ...x,
          sel: (x.pay ?? 0) > 0,
        })
      )
    );
    this.updateAllLocks();
  }
  onSelChanged(i: number, ev: Event) {
    const checked = !!(ev.target as HTMLInputElement)?.checked;
    const fg = this.knockFA.at(i) as FormGroup;
    fg.patchValue({ sel: checked }, { emitEvent: false });
    // dùng lại logic cũ của bạn
    this.toggleAlloc(i, ev);
  }
  onDebtorChanged() {
    const code = this.rpForm.value.debtor as string;
    if (!code) {
      this.knockFA.clear();
      this.recalcTotals();
      return;
    }
    this.loadKnockRows(code);
    this.recalcTotals();
  }

  // ===== allocation helpers =====
  recalcTotals() {
    const mRows = this.methodsFA.getRawValue() as Array<{ amount: number }>;
    const kRows = this.knockFA.getRawValue() as Array<{ pay: number }>;

    const mSum = mRows.reduce((s, r) => s + (+r.amount || 0), 0);
    const paySum = kRows.reduce((s, r) => s + (+r.pay || 0), 0);

    this.totalAmount = +mSum.toFixed(2);
    this.netTotal = +paySum.toFixed(2);
    this.unappliedAmount = +(this.totalAmount - this.netTotal).toFixed(2);
  }

  private remainingForAllocation(excludeIndex = -1) {
    const total = this.totalAmount;
    const others = this.knockFA.controls
      .map((fg, idx) => (idx === excludeIndex ? 0 : +fg.value.pay || 0))
      .reduce((a, b) => a + b, 0);
    return +(total - others).toFixed(2);
  }

  /** Bật/tắt control trên từng dòng */
private updateLocksForRow(i: number) {
  const fg = this.knockFA.at(i) as FormGroup;
  const payCtl = fg.get('pay')!;
  const selCtl = fg.get('sel')!;

  // Edit mode: khóa hoàn toàn
  if (this.formMode === 'edit') {
    payCtl.disable({ emitEvent: false });
    selCtl.disable({ emitEvent: false });
    return;
  }

  // New mode: chỉ bật khi có tiền để allocate
  if (!this.canAllocate) {
    payCtl.disable({ emitEvent: false });
    selCtl.disable({ emitEvent: false });
    return;
  }

  payCtl.enable({ emitEvent: false });
  selCtl.enable({ emitEvent: false });
}
  private disableKnockTableAll() {
    this.knockFA.controls.forEach((g) => {
      g.get('pay')!.disable({ emitEvent: false });
      g.get('sel')!.disable({ emitEvent: false });
    });
  }
  private updateAllLocks() {
    this.knockFA.controls.forEach((_fg, i) => this.updateLocksForRow(i));
  }

  /** Từ checkbox Sel/Pay */
  toggleAlloc(i: number, ev: Event) {
      if (this.isSelDisabled(i)) return;  // <— guard
    const checked = !!(ev.target as HTMLInputElement)?.checked;
    const fg = this.knockFA.at(i) as FormGroup;
    const org = +fg.get('orgAmt')!.value || 0;

    if (!checked) {
      const out = +org.toFixed(2);
      fg.patchValue(
        { sel: false, pay: 0, outstanding: out },
        { emitEvent: false }
      );
      this.updateLocksForRow(i);
      this.recalcTotals();
      return;
    }

    const remain = this.remainingForAllocation(i);
    const cap = Math.max(0, org);
    const pay = Math.min(cap, remain);
    const out = +(org - pay).toFixed(2);

    fg.patchValue({ sel: true, pay, outstanding: out }, { emitEvent: false });
    this.updateLocksForRow(i);
    this.recalcTotals();
  }

  /** Khi thay Pay hoặc Disc */
  onPayChanged(i: number) {
    const fg = this.knockFA.at(i) as FormGroup;
    const org = +fg.get('orgAmt')!.value || 0;
    let pay = +fg.get('pay')!.value || 0;
    pay = Math.max(0, Math.min(pay, org));
    const outstanding = +(org - pay).toFixed(2);
    fg.patchValue(
      { sel: pay > 0, pay: +pay.toFixed(2), outstanding },
      { emitEvent: false }
    );
    this.recalcTotals();
  }
  autoAllocate() {
    const baseTotal = this.totalAmount;
    let remaining = +baseTotal.toFixed(2);

    // reset trước
    this.knockFA.controls.forEach((c: any) => {
      const org = +c.value.orgAmt || 0;
      c.patchValue(
        { sel: false, pay: 0, outstanding: +org.toFixed(2) },
        { emitEvent: false }
      );
    });

    // phân bổ
    this.knockFA.controls.forEach((c: any) => {
      if (remaining <= 0) return;
      const org = +c.value.orgAmt || 0;
      const pay = Math.min(org, remaining);
      const outstanding = +(org - pay).toFixed(2);
      c.patchValue(
        { sel: pay > 0, pay: +pay.toFixed(2), outstanding },
        { emitEvent: false }
      );
      remaining = +(remaining - pay).toFixed(2);
    });

    this.recalcTotals();
  }

  openNew() {
    this.editingDocNo = null;
    this.formMode = 'new';
    this.resetFormForNew();
    this.rpForm.enable({ emitEvent: false });
    this.showForm = true;
  }
  private settledAtOpen = false;
  openEdit() {
    if (!this.selected) return;
    this.editingDocNo = this.selected.receiptNo;
    this.formMode = 'edit';
    this.resetFormForNew(); // clear trước
    this.showSuccess = false; // <-- thêm dòng này
    const s = this.selected;
    const p = s.payload;

    if (p) {
      // header
      this.rpForm.patchValue(
        {
          debtor: p.debtor ?? s.debtor,
          journalType: p.journalType,
          description: p.description ?? s.description ?? '',
          dnType: p.dnType,
          isDebitJournal: p.isDebitJournal,
          ref: p.ref,
          ref2: p.ref2,
                    docNo: p.docNo ?? s.receiptNo,
          docDate: this.normalizeYmd(p.docDate ?? p.date ?? s.date),
        },
        { emitEvent: false }
      );

      // methods
      while (this.methodsFA.length) this.methodsFA.removeAt(0);
      const methods: any[] =
        Array.isArray(p.methods) && p.methods.length
          ? p.methods
          : [this.createMethodRow().value];

      methods.forEach((m) => {
        const fg = this.createMethodRow();
        fg.patchValue(
          {
            decs: m.decs,
            debitAc: m.debitAc ?? '',
            amount: +m.amount || 0,
          },
          { emitEvent: false }
        );
        this.methodsFA.push(fg);
        this.wireMethodRow(fg);
      });

      // knock-off
      while (this.knockFA.length) this.knockFA.removeAt(0);
      (p.knockOff || []).forEach((k: any) => {
        const fg = this.createKnockRow({
          type: k.type,
          date: k.date,
          no: k.no,
          orgAmt: +k.orgAmt || 0,
          outstanding: +k.outstanding || 0,
          pay: +k.pay || 0,
          sel: !!k.sel,
        });
        this.knockFA.push(fg);
      });
    } else {
      // không có payload: nạp header cơ bản + openDocs
      this.rpForm.patchValue(
        {
          debtor: s.debtor,
          docNo: s.receiptNo,
          docDate: this.normalizeYmd(s.date),
          description: s.description || '',
        },
        { emitEvent: false }
      );
      this.loadKnockRows(s.debtor);
    }

    this.recalcTotals();
    //this.enableOnlyRchqWhenEdit(); // khóa toàn bộ, chỉ bật Is RCHQ/RCHQ Date nếu Cheque
    //this.disableKnockTableAll();
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.editingDocNo = null;
  }
  private today() {
    return new Date().toISOString().slice(0, 10);
  }
  private resetFormForNew() {
    const jtDefault = this.journalTypes?.[0]?.typeCode ?? '';
    this.rpForm.reset({
      docNo: '',
      docDate: this.today(),
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
      dnType: 'RETURN',
      continueNew : false,
    });
    while (this.methodsFA.length) this.methodsFA.removeAt(0);
    this.addMethod();
    this.knockFA.clear();
    this.totalAmount = 0;
    this.unappliedAmount = 0;
    this.updateAllLocks();
  }
  save() {
    if (this.rpForm.invalid) {
      this.rpForm.markAllAsTouched();
      return;
    }

    const v = this.rpForm.getRawValue();
    const keepContinue = this.formMode === 'new' && !!v.continueNew;
    const debtor = this.debtors.find((d) => d.debtorAccount === v.debtor);
    const receiptNo = v.docNo?.trim() ? v.docNo.trim() : this.nextRunningNo();

    const docDate = this.normalizeYmd(v.docDate) || this.todayYMD();

    // check duplicate docNo (ignore chính nó khi Edit)
    const key = String(receiptNo || '').toLowerCase();
    const current = String(this.editingDocNo || '').toLowerCase();
    const dup = this.rows.some(r => String(r.receiptNo || '').toLowerCase() === key && String(r.receiptNo || '').toLowerCase() !== current);
    if (dup) {
      const c = this.rpForm.get('docNo');
      c?.setErrors({ ...(c.errors || {}), duplicate: true });
      c?.markAsTouched();
      return;
    }

    localStorage.setItem('arp_last_desc', v.description || '');

    const row = {
      receiptNo,
      date: docDate,
      debtor: v.debtor,
      dnType: v.dnType,
      journalType: v.journalType,
      debtorName: debtor?.companyName || v.debtor,
      ref: v.ref,
      ref2: v.ref2,
      description: v.description,
      amount: this.netTotal,
      paidAmt: this.totalAmount,
      outstanding: this.unappliedAmount,
            payload: {
        ...v,
        docDate,
        methods: this.methodsFA.getRawValue(),
        knockOff: this.knockFA.getRawValue(),
      },
    };

    if (this.formMode === 'edit' && this.selected) {
      const idx = this.rows.indexOf(this.selected);
      if (idx >= 0) this.rows[idx] = row as any;
      this.selected = this.rows[idx];
      this.editingDocNo = null;
      this.showForm = false;
      this.openSuccess(`Updated receipt ${receiptNo} successfully.`);
      return;
    }

    // New
    this.rows.unshift(row as any);

    if (keepContinue) {
      this.resetFormForNew();
      this.rpForm.get('continueNew')?.setValue(true, { emitEvent: false });
      this.formMode = 'new';
      this.editingDocNo = null;
      this.selected = undefined;
      this.showForm = true;
      this.openSuccess(`Saved receipt ${receiptNo} successfully.`);
      return;
    }

    this.editingDocNo = null;
    this.showForm = false;
    this.openSuccess(`Saved receipt ${receiptNo} successfully.`);
  }

  askDelete() {
    if (!this.selected) return;
    this.showDeleteConfirm = true;
  }
  doDelete() {
    if (!this.selected) return;
    this.rows = this.rows.filter((x) => x !== this.selected);
    this.selected = undefined;
    this.showDeleteConfirm = false;
    this.openSuccess(`Credit Note deleted successfully.`);
  }

  // ===== utils =====
  private nextRunningNo() {
    const n = Math.floor(Math.random() * 90000) + 10000;
    return `CN-${n}`;
  }
  private todayYMD() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  /** Chuẩn hoá ngày về YYYY-MM-DD (phục vụ <input type="date">) */
  private normalizeYmd(v: any): string {
    if (!v) return '';

    // Date object
    if (v instanceof Date && !isNaN(v.getTime())) {
      return v.toISOString().slice(0, 10);
    }

    const s = String(v).trim();
    if (!s) return '';

    // ISO yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    // ISO datetime: yyyy-mm-ddThh:mm:ss...
    const iso = s.match(/^(\d{4}-\d{2}-\d{2})[T\s]/);
    if (iso) return iso[1];

    // dd/mm/yyyy hoặc d/m/yyyy
    const dmy = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (dmy) {
      const dd = String(+dmy[1]).padStart(2, '0');
      const mm = String(+dmy[2]).padStart(2, '0');
      const yy = dmy[3];
      return `${yy}-${mm}-${dd}`;
    }

    // Fallback
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);

    return '';
  }

  knockSortBy: 'type' | 'date' | 'orgAmt' = 'date';
  knockSortDir: 'asc' | 'desc' = 'asc';

  sortKnock(by: 'type' | 'date' | 'orgAmt') {
    // đổi chiều khi bấm lại
    if (this.knockSortBy === by) {
      this.knockSortDir = this.knockSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.knockSortBy = by;
      this.knockSortDir = 'asc';
    }

    // lấy mảng value hiện tại, sort rồi build lại FormArray
    const rows = this.knockFA.controls.map((fg) => fg.getRawValue());

    rows.sort((a: any, b: any) => {
      let va: any = a[by];
      let vb: any = b[by];
      if (by === 'date') {
        va = new Date(a.date).getTime();
        vb = new Date(b.date).getTime();
      } else if (by === 'orgAmt') {
        va = +a.orgAmt || 0;
        vb = +b.orgAmt || 0;
      } else {
        va = String(a.type);
        vb = String(b.type);
      }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return this.knockSortDir === 'asc' ? cmp : -cmp;
    });

    this.knockFA.clear();
    rows.forEach((r: any) => this.knockFA.push(this.createKnockRow(r)));
    // không đổi tổng, nhưng cứ tính lại cho chắc
    this.recalcTotals();
  }

  private toNum(v: any): number {
    return +String(v ?? 0).replace(/,/g, '');
  }

  formatRow(i: number) {
    const fg = this.knockFA.at(i) as FormGroup;
    const org = this.toNum(fg.get('orgAmt')!.value);
    const withDisc = !!fg.get('withDisc')!.value;

    let disc = withDisc ? this.toNum(fg.get('discAmt')!.value) : 0;
    disc = Math.max(0, Math.min(disc, org));

    let pay = this.toNum(fg.get('pay')!.value);
    const maxPay = Math.max(0, +(org - disc).toFixed(2));
    pay = Math.max(0, Math.min(pay, maxPay));

    const outstanding = +(org - disc - pay).toFixed(2);

    fg.patchValue(
      {
        discAmt: withDisc ? disc.toFixed(2) : '0.00',
        pay: pay.toFixed(2),
        outstanding,
      },
      { emitEvent: false }
    );

    this.recalcTotals();
  }
  /** Gọi khi blur ở Disc. Amount của dòng i */
  onDiscBlur(i: number) {
    const fg = this.knockFA.at(i) as FormGroup;
    const org = +fg.get('orgAmt')!.value || 0;
    const effDisc = 0;

    // giới hạn Pay theo phần còn lại sau discount
    let pay = +fg.get('pay')!.value || 0;
    pay = Math.max(0, Math.min(pay, org - effDisc));

    // nếu discount >= org thì pay = 0, outstanding = 0 (NHƯNG KHÔNG sửa discAmt)
    if (effDisc >= org - 1e-6) {
      fg.patchValue(
        { pay: 0, outstanding: 0, sel: true },
        { emitEvent: false }
      );
    } else {
      const outstanding = +(org - effDisc - pay).toFixed(2);
      fg.patchValue(
        { pay: +pay.toFixed(2), outstanding },
        { emitEvent: false }
      );
    }
    this.autoTickSelWhenDisc(i);
    this.recalcTotals();
  }

  onPayBlur(i: number) {
    const fg = this.knockFA.at(i) as FormGroup;
    const org = +fg.get('orgAmt')!.value || 0;
    let pay = +fg.get('pay')!.value || 0;
    if (pay < 0) pay = 0;
    if (pay > org) pay = org;
    const outstanding = +(org - pay).toFixed(2);
    fg.patchValue(
      { sel: pay > 0, pay: +pay.toFixed(2), outstanding },
      { emitEvent: false }
    );
    this.recalcTotals();
  }

  private autoTickSelWhenDisc(i: number) {
    const fg = this.knockFA.at(i) as FormGroup;
    const withDisc = !!fg.get('withDisc')!.value;
    const disc = +fg.get('discAmt')!.value || 0;

    // Không tự tick nếu chưa bật With Dis. hoặc discount = 0
    if (!withDisc || disc <= 0) return;

    // (phần dưới nếu bạn muốn vừa tick vừa phân bổ Pay theo số còn lại)
    const org = +fg.get('orgAmt')!.value || 0;
    const effDisc = 0; // sẽ =0 nếu With Dis. = false
    const remain = this.remainingForAllocation(i);
    const cap = Math.max(0, org - effDisc);
    const pay = Math.min(cap, remain);
    const outstanding = +(org - effDisc - pay).toFixed(2);
    fg.patchValue({ pay, outstanding }, { emitEvent: false });
  }

  // ===== Autocomplete for OR number =====
  orNoSuggestions: string[] = [];

  buildOrNoSuggestions() {
    // text đang gõ
    const raw = String(
      this.rpForm.get('docNo')?.value || ''
    ).toUpperCase();

    // prefix luôn là OR- (hoặc bạn cho đổi nếu muốn)
    const prefix = 'CN-';

    // Lấy phần số đã gõ (nếu chưa gõ, dùng gợi ý từ số kế tiếp)
    const typedDigits = raw.replace(/\D/g, '');
    const nextBase = this.nextRunningNo().replace(/^CN-/, ''); // ví dụ "10321"

    // base là 5 chữ số: ưu tiên theo người dùng, rỗng thì lấy next
    const base = (typedDigits || nextBase).padEnd(5, '0').slice(0, 5);
    const start = Math.max(0, Number(base)); // số bắt đầu

    // 10 gợi ý liên tiếp: OR-xxxxx, OR-xxxxx+1, ...
    const generated = Array.from(
      { length: 10 },
      (_, i) => `${prefix}${(start + i).toString().padStart(5, '0')}`
    );

    // Thêm vài số đã tồn tại (gần đây) ở danh sách ngoài để tiện chọn
    const recentlyUsed = [...new Set(this.rows.map((r) => r.receiptNo))].slice(
      0,
      5
    );

    // Hợp nhất + loại trùng
    const set = new Set<string>([...generated, ...recentlyUsed]);
    this.orNoSuggestions = [...set];
  }
  // so sánh theo ngày (bỏ phần giờ)
  isOverdue(dateStr?: string): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    d.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
  }

  // Dùng cột Date + còn outstanding > 0 thì coi là quá hạn
  // (Nếu muốn tô đỏ chỉ theo Date, bỏ điều kiện outstanding > 0)
  isRowOverdue(i: number): boolean {
    const fg = this.knockFA.at(i) as FormGroup;
    const docDate = fg.get('date')?.value as string;
    return this.isOverdue(docDate);
  }
  /** Edit mode: khóa toàn bộ form, chỉ bật Is RCHQ & RCHQ Date cho các dòng Cheque */
  private enableOnlyRchqWhenEdit(): void {
    this.rpForm.disable({ emitEvent: false }); // khóa tất cả
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
  // ===== confirm save modal =====
  showSaveConfirm = false;
  confirmMsg = '';

  askSave() {
    var unappliedAmount = '';
    if (this.unappliedAmount !== 0) {
      unappliedAmount = 'Unapplied Amount is ' + this.unappliedAmount + ". ";
    }
    this.confirmMsg = unappliedAmount + (
      this.formMode ===  'edit'
        ? 'Are you sure you want to update this Credit Note?'
        : 'Are you sure you want to save this Credit Note?');
    this.showSaveConfirm = true;
  }
  doConfirmSave() {
    this.showSaveConfirm = false;
    this.save(); // gọi hàm save() bạn đã có; sẽ hiện Success như trước
  }
  cancelConfirmSave() {
    this.showSaveConfirm = false;
  }
  private isZero(n: number): boolean {
    return Math.abs(+n) < 1e-6;
  }

isSelDisabled(i: number): boolean {
  if (this.formMode === 'edit') return true; // luôn readonly khi Edit
  if (!this.canAllocate) return true;        // không có tiền để allocate
  return false;
}
  private methodNet(fg: FormGroup): number {
    const amt = this.toNum(fg.get('amount')?.value);
    return Math.max(0, +amt.toFixed(2));
  }
  onMethodAmtOrFeeChanged() {
    this.recalcTotals(); // Amount = sum(amount) - sum(chargeFee)
  }
  private wireMethodRow(fg: FormGroup) {
    fg.get('amount')?.valueChanges.subscribe(() => {
      this.resetAllAllocations(); // <— xoá phân bổ khi đổi Payment Amount
    });
  }
  /** Xoá tất cả phân bổ Pay; giữ nguyên Disc. Amount, chỉ trừ disc nếu With Dis. đang bật */
  private resetAllAllocations(): void {
    this.knockFA.controls.forEach((c) => {
      const fg = c as FormGroup;
      const org = +fg.get('orgAmt')!.value || 0;
      fg.patchValue(
        { sel: false, pay: 0, outstanding: +org.toFixed(2) },
        { emitEvent: false }
      );
    });
    this.recalcTotals();
  }
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
    this.rpForm.patchValue({ debtor: d.debtorAccount });
    this.showDebtorPicker = false;
    this.onDebtorChanged();
  }

  submitted = false;
  isInvalid(name: string): boolean {
    const c = this.rpForm?.get(name);
    return !!(c && c.invalid && (c.touched || this.submitted));
  }
  get selectedDebtor(): DebtorRow | undefined {
    const code = this.rpForm?.value?.debtor;
    return (this.debtors ?? []).find((d) => d.debtorAccount === code) as
      | DebtorRow
      | undefined;
  }
  get debtorToText(): string {
    const d = this.selectedDebtor;
    if (!d) return '';
    return [d.companyName, d.billAddress, d.phone].filter(Boolean).join('\n');
  }
  detailOpen = false;
  detailItems: PaidLine[] = [];
  detailPaidTotal = 0;

  // Demo mapping: CN No. -> các dòng đã knock off
  paidByCN = new Map<string, PaidLine[]>([
    [
      'CN-000002',
      [
        {
          type: 'RI',
          date: '2025-06-11',
          no: 'INV 0802',
          orgAmt: 300,
          outstanding: 70,
          paid: 230.0,
        },
      ],
    ],
    [
      'CN-000001',
      [
        {
          type: 'RI',
          date: '2025-10-20',
          no: 'INV-0007',
          orgAmt: 700.00,
          outstanding: 600.00,
          paid: 100.0,
        },
        {
          type: 'RI',
          date: '2025-10-30',
          no: 'INV-0009',
          orgAmt: 150.00,
          outstanding: 0.00,
          paid: 150.0,
        },
      ],
    ],
  ]);

  // Hỗ trợ định dạng số
  fmt(n: number) {
    return (Number(n) || 0).toFixed(2);
  }

  // Thay hàm chọn hàng (nếu bạn đã có select()) thì đổi (click) trong HTML sang dùng hàm này
  toggleDetailFor(r: ReceivePaymentRow) {
    if (this.selected === r && this.detailOpen) {
      this.detailOpen = false; // click lại để collapse
      return;
    }
    this.selected = r;
    this.detailItems = this.paidByCN.get(r.receiptNo) ?? [];
    this.detailPaidTotal = this.detailItems.reduce(
      (s, it) => s + (it.paid || 0),
      0
    );
    this.detailOpen = true;
  }

}