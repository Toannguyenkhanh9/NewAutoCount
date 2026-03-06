import { CommonModule } from '@angular/common';
import { Component, OnInit,inject, NgZone, ChangeDetectorRef, ElementRef, ViewChild,DestroyRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { ActivatedRoute, Router,RouterLink } from '@angular/router';
import { CompanyContextService } from '../../../core/services/company-context.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type Curr = 'MYR' | 'USD' | 'SGD' | 'EUR';
type EditArea = 'sampleCoa' | 'other';
export interface CompanyProfile {
  remarkColor: string;
  remark: string;
  name: string;
  regNo: string;
  useSst: boolean;
  taxRegNo?: string; // GST/SST/VAT/Tax ID
  phone: string;
  fax: string;
  email: string;
  contactPerson: string;
  address1: string;
  postcode: string;
  currency: Curr;
  priceIncludeTax: boolean;

  logoDataUrl?: string; // preview/upload

  // ===== CHỈNH KIỂU: tất cả phải là string (không phải '' literal) =====
  deliveryAddress1: string;
  deliveryPostcode: string;
  deliveryContactPerson: string;
  deliveryPhone: string;
  deliveryFax: string;

  reportHeaderHtml: string; // nội dung HTML của header báo cáo
  // ✅ NEW fields
  actualDataStartDate: string;   // Fiscal Year Settings
  accountCodeFormat: string;     // Account Code Format
  coaTemplate: string;
  fiscalYearStart: string;         // Sample COA
  fiscalYearEnd: string;
}

const LS_KEY = 'companyProfile';
type CpSection =
  | 'company'
  | 'fiscal'
  | 'accFormat'
  | 'sampleCoa'
  | 'contact'
  | 'delivery'
  | 'logo';
type CpMode = 'normal' | 'new';
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, QuillModule, RouterLink],
  selector: 'app-company-profile',
  templateUrl: './company-profile.component.html',
  styleUrls: ['./company-profile.component.scss'],
})
export class CompanyProfileComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private companyContext = inject(CompanyContextService);
  companyName$ = this.companyContext.companyName$;
  mode: CpMode = 'normal';
  isEdit = false;
  coaTemplates = [
    { value: 'MY_STD', label: 'Default Data' },
    { value: 'MY_SME', label: 'Build from zero' },
    { value: 'SG_STD', label: 'Copy from existing sample' },
  ];
  constructor(
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  form: CompanyProfile = this.blank();
  private original?: CompanyProfile;

  quill: any; // hoặc: quill?: Quill;
  quillReady = false;

  onQuillReady(q: any) {
    this.quill = q;
    this.quillReady = true;

    // canh giữa mặc định ngay khi tạo
    this.quill.format('align', 'center');
  }

  onQuillChangeHtml(html: string | null) {
    this.form.reportHeaderHtml = html ?? '';
  }

  // Cấu hình toolbar + định dạng
  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ align: [] }], // left/center/right/justify
      [{ list: 'bullet' }],
      [{ color: [] }],
      [{ font: [] }],
      [{ size: ['small', false, 'large', 'huge'] }],
    ],
  };

  quillFormats = [
    'bold',
    'italic',
    'underline',
    'align',
    'list',
    'color',
    'font',
    'size',
  ];

  // Bắt thay đổi -> lưu ra HTML (để in/preview nơi khác)
  onQuillChange(evt: { html?: string }) {
    this.form.reportHeaderHtml = evt.html ?? '';
  }
  private initModeHandled = false;
ngOnInit() {

    // route mode như bạn đang làm
    this.route.queryParamMap.subscribe((p) => {
      const m = (p.get('mode') || 'normal') as CpMode;
      this.mode = m === 'new' ? 'new' : 'normal';

      if (this.mode === 'new') {
        this.original = undefined;
        this.form = this.blank();
        this.isEdit = true;
      } else {
        const saved = localStorage.getItem(LS_KEY);
        this.form = saved ? JSON.parse(saved) : this.blank();
        this.isEdit = false;
        // form.name sẽ được subscription ở trên tự set theo companyName$
      }
    });
        // ✅ Sync company name khi không phải mode new
    this.companyName$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((name) => {
        if (this.mode === 'new') return;
        const v = (name || '').trim();
        if (!v) return;

        // ✅ chỉ set khi chưa edit (hoặc form.name đang rỗng)
        if (!this.isEdit || !String(this.form?.name || '').trim()) {
          this.form.name = v;
          this.companyNameTouched = false; // tránh hiện lỗi required
          this.cdr.markForCheck();
        }
      });

  }
  private todayISO(): string {
    const t = new Date();
    const d = new Date(t.getTime() - t.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 10);
  }
  blank(): CompanyProfile {
    const first = this.coaTemplates?.[0]?.value ?? 'NONE';
    const today = this.todayISO();
    return {
      remark: '',
      remarkColor: '#fff9a8',
      name: '',
      regNo: '',
      useSst: false,
      taxRegNo: '',
      phone: '',
      fax: '',
      email: '',
      contactPerson: '',
      address1: '',
      postcode: '',
      currency: 'MYR',
      priceIncludeTax: false,
      logoDataUrl: '',
      deliveryAddress1: '',
      deliveryPostcode: '',
      deliveryContactPerson: '',
      deliveryPhone: '',
      deliveryFax: '',
      reportHeaderHtml: '',
      // ✅ NEW
      actualDataStartDate: this.todayISO(),
      fiscalYearStart: this.todayISO(),
      fiscalYearEnd: this.calcFiscalEnd(today),
      accountCodeFormat: '',
      coaTemplate: first,
    };
  }

  getContrast(hex?: string): string {
    if (!hex) return '#1f2937';
    const h = hex.replace('#', '');
    const r = parseInt(h.length === 3 ? h[0] + h[0] : h.substring(0, 2), 16);
    const g = parseInt(h.length === 3 ? h[1] + h[1] : h.substring(2, 4), 16);
    const b = parseInt(h.length === 3 ? h[2] + h[2] : h.substring(4, 6), 16);
    const L = 0.299 * r + 0.587 * g + 0.114 * b;
    return L > 160 ? '#1f2937' : '#ffffff';
  }

  onRemarkColorChange(): void {
    // nếu cần xử lý thêm khi đổi màu, thêm tại đây
  }

  // Toolbar actions
  newProfile() {
    if (this.isEdit) return;
    this.original = undefined;
    this.form = this.blank();
    this.isEdit = true;
  }

  edit() {
    if (this.isEdit) return;
    this.original = JSON.parse(JSON.stringify(this.form));
    this.isEdit = true;
  }
performSave(): boolean {
  // bật touched để hiện lỗi khi bấm Save
  this.fiscalStartTouched = true;
  this.fiscalEndTouched = true;
  this.openingDateTouched = true;
  this.companyNameTouched = true; // nếu bạn có validate company name

  if (
    this.companyNameInvalid ||
    this.fiscalStartInvalid ||
    this.fiscalEndInvalid ||
    this.fiscalRangeInvalid ||
    this.openingDateRequiredInvalid ||
    this.openingDateRangeInvalid
  ) {
    return false;
  }

  // logic lưu thật (localStorage / API)
  localStorage.setItem(LS_KEY, JSON.stringify(this.form));

  this.isEdit = false;
  this.original = undefined;

  // (tuỳ chọn) save xong thoát mode=new
  if (this.mode === 'new') {
    this.router.navigate([], {
      queryParams: { mode: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    this.mode = 'normal';
  }

  return true;
}

  cancel() {
    if (this.original) {
      this.form = JSON.parse(JSON.stringify(this.original));
    }
    this.isEdit = false;
    this.original = undefined;
  }

  refresh() {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) this.form = JSON.parse(saved);
  }

  doPrint() {
    window.print();
  }

  private logoObjectUrl?: string; // để revoke tránh leak

  resetFileInput(inp: HTMLInputElement) {
    // đảm bảo lần chọn cùng 1 file vẫn trigger change
    inp.value = '';
  }

  onLogoSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // 1) Hiển thị nhanh bằng Object URL
    if (this.logoObjectUrl) URL.revokeObjectURL(this.logoObjectUrl);
    this.logoObjectUrl = URL.createObjectURL(file);

    this.zone.run(() => {
      this.form.logoDataUrl = this.logoObjectUrl; // hiển thị ngay
      this.cdr.markForCheck(); // ép view cập nhật (OnPush/edge cases)
    });

    // 2) Nếu cần base64 để gửi API, đọc thêm (không bắt buộc cho hiển thị)
    // const reader = new FileReader();
    // reader.onload = () => this.zone.run(() => {
    //   this.form.logoDataUrl = reader.result as string; // dùng base64 thay cho object URL
    //   this.cdr.markForCheck();
    // });
    // reader.readAsDataURL(file);

    input.value = ''; // reset sau khi xử lý
  }

  clearLogo() {
    if (this.logoObjectUrl) {
      URL.revokeObjectURL(this.logoObjectUrl);
      this.logoObjectUrl = undefined;
    }
    this.form.logoDataUrl = '';
    this.cdr.markForCheck();
  }
  onHeaderChange(ev: Event) {
    const el = ev.target as HTMLElement;
    this.form.reportHeaderHtml = el.innerHTML;
  }

  applyCmd(cmd: string, value?: string) {
    if (!this.isEdit) return;
    document.execCommand(cmd, false, value);
  }

  applySize(px: string) {
    if (!this.isEdit) return;
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('fontSize', false, '7');
    const editor = document.querySelector(
      '.header-editor'
    ) as HTMLElement | null;
    if (!editor) return;
    editor.querySelectorAll('font[size="7"]').forEach((f) => {
      const span = document.createElement('span');
      span.style.fontSize = `${px}px`;
      span.innerHTML = f.innerHTML;
      f.replaceWith(span);
    });
  }
  private isEditorEmpty(): boolean {
    if (!this.quill) return true;
    // Quill luôn có 1 newline => getLength() > 1 nghĩa là có nội dung
    const len = this.quill.getLength?.() ?? 0;
    if (len <= 1) return true;

    const text = (this.quill.getText?.() as string | undefined) ?? '';
    // bỏ khoảng trắng/newline để kiểm tra rỗng
    return text.trim().length === 0;
  }
  setDefaultHeader() {
    const q = this.quill;
    if (!q) return;

    const html = this.buildDefaultHeaderHtml();

    // XÓA sạch nội dung hiện có (kể cả newline cuối cùng)
    q.deleteText(0, q.getLength());

    // Dán nội dung mặc định vào đầu
    q.clipboard.dangerouslyPasteHTML(0, html, 'user');

    // Căn giữa toàn bộ dòng
    const len = q.getLength();
    q.formatLine(0, len, { align: 'center' });

    // Đưa caret về cuối cho tiện tiếp tục soạn
    q.setSelection(q.getLength(), 0);

    // Nếu bạn có lưu vào model
    this.form.reportHeaderHtml = q.root.innerHTML;
  }

  private buildDefaultHeaderHtml(): string {
    const name = this.escape(this.form.name || 'Company Name');
    const reg = this.form.regNo ? `(ROC:${this.escape(this.form.regNo)})` : '';
    const addr = [this.form.address1]
      .filter(Boolean)
      .map(this.escape)
      .join('<br/>');
    const line3 = `${this.escape(this.form.postcode)}`.trim();

    return `
      <div style="text-align:center;font-family:'Microsoft Sans Serif'">
        <div style="font-size:22px;font-weight:700;color:#cc2b2b;margin-bottom:4px">${name}</div>
        <div style="font-size:12px;color:#444;margin-bottom:6px">${reg}</div>
        <div style="font-size:13px;color:#9b2ea9">
          ${addr}${addr ? '<br/>' : ''}${line3}
        </div>
      </div>`;
  }

  private escapeHtml(v: any): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return String(v ?? '').replace(/[&<>"']/g, (m) => map[m] ?? m);
  }
  private escape(v: unknown): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return String(v ?? '').replace(/[&<>"']/g, (ch) => map[ch] ?? ch);
  }
  activeSection: CpSection = 'company';

  @ViewChild('formScroll') formScroll!: ElementRef<HTMLElement>;
  @ViewChild('companySection') companySection!: ElementRef<HTMLElement>;
  @ViewChild('fiscalSection') fiscalSection!: ElementRef<HTMLElement>;
  @ViewChild('accFormatSection') accFormatSection!: ElementRef<HTMLElement>;
  @ViewChild('sampleCoaSection') sampleCoaSection!: ElementRef<HTMLElement>;
  @ViewChild('contactSection') contactSection!: ElementRef<HTMLElement>;
  @ViewChild('deliverySection') deliverySection!: ElementRef<HTMLElement>;
  @ViewChild('logoSection') logoSection!: ElementRef<HTMLElement>;

  private spyLockUntil = 0;
  private rafPending = false;

  private get sectionMap(): { key: CpSection; el: HTMLElement }[] {
    return [
      { key: 'company', el: this.companySection?.nativeElement },
      { key: 'fiscal', el: this.fiscalSection?.nativeElement },
      { key: 'accFormat', el: this.accFormatSection?.nativeElement },
      { key: 'sampleCoa', el: this.sampleCoaSection?.nativeElement },
      { key: 'contact', el: this.contactSection?.nativeElement },
      { key: 'delivery', el: this.deliverySection?.nativeElement },
      { key: 'logo', el: this.logoSection?.nativeElement },
    ].filter(x => !!x.el) as any;
  }

  ngAfterViewInit(): void {
    // chạy lần đầu để set đúng tab khi load
    setTimeout(() => this.onFormScroll(), 0);
  }

  onFormScroll(): void {
    if (Date.now() < this.spyLockUntil) return;

    const container = this.formScroll?.nativeElement;
    if (!container) return;

    const cTop = container.getBoundingClientRect().top;
    const threshold = 100; // chỉnh 80-120 tuỳ UI

    let best = -Infinity;
    let active: CpSection = this.activeSection || 'company';

    for (const s of this.sectionMap) {
      const y = s.el.getBoundingClientRect().top - cTop;
      if (y <= threshold && y > best) {
        best = y;
        active = s.key;
      }
    }

    if (active !== this.activeSection) {
      this.activeSection = active;

      // ✅ ép UI update ngay (phòng trường hợp event/async)
      this.cdr.detectChanges();
    }
  }

  scrollToSection(section: CpSection): void {
    this.activeSection = section;

    const container = this.formScroll?.nativeElement;
    if (!container) return;

    const target =
      section === 'company' ? this.companySection?.nativeElement :
        section === 'fiscal' ? this.fiscalSection?.nativeElement :
          section === 'accFormat' ? this.accFormatSection?.nativeElement :
            section === 'sampleCoa' ? this.sampleCoaSection?.nativeElement :
              section === 'contact' ? this.contactSection?.nativeElement :
                section === 'delivery' ? this.deliverySection?.nativeElement :
                  this.logoSection?.nativeElement;

    if (!target) return;

    this.spyLockUntil = Date.now() + 700;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offset = targetRect.top - containerRect.top + container.scrollTop - 12;

    container.scrollTo({ top: offset, behavior: 'smooth' });

    setTimeout(() => this.onFormScroll(), 750);
  }
  fiscalStartTouched = false;
  fiscalEndTouched = false;
  openingDateTouched = false;
  private fiscalEndUserEdited = false;
  onFiscalStartChange(v: string) {
    this.form.fiscalYearStart = v || '';
    this.fiscalStartTouched = true;

    // Nếu user chưa tự sửa End Date -> auto set theo rule cũ (1 year - 1 day)
    if (!this.fiscalEndUserEdited) {
      this.form.fiscalYearEnd = this.calcFiscalEnd(this.form.fiscalYearStart);
    }

    // Nếu End Date đang vượt max 18 months -> giữ nguyên để báo lỗi (không auto sửa)
    // Nếu bạn muốn auto clamp thì có thể set = fiscalEndMaxIso tại đây.

    // Actual Data Start Date: nếu rỗng => set = Start
    if (!this.form.actualDataStartDate) {
      this.form.actualDataStartDate = this.form.fiscalYearStart;
    }
  }

  onFiscalEndChange(v: string) {
    this.fiscalEndUserEdited = true;
    this.form.fiscalYearEnd = v || '';
  }

  get fiscalStartInvalid(): boolean {
    return this.fiscalStartTouched && !String(this.form.fiscalYearStart || '').trim();
  }

  get fiscalEndInvalid(): boolean {
    return this.fiscalEndTouched && !String(this.form.fiscalYearEnd || '').trim();
  }

  get fiscalRangeInvalid(): boolean {
    const s = this.form.fiscalYearStart;
    const e = this.form.fiscalYearEnd;
    if (!s || !e) return false;
    return this.toDate(e) < this.toDate(s);
  }

  /** max end date = start + 18 months */
  get fiscalEndMaxIso(): string {
    return this.calcMaxFiscalEnd(this.form.fiscalYearStart);
  }

  get fiscalEndTooLongInvalid(): boolean {
    if (!this.fiscalEndTouched) return false;
    const s = this.form.fiscalYearStart;
    const e = this.form.fiscalYearEnd;
    if (!s || !e) return false;

    const maxIso = this.calcMaxFiscalEnd(s);
    if (!maxIso) return false;

    return this.toDate(e) > this.toDate(maxIso);
  }

  get openingDateRequiredInvalid(): boolean {
    return this.openingDateTouched && !String(this.form.actualDataStartDate || '').trim();
  }

  get openingDateRangeInvalid(): boolean {
    if (!this.openingDateTouched) return false;

    const a = this.form.actualDataStartDate;
    const s = this.form.fiscalYearStart;
    const e = this.form.fiscalYearEnd;

    if (!a || !s || !e) return false;

    const ad = this.toDate(a);
    return ad < this.toDate(s) || ad > this.toDate(e);
  }

  /** yyyy-MM-dd -> Date local midnight */
  private toDate(iso: string): Date {
    return new Date(`${iso}T00:00:00`);
  }

  /** End mặc định = Start + 1 year - 1 day (rule cũ) */
  private calcFiscalEnd(startIso: string): string {
    if (!startIso) return '';
    const d = this.toDate(startIso);
    const end = new Date(d);
    end.setFullYear(end.getFullYear() + 1);
    end.setDate(end.getDate() - 1);
    return this.toIsoLocal(end);
  }

  /** Max End = Start + 18 months */
  private calcMaxFiscalEnd(startIso: string): string {
    if (!startIso) return '';
    const d = this.toDate(startIso);
    const max = this.addMonthsSafe(d, 18);
    return this.toIsoLocal(max);
  }

  private addMonthsSafe(d: Date, months: number): Date {
    const day = d.getDate();
    const tmp = new Date(d);
    tmp.setDate(1);
    tmp.setMonth(tmp.getMonth() + months);
    const last = new Date(tmp.getFullYear(), tmp.getMonth() + 1, 0).getDate();
    tmp.setDate(Math.min(day, last));
    return tmp;
  }

  private toIsoLocal(d: Date): string {
    const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return x.toISOString().slice(0, 10);
  }
  onUseSstChanged(v: boolean) {
    this.form.useSst = !!v;
    if (!this.form.useSst) {
      this.form.taxRegNo = '';
    }
  }
  companyNameTouched = false;

  get companyNameInvalid(): boolean {
    return this.companyNameTouched && !String(this.form.name || '').trim();
  }
  canEditField(area: EditArea): boolean {
    // ✅ Mode NEW: cho sửa tất cả
    if (this.mode === 'new') return true;

    // ✅ Mode NORMAL:
    // - Sample COA: luôn khóa
    if (area === 'sampleCoa') return false;

    // - Các field khác: theo isEdit
    return this.isEdit;
  }
  // ===== Confirm Save + Success =====
showSaveConfirm = false;
confirmMsg = '';

showSuccess = false;
successMsg = '';
private successTimer: any = null;

askSave() {
  if (!this.isEdit) return;

  // message giống cash book entry
  this.confirmMsg =
    this.mode === 'new'
      ? 'Are you sure you want to create this Company Profile ?'
      : 'Are you sure you want to update this Company Profile ?';

  this.showSaveConfirm = true;
}

cancelConfirmSave() {
  this.showSaveConfirm = false;
}

doConfirmSave() {
  this.showSaveConfirm = false;

  const ok = this.performSave(); // gọi save thật
  if (!ok) return;

  const msg =
    this.mode === 'new'
      ? 'Create Company Profile successfully.'
      : 'Update Company Profile successfully.';

  this.openSuccess(msg);
}

private openSuccess(msg: string) {
  this.successMsg = msg;
  this.showSuccess = true;

  // ✅ “thông báo nhanh” tự tắt sau 1.2s (bạn đổi ms tuỳ ý)
  if (this.successTimer) clearTimeout(this.successTimer);
  this.successTimer = setTimeout(() => {
    this.closeSuccess();
  }, 1200);
}

closeSuccess() {
  this.showSuccess = false;
  if (this.successTimer) {
    clearTimeout(this.successTimer);
    this.successTimer = null;
  }
}
}
