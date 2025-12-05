import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  computed,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

type PaymentType = 'normal' | 'return';

type CollectionDetail = {
  docNo: string;
  docDate: string;        // yyyy-mm-dd
  docType: string;        // OR / CN / etc
  description: string;
  currency: string;
  chequeNo?: string;
  prePayment: number;     // PrePayment column
  amount: number;         // Payment Amount column
  paymentType: PaymentType;
  cancelled: boolean;
};

type DebtorRow = {
  debtorCode: string;
  debtorName: string;
  debtorType: string;
  area: string;               // dùng cho Group by (không hiển thị cột)
  phone: string;
  currency: string;
  details: CollectionDetail[];
  totalPrePayment: number;
  totalAmount: number;
  avgAge: number;
  avgPaymentDays: number;
  expanded?: boolean;
};

type GroupView = {
  key: string;
  items: DebtorRow[];
};

type SortKey =
  | 'debtorCode'
  | 'debtorName'
  | 'debtorType'
  | 'phone'
  | 'currency'
  | 'totalPrePayment'
  | 'totalAmount'
  | 'avgAge'
  | 'avgPaymentDays';

type Dir = 'asc' | 'desc';

@Component({
  selector: 'app-debtor-collection-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './debtor-collection-report.component.html',
  styleUrls: ['./debtor-collection-report.component.scss'],
})
export class DebtorCollectionReportComponent {
 fg!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.fg = this.fb.group({
      dateFrom: ['2025-10-01'],
      dateTo: ['2025-10-31'],
      groupBy: ['none'],           // 'none' | 'area' | 'debtorType'
      debtorType: ['ALL'],         // filter Debtor Type
      currency: ['ALL'],           // filter Currency
      cancelledStatus: ['all'],    // 'all' | 'cancelled' | 'uncancelled'
    });

    // mặc định chọn tất cả Debtor & Payment Type
    this.selectedDebtors = this.debtors.map((d) => d.code);
    this.selectedPaymentTypes = this.paymentTypes.map((p) => p.value);

    this.inquiry();
  }

  // ===== Static options =====
  debtors = [
    { code: '300-B001', name: 'BEST PHONE SDN BHD' },
    { code: '300-P003', name: 'P2P MARKETING SDN BHD' },
  ];

  debtorTypes = ['LOCAL','TRADER','EXPORT'];
  currencies = ['MYR'];

  paymentTypes: { value: PaymentType; label: string }[] = [
    { value: 'normal', label: 'Normal Payment' },
    { value: 'return', label: 'Return Cheque Payment' },
  ];

  cancelledStatuses = [
    { value: 'all', label: 'Show All' },
    { value: 'cancelled', label: 'Show Cancelled' },
    { value: 'uncancelled', label: 'Show Uncancelled' },
  ];

  // ===== Debtor multi-select =====
  debtorDropOpen = false;
  selectedDebtors: string[] = [];

  get debtorSummary(): string {
    if (
      this.selectedDebtors.length === 0 ||
      this.selectedDebtors.length === this.debtors.length
    ) {
      return 'All';
    }
    return `${this.selectedDebtors.length} selected`;
  }

  onToggleDebtor(ev: Event) {
    ev.stopPropagation();
    this.debtorDropOpen = !this.debtorDropOpen;
    this.paymentTypeDropOpen = false;
  }
  closeDebtor() {
    this.debtorDropOpen = false;
  }
  selectAllDebtors(checked: boolean) {
    this.selectedDebtors = checked ? this.debtors.map((d) => d.code) : [];
  }
  toggleDebtor(code: string, checked: boolean) {
    if (checked) {
      if (!this.selectedDebtors.includes(code)) {
        this.selectedDebtors = [...this.selectedDebtors, code];
      }
    } else {
      this.selectedDebtors = this.selectedDebtors.filter((c) => c !== code);
    }
  }
  isDebtorChecked(code: string) {
    return this.selectedDebtors.includes(code);
  }

  // ===== Payment Type multi-select =====
  paymentTypeDropOpen = false;
  selectedPaymentTypes: PaymentType[] = [];

  get paymentTypeSummary(): string {
    if (
      this.selectedPaymentTypes.length === 0 ||
      this.selectedPaymentTypes.length === this.paymentTypes.length
    ) {
      return 'All';
    }
    return `${this.selectedPaymentTypes.length} selected`;
  }

  onTogglePaymentType(ev: Event) {
    ev.stopPropagation();
    this.paymentTypeDropOpen = !this.paymentTypeDropOpen;
    this.debtorDropOpen = false;
  }
  closePaymentType() {
    this.paymentTypeDropOpen = false;
  }
  selectAllPaymentTypes(checked: boolean) {
    this.selectedPaymentTypes = checked
      ? this.paymentTypes.map((p) => p.value)
      : [];
  }
  togglePaymentType(value: PaymentType, checked: boolean) {
    if (checked) {
      if (!this.selectedPaymentTypes.includes(value)) {
        this.selectedPaymentTypes = [...this.selectedPaymentTypes, value];
      }
    } else {
      this.selectedPaymentTypes = this.selectedPaymentTypes.filter(
        (v) => v !== value
      );
    }
  }
  isPaymentTypeChecked(value: PaymentType) {
    return this.selectedPaymentTypes.includes(value);
  }

  // ===== Click outside: close dropdowns =====
  @HostListener('document:click')
  handleDocClick() {
    this.debtorDropOpen = false;
    this.paymentTypeDropOpen = false;
  }

  // ===== Demo master data (match screenshot logic) =====
  private master: {
    debtorCode: string;
    debtorName: string;
    debtorType: string;
    area: string;
    phone: string;
    currency: string;
    avgAge: number;
    avgPaymentDays: number;
    details: CollectionDetail[];
  }[] = [
    {
      debtorCode: '300-B001',
      debtorName: 'BEST PHONE SDN BHD',
      debtorType: 'TRADER',
      area: 'SOUTH',
      phone: '03-33240098',
      currency: 'MYR',
      avgAge: 292,           // demo value
      avgPaymentDays: 322,   // demo value
      details: [
        {
          docNo: 'OR-B00002',
          docDate: '2025-10-05',
          docType: 'OR',
          description: 'ACCOUNT PAYMENT',
          currency: 'MYR',
          chequeNo: 'BBB 22122 (RM1,500.00)',
          prePayment: 1500,
          amount: 1500,
          paymentType: 'normal',
          cancelled: false,
        },
        {
          docNo: 'OR-B00003',
          docDate: '2025-10-05',
          docType: 'OR',
          description: 'ACCOUNT PAYMENT',
          currency: 'MYR',
          chequeNo: 'ABB 12321 (RM2,000.00)',
          prePayment: 0,
          amount: 2000,
          paymentType: 'normal',
          cancelled: false,
        },
      ],
    },
    {
      debtorCode: '300-P003',
      debtorName: 'P2P MARKETING SDN BHD',
      debtorType: 'EXPORT',
      area: 'CENTRAL',
      phone: '03-00000000',
      currency: 'MYR',
      avgAge: 276,          // demo
      avgPaymentDays: 306,  // demo
      details: [
        {
          docNo: 'OR-000002',
          docDate: '2025-10-15',
          docType: 'OR',
          description: 'ACCOUNT PAYMENT',
          currency: 'MYR',
          chequeNo: '',
          prePayment: 0,
          amount: 1500,
          paymentType: 'normal',
          cancelled: false,
        },
      ],
    },
  ];

  // ===== Sort (header) =====
  private _sortKey = signal<SortKey>('debtorCode');
  private _sortDir = signal<Dir>('asc');

  sortKey = () => this._sortKey();
  sortDir = () => this._sortDir();

  onHeaderSort(key: SortKey) {
    if (this._sortKey() === key) {
      this._sortDir.set(this._sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this._sortKey.set(key);
      this._sortDir.set('asc');
    }
  }

  // ===== Working rows =====
  private _rows = signal<DebtorRow[]>([]);
  private _rowsView = computed<DebtorRow[]>(() => {
    const list = [...this._rows()];
    const k = this._sortKey();
    const d = this._sortDir();
    const mul = d === 'asc' ? 1 : -1;

    return list.sort((a, b) => {
      const va = (a as any)[k];
      const vb = (b as any)[k];

      if (typeof va === 'number' && typeof vb === 'number') {
        return (va - vb) * mul;
      }

      return ('' + va).localeCompare('' + vb, undefined, {
        numeric: true,
        sensitivity: 'base',
      }) * mul;
    });
  });

  rows = computed(() => this._rowsView());

  // ===== Grouped view =====
  showGrouped = () => this.fg.value.groupBy !== 'none';

  groups = computed<GroupView[]>(() => {
    const mode = this.fg.value.groupBy;
    if (mode === 'none') return [];

    const byArea = mode === 'area';
    const map = new Map<string, DebtorRow[]>();

    for (const r of this.rows()) {
      const key = byArea ? r.area || 'N/A' : r.debtorType || 'N/A';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }

    return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
  });

  // ===== Totals =====
  totals = computed(() => {
    const rows = this.rows();
    const pre = rows.reduce((s, r) => s + (r.totalPrePayment || 0), 0);
    const amt = rows.reduce((s, r) => s + (r.totalAmount || 0), 0);
    return { prePayment: pre, amount: amt };
  });

  // ===== Toggle row =====
  toggleRow(r: DebtorRow) {
    r.expanded = !r.expanded;
  }

  // ===== Inquiry =====
  inquiry() {
    const v = this.fg.getRawValue();
    const from = this.toDate(v.dateFrom);
    const to = this.toDate(v.dateTo);

    const selectedDebtors =
      this.selectedDebtors.length > 0
        ? new Set(this.selectedDebtors)
        : new Set(this.debtors.map((d) => d.code));

    const selectedPayTypes =
      this.selectedPaymentTypes.length > 0
        ? new Set(this.selectedPaymentTypes)
        : new Set(this.paymentTypes.map((p) => p.value));

    const debtorTypeFilter = v.debtorType;
    const currencyFilter = v.currency;
    const cancelMode = v.cancelledStatus as 'all' | 'cancelled' | 'uncancelled';

    const rows: DebtorRow[] = [];

    for (const m of this.master) {
      if (!selectedDebtors.has(m.debtorCode)) continue;
      if (debtorTypeFilter !== 'ALL' && m.debtorType !== debtorTypeFilter)
        continue;

      const details = m.details.filter((d) => {
        const dt = this.toDate(d.docDate);
        if (dt < from || dt > to) return false;

        if (!selectedPayTypes.has(d.paymentType)) return false;
        if (currencyFilter !== 'ALL' && d.currency !== currencyFilter)
          return false;

        if (cancelMode === 'cancelled' && !d.cancelled) return false;
        if (cancelMode === 'uncancelled' && d.cancelled) return false;

        return true;
      });

      if (!details.length) continue;

      const totalPre = details.reduce((s, x) => s + x.prePayment, 0);
      const totalAmt = details.reduce((s, x) => s + x.amount, 0);

      rows.push({
        debtorCode: m.debtorCode,
        debtorName: m.debtorName,
        debtorType: m.debtorType,
        area: m.area,
        phone: m.phone,
        currency: m.currency,
        details,
        totalPrePayment: totalPre,
        totalAmount: totalAmt,
        avgAge: m.avgAge,
        avgPaymentDays: m.avgPaymentDays,
        expanded: false,
      });
    }

    this._rows.set(rows);
  }

  // ===== Utils =====
  private toDate(iso: string): Date {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return new Date(0);
    return d;
  }
}
