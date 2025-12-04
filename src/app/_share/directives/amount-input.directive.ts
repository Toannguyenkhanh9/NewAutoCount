import {
  Directive, ElementRef, forwardRef, HostListener, Input, Renderer2
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: 'input[appAmount]',
  standalone: true,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AmountInputDirective),
    multi: true,
  }],
})
export class AmountInputDirective implements ControlValueAccessor {
  @Input() decimals: number | string = 2;
  @Input() allowNegative = true;
  @Input() locale = 'en-US';
  @Input() useGrouping = true;
  /** NEW: chỉ format khi blur (khuyến nghị bật để gõ mượt) */
  @Input() formatOnBlurOnly = true;

  private onChange: (v: number | null) => void = () => {};
  private onTouched: () => void = () => {};
  private focused = false;
  private groupSep = ',';
  private decSep = '.';
  private value: number | null = null;

  constructor(private el: ElementRef<HTMLInputElement>, private r: Renderer2) {
    this.r.setAttribute(this.el.nativeElement, 'type', 'text');
    this.r.removeAttribute(this.el.nativeElement, 'min');
    this.r.removeAttribute(this.el.nativeElement, 'max');
    this.r.removeAttribute(this.el.nativeElement, 'step');
    try {
      const parts = new Intl.NumberFormat(this.locale).formatToParts(12345.6);
      this.groupSep = parts.find(p => p.type === 'group')?.value || ',';
      this.decSep   = parts.find(p => p.type === 'decimal')?.value || '.';
    } catch {}
    this.r.setAttribute(this.el.nativeElement, 'inputmode', 'decimal');
    this.r.setStyle(this.el.nativeElement, 'textAlign', 'right');
  }

  private get dec(): number {
    const n = Number(this.decimals);
    return Number.isFinite(n) ? n : 2;
  }

  writeValue(val: number | string | null): void {
    // chuẩn hoá về number
    const asNum =
      typeof val === 'string' ? this.parse(val) :
      typeof val === 'number' ? val : null;

    this.value = asNum;

    // Khi đang focus và bật formatOnBlurOnly, KHÔNG đè giá trị đang gõ
    if (this.focused && this.formatOnBlurOnly) return;

    this.el.nativeElement.value = this.formatView(this.value);
  }

  registerOnChange(fn: any)  { this.onChange = fn; }
  registerOnTouched(fn: any) { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean) {
    this.r.setProperty(this.el.nativeElement, 'disabled', isDisabled);
  }

  @HostListener('focus') onFocus() {
    this.focused = true;
    if (!this.formatOnBlurOnly) {
      // nếu muốn nhìn dạng raw khi focus
      this.el.nativeElement.value = this.formatRaw(this.value);
    }
  }

  @HostListener('blur') onBlur() {
    this.focused = false;
    this.onTouched();
    // luôn format đẹp khi blur
    this.el.nativeElement.value = this.formatView(this.value);
  }

  @HostListener('wheel', ['$event']) onWheel(ev: WheelEvent) { ev.preventDefault(); }

  @HostListener('input') onInput() {
    const raw = this.el.nativeElement.value;
    const parsed = this.parse(raw);
    this.value = parsed;
    this.onChange(parsed);

    // Nếu không phải chế độ chỉ format khi blur, khi nhập ta vẫn hiển thị raw (đã chuẩn hoá)
    if (!this.formatOnBlurOnly && this.focused) {
      this.el.nativeElement.value = this.formatRaw(this.value);
    }
  }

  private parse(text: string): number | null {
    if (!text) return null;
    let s = text
      .replace(new RegExp('\\' + this.groupSep, 'g'), '')
      .replace(new RegExp('\\' + this.decSep, 'g'), '.')
      .replace(/[^\d.\-]/g, '');

    const neg = this.allowNegative && s.startsWith('-');
    s = (neg ? '-' : '') + s.replace(/-/g, '').replace(/\.(?=.*\.)/g, '');
    if (s === '-' || s === '.' || s === '-.') return null;

    let n = Number(s);
    if (!isFinite(n)) return null;
    if (!this.allowNegative && n < 0) n = Math.abs(n);
    const f = Math.pow(10, this.dec);
    n = Math.round(n * f) / f;
    return n;
  }

  private formatView(val: number | null): string {
    if (val === null || val === undefined || isNaN(val as any)) return '';
    return new Intl.NumberFormat(this.locale, {
      useGrouping: this.useGrouping,
      minimumFractionDigits: this.dec,
      maximumFractionDigits: this.dec,
    }).format(Number(val));
  }

  private formatRaw(val: number | null): string {
    if (val === null || val === undefined || isNaN(val as any)) return '';
    return Number(val).toFixed(this.dec);
  }
}
