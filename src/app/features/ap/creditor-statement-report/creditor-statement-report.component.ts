import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

type Line = {
  date: string; // yyyy-mm-dd
  docNo: string;
  refNo?: string;
  type: string; // OR / CON / etc…
  description: string;
  chequeNo?: string;
  currency?: string;
  debit: number;
  credit: number;
  runBalance: number; // running balance inside the doc
};

type DocumentRow = {
  docDate: string;
  docNo: string;
  docType: string; // IN / DN / OR / BF…
  description: string;
  chequeNo?: string;
  currency: string;
  debit: number;
  credit: number;
  balance: number; // doc-level balance
  lines: Line[];
  expanded?: boolean;
};

type DebtorRow = {
  expanded?: boolean;
  debtorCode: string;
  debtorName: string;
  debtorType: 'RETAIL' | 'TRADING' | 'IMPORT' | 'MANUF';
  agent: string;
  phone: string;
  currency: string;
  balance: number;
  documents: DocumentRow[];
};

type Dir = 'asc' | 'desc';
interface SortState {
  key: string;
  dir: Dir;
}

@Component({
  selector: 'app-creditor-statement-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './creditor-statement-report.component.html',
  styleUrls: ['./creditor-statement-report.component.scss'],
})
export class CreditorStatementReportComponent {
  // ===== Sort state (3 cấp) =====
  sortLv1: SortState = { key: 'debtorCode', dir: 'asc' };
  sortLv2: SortState = { key: 'docDate', dir: 'asc' };
  sortLv3: SortState = { key: 'date', dir: 'asc' };

  // ===== form =====
  fg!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.fg = this.fb.group({
      dateFrom: ['2025-01-01'],
      dateTo: ['2025-11-06'],

      debtorType: ['ALL'],           // 'RETAIL' | 'TRADING' | ALL
      statementType: ['open'],       // 'default' | 'open' | 'balancebf'
      knockoffMode: ['normal'],      // 'normal' | 'knockoff' (placeholder)
      sortBy: ['debtorCode'],        // 'debtorCode' | 'debtorName' | 'debtorType'
    });

    // default: select all debtors
    this.selectedDebtors = this.debtors.map((d) => d.code);

    // initial data build
    this.inquiry();

    // Nếu muốn tự cập nhật khi đổi filter: bật dòng dưới
    // this.fg.valueChanges.subscribe(() => this.inquiry());
  }

  // ===== options (static) =====
  debtors = [
    { code: '400-B001', name: 'CARE PHONE SDN' },
    { code: '400-F001', name: 'BEST PHONE SDN BHD' },
    { code: '400-C001', name: 'CELCOM SDN BHD' },
    { code: '400-D001', name: 'DIGI SDN' },
    { code: '400-M001', name: 'MAXIS SDN BHD' },
  ];

  debtorTypes: Array<'IMPORT' | 'MANUF'> = ['IMPORT', 'MANUF'];

  statementTypes = [
    { value: 'default',   label: 'Creditor Default' },
    { value: 'open',      label: 'Open Item Only' },
    { value: 'balancebf', label: 'Balance B/F' },
  ];

  knockoffModes = [
    { value: 'normal',   label: 'Normal Statement' },
    { value: 'knockoff', label: 'KnockOff Statement' },
  ];

  // ===== multi-select UI state =====
  debtorDropOpen = false;
  selectedDebtors: string[] = [];

  get debtorSummary(): string {
    if (this.selectedDebtors.length === 0) return 'All';
    if (this.selectedDebtors.length === this.debtors.length) return 'All';
    return `${this.selectedDebtors.length} selected`;
  }

  onToggleDebtor(ev: Event) {
    ev.stopPropagation();
    this.debtorDropOpen = !this.debtorDropOpen;
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

  // close the dropdown when clicking outside
  @HostListener('document:click')
  handleDocClick() {
    this.debtorDropOpen = false;
  }

  // ===== dataset (master) — sample, structured 3-level =====
// ===== dataset (master) — BEST PHONE giống số liệu trong hình =====
private master: DebtorRow[] = [
  {
    debtorCode: '400-B001',
    debtorName: 'BEST PHONE SDN BHD',
    debtorType: 'IMPORT',
    agent: 'TEH',
    phone: '0925145321',
    currency: 'MYR',
    balance: 7800,
    documents: [
      // Doc cũ 2008 đã được thanh toán/đối trừ: về 0 (để thể hiện lưới như hình)
      {
        docDate: '2025-08-05',
        docNo: '123456',
        docType: 'IN',
        description: '2025 PURCHARESE',
        currency: 'MYR',
        debit: 0,
        credit: 4400,
        balance: 4400,
        lines: [
          // hóa đơn gốc
          {
            date: '2025-10-05',
            docNo: 'JV-000004',
            type: 'CON',
            description: 'CONTRA',
            chequeNo: '',
            currency: 'MYR',
            debit: 4400,
            credit: 0,
            runBalance: 0
          },
        ],
        expanded: false
      },

      // Các chứng từ 2009 còn outstanding (đúng tổng 5,819.00)
      {
        docDate: '2025-08-10',
        docNo: '456214',
        docType: 'IN',
        description: '2025 PURCHARESE',
        currency: 'MYR',
        debit: 0,
        credit: 3500,
        balance: 3500,
        lines: [
          {
            date: '2025-08-10',
            docNo: 'PV-00005',
            type: 'PV',
            description: 'ACCOUNT PAYMENT',
            chequeNo: '',
            currency: 'MYR',
            debit: 1000,
            credit: 0,
            runBalance: 2500
          },
          {
            date: '2025-08-10',
            docNo: '23456',
            type: 'CN',
            description: 'CN FROM SUPPLIER',
            chequeNo: '',
            currency: 'MYR',
            debit: 700,
            credit: 0,
            runBalance: 1800
          }
        ]
      },
      {
        docDate: '2025-09-23',
        docNo: '3432134',
        docType: 'IN',
        description: '2009 SALES',
        currency: 'MYR',
        debit: 0,
        credit: 5500,
        balance: 7300,
        lines: [
        ]
      },
      {
        docDate: '2025-09-25',
        docNo: '25622525',
        docType: 'DN',
        description: 'DN FROM SUPPLIER',
        currency: 'MYR',
        debit: 0,
        credit: 500,
        balance: 7800,
        lines: [
        ]
      },

    ],
    expanded: false
  },

  // các debtor còn lại giữ nguyên như bạn đang có
  {
    debtorCode: '400-F001',
    debtorName: 'FUTURE DREAM PHONE SDN BHD',
    debtorType: 'IMPORT',
    agent: 'JLO',
    phone: '0925145321',
    currency: 'MYR',
    balance: 4000,
    documents: [
      {
        docDate: '2025-09-23',
        docNo: 'INV 0803',
        docType: 'IN',
        description: 'ACCOUNT PAYMENT',
        currency: 'MYR',
        debit: 0,
        credit: 0,
        balance: 0,
        lines: [
          {
            date: '2025-09-23',
            docNo: 'INV 0803',
            type: 'IN',
            description: 'Invoice',
            chequeNo: '',
            currency: 'MYR',
            debit: 9500,
            credit: 0,
            runBalance: 0
          }
        ]
      }
    ],
    expanded: false
  },
  {
    debtorCode: '400-C001',
    debtorName: 'CELCOM SDN BHD',
    debtorType: 'IMPORT',
    agent: 'JLO',
    phone: '0925145321',
    currency: 'MYR',
    balance: 6170,
    documents: [
      {
        docDate: '2025-09-23',
        docNo: 'INV 0803',
        docType: 'IN',
        description: 'ACCOUNT PAYMENT',
        currency: 'MYR',
        debit: 0,
        credit: 0,
        balance: 0,
        lines: [
          {
            date: '2025-09-23',
            docNo: 'INV 0803',
            type: 'IN',
            description: 'Invoice',
            chequeNo: '',
            currency: 'MYR',
            debit: 9500,
            credit: 0,
            runBalance: 0
          }
        ]
      }
    ],
    expanded: false
  },
  {
    debtorCode: '400-D001',
    debtorName: 'DIGI SDN BHD',
    debtorType: 'MANUF',
    agent: 'JLO',
    phone: '0925145321',
    currency: 'MYR',
    balance: 3300,
    documents: [
      {
        docDate: '2025-09-23',
        docNo: 'INV 0803',
        docType: 'IN',
        description: 'ACCOUNT PAYMENT',
        currency: 'MYR',
        debit: 0,
        credit: 0,
        balance: 0,
        lines: [
          {
            date: '2025-09-23',
            docNo: 'INV 0803',
            type: 'IN',
            description: 'Invoice',
            chequeNo: '',
            currency: 'MYR',
            debit: 9500,
            credit: 0,
            runBalance: 0
          }
        ]
      }
    ],
    expanded: false
  },
  {
    debtorCode: '400-M001',
    debtorName: 'MAXIS SDN BHD',
    debtorType: 'MANUF',
    agent: 'JLO',
    phone: '0925145321',
    currency: 'MYR',
    balance: 3100,
    documents: [
      {
        docDate: '2025-09-23',
        docNo: 'INV 0803',
        docType: 'IN',
        description: 'ACCOUNT PAYMENT',
        currency: 'MYR',
        debit: 0,
        credit: 0,
        balance: 0,
        lines: [
          {
            date: '2025-09-23',
            docNo: 'INV 0803',
            type: 'IN',
            description: 'Invoice',
            chequeNo: '',
            currency: 'MYR',
            debit: 9500,
            credit: 0,
            runBalance: 0
          }
        ]
      }
    ],
    expanded: false
  },
];

  // ===== working state =====
  private _rows = signal<DebtorRow[]>([]);
  private _viewRows = signal<DebtorRow[]>([]); // <-- data sau khi sort đa cấp

  // Template gọi rows() => lấy từ _viewRows để phản ánh sort đa cấp
  rows = computed(() => this._viewRows());

  // footer totals
  totals = computed(() => {
    const bal = this._viewRows().reduce((s, r) => s + (r.balance || 0), 0);
    return { balance: bal };
  });

  // ===== expand helpers =====
  toggle(r: DebtorRow) {
    r.expanded = !r.expanded;
  }
  toggleDoc(d: DocumentRow) {
    d.expanded = !d.expanded;
  }

  // ===== main filter/sort/recalc =====
  inquiry() {
    const v = this.fg.getRawValue();
    const from = this.toDate(v.dateFrom);
    const to = this.toDate(v.dateTo);
    const selected = new Set(
      this.selectedDebtors.length
        ? this.selectedDebtors
        : this.debtors.map((d) => d.code)
    );

    // Deep clone master để không mutate nguồn
    const cloned: DebtorRow[] = this.master.map((m) => ({
      ...m,
      documents: m.documents.map((d) => ({
        ...d,
        lines: d.lines.map((l) => ({ ...l })),
        expanded: false,
      })),
      expanded: false,
      //balance: 0,
    }));

    // Filter + tính toán lại theo khoảng ngày và statement type
    let result = cloned
      .filter((r) => selected.has(r.debtorCode))
      .filter((r) => v.debtorType === 'ALL' || r.debtorType === v.debtorType)
      .filter((r) => r.documents.length > 0);

    // Sort theo combo “Sort by” (level 1 mặc định)
    const sk = v.sortBy as 'debtorCode' | 'debtorName' | 'debtorType';
    result.sort((a, b) => ('' + a[sk]).localeCompare('' + b[sk], undefined, { numeric: true, sensitivity: 'base' }));

    this._rows.set(result);

    // Sau khi set dữ liệu mới => áp sort đa cấp hiện tại
    this._recalcView();
  }

  private withinDateRangeAndRecalc(
    r: DebtorRow,
    from: Date,
    to: Date,
    statementType: 'default' | 'open' | 'balancebf'
  ): DebtorRow {
    let docs: DocumentRow[] = r.documents
      .map((d) => {
        const linesInRange = d.lines.filter((l) => {
          const dt = this.toDate(l.date);
          return dt >= from && dt <= to;
        });

        const debit = linesInRange.reduce((s, x) => s + x.debit, 0);
        const credit = linesInRange.reduce((s, x) => s + x.credit, 0);
        const balance = debit - credit;

        let run = 0;
        const newLines = linesInRange.map((l) => {
          run += l.debit - l.credit;
          return { ...l, runBalance: run };
        });

        const doc: DocumentRow = {
          ...d,
          debit,
          credit,
          balance,
          lines: newLines,
          expanded: false,
        };

        return doc;
      })
      .filter((d) => d.lines.length > 0 || statementType === 'balancebf');

    // Balance B/F
    if (statementType === 'balancebf') {
      const beforeDebit = r.documents.reduce(
        (s, d) =>
          s +
          d.lines
            .filter((l) => this.toDate(l.date) < from)
            .reduce((a, b) => a + b.debit, 0),
        0
      );
      const beforeCredit = r.documents.reduce(
        (s, d) =>
          s +
          d.lines
            .filter((l) => this.toDate(l.date) < from)
            .reduce((a, b) => a + b.credit, 0),
        0
      );
      const bf = beforeDebit - beforeCredit;
      if (bf !== 0) {
        const bfDoc: DocumentRow = {
          docDate: this.toIso(from),
          docNo: 'B/F',
          docType: 'BF',
          description: 'Balance B/F',
          chequeNo: '',
          currency: r.currency,
          debit: bf > 0 ? bf : 0,
          credit: bf < 0 ? -bf : 0,
          balance: bf,
          expanded: false,
          lines: [
            {
              date: this.toIso(from),
              docNo: 'B/F',
              refNo: '',
              type: 'BF',
              description: 'Balance B/F',
              chequeNo: '',
              currency: r.currency,
              debit: bf > 0 ? bf : 0,
              credit: bf < 0 ? -bf : 0,
              runBalance: bf,
            },
          ],
        };
        docs = [bfDoc, ...docs];
      }
    }

    // Open Item Only
    if (statementType === 'open') {
      docs = docs.filter((d) => d.debit - d.credit !== 0);
    }

    const debtorBal = docs.reduce((s, d) => s + (d.debit - d.credit), 0);

    return {
      ...r,
      documents: docs,
      balance: debtorBal,
    };
  }

  // ===== Sort handler cho header =====
  onSortLv1(key: 'debtorCode' | 'debtorName' | 'debtorType' | 'balance') {
    this.toggleDir(this.sortLv1, key);
    this._recalcView();
  }
  onSortLv2(key: 'docDate' | 'docNo') {
    this.toggleDir(this.sortLv2, key);
    this._recalcView();
  }
  onSortLv3(key: 'date' | 'docNo') {
    this.toggleDir(this.sortLv3, key);
    this._recalcView();
  }
  iconLv1(key: string) { return this.sortLv1.key === key ? this.sortLv1.dir : ''; }
  iconLv2(key: string) { return this.sortLv2.key === key ? this.sortLv2.dir : ''; }
  iconLv3(key: string) { return this.sortLv3.key === key ? this.sortLv3.dir : ''; }

  // ===== Rebuild view theo sort đa cấp =====
  private _recalcView() {
    // 1) Sort cấp 1 trên debtor list
    const s1 = this.sortLv1;
    const base = this._rows(); // <-- đọc GIÁ TRỊ signal
    const lvl1 = [...base].sort((a, b) => this.cmp((a as any)[s1.key], (b as any)[s1.key], s1.dir));

    // 2) Sort cấp 2 trong từng debtor
    const s2 = this.sortLv2;
    for (const r of lvl1) {
      r.documents = [...(r.documents ?? [])].sort((a: any, b: any) =>
        this.cmp(a[s2.key], b[s2.key], s2.dir)
      );

      // 3) Sort cấp 3 trong từng document
      const s3 = this.sortLv3;
      for (const d of r.documents) {
        d.lines = [...(d.lines ?? [])].sort((a: any, b: any) =>
          this.cmp(a[s3.key], b[s3.key], s3.dir)
        );
      }
    }

    // cập nhật signal để template rows() phản ánh
    this._viewRows.set(lvl1);
  }

  // ===== utils =====
  private toggleDir(s: SortState, key: string) {
    if (s.key === key) s.dir = s.dir === 'asc' ? 'desc' : 'asc';
    else { s.key = key; s.dir = 'asc'; }
  }
  private cmp(a: any, b: any, dir: Dir): number {
    const mul = dir === 'asc' ? 1 : -1;

    const as = typeof a === 'string' ? a : String(a ?? '');
    const bs = typeof b === 'string' ? b : String(b ?? '');

    // date?
    const ad = Date.parse(as);
    const bd = Date.parse(bs);
    if (!Number.isNaN(ad) && !Number.isNaN(bd)) return mul * (ad - bd);

    // number?
    const an = typeof a === 'number' ? a : Number(as.replace(/[, ]/g, ''));
    const bn = typeof b === 'number' ? b : Number(bs.replace(/[, ]/g, ''));
    if (!Number.isNaN(an) && !Number.isNaN(bn)) return mul * (an - bn);

    // natural string compare
    return mul * as.localeCompare(bs, undefined, { numeric: true, sensitivity: 'base' });
  }

  private toDate(iso: string): Date {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return new Date();
    return d;
  }
  private toIso(d: Date): string {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
}
