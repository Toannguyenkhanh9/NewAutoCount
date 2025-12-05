import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AmountInputDirective } from '../../../_share/directives';
import { DebtorRow } from '../../../_share/models/ar';

type FormMode = 'new' | 'edit' | 'view';
interface PriceRow {
  date: string;
  item: string;
  uom: string;
  qty: number;
  price: number;
  docNo: string;
}

export interface Branch {
  code: string;
  name: string;
  address?: string;
  postCode?: string;
  attention?: string;
  phone1?: string;
  phone2?: string;
  fax1?: string;
  fax2?: string;
  agent?: string; // code
  area?: string; // code
  email?: string;
}

@Component({
  selector: 'app-debtor-maintenance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AmountInputDirective,
  ],
  templateUrl: './debtor-maintenance.component.html',
  styleUrls: ['./debtor-maintenance.component.scss'],
})
export class DebtorMaintenanceComponent implements OnInit {
  @ViewChild('generalPane') generalPane?: ElementRef<HTMLDivElement>;
  paneMinHeight = 0;
  q = '';
  private computePaneMinHeight() {
    const el = this.generalPane?.nativeElement;
    if (!el) return;
    // scrollHeight cho chiều cao thực nội dung
    const h = el.scrollHeight;
    // Giới hạn theo viewport để không vượt quá modal
    const max = Math.floor(window.innerHeight * 0.62); // tỉ lệ phần body trong panel
    this.paneMinHeight = Math.min(h, max);
    this.cdr.detectChanges();
  }
  // ===== Grid mock =====
  rows: DebtorRow[] = [
    {
      debtorAccount: '300-N00A',
      companyName: 'Normal Debtor A',
      type: '123456789',
      phone: '012-3456789',
      currency: 'MYR',
      creditTerm: '30D',
      creditLimit: 10000,
      active: true,
      groupCompany: true,
      registrationNo: '',
      billAddress: '',
      fax: '',
      email: '',
      website: '',
      postCode: '',
      deliveryAddress: '',
      deliveryPostCode: '',
      customerTin :'A12563311'
    },
    {
      debtorAccount: '300-GABB',
      companyName: 'General Trading Berhad',
      type: '12354863',
      phone: '03-2222222',
      currency: 'USD',
      creditTerm: '30D',
      creditLimit: 0,
      active: true,
      groupCompany: true,
      registrationNo: '',
      billAddress: '',
      fax: '',
      email: '',
      website: '',
      postCode: '',
      deliveryAddress: '',
      deliveryPostCode: '',
      customerTin :'B1234442'
    },
  ];
  filteredRows(): DebtorRow[] {
    const k = (this.q || '').trim().toLowerCase();
    if (!k) return this.rows;
    return this.rows.filter(
      (r) =>
        r.debtorAccount.toLowerCase().includes(k) ||
        r.companyName.toLowerCase().includes(k) ||
        r.type.toLowerCase().includes(k) ||
        r.phone.toLowerCase().includes(k)
    );
  }
  selected: DebtorRow | null = null;
  showDeleteDebtorConfirm = false;
  sortKey: keyof DebtorRow = 'debtorAccount';
  sortAsc = true;

  page = 1;
  pageSize = 10;
  get filtered(): DebtorRow[] {
    const out = [...this.rows].sort((a, b) => {
      const va = String(a[this.sortKey] ?? '').toUpperCase();
      const vb = String(b[this.sortKey] ?? '').toUpperCase();
      return this.sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return out;
  }
  get totalPages() {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }
  get paged(): DebtorRow[] {
    const s = (this.page - 1) * this.pageSize;
    return this.filtered.slice(s, s + this.pageSize);
  }
  setSort(k: keyof DebtorRow) {
    if (this.sortKey === k) this.sortAsc = !this.sortAsc;
    else {
      this.sortKey = k;
      this.sortAsc = true;
    }
  }
  select(r: DebtorRow) {
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

  refresh() {
    /* mock */
  }
  private initBranchForm() {
    this.branchForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      address: [''],
      postCode: [''],
      attention: [''],
      phone1: [''],
      phone2: [''],
      fax1: [''],
      fax2: [''],
      agent: [''],
      area: [''],
      email: ['', Validators.email],
    });
  }

  // ===== dialogs/toggles =====
  showFind = false;
  showPrice = false;
  showPrint = false;
  showPrintPreview = false;
  showDetail = false;

  // ===== Forms (khởi tạo trong constructor) =====
  findForm!: FormGroup;
  printForm!: FormGroup;
  debtorForm!: FormGroup;
  creditForm!: FormGroup;
  contactForm!: FormGroup;
  branchForm!: FormGroup;

  // ===== Data sources (mock) =====
  controlAccounts = [{ code: '300-0000', name: '' }];
  debtorTypes = [
    { code: 'LOCAL', name: 'LOCAL USER' },
    { code: 'TRADER', name: 'TRADER AND REDISTRIBUTOR' },
    { code: 'EXPORT', name: 'EXPORTER' },
  ];
  areas = [
    { code: 'CENTRAL', name: 'Central' },
    { code: 'SOUTH', name: 'South' },
  ];
  agents = [
    { code: 'ALICE', name: 'Alice' },
    { code: 'BOB', name: 'Bob' },
  ];
  currencies = [{ code: 'MYR' }, { code: 'USD' }];
  creditTerms = [
    { code: '30D', name: '30 Days' },
    { code: 'COD', name: 'Cash on Delivery' },
  ];
  taxTypes = [
    { code: 'GST6', name: 'GST 6%' },
    { code: 'ZRL', name: 'Zero Rated' },
  ];
  priceCategories = [
    { code: 'STD', name: 'Standard' },
    { code: 'VIP', name: 'VIP' },
  ];
  accountGroups = [
    { code: 'AG01', name: 'Retail' },
    { code: 'AG02', name: 'Wholesale' },
  ];

  // Contacts / Branches / Links
  contacts: any[] = [];
  selectedContact: any | null = null;
  branches: any[] = [];
  selectedBranch: any | null = null;
  externalLinks: string[] = [];
  selectedLink: string | null = null;

  // Price history rows (mock)
  priceRows: PriceRow[] = [
    {
      date: '2025-01-10',
      item: 'ITEM-001',
      uom: 'PCS',
      qty: 10,
      price: 12.5,
      docNo: 'INV-250110-001',
    },
    {
      date: '2025-02-05',
      item: 'ITEM-002',
      uom: 'PCS',
      qty: 5,
      price: 99.0,
      docNo: 'INV-250205-013',
    },
  ];

  // ===== form modal =====
  showForm = false;
  formMode: FormMode = 'new';
  tab: 'general' | 'contact' | 'branches' | 'others' | 'note' = 'general';
  ngOnInit() {
    this.setupCreditControlReactions();
    this.initBranchForm();
  }
  setupCreditControlReactions() {
    const modeCtrl = this.creditForm.get('mode');
    modeCtrl?.valueChanges.subscribe(() => this.applyCreditMode());
    this.applyCreditMode(); // chạy lần đầu
  }

  private applyCreditMode() {
    const mode = this.creditForm.get('mode')?.value as
      | 'DISABLED'
      | 'BY_TERM'
      | 'SUSPEND';

    const ec = this.creditForm.get('exceedCreditAction')!;
    const eo = this.creditForm.get('exceedOverdueAction')!;
    const sr = this.creditForm.get('suspendReason')!;

    if (mode === 'BY_TERM') {
      ec.enable({ emitEvent: false });
      eo.enable({ emitEvent: false });
      sr.disable({ emitEvent: false });
    } else if (mode === 'SUSPEND') {
      ec.disable({ emitEvent: false });
      eo.disable({ emitEvent: false });
      sr.enable({ emitEvent: false });
    } else {
      // DISABLED
      ec.disable({ emitEvent: false });
      eo.disable({ emitEvent: false });
      sr.disable({ emitEvent: false });
    }
  }

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) {
    // Khởi tạo form TẠI ĐÂY để tránh lỗi "fb used before initialization"
    this.findForm = this.fb.group({
      keyword: [''],
      area: [''],
      agent: [''],
      active: ['all'],
    });

    this.printForm = this.fb.group({
      active: ['all'],
      area: [''],
      agent: [''],
      currency: [''],
      sort: ['code'],
    });

    this.debtorForm = this.fb.group({
      controlAccount: ['300-0000'],
      type: ['', Validators.required], // validate Debtor Type
      groupCompany: [false],
      name: ['', Validators.required], // Company Name
      registrationNo: [''],
      code: ['', Validators.required], // Debtor Account
      active: [true],

      billAddress: ['', Validators.required],
      phone: ['', Validators.required],
      fax: ['', Validators.required],
      postCode: ['', Validators.required],
      deliveryAddress: [''],
      deliveryPostCode: [''],
      email: [''],
      website: [''],
      currency: [''],
      creditTerm: [''],
      actualTerm: this.fb.control<number | null>(null), // NEW
      includeContactInfo: [false],

      taxExemptionNo: [''],
      taxExemptionExpiry: [null], // string | null, dạng 'YYYY-MM-DDTHH:mm'
      priceCategory: [''],
      accountGroup: [''],
      note: [''],
      individualId: ['', Validators.required],
      tinNo: ['', Validators.required],
      sstRegNo: [''],
    });
    this.contactForm = this.fb.group({
      name: [''],
      department: [''],
      title: [''],
      directPhone: [''],
      directFax: [''],
      mobile: [''],
      email: [''],
      im: [''],
      include: [true],
    });

    this.creditForm = this.fb.group({
      creditLimit: [0],
      overdueLimit: [0],
      scope: ['ALL'], // ALL | BYDOC
      mode: ['DISABLED'], // DISABLED | BY_TERM | SUSPEND
      exceedCreditAction: ['ALLOW'], // ALLOW | BLOCK | NEEDPWD
      exceedOverdueAction: ['ALLOW'], // ALLOW | BLOCK | NEEDPWD
      suspendReason: [''],
    });
  }

  showContactEditor = false;
  contactEditIndex = -1;
  // Preview dòng “Contact info displayed in report”
  contactInfoPreview = '';
  closeContactEditor() {
    this.showContactEditor = false;
  }
  private refreshContactInfoPreview() {
    const parts: string[] = [];
    const included = this.contacts.filter((c) => c.include);
    included.forEach((c) => {
      const tel = c.directPhone || c.mobile;
      const p: string[] = [];
      p.push(`Contact: ${c.name}`);
      if (tel) p.push(`Tel: ${tel}`);
      if (c.email) p.push(`Email: ${c.email}`);
      parts.push(p.join(', '));
    });
    this.contactInfoPreview = parts.join('  |  ');
  }

  // ===== Toolbar actions =====
  openFind() {
    this.showFind = true;
  }
  openPrint() {
    this.showPrint = true;
  }
  openPriceHistory() {
    this.showPrice = true;
  }
  openDetail() {
    if (!this.selected) return;
    this.showDetail = true;
  }

  runFind() {
    const k = (this.findForm.value.keyword || '')
      .toString()
      .trim()
      .toLowerCase();
    this.findResults = this.rows.filter((r) =>
      (r.debtorAccount + ' ' + r.companyName + ' ').toLowerCase().includes(k)
    );
  }
  findResults: DebtorRow[] = [];
  pickFromFind(r: DebtorRow) {
    this.selected = r;
    this.showFind = false;
  }

  buildListing() {
    const f = this.printForm.value;
    let list = [...this.rows];
    if (f.active === 'active') list = list.filter((x) => x.active);
    if (f.active === 'inactive') list = list.filter((x) => !x.active);
    if (f.currency) list = list.filter((x) => x.currency === f.currency);
    return list;
  }
  printNow() {
    window.print();
  }

  // ===== Modal: New/Edit/View =====
  newDebtor() {
    this.formMode = 'new';
    this.debtorForm.reset({
      controlAccount: '300-0000',
      type: 'LOCAL',
      groupCompany: false,
      name: '',
      registrationNo: '',
      code: '',
      active: false,
      statementType: 'OpenItem',
      agingOn: 'InvoiceDate',
      creditTerm: '30D',
      currency: 'MYR',
      gstType: 'GST6',
    });
    this.debtorForm.enable({ emitEvent: false });
    this.tab = 'general';
    this.showForm = true;
    setTimeout(() => this.computePaneMinHeight(), 0);
  }
  editDebtor() {
    if (!this.selected) return;
    this.formMode = 'edit';
    this.debtorForm.reset({
      controlAccount: '300-0000',
      type: this.selected.type,
      groupCompany: this.selected.groupCompany,
      name: this.selected.companyName,
      registrationNo: '',
      code: this.selected.debtorAccount,
      active: this.selected.active,
      currency: this.selected.currency,
      statementType: 'OpenItem',
      agingOn: 'InvoiceDate',
      creditTerm: this.selected.creditTerm,
      billAddress: '17 KKLL Kula',
      phone: '09352556532',
      fax: '34234243143',
      postCode: '700000',
      deliveryAddress: '345 KLCC',
      deliveryPostCode: '40000',
      email: 'mycompany@gmail.com',
    });
    this.debtorForm.enable({ emitEvent: false });
    this.tab = 'general';
    this.showForm = true;
    setTimeout(() => this.computePaneMinHeight(), 0);
  }
  viewDebtor() {
    if (!this.selected) return;
    this.formMode = 'view';
    this.debtorForm.reset({
      controlAccount: '300-0000',
      type: this.selected.type,
      groupCompany: this.selected.groupCompany,
      name: this.selected.companyName,
      registrationNo: '',
      code: this.selected.debtorAccount,
      active: this.selected.active,
      currency: this.selected.currency,
      statementType: 'OpenItem',
      agingOn: 'InvoiceDate',
      creditTerm: this.selected.creditTerm,
    });
    this.debtorForm.enable({ emitEvent: false });
    this.tab = 'general';
    this.showForm = true;
    setTimeout(() => this.computePaneMinHeight(), 0);
  }
  deleteDebtor() {
    if (!this.selected) return;
    this.rows = this.rows.filter((r) => r !== this.selected);
    this.selected = null;
    this.closeDeleteDebtorConfirm();
    this.openSuccess(`Debtor is deleted successfully.`);
  }

  autoGenerateCode() {
    if (this.formMode !== 'new') return;
    const name = (this.debtorForm.value.name || '').toString().trim();
    const init = name
      ? name
          .replace(/[^A-Za-z0-9]/g, '')
          .slice(0, 3)
          .toUpperCase()
      : 'N';
    const code = `300-${init}${Math.floor(1000 + Math.random() * 9000)}`;
    this.debtorForm.patchValue({ code });
  }

  saveDebtor() {
    if (this.debtorForm.invalid) {
      this.debtorForm.markAllAsTouched();
      alert(
        'Please fill required fields: Debtor Type, Company Name and Debtor Account.'
      );
      return;
    }
    const v = this.debtorForm.getRawValue();
    if (!v.code || !String(v.code).trim()) {
      // tự phát sinh tạm một mã — hoặc gọi hàm autoGenerateCode() của bạn
      const tmp = 'D' + Math.random().toString(36).slice(2, 8).toUpperCase();
      this.debtorForm.patchValue({ code: tmp });
    }
    // gửi payload gồm tinNo, sstRegNo
 const payload = {
    debtorAccount: v.code,            // NEW: map Debtor Code
    companyName: v.name,
    registrationNo: v.registrationNo,
    individualId: v.individualId,
    tinNo: v.tinNo,
    sstRegNo: v.sstRegNo,
    currency: v.currency,
    billAddress: v.billAddress,
    phone: v.phone,
    fax: v.fax,
    postCode: v.postCode,
    deliveryAddress: v.deliveryAddress,
    deliveryPostCode: v.deliveryPostCode,
    email: v.email,
    website: v.website,
    creditTerm: v.creditTerm,
    actualTerm: v.actualTerm,
    taxExemptionNo: v.taxExemptionNo,
    taxExemptionExpiry: v.taxExemptionExpiry,
    active: true
  };
    if (this.formMode === 'new') {
      // this.rows = [
      //   {
      //     debtorAccount: v.code!,
      //     companyName: v.name!,
      //     type: v.type!,
      //     phone: v.phone || '',
      //     currency: v.currency || 'MYR',
      //     creditTerm: v.creditTerm || '',
      //     creditLimit: 0,
      //     active: !!v.active,
      //     remark: v.note || '',
      //     groupCompany: !!v.groupCompany,
      //     contactName: '',
      //     department: '',
      //     title: '',
      //     directPhone: '',
      //     directFax: '',
      //     mobile: '',
      //     email: '',
      //     im: '',
      //     include: true,
      //   },
      //   ...this.rows,
      // ];
    } else if (this.formMode === 'edit' && this.selected) {
      Object.assign(this.selected, {
        name: v.name!,
        type: v.type!,
        phone: v.phone || '',
        area: v.area || '',
        agent: v.agent || '',
        currency: v.currency || 'MYR',
        creditTerm: v.creditTerm || '',
        active: !!v.active,
        groupCompany: !!v.groupCompany,
      });
    }
    this.showForm = false;
  }

  // Contacts
  addContact() {
    this.contacts.push({
      name: '',
      department: '',
      title: '',
      directPhone: '',
      mobile: '',
      email: '',
      im: '',
    });
  }
  editContact() {
    /* mock */
  }
  removeContact() {
    if (!this.selectedContact) return;
    const name = this.selectedContact.name || 'this contact';
    if (!confirm(`Delete contact "${name}"?`)) return;

    this.contacts = this.contacts.filter((x) => x !== this.selectedContact);
    this.selectedContact = undefined;
    this.refreshContactInfoPreview();
  }
  generateContactInfo() {
    const included = this.contacts.filter((c) => c.include);
    if (included.length === 0) {
      alert(
        'Please select at least one contact to "Include in contact info". Edit a contact and tick the checkbox.'
      );
      return;
    }
    this.refreshContactInfoPreview();
    this.openSuccess('Contact info generated successfully.');
  }
  showContactDeleteConfirm = false;
  showSuccess = false;
  successMsg = '';

  askDeleteContact() {
    if (!this.selectedContact) return;
    this.showContactDeleteConfirm = true;
  }

  closeContactDeleteConfirm() {
    this.showContactDeleteConfirm = false;
  }

  confirmDeleteContact() {
    if (!this.selectedContact) {
      this.showContactDeleteConfirm = false;
      return;
    }
    const name = this.selectedContact.name || 'contact';
    this.contacts = this.contacts.filter((x) => x !== this.selectedContact);
    this.selectedContact = undefined;
    this.refreshContactInfoPreview();
    this.showContactDeleteConfirm = false;
    this.openSuccess(`Contact "${name}" deleted successfully.`);
  }

  // success modal
  openSuccess(msg: string) {
    this.successMsg = msg;
    this.showSuccess = true;
  }
  closeSuccess() {
    this.showSuccess = false;
  }
  // External Links
  addExternalLink() {
    this.externalLinks.push('https://example.com/doc.pdf');
  }
  removeExternalLink() {
    if (this.selectedLink) {
      this.externalLinks = this.externalLinks.filter(
        (x) => x !== this.selectedLink
      );
      this.selectedLink = null;
    }
  }

  // ===== Credit Control popup =====
  showCredit = false;
  openCreditControl() {
    this.creditForm.reset(
      {
        creditLimit: 10000,
        overdueLimit: 2000,
        scope: 'ALL',
        mode: 'DISABLED',
        exceedCreditAction: 'ALLOW',
        exceedOverdueAction: 'ALLOW',
        suspendReason: '',
      },
      { emitEvent: false }
    );
    this.showCredit = true;
  }
  saveCreditControl() {
    this.showCredit = false;
  }
  showBranchEditor = false;
  branchEditIndex = -1;
  showBranchDeleteConfirm = false;

  // ---- Open editor: Add
  addBranch() {
    if (!this.branchForm) this.initBranchForm(); // phòng ngừa
    if (this.formMode === 'view') return;

    this.branchEditIndex = -1;
    this.branchForm.reset({
      code: '',
      name: '',
      address: '',
      postCode: '',
      attention: '',
      phone1: '',
      phone2: '',
      fax1: '',
      fax2: '',
      agent: this.debtorForm?.value?.agent || '',
      area: this.debtorForm?.value?.area || '',
      email: '',
    });
    this.showBranchEditor = true;
  }

  // ---- Open editor: Edit
  editBranch() {
    if (this.formMode === 'view' || !this.selectedBranch) return;
    this.branchEditIndex = this.branches.indexOf(this.selectedBranch);
    const b = this.selectedBranch;
    this.branchForm.reset({
      code: b.code || '',
      name: b.name || '',
      address: b.address || '',
      postCode: b.postCode || '',
      attention: b.attention || '',
      phone1: b.phone1 || '',
      phone2: b.phone2 || '',
      fax1: b.fax1 || '',
      fax2: b.fax2 || '',
      agent: b.agent || '',
      area: b.area || '',
      email: b.email || '',
    });
    this.showBranchEditor = true;
  }

  closeBranchEditor() {
    this.showBranchEditor = false;
    this.branchEditIndex = -1;
  }

  // ---- Save
  saveBranchEditor() {
    const v = this.branchForm.value as Branch;
    if (!this.branchForm.valid) return;

    if (this.branchEditIndex === -1) {
      this.branches = [...this.branches, v];
    } else {
      this.branches = this.branches.map((x, i) =>
        i === this.branchEditIndex ? v : x
      );
    }
    this.selectedBranch = v;
    this.showBranchEditor = false;
    this.branchEditIndex = -1;

    // nếu bạn đã có cơ chế success popup:
    // this.successMsg = 'Saved';
    // this.showSuccess = true;
  }

  // ---- Delete
  removeBranch() {
    if (this.formMode === 'view' || !this.selectedBranch) return;
    this.showBranchDeleteConfirm = true;
  }

  closeBranchDeleteConfirm() {
    this.showBranchDeleteConfirm = false;
  }

  confirmDeleteBranch() {
    if (!this.selectedBranch) return;
    const target = this.selectedBranch;
    this.branches = this.branches.filter((b) => b !== target);
    this.selectedBranch = null;
    this.showBranchDeleteConfirm = false;

    // Optional success:
    // this.successMsg = 'Branch deleted';
    // this.showSuccess = true;
  }
  onDeleteDebtor() {
    if (!this.selected) return;
    this.showDeleteDebtorConfirm = true;
  }
  closeDeleteDebtorConfirm() {
    this.showDeleteDebtorConfirm = false;
  }
  private toLocalDatetimeInputValue(d: Date | null): string | null {
    if (!d) return null;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  private fromLocalDatetimeInput(val: string | null): string | null {
    if (!val) return null;
    // 'YYYY-MM-DDTHH:mm' -> ISO UTC string để lưu DB/API
    return new Date(val).toISOString();
  }
  minDateTime = this.toLocalDatetimeInputValue(new Date());
  openTinLookup() {
    window.open('https://mytax.hasil.gov.my/carian', '_blank');
  }

  copyBillingToDelivery() {
    const bill = this.debtorForm.get('billAddress')?.value ?? '';
    const post = this.debtorForm.get('postCode')?.value ?? '';
    this.debtorForm.patchValue({
      deliveryAddress: bill,
      deliveryPostCode: post,
    });
  }
  debtorCodeList: string[] = [];
  onCodeFocus() {
    // sinh 300-001 đến 300-999
    const all = Array.from(
      { length: 999 },
      (_, i) => `300-${(i + 1).toString().padStart(3, '0')}`
    );
    // tập code đang có (tùy dữ liệu của bạn, ở đây giả sử dùng r.debtorAccount)
    const used = new Set(
      this.rows.map((r) => (r.debtorAccount || '').trim()).filter(Boolean)
    );
    this.debtorCodeList = all.filter((c) => !used.has(c)).slice(0, 20); // giới hạn 50 gợi ý đầu
  }
}
