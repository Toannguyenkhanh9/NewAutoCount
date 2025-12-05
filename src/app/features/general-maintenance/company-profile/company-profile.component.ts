import { CommonModule } from '@angular/common';
import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';

type Curr = 'MYR' | 'USD' | 'SGD' | 'EUR';

export interface CompanyProfile {
  remarkColor: string;
  remark: string;
  name: string;
  regNo: string;
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
}

const LS_KEY = 'companyProfile';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, QuillModule],
  selector: 'app-company-profile',
  templateUrl: './company-profile.component.html',
  styleUrls: ['./company-profile.component.scss'],
})
export class CompanyProfileComponent implements OnInit {
  constructor(private zone: NgZone, private cdr: ChangeDetectorRef) {}
  isEdit = false;

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

  ngOnInit() {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      this.form = JSON.parse(saved);
    } else {
      // seed demo data
      this.form = {
        remark: 'testing',
        remarkColor: '#fff9a8',
        name: 'Learning Autocount Sdn Bhd',
        regNo: '923456-T',
        taxRegNo: 'W1234567890',
        phone: '03-33420011',
        fax: '03-33420012',
        email: 'info@learning-autocount.com',
        contactPerson: 'Mr. Daniel',
        address1: 'Level 17, Block A, Damansara Intan',
        postcode: '47400',
        currency: 'MYR',
        priceIncludeTax: false,
        logoDataUrl: '',
        deliveryAddress1: '',
        deliveryPostcode: '',
        deliveryContactPerson: '',
        deliveryPhone: '',
        deliveryFax: '',
        reportHeaderHtml: '',
      };
    }
  }

  blank(): CompanyProfile {
    return {
      remark: '',
      remarkColor: '#fff9a8',
      name: '',
      regNo: '',
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

  save() {
    if (!this.form.name?.trim()) return;
    localStorage.setItem(LS_KEY, JSON.stringify(this.form));
    this.isEdit = false;
    this.original = undefined;
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
}
