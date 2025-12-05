import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AmountInputDirective } from '../../../_share/directives';

type EntryType = 'Receipt' | 'Payment';
type VoucherKind = 'Receipt' | 'Payment';

interface ListRow {
  id: string;
  type: VoucherKind;
  docNo: string;
  docDate: string;
  payerPayee: string;
  description: string;
  localAmount: number;
  cancelled: boolean;
  voucher?: any; // snapshot đầy đủ để Edit mở lại
}
interface MethodRow {
  method: string;
  chequeNo?: string;
  amount: number;
  bankCharge: number;
  paymentBy?: string;
  isRchq?: boolean;
  rchqDate?: string;
}
interface DetailRow {
  accNo: string;
  accDesc: string;
  description: string;
  amount: number;
}

@Component({
  selector: 'app-cash-book-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, AmountInputDirective],
  templateUrl: './cash-book-entry.component.html',
  styleUrls: ['./cash-book-entry.component.scss'],
})
export class CashBookEntryComponent {
  // ===== Listing (data mẫu) =====
  rows: ListRow[] = [
    {
      id: 'OR-202511-0001',
      type: 'Receipt',
      docNo: 'OR-202511-0001',
      docDate: '2025-11-20',
      payerPayee: 'DANNY MELAKA',
      description: 'RENTAL 09/2025',
      localAmount: 4500.0,
      cancelled: false,
    },
    {
      id: 'PV-202511-0001',
      type: 'Payment',
      docNo: 'PV-202511-0001',
      docDate: '2025-11-20',
      payerPayee: 'MICKY SCOFIELD',
      description: 'SALARIES 09/2025',
      localAmount: 2660.25,
      cancelled: false,
    },
    {
      id: 'PV-202511-0002',
      type: 'Payment',
      docNo: 'PV-202511-0002',
      docDate: '2025-11-21',
      payerPayee: 'EPF DEPARTMENT',
      description: 'EPF ACCRUAL 09/2025',
      localAmount: -330.0,
      cancelled: false,
    },
    {
      id: 'PV-202511-0003',
      type: 'Payment',
      docNo: 'PV-202511-0003',
      docDate: '2025-11-21',
      payerPayee: 'SOCSO',
      description: 'SOCSO ACCRUAL 09/2025',
      localAmount: -9.75,
      cancelled: false,
    },
    {
      id: 'OR-202511-0002',
      type: 'Receipt',
      docNo: 'OR-202511-0002',
      docDate: '2025-11-22',
      payerPayee: 'JOHN TAN',
      description: 'INVOICE RCPT 000123',
      localAmount: 980.0,
      cancelled: false,
    },
    {
      id: 'OR-202511-0003',
      type: 'Receipt',
      docNo: 'OR-202511-0003',
      docDate: '2025-11-23',
      payerPayee: 'ACME SDN BHD',
      description: 'SERVICE FEE',
      localAmount: 350.0,
      cancelled: true,
    },
  ];

  selected: ListRow | null = null;

  typeFilter: 'All' | EntryType = 'All';
  q = '';

  cashBooks = [
    'CHEQUE-MBB',
    'CHEQUE-FBB',
    'CASH IN HAND',
    'MBB JALAN',
    'FBB CHERAS',
  ];
  paymentMethods = ['CHEQUE-MBB', 'CHEQUE-FBB', 'CASH', 'DIRECT BANK IN', 'TT'];

  // ===== New choice modal =====
  choiceOpen = false;
  openNewChoice() {
    this.choiceOpen = true;
  }
  closeChoice() {
    this.choiceOpen = false;
  }

  // ===== Voucher modal (form state) =====
  voucherOpen = false;
  voucher = {
    type: 'Receipt' as EntryType,
    docNo: '<<New>>',
    docDate: this.today(),
    secondDocNo: '',
    cashBook: this.cashBooks[0],
    payerPayee: '',
    currency: 'MYR',
    rate: 1,
    remark: '',
    methods: [] as MethodRow[],
    details: [] as DetailRow[],
    postDetailToGL: true,
  };

  openVoucher(type: EntryType) {
    this.choiceOpen = false;
    this.voucherOpen = true;
    Object.assign(this.voucher, {
      type,
      docNo: '',
      docDate: this.today(),
      secondDocNo: '',
      cashBook: this.cashBooks[0],
      payerPayee: '',
      currency: 'MYR',
      rate: 1,
      remark: '',
      methods: [
        { method: this.paymentMethods[0], amount: 0, bankCharge: 0 },
      ] as MethodRow[],
      details: [] as DetailRow[],
      postDetailToGL: true,
    });
  }
  closeVoucher() {
    this.voucherOpen = false;
  }

  // ===== List helpers =====
  trackById(_: number, r: ListRow) {
    return r.id;
  }
  filtered() {
    const q = this.q.trim().toLowerCase();
    return this.rows.filter((r) => {
      const byType = this.typeFilter === 'All' || r.type === this.typeFilter;
      const byQ =
        !q ||
        (r.type + ' ' + r.docNo + ' ' + r.payerPayee + ' ' + r.description)
          .toLowerCase()
          .includes(q);
      return byType && byQ;
    });
  }
  totalLocal() {
    return this.filtered().reduce((s, r) => s + r.localAmount, 0);
  }
  pick(r: ListRow) {
    this.selected = r;
  }
  isPicked(r: ListRow) {
    return this.selected?.id === r.id;
  }

  onEdit() {
    if (!this.selected) return;
    this.openVoucher(this.selected.type);
    Object.assign(this.voucher, {
      docNo: this.selected.docNo,
      docDate: this.selected.docDate,
      payerPayee: this.selected.payerPayee,
      remark: this.selected.description,
    });
  }
  onRefresh() {
    /* hook real API */
  }
  onPrint() {
    window.print?.();
  }

  // ===== Delete (list) =====
  confirmListOpen = false;
  askDelete() {
    if (this.selected) this.confirmListOpen = true;
  }
  doDelete() {
    if (!this.selected) return;
    this.rows = this.rows.filter((r) => r.id !== this.selected!.id);
    this.selected = null;
    this.confirmListOpen = false;
  }

  // ===== Methods / Details rows =====
  addMethod() {
    this.voucher.methods.push({
      method: this.paymentMethods[0],
      amount: 0,
      bankCharge: 0,
    });
  }
  confirmRowOpen = false as boolean;
  confirmRowCtx: { kind: 'method' | 'detail'; index: number } | null = null;
  askRemoveMethod(i: number) {
    this.confirmRowCtx = { kind: 'method', index: i };
    this.confirmRowOpen = true;
  }

  addDetail() {
    this.voucher.details.push({
      accNo: '',
      accDesc: '',
      description: '',
      amount: 0,
    });
  }
  askRemoveDetail(i: number) {
    this.confirmRowCtx = { kind: 'detail', index: i };
    this.confirmRowOpen = true;
  }
  doRemoveRow() {
    if (!this.confirmRowCtx) return;
    if (this.confirmRowCtx.kind === 'method')
      this.voucher.methods.splice(this.confirmRowCtx.index, 1);
    else this.voucher.details.splice(this.confirmRowCtx.index, 1);
    this.confirmRowOpen = false;
    this.recalcTotals();
  }

  // ===== Totals =====
  voucherTotal() {
    return this.voucher.methods.reduce(
      (s, m) => s + (+m.amount || 0) - (+m.bankCharge || 0),
      0
    );
  }
  detailsTotal() {
    return this.voucher.details.reduce((s, d) => s + (+d.amount || 0), 0);
  }
  localTotal() {
    return this.voucherTotal() * (this.voucher.rate || 1);
  }
  onCurChange() {
    this.voucher.rate =
      this.voucher.currency === 'MYR' ? 1 : this.voucher.rate || 1;
  }
  recalcTotals() {
    /* bindings compute */
  }

  // ===== Save =====
  errors: { payerPayee?: string; docNo?: string; mismatch?: string } = {};
  private resetErrors() {
    this.errors = {};
  }
  public amountsEqual(a: number, b: number): boolean {
    return Math.abs((a ?? 0) - (b ?? 0)) <= 0.005;
  }

  // Tổng khớp chưa (dùng cho template)
  get totalsMatched(): boolean {
    return this.amountsEqual(this.voucherTotal(), this.detailsTotal());
  }

  // Đủ điều kiện bật nút Save?
  canSaveVoucher(): boolean {
    const hasPayer = !!(
      this.voucher.payerPayee && this.voucher.payerPayee.trim()
    );
    return hasPayer && this.totalsMatched;
  }

  saveVoucher() {
    this.resetErrors();
    if (!this.voucher.payerPayee?.trim()) this.errors.payerPayee = 'Required';
    const totalPayment = this.voucherTotal();
    const netTotal = this.detailsTotal();
    if (!this.amountsEqual(totalPayment, netTotal)) {
      this.errors.mismatch = 'Total Payment must equal Net Total.';
    }
    if (this.errors.payerPayee || this.errors.docNo || this.errors.mismatch)
      return;

    const local = this.localTotal();

    const row: ListRow = {
      id:
        this.editingId ?? (crypto as any).randomUUID?.() ?? String(Date.now()),
      type: this.voucher.type,
      docNo: this.voucher.docNo || this.suggestDocNo(),
      docDate: this.voucher.docDate,
      payerPayee: this.voucher.payerPayee,
      description: this.voucher.remark || '',
      localAmount: local,
      cancelled: false,
      voucher: this.clone(this.voucher),
    };

    if (this.editingId) {
      const i = this.rows.findIndex((r) => r.id === this.editingId);
      if (i >= 0) this.rows[i] = row;
    } else {
      this.rows.unshift(row);
    }

    this.voucherOpen = false;
    this.editingId = null;
  }

  // ===== Utils =====
  today() {
    return new Date().toISOString().slice(0, 10);
  }
  nextDocNo(type: EntryType) {
    const prefix = type === 'Receipt' ? 'OR' : 'PV';
    const y = new Date().toISOString().slice(0, 7).replace('-', '');
    const seq = (this.rows.filter((r) => r.type === type).length + 1)
      .toString()
      .padStart(4, '0');
    return `${prefix}-${y}-${seq}`;
  }

  fillAccDesc(d: DetailRow) {
    const map: Record<string, string> = {
      '561-1000': 'RENTAL RECEIVED',
      '904-0000': 'SALARIES',
      '421-0000': 'EPF ACCRUAL',
      '422-0000': 'SOCSO ACCRUAL',
    };
    d.accDesc = map[d.accNo] || d.accDesc;
  }
  private clone<T>(x: T): T {
    return JSON.parse(JSON.stringify(x));
  }

  // ===== New / Edit =====
  editingId: string | null = null;

  openNew(kind: VoucherKind = 'Receipt') {
    this.voucher = this.makeEmptyVoucher(kind);
    this.voucherOpen = true;
    this.editingId = null;
  }

  // ✅ Sửa lỗi: fallback nếu row.voucher không có
  openEdit(row: ListRow) {
    if (!row) return;

    // Lấy snapshot nếu có; nếu không, dựng một voucher rỗng theo loại
    const base = row.voucher ?? this.makeEmptyVoucher(row.type);
    const v = this.clone(base);

    // Hydrate lại các header từ dòng list để form luôn khớp
    v.type = row.type;
    v.docNo = row.docNo || v.docNo || '';
    v.docDate = row.docDate || v.docDate;
    v.payerPayee = row.payerPayee || v.payerPayee || '';
    v.remark = row.description || v.remark || '';

    this.voucher = v;
    this.voucherOpen = true;
    this.editingId = row.id;
    this.recalcTotals?.();
  }

  get selectedRow(): ListRow | null {
    // Giữ tương thích với template cũ
    // @ts-ignore
    return (this as any).selected ?? null;
  }

  private makeEmptyVoucher(kind: VoucherKind) {
    const today = this.today();
    return {
      type: kind,
      payerPayee: '',
      docNo: '',
      docDate: today,
      secondDocNo: '',
      cashBook: this.cashBooks[0],
      currency: 'MYR',
      rate: 1,
      remark: '',
      postDetailToGL: true,
      methods: [
        {
          method: this.paymentMethods[0],
          chequeNo: '',
          amount: 0,
          bankCharge: 0,
          paymentBy: '',
          isRchq: false,
          rchqDate: '',
        },
      ] as MethodRow[],
      details: [] as DetailRow[],
    };
  }

  private suggestDocNo(): string {
    return this.nextDocNo(this.voucher.type as EntryType);
  }
}
