import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';

type AccKind = 'type' | 'normal' | 'special';

interface FixedLinkRow {
  assetId: string;
  assetCode: string;
  assetDesc: string;
  deprId: string;
  deprCode: string;
  deprDesc: string;
}

interface AccountNode {
  id: string;
  kind: AccKind;
  code?: string;
  desc: string;
  specialCode?: string;
  currency?: string;
  balance?: number;
  canCarryChildren?: boolean;
  hasTxn?: boolean;
  parentId?: string | null;
  expanded?: boolean;
  children?: AccountNode[];
}

interface FlatRow {
  node: AccountNode;
  depth: number;
  visible: boolean;
}
interface ListRow {
  node: AccountNode;
  typeId: string;
  typeDesc: string; // desc của cấp 1
}
interface PaymentMethod {
  name: string;
  journalType: 'BANK' | 'CASH' | 'DEPOSIT';
  bankChargeAcc?: string;
  bankChargeRate?: number;
  paymentBy?: string;
  paymentType?: 'Cash' | 'Credit Card' | 'Multi' | 'Other';
  requireExtraInfo?: boolean;
  mergeBankCharge?: boolean;
  pvFormat?: string;
  orFormat?: string;
}
type CashflowCat =
  | 'Operating Activities'
  | 'Investing Activities'
  | 'Financing Activities';
@Component({
  standalone: true,
  selector: 'app-account-maintenance',
  templateUrl: './account-maintenance.component.html',
  styleUrls: ['./account-maintenance.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class AccountMaintenanceComponent {
  private readonly ACC_NO_RE = /^[0-9]{3}-[A-Z0-9]{4}$/; // dùng trong TS
  accPattern = '^\\d{3}-[A-Za-z0-9]{4}$'; // bind cho [pattern] trong HTML
  newNormalAccNoDup = false;
  faAssetAccNoDup = false;
  faDeprAccNoDup = false;
  bankAccNoDup = false;
  normalizeAcc(s: string) {
    return (s || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
  }

  isCodeInUse(code: string, excludeId?: string): boolean {
    const c = this.normalizeAcc(code);
    for (const n of this.allNodes()) {
      if (!n.code) continue;
      if (
        this.normalizeAcc(n.code) === c &&
        (!excludeId || n.id !== excludeId)
      ) {
        return true;
      }
    }
    return false;
  }

  /** Trả về chuỗi lỗi, null nếu hợp lệ */
  accError(code: string, excludeId?: string): string | null {
    const v = this.normalizeAcc(code);
    if (!v) return 'Account No. is required';
    if (!this.ACC_NO_RE.test(v)) {
      return 'Format must be NNN-XXXX (3 digits, hyphen, 4 letters/digits).';
    }
    if (this.isCodeInUse(v, excludeId)) return 'Account No. already exists';
    return null;
  }
  // ====== config / options ======
  currencies: string[] = [
    'MYR',
    'USD',
    'SGD',
    'IDR',
    'THB',
    'VND',
    'CNY',
    'JPY',
    'EUR',
  ];
  docPvOptions = ['PV Default', 'PV A', 'PV B', 'PV Manual'];
  docOrOptions = ['ORB', 'OR Default', 'OR Series 1', 'OR Series 2'];

  // ====== top state ======
  selectedType = 'ALL';
  upToDate = this.toISO(new Date());
  findText = '';
  private findHits: FlatRow[] = [];
  private findIndex = -1;

  // hàng đang chọn trong grid
  selectedNodeId: string | null = null;
// Multi-select (bulk delete)
selectedIds = new Set<string>();
bulkDeleteNodes: AccountNode[] = [];

get selectedCount(): number { return this.selectedIds.size; }
get hasSelection(): boolean { return this.selectedIds.size > 0; }
isChecked(n: AccountNode): boolean { return this.selectedIds.has(n.id); }

private _setChecked(id: string, checked: boolean) {
  const next = new Set(this.selectedIds);
  if (checked) next.add(id);
  else next.delete(id);
  this.selectedIds = next;
}

toggleChecked(n: AccountNode, checked: boolean) {
  if (!this.canDelete(n)) return;
  this._setChecked(n.id, checked);
}

// click row để toggle chọn (optional)
toggleRowClick(n: AccountNode) {
  if (!this.canDelete(n)) return;
  this._setChecked(n.id, !this.selectedIds.has(n.id));
}

clearSelection() {
  this.selectedIds = new Set<string>();
}

get selectedNodes(): AccountNode[] {
  if (this.selectedIds.size === 0) return [];
  const map = new Map<string, AccountNode>();
for (const n of this.allNodes()) map.set(n.id, n);
  return Array.from(this.selectedIds)
    .map((id) => map.get(id))
    .filter((x): x is AccountNode => !!x);
}

get allSelectableChecked(): boolean {
  const selectableIds = this.listRows
    .filter((r) => this.canDelete(r.node))
    .map((r) => r.node.id);
  return selectableIds.length > 0 && selectableIds.every((id) => this.selectedIds.has(id));
}

toggleSelectAll(ev: Event) {
  const checked = (ev.target as HTMLInputElement).checked;
  const selectableIds = this.listRows
    .filter((r) => this.canDelete(r.node))
    .map((r) => r.node.id);

  const next = new Set(this.selectedIds);
  for (const id of selectableIds) {
    if (checked) next.add(id);
    else next.delete(id);
  }
  this.selectedIds = next;
}

askBulkDelete() {
  const nodes = this.selectedNodes.filter((n) => this.canDelete(n));
  if (nodes.length === 0) return;
  this.bulkDeleteNodes = nodes;
  this.ui.confirmBulkDeleteOpen = true;
}

cancelBulkDelete() {
  this.ui.confirmBulkDeleteOpen = false;
  this.bulkDeleteNodes = [];
}
  // UI flags
  ui = {
    // popups
    newNormalOpen: false,
    fixedAssetOpen: false,
    bankCashOpen: false,
    debtorCtrlOpen: false,
    creditorCtrlOpen: false,
    stockOpen: false,
    retainedOpen: false,
    editOpen: false,
    fixedLinksOpen: false,
    // create menu
    createOpen: false, // menu đầy đủ
    createShortOpen: false, // menu rút gọn cho CA/CL
    // confirm delete
    confirmDeleteOpen: false,
    confirmFixedLinkOpen: false,
    confirmRemoveMethodOpen: false,
    addMenuOpen: false,
    confirmBulkDeleteOpen: false,
  };

  // context cho create menu
  createParentId: string | null = null;
  createShortMode: 'CA' | 'CL' | null = null; // Current Assets / Current Liabilities

  // lock "Under Account Type of…" khi mở từ CA/CL
  bankUnderTypeLocked = false;

  // ===== models cho các modal =====
  newNormal = {
    parentId: '' as string | null,
    code: '',
    desc: '',
    currency: 'MYR',
    cashflow: 'Operating Activities',
  };

  fixedAsset = {
    parentIdAsset: '' as string | null,
    parentIdDepr: '' as string | null,
    currency: 'MYR',
    cashflow: 'Investing Activities',
    assetCode: '',
    assetDesc: '',
    assetDesc2: '',
    deprCode: '',
    deprDesc: '',
    deprDesc2: '',
  };

  bankCash = {
    parentId: '' as string | null,
    mode: 'Bank' as 'Bank' | 'Cash' | 'Deposit',
    underType: 'Current Assets' as 'Current Assets' | 'Current Liabilities',
    underTypeLocked: false,
    code: '',
    desc: '',
    currency: 'MYR',
    cashflow: 'Operating Activities',
    odLimit: 0,
    methods: [] as PaymentMethod[],
    selectedMethodIndex: null as number | null,
  };

  debtorCtrl = {
    parentId: '' as string | null,
    code: '',
    currency: 'MYR',
    cashflow: 'Operating Activities',
    desc: 'DEBTOR CONTROL',
    desc2: '',
  };
  creditorCtrl = {
    parentId: '' as string | null,
    code: '',
    currency: 'MYR',
    cashflow: 'Operating Activities',
    desc: 'CREDITOR CONTROL (NORTHERN)',
    desc2: '',
  };
  creditorAccNoDup = false;

  stock = {
    open: {
      parentId: null as string | null,
      code: '600-0000',
      currency: 'MYR',
      cashflow: 'Operating Activities' as CashflowCat,
      desc: 'OPENING STOCK',
      desc2: '',
    },
    close: {
      parentId: null as string | null,
      code: '699-0000',
      currency: 'MYR',
      cashflow: 'Operating Activities' as CashflowCat,
      desc: 'CLOSING STOCK',
      desc2: '',
    },
    balance: {
      parentId: null as string | null,
      code: '333-0000',
      currency: 'MYR',
      cashflow: 'Operating Activities' as CashflowCat,
      desc: 'BALANCE SHEET STOCK',
      desc2: '',
    },
  };
  retained = {
    parentId: null as string | null,
    code: '150-0000',
    desc: 'RETAINED EARNING',
    desc2: '',
    currency: 'MYR',
    cashflow: 'Operating Activities',
  };

  edit = {
    nodeId: '' as string,
    parentId: '' as string | null,
    code: '',
    desc: '',
    currency: 'MYR',
  };
  editLockParent = false;
  editLockReason = '';

  // ===== mock dữ liệu =====
  roots: AccountNode[] = [
    {
      id: 'T-CAP',
      kind: 'type',
      desc: 'CAPITAL',
      expanded: true,
      children: [
        {
          id: 'N-SHARE',
          kind: 'normal',
          code: '100-0000',
          desc: 'SHARE CAPITAL',
          currency: 'MYR',
          balance: -200000,
          canCarryChildren: true,
          children: [],
        },
      ],
    },
    {
      id: 'T-RE',
      kind: 'type',
      desc: 'RETAINED EARNING',
      expanded: true,
      children: [
        {
          id: 'S-RE',
          kind: 'special',
          code: '150-0000',
          desc: 'RETAINED EARNING',
          specialCode: 'SRE',
          currency: 'MYR',
          balance: -78800,
        },
        {
          id: 'N-RES',
          kind: 'normal',
          code: '151-0000',
          desc: 'RESERVES',
          canCarryChildren: true,
          children: [],
        },
      ],
    },
    {
      id: 'T-FA',
      kind: 'type',
      desc: 'FIXED ASSETS',
      expanded: true,
      children: [
        {
          id: 'FA-MOTOR',
          kind: 'special',
          code: '200-1000',
          desc: 'MOTOR VEHICLES',
          specialCode: 'SAD',
          currency: 'MYR',
          balance: 70000,
        },
        {
          id: 'FA-DEP-MOTOR',
          kind: 'special',
          code: '200-1005',
          desc: 'ACCUM. DEPRN. MOTOR VEHICLES',
          specialCode: 'SFA',
          currency: 'MYR',
          balance: -14000,
        },
        {
          id: 'FA-FFE',
          kind: 'special',
          code: '200-2000',
          desc: 'FURNITURES & FITTINGS',
          specialCode: 'SAD',
          currency: 'MYR',
          balance: 50000,
        },
        {
          id: 'FA-DEP-FFE',
          kind: 'special',
          code: '200-2005',
          desc: 'ACCUM. DEPRN. - FURNITURES & FITTINGS',
          specialCode: 'SFA',
          currency: 'MYR',
          balance: -10000,
        },
        {
          id: 'FA-OFFICE',
          kind: 'special',
          code: '200-3000',
          desc: 'OFFICE EQUIPMENT',
          specialCode: 'SAD',
          currency: 'MYR',
          balance: 19500,
        },
        {
          id: 'FA-DEP-OFFICE',
          kind: 'special',
          code: '200-3005',
          desc: 'ACCUM. DEPRN. - OFFICE EQUIPMENT',
          specialCode: 'SFA',
          currency: 'MYR',
          balance: -4000,
        },
      ],
    },
    {
      id: 'T-CA',
      kind: 'type',
      desc: 'CURRENT ASSETS',
      expanded: true,
      children: [
        {
          id: 'S-TRADE-DEBTORS',
          kind: 'special',
          code: '300-0000',
          desc: 'TRADE DEBTORS',
          specialCode: 'SDC',
          currency: 'MYR',
          balance: 68949,
          canCarryChildren: false,
        },
        {
          id: 'S-OTHER-DEBTORS',
          kind: 'special',
          code: '301-0000',
          desc: 'OTHER DEBTORS',
          specialCode: 'SDC',
          currency: 'MYR',
          balance: 0,
        },
        {
          id: 'N-BANKS',
          kind: 'normal',
          code: '310-0000',
          desc: 'CASH AT BANK',
          canCarryChildren: true,
          children: [
            {
              id: 'S-MBB',
              kind: 'special',
              code: '310-MBB1',
              desc: 'MBB JALAN SULTAN',
              specialCode: 'SBK',
              currency: 'MYR',
              balance: 30000,
            },
            {
              id: 'S-FBB',
              kind: 'special',
              code: '310-FBB1',
              desc: 'FBB CHERAS',
              specialCode: 'SBK',
              currency: 'MYR',
              balance: 25000,
            },
          ],
        },
        {
          id: 'S-CASH-HAND',
          kind: 'special',
          code: '320-0000',
          desc: 'CASH IN HAND',
          specialCode: 'SCH',
          currency: 'MYR',
          balance: 20000,
        },
        {
          id: 'S-STOCK',
          kind: 'special',
          code: '330-0000',
          desc: 'STOCK',
          specialCode: 'SCS',
          currency: 'MYR',
          balance: 2000,
        },
        {
          id: 'S-PREPAY',
          kind: 'special',
          code: '340-0000',
          desc: 'PREPAYMENT',
          specialCode: 'SCS',
          currency: 'MYR',
          balance: 0,
        },
        {
          id: 'S-DEPOSIT-PAID',
          kind: 'special',
          code: '350-0000',
          desc: 'DEPOSIT PAID',
          specialCode: 'SCS',
          currency: 'MYR',
          balance: 0,
        },
      ],
    },
    {
      id: 'T-CL',
      kind: 'type',
      desc: 'CURRENT LIABILITIES',
      expanded: true,
      children: [],
    },
    {
      id: 'T-COGS',
      kind: 'type',
      desc: 'COST OF GOODS SOLD',
      expanded: true,
      children: [],
    },
  ];

  // ===== derived =====
  get accountTypes(): { id: string; label: string }[] {
    return [
      { id: 'ALL', label: 'Show All' },
      ...this.roots.map((r) => ({ id: r.id, label: r.desc })),
    ];
  }

  // ===== utils =====
  private toISO(d: Date) {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  private genId(prefix: 'N' | 'S' = 'N'): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  }

  // ===== tree flatten =====
  toggle(node: AccountNode) {
    node.expanded = !node.expanded;
  }
  get flat(): FlatRow[] {
    const rows: FlatRow[] = [];
    const acceptRoot = (root: AccountNode) =>
      this.selectedType === 'ALL' || root.id === this.selectedType;
    for (const root of this.roots) {
      if (!acceptRoot(root)) continue;
      this.walk(root, 0, rows);
    }
    return rows;
  }
get listRows(): ListRow[] {
  const q = String(this.activeFilter ?? '').trim().toLowerCase();

  const out: ListRow[] = [];

  const pushIfMatch = (root: AccountNode, n: AccountNode) => {
    if (n.kind === 'type') return;

    if (q) {
      const s = `${n.desc ?? ''} ${n.code ?? ''} ${n.specialCode ?? ''}`.toLowerCase();
      if (!s.includes(q)) return;
    }

    out.push({ node: n, typeId: root.id, typeDesc: root.desc });
  };

  const walk = (root: AccountNode, n: AccountNode) => {
    pushIfMatch(root, n);
    for (const ch of n.children ?? []) walk(root, ch);
  };

  for (const root of this.roots ?? []) {
    if (this.selectedType !== 'ALL' && root.id !== this.selectedType) continue;
    for (const ch of root.children ?? []) walk(root, ch);
  }

  return out;
}
selectNode(node: AccountNode) {
  this.selectedNodeId = node.id;
}
  private walk(node: AccountNode, depth: number, out: FlatRow[]) {
    out.push({ node, depth, visible: true });
    if (!node.children || !node.expanded) return;
    for (const ch of node.children) this.walk(ch, depth + 1, out);
  }

  // ===== select row =====
  onRowSelect(r: FlatRow) {
    this.selectedNodeId = r.node.id;
  }

  // ancestry helpers
  private getAncestry(id: string): AccountNode[] {
    const path: AccountNode[] = [];
    const dfs = (n: AccountNode, stack: AccountNode[]): boolean => {
      const cur = [...stack, n];
      if (n.id === id) {
        path.push(...cur);
        return true;
      }
      if (n.children) for (const c of n.children) if (dfs(c, cur)) return true;
      return false;
    };
    for (const r of this.roots) if (dfs(r, [])) break;
    return path;
  }
  private findParentId(childId: string): string | null {
    const anc = this.getAncestry(childId);
    return anc.length >= 2 ? anc[anc.length - 2].id : null;
  }
  private defaultParentFromSelection(preferTypeDesc?: string): string | null {
    if (preferTypeDesc) {
      const t = this.roots.find((r) => r.desc === preferTypeDesc);
      if (t) return t.id;
    }
    if (!this.selectedNodeId) return null;
    const anc = this.getAncestry(this.selectedNodeId);
    if (anc.length >= 3) return anc[anc.length - 2].id;
    return anc[anc.length - 1].id;
  }
  private moveNode(childId: string, newParentId: string) {
    if (childId === newParentId) return;
    const removeFrom = (arr: AccountNode[]): AccountNode | null => {
      for (let i = 0; i < arr.length; i++) {
        const n = arr[i];
        if (n.id === childId) {
          arr.splice(i, 1);
          return n;
        }
        if (n.children) {
          const got = removeFrom(n.children);
          if (got) return got;
        }
      }
      return null;
    };
    const node = removeFrom(this.roots);
    if (!node) return;
    const parent = this.getNode(newParentId);
    if (!parent) return;
    parent.children = parent.children ?? [];
    parent.children.push(node);
    parent.expanded = true;
  }

  // ===== search =====
activeFilter = '';

doFind() {
  this.activeFilter = (this.findText || '').trim();

  // optional: cuộn tới dòng đầu tiên sau khi filter
  setTimeout(() => {
    const first = this.listRows[0]?.node;
    if (!first) return;
    document.getElementById(`row-${first.id}`)?.scrollIntoView({ block: 'center' });
  });
}

clearFind() {
  this.findText = '';
  this.activeFilter = '';
}
  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (e.key === 'F3') {
      e.preventDefault();
      this.findNext();
    }
  }


    @HostListener('document:click')
  onDocClick() {
    this.ui.addMenuOpen = false;
  }

  toggleAddMenu(ev: MouseEvent) {
    ev.stopPropagation();
    this.ui.addMenuOpen = !this.ui.addMenuOpen;
  }

  selectType(id: string) {
    this.selectedType = id;
    this.selectedNodeId = null;
    this.ui.addMenuOpen = false;
  }

    findNext() {
    if (this.findHits.length === 0) return;
    this.findIndex = (this.findIndex + 1) % this.findHits.length;
    const target = this.findHits[this.findIndex].node;
    const anc = this.getAncestry(target.id);
    anc.forEach((a) => (a.expanded = true));
    setTimeout(() => {
      const el = document.getElementById(`row-${target.id}`);
      el?.scrollIntoView({ block: 'center' });
      el?.classList.add('hit');
      setTimeout(() => el?.classList.remove('hit'), 800);
    });
  }

  // node access
  allNodes(): AccountNode[] {
    const list: AccountNode[] = [];
    const dfs = (n: AccountNode) => {
      list.push(n);
      n.children?.forEach(dfs);
    };
    this.roots.forEach(dfs);
    return list;
  }
  getNode(id: string) {
    return this.allNodes().find((n) => n.id === id);
  }
  getParents(): AccountNode[] {
    return this.allNodes().filter(
      (n) => n.kind === 'normal' && !!n.canCarryChildren
    );
  }
  getTypesOnly(): AccountNode[] {
    return this.roots;
  }

  // ===== Create button (+) routing =====
  openCreateMenu(nodeId: string) {
    this.createParentId = nodeId;
    const node = this.getNode(nodeId);
    if (!node) {
      this.ui.createOpen = true;
      return;
    }

    if (node.kind === 'type') {
      const t = node.desc.toUpperCase();

      if (t === 'CAPITAL') {
        // mở thẳng Bank/Cash/Deposit
        this.openBankCash(node.id);
        return;
      }
      if (t === 'RETAINED EARNING') {
        this.openRetained(node.id);
        return;
      }
      if (t === 'FIXED ASSETS') {
        this.openFixedAsset(node.id);
        return;
      }
      if (t === 'CURRENT ASSETS') {
        this.createShortMode = 'CA';
        this.ui.createShortOpen = true;
        this.ui.createOpen = false;
        return;
      }
      if (t === 'CURRENT LIABILITIES') {
        this.createShortMode = 'CL';
        this.ui.createShortOpen = true;
        this.ui.createOpen = false;
        return;
      }
      if (t === 'COST OF GOODS SOLD') {
        this.openStock();
        return;
      }
    }

    // default: mở menu đầy đủ
    this.ui.createOpen = true;
    this.ui.createShortOpen = false;
  }

  // ===== New Normal =====
  openNewNormal(parentId?: string) {
    this.ui.newNormalOpen = true;
    this.newNormal = {
      parentId:
        parentId ??
        this.defaultParentFromSelection() ??
        this.roots[0]?.id ??
        null,
      code: '',
      desc: '',
      currency: 'MYR',
      cashflow: 'Operating Activities',
    };
  }
  saveNewNormal() {
    if (!this.newNormal.parentId) {
      alert('Select Parent Account/Type.');
      return;
    }
    const parent = this.getNode(this.newNormal.parentId)!;
    const node: AccountNode = {
      id: this.genId('N'),
      kind: 'normal',
      code: this.newNormal.code.trim(),
      desc: this.newNormal.desc.trim(),
      currency: this.newNormal.currency,
      balance: 0,
      canCarryChildren: true,
      children: [],
    };
    parent.children = parent.children ?? [];
    parent.children.push(node);
    parent.expanded = true;
    this.ui.newNormalOpen = false;
    this.openSuccess(`Create account successfully.`);

  }

  // ===== Fixed Asset pair =====
  onFixedAssetNameChange(name: string) {
    this.fixedAsset.deprDesc = `ACCUM. DEPRN. - ${String(
      name || ''
    ).toUpperCase()}`;
  }
  openFixedAsset(parentId?: string) {
    const faType = this.roots.find((r) => r.desc === 'FIXED ASSETS');
    this.fixedAsset = {
      parentIdAsset: parentId ?? faType?.id ?? null,
      parentIdDepr: parentId ?? faType?.id ?? null,
      assetCode: '',
      assetDesc: '',
      deprCode: '',
      currency: 'MYR',
      cashflow: 'Investing Activities',
      assetDesc2: '',
      deprDesc: '',
      deprDesc2: '',
    };
    this.ui.fixedLinksOpen = false;
    this.ui.fixedAssetOpen = true;
  }
  saveFixedAsset() {
    const pa = this.fixedAsset.parentIdAsset,
      pd = this.fixedAsset.parentIdDepr;
    if (!pa || !pd) {
      alert('Select parents for both accounts.');
      return;
    }
    const parentA = this.getNode(pa)!,
      parentD = this.getNode(pd)!;
    parentA.children = parentA.children ?? [];
    parentD.children = parentD.children ?? [];

    const assetNode: AccountNode = {
      id: this.genId('S'),
      kind: 'special',
      code: this.fixedAsset.assetCode,
      desc: this.fixedAsset.assetDesc,
      specialCode: 'SAD',
      currency: this.fixedAsset.currency,
      canCarryChildren: false,
      balance: 0,
      children: [],
    };
    const deprNode: AccountNode = {
      id: this.genId('S'),
      kind: 'special',
      code: this.fixedAsset.deprCode,
      desc: `ACCUM. DEPRN. - ${this.fixedAsset.assetDesc.toUpperCase()}`,
      specialCode: 'SFA',
      currency: this.fixedAsset.currency,
      canCarryChildren: false,
      balance: 0,
      children: [],
    };
    parentA.children.push(assetNode);
    parentD.children.push(deprNode);
    parentA.expanded = parentD.expanded = true;

    this.fixedLinks.unshift({
      assetId: assetNode.id,
      assetCode: assetNode.code || '',
      assetDesc: assetNode.desc,
      deprId: deprNode.id,
      deprCode: deprNode.code || '',
      deprDesc: deprNode.desc,
    });

    this.ui.fixedAssetOpen = false;
    this.openSuccess(`Create Fixed Asset Account successfully.`);
  }

  // ===== Bank/Cash/Deposit =====
  onBankDescInput(v: string) {
    this.bankCash.desc = v;
    if (this.bankCash.methods.length) {
      const first = this.bankCash.methods[0];
      if (!first.name?.trim()) first.name = v || 'CHEQUE';
      if (!first.paymentBy?.trim()) first.paymentBy = 'CHEQUE';
    }
  }
  openBankCash(
    parentId?: string | null,
    opts?: {
      underType?: 'Current Assets' | 'Current Liabilities';
      lock?: boolean;
    }
  ) {
    this.bankCash = {
      parentId:
        parentId ??
        this.defaultParentFromSelection() ??
        this.roots.find((r) => r.desc === 'CURRENT ASSETS')?.id ??
        null,
      mode: 'Bank',
      underType: opts?.underType ?? 'Current Assets',
      underTypeLocked: !!opts?.lock,
      code: '',
      desc: '',
      currency: 'MYR',
      cashflow: 'Operating Activities',
      odLimit: 0,
      methods: [],
      selectedMethodIndex: 0,
    };

    const defaultMethod: PaymentMethod = {
      name: 'CHEQUE',
      journalType: 'BANK',
      bankChargeAcc: '',
      bankChargeRate: 0,
      paymentBy: 'CHEQUE',
      paymentType: 'Cash',
      requireExtraInfo: true,
      mergeBankCharge: true,
      pvFormat: this.docPvOptions[0],
      orFormat: this.docOrOptions[0],
    };
    this.bankCash.methods.push(defaultMethod);

    this.ui.bankCashOpen = true;
  }

  closeBankCash() {
    this.ui.bankCashOpen = false;
    this.bankCash.underTypeLocked = false;
  }

  chooseCreate(action: 'debtor' | 'creditor' | 'bankcash') {
    const parentId =
      this.createParentId ?? this.defaultParentFromSelection() ?? null;

    if (this.createMode === 'CA') {
      if (action === 'debtor') {
        this.openDebtorCtrl();
        if (parentId) this.debtorCtrl.parentId = parentId;
      } else {
        // Bank/Cash/Deposit cho CURRENT ASSETS & Readonly UnderType
        this.openBankCash(parentId, {
          underType: 'Current Assets',
          lock: true,
        });
      }
    }

    if (this.createMode === 'CL') {
      if (action === 'creditor') {
        this.openCreditorCtrl();
        if (parentId) this.creditorCtrl.parentId = parentId;
      } else {
        // Bank/Cash/Deposit cho CURRENT LIABILITIES & Readonly UnderType
        this.openBankCash(parentId, {
          underType: 'Current Liabilities',
          lock: true,
        });
      }
    }

    this.ui.createOpen = false;
  }

  addPaymentMethod() {
    const m: PaymentMethod = {
      name: '',
      journalType: 'BANK',
      bankChargeAcc: '',
      bankChargeRate: 0,
      paymentBy: '',
      paymentType: 'Cash',
      requireExtraInfo: true,
      mergeBankCharge: true,
      pvFormat: this.docPvOptions[0],
      orFormat: this.docOrOptions[0],
    };
    this.bankCash.methods.push(m);
    this.bankCash.selectedMethodIndex = this.bankCash.methods.length - 1;
  }
  removePaymentMethod(i: number) {
    this.bankCash.methods.splice(i, 1);
    if (this.bankCash.selectedMethodIndex != null) {
      if (this.bankCash.selectedMethodIndex >= this.bankCash.methods.length) {
        this.bankCash.selectedMethodIndex = this.bankCash.methods.length - 1;
      }
      if (this.bankCash.methods.length === 0)
        this.bankCash.selectedMethodIndex = null;
    }
  }
  selectMethod(i: number) {
    this.bankCash.selectedMethodIndex = i;
  }
  selectedMethod(): PaymentMethod | null {
    const i = this.bankCash.selectedMethodIndex;
    return i == null ? null : this.bankCash.methods[i];
  }

  saveBankCash() {
    if (!this.bankCash.parentId) {
      alert('Select parent type.');
      return;
    }
    const parent = this.getNode(this.bankCash.parentId)!;

    const specialMap: Record<'Bank' | 'Cash' | 'Deposit', string> = {
      Bank: 'SCK',
      Cash: 'SCH',
      Deposit: 'SCS',
    };
    parent.children = parent.children ?? [];
    parent.children.push({
      id: this.genId('S'),
      kind: 'special',
      code: this.bankCash.code,
      desc: this.bankCash.desc,
      specialCode: specialMap[this.bankCash.mode],
      currency: this.bankCash.currency,
      balance: 0,
      canCarryChildren: false,
      children: [],
    });
    parent.expanded = true;
    this.ui.bankCashOpen = false;
    this.openSuccess(`Create Bank Account successfully.`);
  }

  // ===== Debtor / Creditor Control =====
  openDebtorCtrl() {
    this.debtorCtrl = {
      parentId: this.roots.find((r) => r.desc === 'CURRENT ASSETS')?.id ?? null,
      code: '',
      currency: 'MYR',
      cashflow: 'Operating Activities',
      desc: '',
      desc2: '',
    };
    this.debtorAccNoDup = false;
    this.ui.debtorCtrlOpen = true;
  }

  saveDebtorCtrl() {
    const code = (this.debtorCtrl.code || '').trim();
    const patternOk = /^\d{3}-\d{4}$/.test(code);
    const dup = this.codeExistsUnder(this.debtorCtrl.parentId, code);

    if (!code || !patternOk || dup) return;
    if (!this.debtorCtrl.parentId || !this.debtorCtrl.code.trim()) return;
    const p = this.getNode(this.debtorCtrl.parentId)!;
    p.children = p.children ?? [];
    p.children.push({
      id: this.genId('S'),
      kind: 'special',
      code: this.debtorCtrl.code.trim(),
      desc:
        this.debtorCtrl.desc +
        (this.debtorCtrl.desc2 ? ' ' + this.debtorCtrl.desc2 : ''),
      specialCode: 'SDC',
      currency: this.debtorCtrl.currency,
      balance: 0,
      canCarryChildren: false,
      children: [],
    });
    p.expanded = true;
    this.ui.debtorCtrlOpen = false;
    this.openSuccess(`Create Debtor Control successfully.`);
  }
  debtorAccNoDup = false;

  private codeExistsUnder(
    parentId: string | null | undefined,
    code: string
  ): boolean {
    if (!code) return false;
    const parent = parentId ? this.getNode(parentId) : null;
    const siblings = parent?.children ?? [];
    return siblings.some(
      (n) => (n.code || '').toUpperCase() === code.toUpperCase()
    );
  }

  validateDebtorAccNo(code: string) {
    this.debtorAccNoDup = this.codeExistsUnder(this.debtorCtrl.parentId, code);
  }
  validateNewNormalAccNo(code: string) {
    this.newNormalAccNoDup = this.codeExistsUnder(
      this.newNormal.parentId,
      code
    );
  }

  // Fixed Asset – Asset
  validateFaAssetAccNo(code: string) {
    this.faAssetAccNoDup = this.codeExistsUnder(
      this.fixedAsset.parentIdAsset,
      code
    );
  }

  // Fixed Asset – Depr
  validateFaDeprAccNo(code: string) {
    this.faDeprAccNoDup = this.codeExistsUnder(
      this.fixedAsset.parentIdDepr,
      code
    );
  }

  // Bank / Cash / Deposit
  validateBankAccNo(code: string) {
    this.bankAccNoDup = this.codeExistsUnder(this.bankCash.parentId, code);
  }
  openCreditorCtrl() {
    const cl = this.roots.find((r) => r.desc === 'CURRENT LIABILITIES');
    this.creditorCtrl = {
      parentId: cl?.id ?? null,
      code: '',
      currency: 'MYR',
      cashflow: 'Operating Activities',
      desc: '',
      desc2: '',
    };
    this.creditorAccNoDup = false;
    this.ui.creditorCtrlOpen = true;
  }
  validateCreditorAccNo(v: string) {
    const code = (v || '').trim();
    // ví dụ: trùng trong nhóm CURRENT LIABILITIES
    this.creditorAccNoDup = this.allNodes().some((n) => {
      const anc = this.getAncestry(n.id)[0]?.desc?.toUpperCase();
      return n.code === code && anc === 'CURRENT LIABILITIES';
    });
  }
  saveCreditorCtrl() {
    if (
      !this.creditorCtrl.parentId ||
      !this.creditorCtrl.code ||
      this.creditorAccNoDup
    )
      return;

    const p = this.getNode(this.creditorCtrl.parentId);
    if (!p) return;

    p.children = p.children ?? [];
    p.children.push({
      id: this.genId('S'),
      kind: 'special',
      code: this.creditorCtrl.code,
      desc: this.creditorCtrl.desc,
      specialCode: 'SCL', // creditor control
      currency: this.creditorCtrl.currency,
      balance: 0,
      canCarryChildren: false,
      children: [],
    });
    p.expanded = true;
    this.ui.creditorCtrlOpen = false;
    this.openSuccess(`Create Creditor Control successfully.`);
  }

  // ===== Stock =====
  openStock() {
    // đảm bảo có 2 root cần thiết
    if (!this.roots.find((r) => r.desc === 'COST OF GOODS SOLD')) {
      this.roots.push({
        id: 'T-COGS',
        kind: 'type',
        desc: 'COST OF GOODS SOLD',
        expanded: true,
        children: [],
      });
    }
    if (!this.roots.find((r) => r.desc === 'CURRENT ASSETS')) {
      this.roots.push({
        id: 'T-CA',
        kind: 'type',
        desc: 'CURRENT ASSETS',
        expanded: true,
        children: [],
      });
    }

    const cogs =
      this.roots.find((r) => r.desc === 'COST OF GOODS SOLD')?.id ?? null;
    const ca = this.roots.find((r) => r.desc === 'CURRENT ASSETS')?.id ?? null;

    this.stock.open.parentId = cogs;
    this.stock.close.parentId = cogs;
    this.stock.balance.parentId = ca;

    // reset mặc định nhẹ nhàng
    this.stock.open.code = '';
    this.stock.open.desc = '';
    this.stock.open.desc2 = '';

    this.stock.close.code = '';
    this.stock.close.desc = '';
    this.stock.close.desc2 = '';

    this.stock.balance.code = '';
    this.stock.balance.desc = '';
    this.stock.balance.desc2 = '';

    this.ui.stockOpen = true;
  }
  saveStock() {
    // validate 3 account no.
    const errOpen = this.accError(this.stock.open.code);
    const errClose = this.accError(this.stock.close.code);
    const errBal = this.accError(this.stock.balance.code);
    if (errOpen || errClose || errBal) {
      const msg = errOpen || errClose || errBal;
      alert(msg);
      return;
    }

    // Chuẩn hóa code
    this.stock.open.code = this.normalizeAcc(this.stock.open.code);
    this.stock.close.code = this.normalizeAcc(this.stock.close.code);
    this.stock.balance.code = this.normalizeAcc(this.stock.balance.code);

    const add = (
      parentId: string | null,
      code: string,
      desc: string,
      currency: string,
      special: string
    ) => {
      if (!parentId) return;
      const p = this.getNode(parentId)!;
      p.children = p.children ?? [];
      p.children.push({
        id: this.genId('S'),
        kind: 'special',
        code,
        desc,
        specialCode: special,
        currency,
        children: [],
      });
      p.expanded = true;
    };

    add(
      this.stock.open.parentId,
      this.stock.open.code,
      this.stock.open.desc,
      this.stock.open.currency,
      'SOS'
    );
    add(
      this.stock.close.parentId,
      this.stock.close.code,
      this.stock.close.desc,
      this.stock.close.currency,
      'SCS'
    );
    add(
      this.stock.balance.parentId,
      this.stock.balance.code,
      this.stock.balance.desc,
      this.stock.balance.currency,
      'SCS'
    );

    this.ui.stockOpen = false;
    this.openSuccess(`Create Stock Control successfully.`);
  }
  retainedAccNoDup = false;
  // ===== Retained Earning =====
  openRetained(parentId?: string) {
    const reType = this.roots.find((r) => r.desc === 'RETAINED EARNING');
    this.retained = {
      parentId: parentId ?? reType?.id ?? null,
      code: '',
      desc: '',
      desc2: '',
      currency: 'MYR',
      cashflow: 'Operating Activities',
    };
    this.retainedAccNoDup = false;
    this.ui.retainedOpen = true;
  }
  saveRetained() {
    const code = this.normalizeAcc(this.retained.code);
    if (
      !this.ACC_NO_RE.test(code) || // ⬅️ dùng RegExp đúng kiểu
      this.retainedAccNoDup ||
      !this.retained.parentId
    ) {
      return;
    }

    // Bảo đảm chỉ có 1 SRE
    for (const n of this.allNodes())
      if (n.specialCode === 'SRE') n.specialCode = undefined;

    const p = this.getNode(this.retained.parentId)!;
    p.children = p.children ?? [];
    p.children.push({
      id: this.genId('S'),
      kind: 'special',
      code,
      desc: this.retained.desc,
      specialCode: 'SRE',
      currency: this.retained.currency,
      balance: 0,
      canCarryChildren: false,
      children: [],
    });
    p.expanded = true;
    this.ui.retainedOpen = false;
    this.openSuccess(`Create Retained Earning successfully.`);
  }

  // ===== Edit / Delete =====
  openEdit(node: AccountNode) {
    this.edit = {
      nodeId: node.id,
      parentId: this.findParentId(node.id),
      code: node.code ?? '',
      desc: node.desc,
      currency: node.currency ?? 'MYR',
    };
    // lock Parent nếu có balance > 0 hoặc có children
    const hasChild = !!(node.children && node.children.length);
    const hasBal = !!(node.balance && node.balance !== 0);
    this.editLockParent = hasChild || hasBal;
    this.editLockReason = this.editLockParent
      ? 'Cannot change parent when account has children or non-zero balance.'
      : '';
    this.ui.editOpen = true;
  }
  saveEdit() {
    const n = this.getNode(this.edit.nodeId)!;
    n.code = this.edit.code;
    n.desc = this.edit.desc;
    n.currency = this.edit.currency;
    const currentParent = this.findParentId(n.id);
    if (
      this.edit.parentId &&
      this.edit.parentId !== currentParent &&
      !this.editLockParent
    ) {
      this.moveNode(n.id, this.edit.parentId);
    }
    this.ui.editOpen = false;
    this.openSuccess(`Edit Account successfully.`);
  }

  canDelete(node: AccountNode): boolean {
    const hasChild = !!(node.children && node.children.length);
    const hasBal = !!(node.balance && node.balance !== 0);
    return !hasChild && !hasBal && !node.hasTxn && node.kind !== 'type';
  }

  // confirm delete popup
  confirmNode: AccountNode | null = null;
  confirmCanDelete = false;
  confirmReason = '';
  askDelete(node: AccountNode) {
    this.confirmNode = node;
    this.confirmCanDelete = this.canDelete(node);
    this.confirmReason = this.confirmCanDelete
      ? ''
      : 'Account has children, balance or transactions.';
    this.ui.confirmDeleteOpen = true;
  }
  closeConfirm() {
    this.ui.confirmDeleteOpen = false;
    this.confirmNode = null;
  }
  confirmDelete() {
    if (!this.confirmNode) return;
    const node = this.confirmNode;
    const removeFrom = (arr: AccountNode[]) => {
      const idx = arr.findIndex((x) => x.id === node.id);
      if (idx >= 0) {
        arr.splice(idx, 1);
        return true;
      }
      for (const x of arr)
        if (x.children && removeFrom(x.children)) return true;
      return false;
    };
    removeFrom(this.roots);
    this.closeConfirm();
  }

  // ===== Fixed Asset Links =====
  fixedLinks: FixedLinkRow[] = [];
  // === Missing helpers wired from the template ===
  openFixedLinks() {
    this.ui.fixedLinksOpen = true;
  }

  
  // ===== toolbar (xero-like) =====
  import() {
    // TODO: wire to real import flow
    alert('Import: TODO');
  }

  export() {
    // TODO: wire to real export flow
    alert('Export: TODO');
  }

print() {
    // tùy bạn sau này muốn in “Chart of Account” như thế nào
    // tạm thời gọi print của trình duyệt
    if (typeof window !== 'undefined' && 'print' in window) window.print();
  }

  drill(node: AccountNode) {
    // hook để “drill down” số dư (mở sổ chi tiết…)
    // Hiện để log tạm – tránh lỗi compile
    console.log('Drill:', node.code, node.desc);
  }

  deleteFixedLink(row: FixedLinkRow) {
    this.fixedLinks = this.fixedLinks.filter(
      (r) => !(r.assetId === row.assetId && r.deprId === row.deprId)
    );
  }

  addFixedFromLinks() {
    // Từ màn Fixed Links bấm Add -> mở form tạo cặp Fixed Asset
    this.ui.fixedLinksOpen = false;
    this.openFixedAsset();
  }
  // Popup chọn loại tạo khi bấm dấu +
  createMode: 'CA' | 'CL' | null = null; // CA = Current Assets, CL = Current Liabilities
  handlePlus(node: AccountNode) {
    // Lấy root type (CAPITAL / RETAINED EARNING / FIXED ASSETS / CURRENT ASSETS / CURRENT LIABILITIES / COST OF GOODS SOLD)
    const ancestry = this.getAncestry(node.id);
    const root = ancestry.length ? ancestry[0] : node;
    const rootDesc = (root.desc || '').toUpperCase();

    // Mặc định: thêm dưới chính dòng đang bấm
    const parentId = node.id;

    switch (rootDesc) {
      // CAPITAL: mở Bank/Cash/Deposit
      case 'CAPITAL': {
        this.openBankCash(parentId);
        break;
      }

      // RETAINED EARNING: mở Retained Earning
      case 'RETAINED EARNING': {
        // parentId đã được set sẵn trong openRetained()
        this.openRetained();
        break;
      }

      // FIXED ASSETS: mở tạo cặp Fixed Asset + Accum Deprn
      case 'FIXED ASSETS': {
        this.openFixedAsset();
        // nếu bạn muốn preselect parent theo dòng đang bấm:
        if (this.fixedAsset && 'parentId' in this.fixedAsset) {
          this.fixedAsset.parentId = parentId;
        }
        break;
      }

      // CURRENT ASSETS: popup 2 lựa chọn (Debtor Control / Bank-Cash-Deposit)
      case 'CURRENT ASSETS': {
        this.createParentId = parentId;
        this.createMode = 'CA'; // chỉ 2 nút: Debtor Control + Bank/Cash/Deposit
        this.ui.createOpen = true;
        break;
      }
      case 'CURRENT LIABILITIES': {
        this.createParentId = parentId;
        this.createMode = 'CL'; // chỉ 2 nút: Creditor Control + Bank/Cash/Deposit
        this.ui.createOpen = true;
        break;
      }

      // COST OF GOODS SOLD: mở tạo Stock (Open/Close/Balance)
      case 'COST OF GOODS SOLD': {
        this.openStock();
        break;
      }

      // các loại khác thì cho tạo Normal account
      default: {
        this.openNewNormal(parentId);
        break;
      }
    }
  }
  onToggleClick(e: Event, node: AccountNode) {
    e.preventDefault();
    e.stopPropagation();
    this.toggle(node);
  }
  onToggle(node: AccountNode, ev: MouseEvent) {
    // chặn click “lọt” ra hàng, và chặn hành vi mặc định
    ev.stopPropagation();
    ev.preventDefault();

    // nhớ vị trí cuộn hiện tại
    const x = window.pageXOffset || document.documentElement.scrollLeft || 0;
    const y = window.pageYOffset || document.documentElement.scrollTop || 0;

    node.expanded = !node.expanded;

    // đợi render xong rồi trả scroll về đúng chỗ
    requestAnimationFrame(() => window.scrollTo(x, y));
    // (có thể dùng setTimeout(()=>...,0) cũng được)
  }
  validateRetainedAccNo(val: string) {
    // kiểm tra trùng dưới parent hiện chọn
    this.retainedAccNoDup = false;
    const pid =
      this.retained.parentId ||
      this.roots.find((r) => r.desc === 'RETAINED EARNING')?.id ||
      null;
    if (!pid || !val) return;

    const parent = this.getNode(pid);
    const exists = !!parent?.children?.some(
      (c) => (c.code || '').toUpperCase() === val.toUpperCase()
    );
    this.retainedAccNoDup = exists;
  }
  pendingFixedLink: FixedLinkRow | null = null;
  askDeleteFixed(row: FixedLinkRow) {
    this.pendingFixedLink = row;
    this.ui.confirmFixedLinkOpen = true;
  }

  closeConfirmFixed() {
    this.ui.confirmFixedLinkOpen = false;
    this.pendingFixedLink = null;
  }

  confirmDeleteFixed() {
    if (!this.pendingFixedLink) return;
    // tái dùng hàm xóa đã có
    this.deleteFixedLink(this.pendingFixedLink);
    this.closeConfirmFixed();
  }
  pendingMethodIndex: number | null = null;
  askRemoveMethod(i: number) {
    this.pendingMethodIndex = i;
    this.ui.confirmRemoveMethodOpen = true;
  }

  closeConfirmRemoveMethod() {
    this.ui.confirmRemoveMethodOpen = false;
    this.pendingMethodIndex = null;
  }

  confirmRemoveMethod() {
    if (this.pendingMethodIndex === null) return;
    this.removePaymentMethod(this.pendingMethodIndex);
    this.closeConfirmRemoveMethod();
  }
  private removeNodeById(id: string): boolean {
  const removeFrom = (arr: AccountNode[]): boolean => {
    const idx = arr.findIndex((x) => x.id === id);
    if (idx >= 0) { arr.splice(idx, 1); return true; }
    for (const a of arr) {
      if (a.children?.length && removeFrom(a.children)) return true;
    }
    return false;
  };
  return removeFrom(this.roots);
}

confirmBulkDelete() {
  if (!this.bulkDeleteNodes?.length) return;
  const ids = this.bulkDeleteNodes.map((n) => n.id);
  for (const id of ids) this.removeNodeById(id);

  this.ui.confirmBulkDeleteOpen = false;
  this.bulkDeleteNodes = [];
  this.clearSelection();
  this.rebuildFlat();
  this.openSuccess(`Deleted account successfully.`);
}
private rebuildFlat() {
  // ép Angular refresh lại list sau khi mutate tree (hữu ích nếu bạn đang dùng OnPush / table render)
  this.roots = [...this.roots];
}
amountClass(v?: number) {
  const n = Number(v ?? 0);
  return n < 0 ? 'amt-neg' : n > 0 ? 'amt-pos' : 'amt-zero';
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
}