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

type Status = 'OPEN' | 'POSTED' | 'VOID';

interface DebtorRow {
  debtorAccount: string;
  companyName: string;
  billAddress?: string;
  phone?: string;
}
interface KnockRow {
  type: 'RI' | 'RD';
  date: string;
  discountDue: string;
  no: string;
  orgAmt: number;
  outstanding: number;
  withDisc: boolean;
  discAmt: number;
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
  selector: 'app-ar-receive-payment-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AmountInputDirective,
  ],
  templateUrl: './ar-receive-payment-page.component.html',
  styleUrls: ['./ar-receive-payment-page.component.scss'],
})
export class ArReceivePaymentPageComponent {
  // ====== master ======
  currencies: Array<'MYR' | 'USD' | 'SGD'> = ['MYR', 'USD', 'SGD'];

  paymentMethods: PayMethod[] = [
    { value: 'CASH', label: 'CASH', payBy: 'Cash', chargeFee: 0 },
    {
      value: 'CHEQUE-MBB',
      label: 'CHEQUE-MBB',
      payBy: 'Cheque',
      chargeFee: 10,
    }, // ví dụ
    {
      value: 'MBB-CARD',
      label: 'MBB-Card',
      payBy: 'Credit Card',
      chargeFee: 20,
    }, // ví dụ
  ];
  private chargeFeeOf(methodValue: string): number {
    return (
      this.paymentMethods.find((m) => m.value === methodValue)?.chargeFee ?? 0
    );
  }
  // helper: lấy text Payment By cho 1 method
  private payByOf(methodValue: string): string {
    return (
      this.paymentMethods.find((m) => m.value === methodValue)?.payBy || ''
    );
  }
  onMethodChanged(i: number) {
    const fg = this.methodsFA.at(i) as FormGroup;
    const method = fg.get('method')!.value as string;

    fg.patchValue(
      {
        paymentBy: this.payByOf(method),
        bankCharge: this.chargeFeeOf(method),
      },
      { emitEvent: false }
    );

    // Đổi method => xoá hết phân bổ bên dưới
    this.knockFA.controls.forEach((row: any) => {
      const org = +row.get('orgAmt')!.value || 0;
      const disc = row.get('withDisc')!.value
        ? +row.get('discAmt')!.value || 0
        : 0;
      row.patchValue(
        { pay: 0, outstanding: +(org - disc).toFixed(2) },
        { emitEvent: false }
      );
    });

    this.recalcTotals(); // tính lại Amount/Unapplied
    if (this.formMode === 'edit') this.enableOnlyRchqWhenEdit();
  }
  onMethodAmtOrFeeChanged() {
    this.recalcTotals(); // Amount = sum(amount) - sum(chargeFee)
    this.normalizeAllocationsToTotal(); // nếu đang âm thì tự giảm pay để hết âm
  }

  debtors: DebtorRow[] = [
    {
      debtorAccount: '300-B001',
      companyName: 'BEST PHONE SDN BHD',
      billAddress: 'Klang',
      phone: '03-1234567',
    },
    {
      debtorAccount: '300-C001',
      companyName: 'IPHONE SDN BHD',
      billAddress: 'PJ',
      phone: '03-7654321',
    },
    {
      debtorAccount: '300-D001',
      companyName: 'FLC PHONE SDN BHD',
      billAddress: 'KL',
      phone: '03-9988776',
    },
  ];

  openDocsByDebtor = new Map<string, KnockRow[]>([
    [
      '300-B001',
      [
        {
          type: 'RD',
          date: '2025-10-10',
          discountDue: '2025-10-17',
          no: 'DN-0801',
          orgAmt: 500,
          outstanding: 500,
          withDisc: false,
          discAmt: 10,
          pay: 0,
        },
        {
          type: 'RD',
          date: '2025-11-18',
          discountDue: '2025-11-25',
          no: 'DN-0801',
          orgAmt: 600,
          outstanding: 600,
          withDisc: false,
          discAmt: 0,
          pay: 0,
        },
        {
          type: 'RD',
          date: '2025-10-19',
          discountDue: '2025-10-26',
          no: 'DN-0801',
          orgAmt: 700,
          outstanding: 700,
          withDisc: false,
          discAmt: 0,
          pay: 0,
        },
        {
          type: 'RD',
          date: '2025-10-20',
          discountDue: '2025-12-27',
          no: 'DN-0801',
          orgAmt: 800,
          outstanding: 800,
          withDisc: false,
          discAmt: 20,
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
          discountDue: '2025-10-05',
          no: 'INV-0007',
          orgAmt: 706.49,
          outstanding: 706.49,
          withDisc: false,
          discAmt: 0,
          pay: 0,
        },
        {
          type: 'RI',
          date: '2025-10-30',
          discountDue: '2025-11-05',
          no: 'INV-0009',
          orgAmt: 2119.47,
          outstanding: 2119.47,
          withDisc: false,
          discAmt: 0,
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
          discountDue: '2025-12-05',
          no: 'INV-0010',
          orgAmt: 1059.73,
          outstanding: 1059.73,
          withDisc: false,
          discAmt: 0,
          pay: 0,
        },
      ],
    ],
  ]);

  // ====== list ======
  rows: ReceivePaymentRow[] = [
    {
      receiptNo: 'OR-10020',
      date: '2025-10-30',
      debtor: '300-B001',
      debtorName: 'BEST PHONE SDN BHD',
      description: 'Official receipt',
      amount: 706.49,
      paidAmt: 706.49,
      outstanding: 100,
    },
    {
      receiptNo: 'OR-10022',
      date: '2025-08-20',
      debtor: '300-D001',
      debtorName: 'FLC PHONE SDN BHD',
      description: 'Official receipt',
      amount: 1059.73,
      paidAmt: 706.49,
      outstanding: 100,
    },
    {
      receiptNo: 'OR-10024',
      date: '2025-10-31',
      debtor: '300-C001',
      debtorName: 'IPHONE SDN BHD',
      description: 'Official receipt',
      amount: 2119.47,
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
  formMode: 'new' | 'edit' = 'new';

  rpForm: FormGroup;
  get methodsFA(): FormArray {
    return this.rpForm.get('methods') as FormArray;
  }
  get knockFA(): FormArray {
    return this.rpForm.get('knockOff') as FormArray;
  }

  totalAmount = 0;
  unappliedAmount = 0;
  get canAllocate() {
    return this.totalAmount > 0;
  }

  constructor(private fb: FormBuilder) {
    this.rpForm = this.fb.group({
      debtor: ['', Validators.required],
      officialNo: [''],
      date: [this.todayYMD(), Validators.required],
      currency: ['MYR', Validators.required],
      description: [localStorage.getItem('arp_last_desc') || ''],
      methods: this.fb.array([]),
      knockOff: this.fb.array([]),
      continueNew: [true],
    });
    this.addMethod();
    this.recalcTotals();
  }

  private createMethodRow(): FormGroup {
    const def = this.paymentMethods[0]?.value || 'CASH';
    return this.fb.group(
      {
        method: ['CASH'],
        chequeNo: [''],
        amount: [0],
        bankCharge: [0],
        paymentBy: [this.payByOf(def)],
        isRCHQ: [{ value: false, disabled: true }],
        rchqDate: [{ value: '', disabled: true }],
      },
      { validators: this.feeNotExceedAmountValidator } // 👈 thêm dòng này
    );
  }

  private setRchqEnabled(enabled: boolean) {
    this.methodsFA.controls.forEach((fg) => {
      const isCtl = fg.get('isRCHQ')!;
      const dtCtl = fg.get('rchqDate')!;
      if (enabled) {
        isCtl.enable({ emitEvent: false });
        dtCtl.enable({ emitEvent: false });
      } else {
        isCtl.disable({ emitEvent: false });
        dtCtl.disable({ emitEvent: false });
      }
    });
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

  private createKnockRow(r: KnockRow): FormGroup {
    return this.fb.group({
      type: [r.type],
      date: [r.date],
      discountdue: [r.discountDue],
      no: [r.no],
      orgAmt: [r.orgAmt],
      outstanding: [r.outstanding],
      withDisc: [r.withDisc],
      discAmt: [r.discAmt],
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
          sel: (x.pay ?? 0) > 0 || (x.discAmt ?? 0) > 0,
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
    const mSum = this.methodsFA.controls
      .map((c) => this.methodNet(c as FormGroup))
      .reduce((a, b) => a + b, 0);

    this.totalAmount = +mSum.toFixed(2);

    const paySum = this.knockFA.controls
      .map((fg) => this.toNum((fg as FormGroup).get('pay')?.value))
      .reduce((a, b) => a + b, 0);

    this.unappliedAmount = +(this.totalAmount - paySum).toFixed(2);
    this.updateAllLocks();
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
    const discCtl = fg.get('discAmt')!;
    const withDiscCtl = fg.get('withDisc')!;

    // 🔒 Edit mode: khóa hẳn các control của bảng
    if (this.formMode === 'edit') {
      payCtl.disable({ emitEvent: false });
      discCtl.disable({ emitEvent: false });
      withDiscCtl.disable({ emitEvent: false });
      return;
    }

    // ===== NEW mode như cũ =====
    if (!this.canAllocate) {
      payCtl.disable({ emitEvent: false });
      withDiscCtl.disable({ emitEvent: false });
      discCtl.disable({ emitEvent: false });
      return;
    }
    payCtl.enable({ emitEvent: false });
    withDiscCtl.enable({ emitEvent: false });
    if (withDiscCtl.value === true) discCtl.enable({ emitEvent: false });
    else discCtl.disable({ emitEvent: false });
  }
  private disableKnockTableAll() {
    this.knockFA.controls.forEach((g) => {
      g.get('withDisc')!.disable({ emitEvent: false });
      g.get('discAmt')!.disable({ emitEvent: false });
      g.get('pay')!.disable({ emitEvent: false });
    });
  }
  private updateAllLocks() {
    this.knockFA.controls.forEach((_fg, i) => this.updateLocksForRow(i));
  }

  /** clamp Pay/Disc + ensure Outstanding >= 0 by subtracting Disc from Pay */
  private setPayDiscAndOutstanding(
    fg: FormGroup,
    rawPay: number,
    rawDisc: number,
    excludeIndex = -1
  ) {
    const org = +fg.get('orgAmt')!.value || 0;
    const remain = this.remainingForAllocation(excludeIndex);

    // giữ nguyên giá trị discAmt trong control,
    // nhưng chỉ dùng effDisc để TÍNH khi withDisc=true
    const withDisc = !!fg.get('withDisc')!.value;

    // sanitize để nếu có tick thì giá trị trong control không vượt org
    const sanitizedDisc = Math.max(0, Math.min(+rawDisc || 0, org));
    const effDisc = withDisc ? sanitizedDisc : 0;

    let pay = Math.max(0, Math.min(org - effDisc, remain, +rawPay || 0));
    const outstanding = +(org - effDisc - pay).toFixed(2);

    const patch: any = { pay, outstanding };
    if (withDisc) patch.discAmt = sanitizedDisc; // chỉ patch khi đang tick
    fg.patchValue(patch, { emitEvent: false });

    this.updateLocksForRow((this.knockFA.controls as any[]).indexOf(fg));
  }

  /** Từ checkbox Sel/Pay */
  toggleAlloc(i: number, ev: Event) {
    const checked = !!(ev.target as HTMLInputElement)?.checked;
    const fg = this.knockFA.at(i) as FormGroup;
    const org = +fg.get('orgAmt')!.value || 0;

    // discount đang thực sự áp dụng
    const effDisc = this.getEffDisc(fg);

    if (!checked) {
      // Bỏ chọn: Pay = 0, Outstanding tính theo discount (nếu có)
      const out = +(org - effDisc).toFixed(2);
      fg.patchValue({ pay: 0, outstanding: out }, { emitEvent: false });
      this.updateLocksForRow(i);
      this.recalcTotals();
      return;
    }

    // Chọn: phân bổ theo phần còn lại nhưng không vượt (org - effDisc)
    const remain = this.remainingForAllocation(i);
    const cap = Math.max(0, org - effDisc);
    const pay = Math.min(cap, remain);
    const out = +(org - effDisc - pay).toFixed(2);

    fg.patchValue({ pay, outstanding: out }, { emitEvent: false });
    this.updateLocksForRow(i);
    this.recalcTotals();
  }

  /** Khi thay Pay hoặc Disc */
  onPayChanged(i: number) {
    const fg = this.knockFA.at(i) as FormGroup;
    const org = +fg.get('orgAmt')!.value || 0;
    const effDisc = this.getEffDisc(fg);

    let pay = +fg.get('pay')!.value || 0;
    pay = Math.max(0, Math.min(pay, org - effDisc)); // không vượt phần còn lại

    const outstanding = +(org - effDisc - pay).toFixed(2);
    const sel = pay > 0 || effDisc > 0;
    fg.patchValue({ pay: +pay.toFixed(2), outstanding }, { emitEvent: false });
    this.recalcTotals();
  }

  onWithDiscChanged(i: number) {
    const fg = this.knockFA.at(i) as FormGroup;

    const org = +fg.get('orgAmt')!.value || 0;
    const pay0 = +fg.get('pay')!.value || 0;
    const disc = +fg.get('discAmt')!.value || 0; // giữ lại giá trị đã nhập
    const withDisc = !!fg.get('withDisc')!.value;

    // snapshot unapplied hiện tại trước khi mình chỉnh con số của dòng này
    const unappliedAvail = Math.max(0, +this.unappliedAmount || 0);

    if (withDisc) {
      // BẬT With Dis.  -> pay không được vượt (org - disc)
      const cap = Math.max(0, org - Math.max(0, Math.min(disc, org)));
      const newPay = Math.min(pay0, cap);
      const outstanding = +(org - Math.min(disc, org) - newPay).toFixed(2);

      fg.patchValue(
        { pay: +newPay.toFixed(2), outstanding },
        { emitEvent: false }
      );
    } else {
      // TẮT With Dis.  -> discount không được áp vào outstanding nữa
      // Nếu pay đang được tick (coi là tick khi pay > 0),
      // thì ưu tiên BÙ discount vào pay bằng unapplied còn lại để cố gắng giữ outstanding = 0.
      let newPay = pay0;

      if (pay0 > 0) {
        const canAdd = Math.max(
          0,
          Math.min(
            disc, // bù tối đa bằng phần disc trước đó
            unappliedAvail, // và không vượt số tiền còn lại chưa phân bổ
            org - pay0 // và cũng không vượt trần org
          )
        );
        newPay = +(pay0 + canAdd).toFixed(2);
      }

      const outstanding = +(org - newPay).toFixed(2);
      fg.patchValue({ pay: newPay, outstanding }, { emitEvent: false });
    }

    // enable/disable inputs theo trạng thái mới
    this.updateLocksForRow(i);
    this.recalcTotals();
  }
  autoAllocate() {
    const baseTotal = this.totalAmount; // đã là Σ(max(amount - fee, 0))
    let remaining = +baseTotal.toFixed(2);

    // reset pay trước
    this.knockFA.controls.forEach((fg: any) => {
      const org = +fg.value.orgAmt || 0;
      const disc = fg.value.withDisc ? +fg.value.discAmt || 0 : 0;
      fg.patchValue(
        { pay: 0, outstanding: +(org - disc).toFixed(2) },
        { emitEvent: false }
      );
    });

    // phân bổ tuần tự
    this.knockFA.controls.forEach((fg: any) => {
      if (remaining <= 0) return;
      const org = +fg.value.orgAmt || 0;
      const disc = fg.value.withDisc ? +fg.value.discAmt || 0 : 0;
      const cap = Math.max(0, +(org - disc).toFixed(2));

      const pay = Math.min(cap, remaining);
      const outstanding = +(org - disc - pay).toFixed(2);
      fg.patchValue({ pay: pay.toFixed(2), outstanding }, { emitEvent: false });

      remaining = +(remaining - pay).toFixed(2);
    });

    this.recalcTotals();
  }

  openNew() {
    this.formMode = 'new';
    this.resetFormForNew();
    this.rpForm.enable({ emitEvent: false });

    // NEW => khóa Is RCHQ & RCHQ Date
    this.methodsFA.controls.forEach((g) => {
      g.get('isRCHQ')?.disable({ emitEvent: false });
      g.get('rchqDate')?.disable({ emitEvent: false });
    });

    this.showForm = true;
  }
  private settledAtOpen = false;
  openEdit() {
    if (!this.selected) return;

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
          officialNo: s.receiptNo,
          date: p.date ?? s.date,
          currency: p.currency ?? 'MYR',
          description: p.description ?? s.description ?? '',
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
        const method = m.method ?? 'CASH';
        fg.patchValue(
          {
            method,
            chequeNo: m.chequeNo ?? '',
            amount: +m.amount || 0,
            bankCharge: m.bankCharge ?? this.chargeFeeOf(method),
            paymentBy: m.paymentBy ?? this.payByOf(method),
            isRCHQ: !!m.isRCHQ,
            rchqDate: m.rchqDate ?? '',
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
          discountDue: k.discountdue ?? k.discountDue ?? '',
          no: k.no,
          orgAmt: +k.orgAmt || 0,
          outstanding: +k.outstanding || 0,
          withDisc: !!k.withDisc,
          discAmt: +k.discAmt || 0,
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
          officialNo: s.receiptNo,
          date: s.date,
          currency: 'MYR',
          description: s.description || '',
        },
        { emitEvent: false }
      );

      // gợi ý payment amount = tổng đã thanh toán (nếu muốn)
      const m0 = this.methodsFA.at(0) as FormGroup;
      m0.patchValue(
        {
          amount: s.amount || 0,
          paymentBy: this.payByOf(m0.get('method')!.value),
          bankCharge: this.chargeFeeOf(m0.get('method')!.value),
        },
        { emitEvent: false }
      );

      this.loadKnockRows(s.debtor);
    }

    this.recalcTotals();
    this.enableOnlyRchqWhenEdit(); // khóa toàn bộ, chỉ bật Is RCHQ/RCHQ Date nếu Cheque
    this.disableKnockTableAll();
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
  }

  private resetFormForNew() {
    this.rpForm.reset({
      debtor: '',
      officialNo: '',
      date: this.todayYMD(),
      currency: 'MYR',
      description: '',
      continueNew: true,
    });
    while (this.methodsFA.length) this.methodsFA.removeAt(0);
    this.addMethod();
    this.knockFA.clear();
    this.totalAmount = 0;
    this.unappliedAmount = 0;
    this.updateAllLocks();
  }
  save() {
    if (this.unappliedAmount !== 0) {
      alert('Unapplied Amount must be 0 before saving.');
      return;
    }
    if (this.rpForm.invalid) {
      this.rpForm.markAllAsTouched();
      return;
    }

    const v = this.rpForm.getRawValue();
    const debtor = this.debtors.find((d) => d.debtorAccount === v.debtor);
    const receiptNo = v.officialNo?.trim()
      ? v.officialNo.trim()
      : this.nextRunningNo();

    localStorage.setItem('arp_last_desc', v.description || '');

    const row = {
      receiptNo,
      date: v.date,
      debtor: v.debtor,
      debtorName: debtor?.companyName || v.debtor,
      description: v.description,
      amount: this.totalAmount,
      paidAmt: this.totalAmount,
      outstanding: this.unappliedAmount,
      payload: {
        ...v,
        methods: this.methodsFA.getRawValue(),
        knockOff: this.knockFA.getRawValue(),
      },
    };

    if (this.formMode === 'edit' && this.selected) {
      const idx = this.rows.indexOf(this.selected);
      if (idx >= 0) this.rows[idx] = row as any;
      this.selected = this.rows[idx];
      this.showForm = false;
      // KHÔNG đóng form – hiện success
      this.openSuccess(`Updated receipt ${receiptNo} successfully.`);
      return;
    }

    // New
    this.rows.unshift(row as any);
    this.showForm = false;
    // KHÔNG đóng form – hiện success
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
  }

  // ===== utils =====
  private nextRunningNo() {
    const n = Math.floor(Math.random() * 90000) + 10000;
    return `OR-${n}`;
  }
  private todayYMD() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
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
    const effDisc = this.getEffDisc(fg);

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
    let disc = +fg.get('discAmt')!.value || 0;
    let pay = +fg.get('pay')!.value || 0;

    // clamp để không vượt org
    if (pay < 0) pay = 0;
    if (pay + disc > org) pay = Math.max(0, org - disc);

    const outstanding = +(org - pay - disc).toFixed(2);
    fg.patchValue({ pay: +pay.toFixed(2), outstanding }, { emitEvent: false });
    this.recalcTotals();
  }
  discIsFull(i: number) {
    const fg = this.knockFA.at(i) as FormGroup;
    const org = +fg.get('orgAmt')!.value || 0;
    const disc = +fg.get('discAmt')!.value || 0;
    return disc >= org - 1e-6;
  }
  private getEffDisc(fg: FormGroup): number {
    const org = +fg.get('orgAmt')!.value || 0;
    const disc = +fg.get('discAmt')!.value || 0;
    const withDisc = !!fg.get('withDisc')!.value;
    return withDisc ? Math.max(0, Math.min(disc, org)) : 0; // chỉ áp dụng khi With Dis. bật
  }
  private autoTickSelWhenDisc(i: number) {
    const fg = this.knockFA.at(i) as FormGroup;
    const withDisc = !!fg.get('withDisc')!.value;
    const disc = +fg.get('discAmt')!.value || 0;

    // Không tự tick nếu chưa bật With Dis. hoặc discount = 0
    if (!withDisc || disc <= 0) return;

    // (phần dưới nếu bạn muốn vừa tick vừa phân bổ Pay theo số còn lại)
    const org = +fg.get('orgAmt')!.value || 0;
    const effDisc = this.getEffDisc(fg); // sẽ =0 nếu With Dis. = false
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
      this.rpForm.get('officialNo')?.value || ''
    ).toUpperCase();

    // prefix luôn là OR- (hoặc bạn cho đổi nếu muốn)
    const prefix = 'OR-';

    // Lấy phần số đã gõ (nếu chưa gõ, dùng gợi ý từ số kế tiếp)
    const typedDigits = raw.replace(/\D/g, '');
    const nextBase = this.nextRunningNo().replace(/^OR-/, ''); // ví dụ "10321"

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
  /** Kiểm tra 1 dòng methods có phải Cheque không */
  private isChequeMethod(fg: FormGroup): boolean {
    const payBy: string = (fg.get('paymentBy')?.value || '').toString();
    // hoặc suy ra từ method nếu paymentBy trống
    const method: string = (fg.get('method')?.value || '').toString();
    const fallback = this.payByOf(method);
    return /cheque/i.test(payBy || fallback);
  }

  /** Edit mode: khóa toàn bộ form, chỉ bật Is RCHQ & RCHQ Date cho các dòng Cheque */
  private enableOnlyRchqWhenEdit(): void {
    this.rpForm.disable({ emitEvent: false }); // khóa tất cả

    // Bật lại 2 control cho từng dòng Cheque, các dòng khác vẫn khóa
    this.methodsFA.controls.forEach((g) => {
      const fg = g as FormGroup;
      const isCtl = fg.get('isRCHQ')!;
      const dtCtl = fg.get('rchqDate')!;
      if (this.isChequeMethod(fg)) {
        isCtl.enable({ emitEvent: false });
        dtCtl.enable({ emitEvent: false });
      } else {
        isCtl.disable({ emitEvent: false });
        dtCtl.disable({ emitEvent: false });
      }
    });
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
    this.confirmMsg =
      this.formMode === 'edit'
        ? 'Are you sure you want to update this receipt?'
        : 'Are you sure you want to save this receipt?';
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
    if (this.formMode !== 'edit') return false; // chỉ áp dụng khi Edit
    const out = +this.knockFA.at(i).get('outstanding')!.value || 0;
    return this.isZero(this.unappliedAmount) && this.isZero(out);
  }
  get hasAnyChequeMethod(): boolean {
    return this.methodsFA.controls.some((fg) =>
      this.isChequeMethod(fg as FormGroup)
    );
  }
  /** Xoá toàn bộ phân bổ ở Knock Off sau khi Amount thay đổi */
  private clearAllocationsAfterAmountChange(): void {
    this.knockFA.controls.forEach((fg: any) => {
      const org = +fg.get('orgAmt')!.value || 0;
      fg.patchValue(
        {
          withDisc: false,
          discAmt: 0,
          pay: 0,
          outstanding: org,
        },
        { emitEvent: false }
      );
    });
    this.recalcTotals();
  }
  private netTotalAmount(): number {
    const net = this.methodsFA.controls
      .map((fg) => (+fg.value.amount || 0) - (+fg.value.bankCharge || 0))
      .reduce((a, b) => a + b, 0);
    return +net.toFixed(2);
  }
  /** Giảm pay từ cuối bảng lên để không bị âm Unapplied */
  private normalizeAllocationsToTotal(): void {
    // tổng sau phí
    const allowed = +this.totalAmount.toFixed(2);

    // tổng pay hiện có
    let paySum = this.knockFA.controls
      .map((fg) => +fg.get('pay')!.value || 0)
      .reduce((a, b) => a + b, 0);
    paySum = +paySum.toFixed(2);

    if (paySum <= allowed) return; // không âm => không làm gì

    // cần giảm bớt
    let over = +(paySum - allowed).toFixed(2);

    for (let i = this.knockFA.length - 1; i >= 0 && over > 0; i--) {
      const fg = this.knockFA.at(i) as FormGroup;
      let p = +fg.get('pay')!.value || 0;
      if (p <= 0) continue;

      const reduce = Math.min(p, over);
      p = +(p - reduce).toFixed(2);

      const org = +fg.get('orgAmt')!.value || 0;
      const disc = fg.get('withDisc')!.value
        ? +fg.get('discAmt')!.value || 0
        : 0;
      const outstanding = +(org - disc - p).toFixed(2);

      fg.patchValue({ pay: p, outstanding }, { emitEvent: false });
      over = +(over - reduce).toFixed(2);
    }

    this.recalcTotals(); // cập nhật lại Unapplied
  }
  private feeNotExceedAmountValidator = (fg: AbstractControl) => {
    const amt = +fg.get('amount')?.value || 0;
    const fee = +fg.get('bankCharge')?.value || 0;
    return fee <= amt ? null : { feeOverAmount: true };
  };
  private methodNet(fg: FormGroup): number {
    const amt = this.toNum(fg.get('amount')?.value);
    const fee = this.toNum(fg.get('bankCharge')?.value);
    return Math.max(0, +(amt - fee).toFixed(2));
  }
  private wireMethodRow(fg: FormGroup) {
    fg.get('amount')?.valueChanges.subscribe(() => {
      this.resetAllAllocations(); // <— xoá phân bổ khi đổi Payment Amount
    });
    fg.get('bankCharge')?.valueChanges.subscribe(() => {
      this.resetAllAllocations(); // <— xoá phân bổ khi đổi Charge Fee
    });
  }
  /** Xoá tất cả phân bổ Pay; giữ nguyên Disc. Amount, chỉ trừ disc nếu With Dis. đang bật */
  private resetAllAllocations(): void {
    this.knockFA.controls.forEach((c) => {
      const fg = c as FormGroup;
      const org = this.toNum(fg.get('orgAmt')?.value);
      const disc = this.toNum(fg.get('discAmt')?.value);
      const withDisc = !!fg.get('withDisc')?.value;

      const effDisc = withDisc ? Math.min(disc, org) : 0;
      const outstanding = +(org - effDisc).toFixed(2);

      fg.patchValue({ pay: 0, outstanding }, { emitEvent: false });
    });
    this.recalcTotals();
  }
  detailOpen = false;
  detailItems: PaidLine[] = [];
  detailPaidTotal = 0;

  // Demo mapping: CN No. -> các dòng đã knock off
  paidByCN = new Map<string, PaidLine[]>([
    [
      'OR-10020',
      [
        {
          type: 'RI',
          date: '2025-06-11',
          no: 'INV 0802',
          orgAmt: 4000,
          outstanding: 3770,
          paid: 230.0,
        },
      ],
    ],
    [
      'OR-10024',
      [
        {
          type: 'RI',
          date: '2025-10-20',
          no: 'INV-0007',
          orgAmt: 706.49,
          outstanding: 606.49,
          paid: 100.0,
        },
        {
          type: 'RI',
          date: '2025-10-30',
          no: 'INV-0009',
          orgAmt: 2119.47,
          outstanding: 2119.47,
          paid: 0.0,
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
