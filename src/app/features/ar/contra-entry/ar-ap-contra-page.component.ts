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
  FormControl,
} from '@angular/forms';
import { AmountInputDirective } from '../../../_share/directives';
import { JournalType } from '../../../_share//models/general-maintenance';
import { LucideIconsModule } from '../../../_share/lucide-icons';
type Status = 'OPEN' | 'POSTED' | 'VOID';

interface DebtorRow {
  debtorAccount: string;
  companyName: string;
  billAddress?: string;
  phone?: string;
}

interface CreditorRow {
  creditorAccount: string;
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
interface ContraRow {
  contraNo: string;
  date: string;
  debtor: string;
  debtorName: string;
  creditor: string;
  creditorName: string;
  description?: string;
  netTotal: number;
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
  selector: 'app-ar-ap-contra-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AmountInputDirective,
    LucideIconsModule
  ],
  templateUrl: './ar-ap-contra-page.component.html',
  styleUrls: ['./ar-ap-contra-page.component.scss'],
})
export class ArApContraPageComponent {
  debtorOptions = [
    { code: '300-B001', name: 'BEST PHONE SDN BHD' },
    { code: '300-C001', name: 'IPHONE SDN BHD' },
    { code: '300-D001', name: 'FLC PHONE SDN BHD' },
  ];
  creditorOptions = [
    { code: '400-B001', name: 'BEST PHONE SDN BHD' },
    { code: '400-S009', name: 'OMEGA SUPPLIES' },
    { code: '400-T010', name: 'NOVA TECH LTD' },
  ];
  private nameByCode(code: string, list: { code: string; name: string }[]) {
    return list.find((x) => x.code === code)?.name ?? '';
  }
  get debtorName(): string {
    return this.nameByCode(
      this.contraForm.get('debtor')?.value,
      this.debtorOptions
    );
  }
  get creditorName(): string {
    return this.nameByCode(
      this.contraForm.get('creditor')?.value,
      this.creditorOptions
    );
  }
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

  creditors: CreditorRow[] = [
    {
      creditorAccount: '400-B001',
      companyName: 'BEST PHONE SDN BHD',
      billAddress: 'Klang',
      phone: '03-1234567',
    },
    {
      creditorAccount: '400-S009',
      companyName: 'OMEGA SUPPLIES',
      billAddress: 'PJ',
      phone: '03-7654321',
    },
    {
      creditorAccount: '400-T010',
      companyName: 'NOVA TECH LTD',
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
  rows: ContraRow[] = [
    {
      contraNo: 'JV-00001',
      date: '2025-10-30',
      debtor: '300-B001',
      debtorName: 'BEST PHONE SDN BHD',
      creditor: '400-B001',
      creditorName: 'BEST PHONE SDN BHD',
      description: 'Official receipt',
      netTotal: 706.49,
    },
    {
      contraNo: 'JV-00002',
      date: '2025-10-30',
      debtor: '300-B001',
      debtorName: 'BEST PHONE SDN BHD',
      creditor: '400-B001',
      creditorName: 'BEST PHONE SDN BHD',
      description: 'Official receipt',
      netTotal: 706.49,
    },
    {
      contraNo: 'JV-00003',
      date: '2025-10-30',
      debtor: '300-B001',
      debtorName: 'BEST PHONE SDN BHD',
      creditor: '400-B001',
      creditorName: 'BEST PHONE SDN BHD',
      description: 'Official receipt',
      netTotal: 706.49,
    },
  ];

  q = '';
  sortBy: keyof ContraRow = 'date';
  sortDir: 'asc' | 'desc' = 'desc';
  page = 1;
  pageSize = 10;
  get filtered() {
    const k = this.q.trim().toLowerCase();
    let arr = !k
      ? this.rows
      : this.rows.filter(
        (r) =>
          r.contraNo.toLowerCase().includes(k) ||
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
  setSort(k: keyof ContraRow) {
    if (this.sortBy === k)
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else {
      this.sortBy = k;
      this.sortDir = 'asc';
    }
  }
  selected?: ContraRow;
  select(r: ContraRow) {
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

  contraForm!: FormGroup;

  totalAmount = 0;
  unappliedAmount = 0;
  get canAllocate(): boolean {
    return +(this.contraForm.get('contraAmt')?.value || 0) > 0;
  }

  constructor(private fb: FormBuilder) {
    this.contraForm = this.fb.group({
      debtor: [''],
      creditor: [''],
      journalType: ['GENERAL'],
      ref2: [''],
      ref: [''],
      contraAmt: [0, [Validators.required, Validators.min(0.01)]],
      contraNo: [''],
      date: [this.todayISO()],
      description: ['CONTRA'],
      proceedWithNew: [false],
      ar: this.fb.array<FormGroup>([]),
      ap: this.fb.array<FormGroup>([]),
    });
    this.contraForm.get('contraAmt')!.valueChanges.subscribe(() => {
      this.resetAllocations('ar');
      this.resetAllocations('ap');
      this.recalcContra();
      this.refreshDisabled('ar');
      this.refreshDisabled('ap');
    });
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
    this.openSuccess(`Contra Entry deleted successfully.`);
  }

  // ===== utils =====
  private nextRunningNo() {
    const n = Math.floor(Math.random() * 90000) + 10000;
    return `JV-${n}`;
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
  detailOpen = false;
  detailItems: PaidLine[] = [];
  detailPaidTotal = 0;
  // Thay hàm chọn hàng (nếu bạn đã có select()) thì đổi (click) trong HTML sang dùng hàm này
  toggleDetailFor(r: ContraRow) {
    if (this.selected === r && this.detailOpen) {
      this.detailOpen = false; // click lại để collapse
      return;
    }
    this.selected = r;
    this.detailItems = this.paidByCN.get(r.contraNo) ?? [];
    this.detailPaidTotal = this.detailItems.reduce(
      (s, it) => s + (it.paid || 0),
      0
    );
    this.detailOpen = true;
  }
  doConfirmSave() {
    this.showSaveConfirm = false;
    //this.save(); // gọi hàm save() bạn đã có; sẽ hiện Success như trước
  }
  private toNum(v: any): number {
    return +String(v ?? 0).replace(/,/g, '');
  }
  private getEffDisc(fg: FormGroup): number {
    const org = +fg.get('orgAmt')!.value || 0;
    const disc = +fg.get('discAmt')!.value || 0;
    const withDisc = !!fg.get('withDisc')!.value;
    return withDisc ? Math.max(0, Math.min(disc, org)) : 0; // chỉ áp dụng khi With Dis. bật
  }

  // ===== Autocomplete for OR number =====
  orNoSuggestions: string[] = [];

  // so sánh theo ngày (bỏ phần giờ)
  isOverdue(dateStr?: string): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    d.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
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

  cancelConfirmSave() {
    this.showSaveConfirm = false;
  }
  private isZero(n: number): boolean {
    return Math.abs(+n) < 1e-6;
  }
  // Demo mapping: CN No. -> các dòng đã knock off
  paidByCN = new Map<string, PaidLine[]>([
    [
      'JV-00001',
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
      'JV-00002',
      [
        {
          type: 'RI',
          date: '2025-10-20',
          no: 'INV-0007',
          orgAmt: 5000.0,
          outstanding: 0.0,
          paid: 3500.0,
        },
        {
          type: 'RI',
          date: '2025-10-30',
          no: 'INV-0009',
          orgAmt: 0.0,
          outstanding: 0.0,
          paid: 0.0,
        },
      ],
    ],
  ]);

  // Hỗ trợ định dạng số
  fmt(n: number) {
    return (Number(n) || 0).toFixed(2);
  }
  showContraForm = false;

  get arFA() {
    return this.contraForm.get('ar') as FormArray;
  }
  get apFA() {
    return this.contraForm.get('ap') as FormArray;
  }

  private doc(p: any) {
    return this.fb.group({
      type: [p.type || ''],
      date: [p.date || this.todayISO()],
      no: [p.no || ''],
      orgAmt: [p.orgAmt || 0],
      outstanding: [p.outstanding || 0],
      pay: [p.pay || 0],
      alloc: [!!p.alloc],
    });
  }

  openContraForm() {
    this.showContraForm = true;
    this.formMode = 'new';
    this.setReadOnly(false);
    // seed như hình để bạn test nhanh
    this.contraForm.reset({
      debtor: '300-B001',
      creditor: '400-B001',
      journalType: 'BANK-B',
      ref2: '',
      ref: '',
      contraAmt: 0,
      contraNo: '',
      date: this.todayISO(),
      description: 'CONTRA',
      proceedWithNew: false,
    });
    this.arFA.clear();
    this.apFA.clear();
    this.arFA.push(
      this.doc({
        type: 'RI',
        date: '2008-11-05',
        no: 'INV 0801',
        orgAmt: 5000,
        outstanding: 3500,
      })
    );
    this.arFA.push(
      this.doc({
        type: 'RI',
        date: '2025-09-23',
        no: 'I-000001',
        orgAmt: 9.9,
        outstanding: 9.9,
      })
    );
    this.arFA.push(
      this.doc({
        type: 'RI',
        date: '2025-09-23',
        no: 'I-000002',
        orgAmt: 4440,
        outstanding: 3550.09,
      })
    );
    this.arFA.push(
      this.doc({
        type: 'RI',
        date: '2025-10-05',
        no: 'I-000005',
        orgAmt: 2400,
        outstanding: 2150,
      })
    );

    this.apFA.push(
      this.doc({
        type: 'PB',
        date: '2025-11-01',
        no: '123456',
        orgAmt: 4400,
        outstanding: 4400,
      })
    );
    this.apFA.push(
      this.doc({
        type: 'PB',
        date: '2025-12-01',
        no: '2524234',
        orgAmt: 2000,
        outstanding: 2000,
      })
    );
    this.apFA.push(
      this.doc({
        type: 'PB',
        date: '2025-10-01',
        no: '85233',
        orgAmt: 3000,
        outstanding: 3000,
      })
    );
    this.recalcContra();
    this.refreshDisabled('ar');
    this.refreshDisabled('ap');
  }

  closeContraForm() {
    this.showContraForm = false;
  }

  private sumPay(which: 'ar' | 'ap') {
    const arr = which === 'ar' ? this.arFA : this.apFA;
    return arr.controls.reduce((s, g) => s + (+g.get('pay')!.value || 0), 0);
  }
  unappliedAR() {
    return +(
      (this.contraForm.get('contraAmt')!.value || 0) - this.sumPay('ar')
    ).toFixed(2);
  }
  unappliedAP() {
    return +(
      (this.contraForm.get('contraAmt')!.value || 0) - this.sumPay('ap')
    ).toFixed(2);
  }

  clampPay(ctrl: AbstractControl, which: 'ar' | 'ap') {
    const g = ctrl as FormGroup;
    const org = +(g.get('orgAmt')?.value ?? 0);
    let v = +(g.get('pay')?.value ?? 0);

    // Giới hạn theo yêu cầu
    if (v < 0) v = 0;
    if (v > org) v = org; // Max Pay = Org.Amt.

    // Không vượt quá số tiền còn lại của Contra
    const remaining =
      (this.contraForm.get('contraAmt')?.value ?? 0) -
      this.sumPay(which) +
      +(g.get('pay')?.value ?? 0);
    if (v > remaining) v = remaining;

    // Cập nhật Pay & Outstanding
    v = +(+v).toFixed(2);
    g.get('pay')?.setValue(v, { emitEvent: false });
    g.get('outstanding')?.setValue(+(org - v).toFixed(2), { emitEvent: false });
    g.get('alloc')?.setValue(v > 0, { emitEvent: false }); // pay>0 thì tick
    this.refreshDisabled(which);
  }
  toggleAlloc(ctrl: AbstractControl, which: 'ar' | 'ap') {
    const g = ctrl as FormGroup;
    const checked = !!g.get('alloc')?.value;
    if (checked) {
      const org = +(g.get('orgAmt')?.value ?? 0);
      const cur = +(g.get('pay')?.value ?? 0);
      const remaining =
        (this.contraForm.get('contraAmt')?.value ?? 0) -
        this.sumPay(which) +
        cur;
      g.get('pay')?.setValue(Math.min(org, remaining), { emitEvent: false });
    } else {
      g.get('pay')?.setValue(0, { emitEvent: false });
    }
    this.clampPay(g, which);
    this.refreshDisabled(which);
  }
  autoAllocate(which: 'ar' | 'ap') {
    const arr = which === 'ar' ? this.arFA : this.apFA;
    const picked = arr.controls.filter(
      (c) => !!(c as FormGroup).get('alloc')?.value
    );
    const list = picked.length ? picked : arr.controls;

    let remaining =
      (this.contraForm.get('contraAmt')?.value ?? 0) - this.sumPay(which);

    for (const c of list) {
      if (remaining <= 0) break;
      const g = c as FormGroup;
      const org = +(g.get('orgAmt')?.value ?? 0);
      const cur = +(g.get('pay')?.value ?? 0);
      const can = Math.min(org, remaining + cur);

      g.get('pay')?.setValue(can, { emitEvent: false });
      this.clampPay(g, which); // sẽ update outstanding

      remaining =
        (this.contraForm.get('contraAmt')?.value ?? 0) - this.sumPay(which);
    }

    // Đồng bộ checkbox: pay > 0 thì tick, ngược lại bỏ tick
    for (const c of arr.controls) {
      const g = c as FormGroup;
      const pay = +(g.get('pay')?.value ?? 0);
      g.get('alloc')?.setValue(pay > 0, { emitEvent: false });
    }
    this.refreshDisabled(which);
  }

  autoFill(which: 'ar' | 'ap') {
    let remaining =
      (this.contraForm.get('contraAmt')!.value || 0) - this.sumPay(which);
    const arr = which === 'ar' ? this.arFA : this.apFA;
    for (const fg of arr.controls) {
      if (remaining <= 0) break;
      const out = +fg.get('outstanding')!.value || 0;
      const cur = +fg.get('pay')!.value || 0;
      const can = Math.min(out, remaining + cur);
      fg.get('pay')!.setValue(+can.toFixed(2), { emitEvent: false });
      remaining =
        (this.contraForm.get('contraAmt')!.value || 0) - this.sumPay(which);
    }
  }
  buildOrNoSuggestions() {
    // text đang gõ
    const raw = String(
      this.contraForm.get('contraNo')?.value || ''
    ).toUpperCase();

    // prefix luôn là OR- (hoặc bạn cho đổi nếu muốn)
    const prefix = 'JV-';

    // Lấy phần số đã gõ (nếu chưa gõ, dùng gợi ý từ số kế tiếp)
    const typedDigits = raw.replace(/\D/g, '');
    const nextBase = this.nextRunningNo().replace(/^JV-/, ''); // ví dụ "10321"

    // base là 5 chữ số: ưu tiên theo người dùng, rỗng thì lấy next
    const base = (typedDigits || nextBase).padEnd(5, '0').slice(0, 5);
    const start = Math.max(0, Number(base)); // số bắt đầu

    // 10 gợi ý liên tiếp: OR-xxxxx, OR-xxxxx+1, ...
    const generated = Array.from(
      { length: 10 },
      (_, i) => `${prefix}${(start + i).toString().padStart(5, '0')}`
    );

    // Thêm vài số đã tồn tại (gần đây) ở danh sách ngoài để tiện chọn
    const recentlyUsed = [...new Set(this.rows.map((r) => r.contraNo))].slice(
      0,
      5
    );

    // Hợp nhất + loại trùng
    const set = new Set<string>([...generated, ...recentlyUsed]);
    this.orNoSuggestions = [...set];
  }
  recalcContra() {
    for (let i = 0; i < this.arFA.length; i++)
      this.clampPay(this.arFA.at(i), 'ar');
    for (let i = 0; i < this.apFA.length; i++)
      this.clampPay(this.apFA.at(i), 'ap');
    this.refreshDisabled('ar');
    this.refreshDisabled('ap');
  }

  saveContra() {
    if (
      this.contraForm.invalid ||
      this.unappliedAR() !== 0 ||
      this.unappliedAP() !== 0
    )
      return;

    // TODO: gọi API lưu; tạm thời chỉ show success và đóng form
    if (this.formMode === 'edit')
      this.successMsg = 'Edit contra entry successfully.';
    else
      this.successMsg = 'Contra Entry saved successfully.';
    this.showSuccess = true;
    const keepDesc = this.contraForm.get('description')!.value;

    if (this.contraForm.get('proceedWithNew')!.value) {
      this.openContraForm();
      this.contraForm.get('description')!.setValue(keepDesc || 'CONTRA');
    } else {
      this.closeContraForm();
    }
  }

  // helpers dùng chung
  private todayISO() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }
  searchParty(kind: 'debtor' | 'creditor') {
    alert('Search ' + kind + '…');
  }
  private resetAllocations(which: 'ar' | 'ap') {
    const arr = which === 'ar' ? this.arFA : this.apFA;
    for (const c of arr.controls) {
      const g = c as FormGroup;
      const org = +(g.get('orgAmt')?.value ?? 0);
      g.get('alloc')?.setValue(false, { emitEvent: false });
      g.get('pay')?.setValue(0, { emitEvent: false });
      g.get('outstanding')?.setValue(org, { emitEvent: false });
    }
  }

  // Ngăn nhập Pay khi chưa có tiền hoặc dòng chưa được tick lúc remaining=0
  isRowInputDisabled(which: 'ar' | 'ap', i: number): boolean {
    if (!this.canAllocate) return true;
    const arr = which === 'ar' ? this.arFA : this.apFA;
    const g = arr.at(i) as FormGroup;
    const checked = !!g.get('alloc')?.value;
    const rem = this.remaining(which);
    return rem <= 0 && !checked; // khi hết tiền: khóa các dòng chưa tick
  }

  // Chỉ cho tick thêm khi còn tiền; đã tick thì luôn cho uncheck
  isRowCheckboxDisabled(which: 'ar' | 'ap', i: number): boolean {
    if (!this.canAllocate) return true;
    const arr = which === 'ar' ? this.arFA : this.apFA;
    const g = arr.at(i) as FormGroup;
    const checked = !!g.get('alloc')?.value;
    const rem = this.remaining(which);
    return rem <= 0 && !checked; // hết tiền: các dòng chưa tick bị disable
  }
  private remaining(which: 'ar' | 'ap'): number {
    return which === 'ar' ? this.unappliedAR() : this.unappliedAP();
  }

  private refreshDisabled(which: 'ar' | 'ap') {
    const arr = which === 'ar' ? this.arFA : this.apFA;
    const rem = this.remaining(which);
    const allow = this.canAllocate; // contraAmt > 0

    arr.controls.forEach((c) => {
      const g = c as FormGroup;
      const checked = !!g.get('alloc')?.value;
      const shouldDisable = !allow || (rem <= 0 && !checked);

      const payCtl = g.get('pay') as FormControl;
      const allocCtl = g.get('alloc') as FormControl;

      if (shouldDisable) {
        if (payCtl.enabled) payCtl.disable({ emitEvent: false });
        // khi hết tiền: dòng chưa tick thì ko cho tick thêm
        if (!checked && allocCtl.enabled)
          allocCtl.disable({ emitEvent: false });
      } else {
        if (payCtl.disabled) payCtl.enable({ emitEvent: false });
        if (allocCtl.disabled) allocCtl.enable({ emitEvent: false });
      }
    });
  }
  sumOrg(which: 'ar' | 'ap'): number {
    const arr = which === 'ar' ? this.arFA : this.apFA;
    return arr.controls.reduce((s, g) => s + (+g.get('orgAmt')!.value || 0), 0);
  }
  sumOutstanding(which: 'ar' | 'ap'): number {
    const arr = which === 'ar' ? this.arFA : this.apFA;
    return arr.controls.reduce(
      (s, g) => s + (+g.get('outstanding')!.value || 0),
      0
    );
  }
  get meetsOutstandingRule(): boolean {
    return this.sumOutstanding('ar') === 0 || this.sumOutstanding('ap') === 0;
  }

  get isReadOnly(): boolean {
    return this.formMode === 'view';
  }
  private setReadOnly(ro: boolean) {
    if (ro) this.contraForm.disable({ emitEvent: false });
    else this.contraForm.enable({ emitEvent: false });

    // đồng bộ logic disable theo Unapplied/Alloc (đã có trong component)
    this.refreshDisabled?.('ar');
    this.refreshDisabled?.('ap');
  }
  openView(row?: ContraRow) {
    // Nếu bạn đã có openContraForm() để seed data demo, có thể tái dùng:
    this.openContraForm(); // nạp dữ liệu (hoặc tự load từ row nếu có API)
    this.formMode = 'edit';
    //this.setReadOnly(true);
  }
  knSort: {
    ar: { key: 'type' | 'date' | 'no' | 'orgAmt'; dir: 'asc' | 'desc' };
    ap: { key: 'type' | 'date' | 'no' | 'orgAmt'; dir: 'asc' | 'desc' };
  } = {
      ar: { key: 'date', dir: 'asc' },
      ap: { key: 'date', dir: 'asc' },
    };

  private sortVal(
    g: FormGroup,
    key: 'type' | 'date' | 'no' | 'orgAmt'
  ): number | string {
    const raw = g.get(key === 'orgAmt' ? 'orgAmt' : key)?.value;
    if (key === 'orgAmt') return +raw || 0;
    if (key === 'date') return new Date(raw || '1970-01-01').getTime();
    return String(raw ?? '').toLowerCase();
  }

  sortKnock(which: 'ar' | 'ap', key: 'type' | 'date' | 'no' | 'orgAmt') {
    const state = this.knSort[which];
    // toggle hướng nếu bấm lại đúng cột, ngược lại reset asc
    state.dir =
      state.key === key ? (state.dir === 'asc' ? 'desc' : 'asc') : 'asc';
    state.key = key;

    const fa = which === 'ar' ? this.arFA : this.apFA;
    // clone + sort control
    const sorted = (fa.controls.slice() as FormGroup[]).sort((a, b) => {
      const va = this.sortVal(a, key);
      const vb = this.sortVal(b, key);
      if (va < vb) return state.dir === 'asc' ? -1 : 1;
      if (va > vb) return state.dir === 'asc' ? 1 : -1;
      return 0;
    });

    // ghi lại vào FormArray để template theo index hiện hành
    fa.clear();
    sorted.forEach((c) => fa.push(c));
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
    const code = d?.debtorAccount || '';
    this.contraForm.get('debtor')?.setValue(code, { emitEvent: true });
    this.contraForm.get('debtor')?.markAsDirty();
    this.contraForm.get('debtor')?.markAsTouched();
    this.showDebtorPicker = false;
    this.onDebtorChanged();
  }


  showCreditorPicker = false;
  creditorQuery = '';
  creditorFiltered: CreditorRow[] = [];

  openCreditorDropdown() {
    this.creditorQuery = '';
    this.creditorFiltered = [...(this.creditors ?? [])];
    this.showCreditorPicker = true;
  }

  filterCreditors() {
    const q = (this.creditorQuery || '').toLowerCase().trim();
    const src = this.creditors ?? [];
    this.creditorFiltered = !q
      ? [...src]
      : src.filter(
        (c) =>
          (c.creditorAccount || '').toLowerCase().includes(q) ||
          (c.companyName || '').toLowerCase().includes(q) ||
          (c.billAddress || '').toLowerCase().includes(q) ||
          (c.phone || '').toLowerCase().includes(q)
      );
  }

  pickCreditor(c: CreditorRow) {
    const code = c?.creditorAccount || '';
    this.contraForm.get('creditor')?.setValue(code, { emitEvent: true });
    this.contraForm.get('creditor')?.markAsDirty();
    this.contraForm.get('creditor')?.markAsTouched();
    this.showCreditorPicker = false;
    this.onCreditorChanged();
  }

  submitted = false;
  isInvalid(name: string): boolean {
    const c = this.contraForm?.get(name);
    return !!(c && c.invalid && (c.touched || this.submitted));
  }
  onDebtorChanged() {
    const code = (this.contraForm.get('debtor')?.value || '') as string;
    // TODO: load A/R outstanding docs by debtor
    // Example: const list = this.openDocsByDebtor.get(code) ?? [];
  }
  onCreditorChanged() {
    const code = (this.contraForm.get('creditor')?.value || '') as string;
    // TODO: load A/P outstanding docs by creditor
  }
}
