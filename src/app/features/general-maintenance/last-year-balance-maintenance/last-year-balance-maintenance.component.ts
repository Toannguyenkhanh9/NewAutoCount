import { Component, OnInit, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AmountInputDirective } from '../../../_share/directives';
type ISOAmount = number | null;

interface LybTree {
  id: string;
  description: string;
  accNo: string;
  curr: string;
  special: string;
  level: number; // 0,1,2… để thụt lề
  isGroup: boolean; // có icon expand/collapse
  expanded: boolean;
  amounts: ISOAmount[]; // 12 tháng
  children?: LybTree[];
}
@Component({
  selector: 'app-last-year-balance-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule, AmountInputDirective],
  templateUrl: './last-year-balance-maintenance.component.html',
  styleUrls: ['./last-year-balance-maintenance.component.scss'],
})
export class LastYearBalanceMaintenanceComponent implements OnInit {
  private readonly nf = new Intl.NumberFormat('en-US', {
    useGrouping: true,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  // ==== Year filter ====
  years: number[] = [];
  selectedYear: number | null = null;
  showGrid = false;
  includeZero: boolean = true;

  constructor() {
    const now = new Date().getFullYear();
    // Chỉ liệt kê các năm TRƯỚC năm hiện tại (ví dụ 10 năm gần đây)
    for (let y = now - 1; y >= now - 10; y--) this.years.push(y);
    this.selectedYear = this.years[0] ?? null;
  }
  ngOnInit(): void {
    this.buildYearList(); // tạo list năm
    this.selectedYear = this.currentYear - 1; // mặc định năm ngoái
    this.inquiry(); // load dữ liệu ngay
  }
  get currentYear(): number {
    return new Date().getFullYear();
  }

  /** Tạo danh sách các năm trước năm hiện tại (ví dụ lùi 20 năm) */
  private buildYearList(range: number = 20) {
    const lastYear = this.currentYear - 1;
    const start = lastYear - (range - 1);
    this.years = [];
    for (let y = lastYear; y >= start; y--) this.years.push(y);
  }

  // ==== Data ====
  private _tree: LybTree[] = [];
  rows: LybTree[] = []; // flattened theo expand/collapse

  // Khởi tạo mock khi bấm Inquiry
  inquiry() {
    if (!this.selectedYear) return;
    this._tree = this.buildMockTree();
    this.rows = this.flatten(this._tree);
    this.showGrid = true;
  }
  onYearChange(y: number) {
    // cập nhật và gọi load dữ liệu ngay
    this.selectedYear = y;
    this.inquiry();
  }
  private buildMockTree(): LybTree[] {
    const z = () => Array<ISOAmount>(12).fill(null);

    return [
      {
        id: 'capital',
        description: 'CAPITAL',
        accNo: '',
        curr: '',
        special: '',
        level: 0,
        isGroup: true,
        expanded: true,
        amounts: z(),
        children: [
          {
            id: 'share',
            description: 'SHARE CAPITAL',
            accNo: '100-0000',
            curr: 'MYR',
            special: '',
            level: 1,
            isGroup: false,
            expanded: false,
            amounts: z(),
          },
        ],
      },
      {
        id: 'retained',
        description: 'RETAINED EARNING',
        accNo: '',
        curr: '',
        special: '',
        level: 0,
        isGroup: true,
        expanded: true,
        amounts: z(),
        children: [
          {
            id: 'ret-e',
            description: 'RETAINED EARNING',
            accNo: '150-0000',
            curr: 'MYR',
            special: 'SRE',
            level: 1,
            isGroup: false,
            expanded: false,
            amounts: z(),
          },
          {
            id: 'resv',
            description: 'RESERVES',
            accNo: '160-0000',
            curr: 'MYR',
            special: '',
            level: 1,
            isGroup: false,
            expanded: false,
            amounts: z(),
          },
        ],
      },
      {
        id: 'fa',
        description: 'FIXED ASSETS',
        accNo: '',
        curr: '',
        special: '',
        level: 0,
        isGroup: true,
        expanded: true,
        amounts: z(),
        children: [
          {
            id: 'veh',
            description: 'MOTOR VEHICLES',
            accNo: '200-1000',
            curr: 'MYR',
            special: 'SFA',
            level: 1,
            isGroup: false,
            expanded: false,
            amounts: z(),
          },
          {
            id: 'off',
            description: 'OFFICE EQUIPMENT',
            accNo: '200-3000',
            curr: 'MYR',
            special: 'SFA',
            level: 1,
            isGroup: false,
            expanded: false,
            amounts: z(),
          },
        ],
      },
      {
        id: 'curr-assets',
        description: 'CURRENT ASSETS',
        accNo: '',
        curr: '',
        special: '',
        level: 0,
        isGroup: true,
        expanded: true,
        amounts: z(),
        children: [
          {
            id: 'td',
            description: 'TRADE DEBTORS',
            accNo: '300-0000',
            curr: 'MYR',
            special: 'SDC',
            level: 1,
            isGroup: true,
            expanded: true,
            amounts: z(),
            children: [
              {
                id: 'grp-a',
                description: 'GROUP A',
                accNo: '300-1001',
                curr: 'MYR',
                special: 'SDR',
                level: 2,
                isGroup: false,
                expanded: false,
                amounts: z(),
              },
              {
                id: 'hq',
                description: 'aaa (HQ)',
                accNo: '300-2000',
                curr: 'MYR',
                special: 'SDC',
                level: 2,
                isGroup: false,
                expanded: false,
                amounts: z(),
              },
            ],
          },
        ],
      },
    ];
  }

  private flatten(tree: LybTree[]): LybTree[] {
    const out: LybTree[] = [];
    const visit = (n: LybTree) => {
      out.push(n);
      if (n.isGroup && n.expanded && n.children) n.children.forEach(visit);
    };
    tree.forEach(visit);
    return out;
  }

  toggle(row: LybTree) {
    if (!row.isGroup) return;
    row.expanded = !row.expanded;
    this.rows = this.flatten(this._tree);
  }

  // Tổng theo tháng
  colTotal(m: number): number {
    return this.rows.reduce((s, r) => s + (Number(r.amounts[m]) || 0), 0);
  }

  // Chặn e/E/+/-
  blockNonInteger(ev: KeyboardEvent) {
    if (['e', 'E', '+', '-'].includes(ev.key)) ev.preventDefault();
  }

  format(n: number | null | undefined): string {
    const v = Number(n ?? 0);
    return Number.isFinite(v) ? this.nf.format(v) : this.nf.format(0);
  }
  onSave() {
    // TODO: call API lưu số dư
    // ví dụ: console.log(this.rows);
    alert('Settings saved successfully.');
  }

  onCancel() {
    // Huỷ thay đổi tạm thời / reload lại lưới
    this.inquiry();
  }
  blockSciNotation(ev: KeyboardEvent) {
    const key = ev.key;
    // Cho phép: số, điều hướng, xoá, Tab, Enter, dấu trừ '-', dấu chấm '.'
    const allow = [
      'Backspace',
      'Delete',
      'Tab',
      'Enter',
      'Escape',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      '-',
      '.',
    ];
    if (allow.includes(key)) return;

    // Chặn e/E, +, và mọi ký tự không phải số
    if (key === 'e' || key === 'E' || key === '+') {
      ev.preventDefault();
      return;
    }
    if (!/^\d$/.test(key)) {
      ev.preventDefault();
    }
  }
  /** Lấy index các con TRỰC TIẾP của một group row */
  private directChildIndexes(group: LybTree): number[] {
    const start = this.rows.indexOf(group);
    if (start < 0) return [];
    const meLevel = group.level;
    const idxs: number[] = [];
    for (let i = start + 1; i < this.rows.length; i++) {
      const r = this.rows[i];
      // gặp cấp ngang hoặc cao hơn -> kết thúc vùng con
      if (r.level <= meLevel) break;
      // chỉ lấy con trực tiếp (level = meLevel + 1)
      if (r.level === meLevel + 1) idxs.push(i);
    }
    return idxs;
  }

  /** Subtotal của 1 nhóm tại tháng m: cộng các con trực tiếp
   *  - Nếu con là lá -> lấy amounts[m]
   *  - Nếu con là nhóm -> lấy subtotal của chính nó (đệ quy), nên số liệu vẫn chính xác
   */
  groupSum(group: LybTree, m: number): number {
    if (!group || !group.isGroup) return 0;
    const childIdxs = this.directChildIndexes(group);
    let sum = 0;
    for (const i of childIdxs) {
      const c = this.rows[i];
      if (c.isGroup) {
        sum += this.groupSum(c, m);
      } else {
        sum += Number(c.amounts?.[m] ?? 0);
      }
    }
    return sum;
  }
}
