import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
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
type DebtorSection = 'contact' | 'primary' | 'additional' | 'business';

interface PriceRow {
  date: string;
  item: string;
  uom: string;
  qty: number;
  price: number;
  docNo: string;
}

interface DebtorCurrency {
  code: string;
  name: string;
  isDefault?: boolean;
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
  selector: 'app-creditor-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule,AmountInputDirective],
  templateUrl: './creditor-maintenance.component.html',
    styleUrls: ['./creditor-maintenance.component.scss'],
})
export class CreditorMaintenanceComponent {
    // ====== Currency dropdown (Xero style) ======
     showCurrencyPanel = false;
     currencySearch = '';

     /** Toàn bộ currency dùng cho dropdown */
     currencies: DebtorCurrency[] = [
       { code: 'MYR', name: 'Malaysian Ringgit', isDefault: true },
       { code: 'USD', name: 'US Dollar' },
       { code: 'EUR', name: 'Euro' },
       { code: 'SGD', name: 'Singapore Dollar' },
       { code: 'THB', name: 'Thai Baht' },
       { code: 'JPY', name: 'Japanese Yen' },
       { code: 'CNY', name: 'Chinese Yuan' },
       { code: 'AUD', name: 'Australian Dollar' },
     ];

     /** “My currencies” – ví dụ: default + currency đang chọn */
     myCurrencies: DebtorCurrency[] = [];

     /** All currencies sau khi filter bằng ô search */
     filteredCurrencies: DebtorCurrency[] = [];

     // ========== layout / scroll ==========
     @ViewChild('generalPane') generalPane?: ElementRef<HTMLDivElement>;
     paneMinHeight = 0;

     private computePaneMinHeight() {
       const el = this.generalPane?.nativeElement;
       if (!el) return;

       const h = el.scrollHeight;
       const max = Math.floor(window.innerHeight * 0.62);
       this.paneMinHeight = Math.min(h, max);
       this.cdr.detectChanges();
     }

     // ===== Grid mock =====
     q = '';

     rows: DebtorRow[] = [
       {
         debtorAccount: '400-N00A',
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
         customerTin: 'A12563311',
       },
       {
         debtorAccount: '400-GABB',
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
         customerTin: 'B1234442',
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

     // ===== Forms =====
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

     // ===== Contact editor =====
     showContactEditor = false;
     contactEditIndex = -1;
     contactInfoPreview = '';

     // ===== Credit control popup =====
     showCredit = false;

     // ===== Delete / success dialog =====
     showContactDeleteConfirm = false;
     showSuccess = false;
     successMsg = '';
     showBranchEditor = false;
     branchEditIndex = -1;
     showBranchDeleteConfirm = false;

     constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) {
       // Find form
       this.findForm = this.fb.group({
         keyword: [''],
         area: [''],
         agent: [''],
         active: ['all'],
       });

       // Print form
       this.printForm = this.fb.group({
         active: ['all'],
         area: [''],
         agent: [''],
         currency: [''],
         sort: ['code'],
       });

       // Debtor form
       this.debtorForm = this.fb.group({
         controlAccount: ['300-0000'],
         type: ['', Validators.required],
         groupCompany: [false],
         name: ['', Validators.required],
         registrationNo: [''],
         code: ['', Validators.required],
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
         actualTerm: this.fb.control<number | null>(null),
         includeContactInfo: [false],

         taxExemptionNo: [''],
         taxExemptionExpiry: [null],
         priceCategory: [''],
         accountGroup: [''],
         note: [''],
         individualId: ['', Validators.required],
         tinNo: ['', Validators.required],
         sstRegNo: [''],
         creditLimitAmount: [null],                 // number | null
         blockInvoicesWhenLimitReached: [{ value: false, disabled: true }],

       });

       // Contact form
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

       // Credit control form
       this.creditForm = this.fb.group({
         creditLimit: [0],
         overdueLimit: [0],
         scope: ['ALL'],
         mode: ['DISABLED'],
         exceedCreditAction: ['ALLOW'],
         exceedOverdueAction: ['ALLOW'],
         suspendReason: [''],
       });
     }

     ngOnInit() {
       this.setupCreditControlReactions();
       this.initBranchForm();
       this.initCurrencyLists();
       this.setupCreditLimitWatcher();
     }

     // ========= Currency helpers =========

     /** Currency đang chọn để hiển thị trên nút */
     get selectedCurrency(): DebtorCurrency | undefined {
       const code = this.debtorForm.get('currency')?.value;
       return this.currencies.find((c) => c.code === code);
     }

     /** Label hiển thị trên nút trigger */
     get currencyDisplayLabel(): string {
       const cur = this.selectedCurrency;
       if (!cur) return 'Select currency';
       return `${cur.name || cur.code} (${cur.code})`;
     }

     /** Khởi tạo “My currencies” và danh sách filter */
     private initCurrencyLists(): void {
       // currency mặc định trong form
       let currentCode =
         this.debtorForm.get('currency')?.value ||
         this.currencies.find((c) => c.isDefault)?.code ||
         this.currencies[0]?.code;

       if (!currentCode) {
         currentCode = 'MYR';
       }

       this.debtorForm.patchValue({ currency: currentCode }, { emitEvent: false });

       this.updateMyCurrencies();
       this.filteredCurrencies = [...this.currencies];
     }

     private updateMyCurrencies(): void {
       const currentCode = this.debtorForm.get('currency')?.value;

       const codes = new Set<string>();
       this.myCurrencies = [];

       // luôn ưu tiên default
       for (const c of this.currencies) {
         if (c.isDefault) {
           this.myCurrencies.push(c);
           codes.add(c.code);
         }
       }

       // thêm currency đang chọn nếu chưa có trong list
       const current = this.currencies.find((c) => c.code === currentCode);
       if (current && !codes.has(current.code)) {
         this.myCurrencies.unshift(current);
         codes.add(current.code);
       }
     }

     toggleCurrencyPanel(): void {
       if (this.showCurrencyPanel) {
         this.closeCurrencyPanel();
       } else {
         this.openCurrencyPanel();
       }
     }

     openCurrencyPanel(): void {
       this.showCurrencyPanel = true;
       this.currencySearch = '';
       this.filteredCurrencies = [...this.currencies];
     }

     closeCurrencyPanel(): void {
       this.showCurrencyPanel = false;
     }

     onCurrencySearchChange(value: string): void {
       this.currencySearch = value;
       this.filterCurrencies();
     }

     filterCurrencies(): void {
       const term = (this.currencySearch || '').trim().toLowerCase();
       if (!term) {
         this.filteredCurrencies = [...this.currencies];
         return;
       }

       this.filteredCurrencies = this.currencies.filter((c) => {
         const name = (c.name || '').toLowerCase();
         const code = c.code.toLowerCase();
         return name.includes(term) || code.includes(term);
       });
     }

     selectCurrency(cur: DebtorCurrency): void {
       this.debtorForm.patchValue({ currency: cur.code });
       this.updateMyCurrencies();
       this.closeCurrencyPanel();
     }

     // ========= Credit control =========

     setupCreditControlReactions() {
       const modeCtrl = this.creditForm.get('mode');
       modeCtrl?.valueChanges.subscribe(() => this.applyCreditMode());
       this.applyCreditMode();
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

     // ===== Contact editor helpers =====

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
         (r.debtorAccount + ' ' + r.companyName + ' ')
           .toLowerCase()
           .includes(k)
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
         controlAccount: '400-0000',
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
       this.activeSection = 'contact';
       this.initCurrencyLists();
       setTimeout(() => this.computePaneMinHeight(), 0);
     }

     editDebtor() {
       if (!this.selected) return;
       this.formMode = 'edit';
       this.debtorForm.reset({
         controlAccount: '400-0000',
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
       this.activeSection = 'contact';
       this.initCurrencyLists();
       setTimeout(() => this.computePaneMinHeight(), 0);
       this.setupCreditLimitWatcher();
     }

     viewDebtor() {
       if (!this.selected) return;
       this.formMode = 'view';
       this.debtorForm.reset({
         controlAccount: '400-0000',
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
       this.activeSection = 'contact';
       this.initCurrencyLists();
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
         ? name.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase()
         : 'N';
       const code = `300-${init}${Math.floor(1000 + Math.random() * 9000)}`;
       this.debtorForm.patchValue({ code });
     }

     saveDebtor() {
       this.submitted = true;
       if (this.debtorForm.invalid) {
         this.debtorForm.markAllAsTouched();
         alert(
           'Please fill required fields: Debtor Type, Company Name and Debtor Account.'
         );
         return;
       }

       const v = this.debtorForm.getRawValue();
       if (!v.code || !String(v.code).trim()) {
         const tmp = 'D' + Math.random().toString(36).slice(2, 8).toUpperCase();
         this.debtorForm.patchValue({ code: tmp });
       }

       const payload = {
         debtorAccount: v.code,
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
         active: true,
       };

       // TODO: call API với payload ở trên

       if (this.formMode === 'edit' && this.selected) {
         Object.assign(this.selected, {
           name: v.name!,
           type: v.type!,
           phone: v.phone || '',
           area: (v as any).area || '',
           agent: (v as any).agent || '',
           currency: v.currency || 'MYR',
           creditTerm: v.creditTerm || '',
           active: !!v.active,
           groupCompany: !!v.groupCompany,
         });
       }

       this.showForm = false;
     }

     // ===== Contacts =====
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

     // ===== Branch editor =====
     addBranch() {
       if (!this.branchForm) this.initBranchForm();
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
     }

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
       const all = Array.from(
         { length: 999 },
         (_, i) => `300-${(i + 1).toString().padStart(3, '0')}`
       );
       const used = new Set(
         this.rows.map((r) => (r.debtorAccount || '').trim()).filter(Boolean)
       );
       this.debtorCodeList = all.filter((c) => !used.has(c)).slice(0, 20);
     }

     closeForm() {
       this.showForm = false;
       this.tab = 'general';
       this.formMode = 'new';
       this.selected = null;
     }

     activeSection: DebtorSection = 'contact';

     @ViewChild('formScroll') formScroll!: ElementRef<HTMLElement>;
     @ViewChild('contactSection') contactSection!: ElementRef<HTMLElement>;
     @ViewChild('primarySection') primarySection!: ElementRef<HTMLElement>;
     @ViewChild('additionalSection') additionalSection!: ElementRef<HTMLElement>;
     @ViewChild('businessSection') businessSection!: ElementRef<HTMLElement>;

     scrollToSection(section: DebtorSection): void {
       this.activeSection = section;

       const container = this.formScroll?.nativeElement;
       if (!container) return;

       let targetEl: HTMLElement | null = null;

       switch (section) {
         case 'contact':
           targetEl = this.contactSection?.nativeElement;
           break;
         case 'primary':
           targetEl = this.primarySection?.nativeElement;
           break;
         case 'additional':
           targetEl = this.additionalSection?.nativeElement;
           break;
         case 'business':
           targetEl = this.businessSection?.nativeElement;
           break;
       }

       if (!targetEl) return;

       const containerRect = container.getBoundingClientRect();
       const targetRect = targetEl.getBoundingClientRect();
       const offset =
         targetRect.top - containerRect.top + container.scrollTop - 12;

       container.scrollTo({
         top: offset,
         behavior: 'smooth',
       });
     }
     submitted = false;
     isFieldInvalid(name: string): boolean {
       const c = this.debtorForm.get(name);
       return !!c && c.invalid && (c.touched || this.submitted);
     }
     sectionHasError(section: 'contact' | 'primary' | 'additional' | 'business'): boolean {
       switch (section) {
         case 'contact':
           // các field REQUIRED trong Contact details
           return ['code', 'name', 'individualId', 'tinNo']
             .some(ctrl => this.isFieldInvalid(ctrl));

         case 'primary':
           // REQUIRED trong Primary person
           return ['billAddress', 'phone', 'fax', 'postCode']
             .some(ctrl => this.isFieldInvalid(ctrl));

         case 'additional':
           // nếu sau này có required ở Additional people thì liệt kê vào đây
           return false;

         case 'business':
           // ví dụ nếu Credit Term là required:
           // return ['creditTerm'].some(ctrl => this.isFieldInvalid(ctrl));
           return false;
       }
     }

     creditLimitDisabled = true; // mặc định: chưa nhập limit => disable

     private setupCreditLimitWatcher(): void {
       const amountCtrl = this.debtorForm.get('creditLimitAmount');
       const blockCtrl = this.debtorForm.get('blockNewInvoicesWhenLimitReached');

       if (!amountCtrl || !blockCtrl) return;

       const updateState = (raw: unknown) => {
         const value = typeof raw === 'string'
           ? parseFloat(raw.replace(/,/g, '')) || 0
           : (Number(raw) || 0);

         // không nhập hoặc <= 0 => disable
         this.creditLimitDisabled = value <= 0;

         if (this.creditLimitDisabled) {
           // luôn tắt checkbox khi disable
           blockCtrl.setValue(false, { emitEvent: false });
         }
       };

       // chạy lần đầu
       updateState(amountCtrl.value);

       // nghe thay đổi
       amountCtrl.valueChanges.subscribe(v => updateState(v));
     }

   }
