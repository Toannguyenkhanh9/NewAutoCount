import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BnmExchangeRateService } from '../../../services/bnm-exchange-rate.service';
import type { QuoteKey, RateTypeKey } from '../../../services/bnm-exchange-rate.service';

type Col = { code: string; unit: number; key: string; label: string };
type ViewRow = { date: string; dateLabel: string; values: Record<string, number | null> };

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

function fmtDateLabel(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(dt);
}
function colKey(code: string, unit: number) { return `${code}_${unit}`; }
function colLabel(code: string, unit: number) { return unit === 1 ? code : `${code}${unit}`; }

const GROUPS: Array<{ cols: Array<{ code: string; unit: number }> }> = [
  { cols: [
    { code: 'USD', unit: 1 }, { code: 'GBP', unit: 1 }, { code: 'EUR', unit: 1 },
    { code: 'JPY', unit: 100 }, { code: 'CHF', unit: 1 }, { code: 'AUD', unit: 1 },
    { code: 'CAD', unit: 1 }, { code: 'SGD', unit: 1 }, { code: 'HKD', unit: 100 },
  ]},
  { cols: [
    { code: 'THB', unit: 100 }, { code: 'PHP', unit: 100 }, { code: 'TWD', unit: 100 },
    { code: 'KRW', unit: 100 }, { code: 'IDR', unit: 100 }, { code: 'SAR', unit: 100 },
    { code: 'SDR', unit: 1 }, { code: 'CNY', unit: 1 }, { code: 'BND', unit: 1 },
  ]},
  { cols: [
    { code: 'VND', unit: 100 }, { code: 'KHR', unit: 100 }, { code: 'NZD', unit: 1 },
    { code: 'MMK', unit: 100 }, { code: 'INR', unit: 100 }, { code: 'AED', unit: 100 },
    { code: 'PKR', unit: 100 }, { code: 'NPR', unit: 100 }, { code: 'EGP', unit: 1 },
  ]},
];

@Component({
  selector: 'app-exchange-rates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exchange-rates.component.html',
  styleUrls: ['./exchange-rates.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExchangeRatesComponent {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // UI vẫn giữ để giống page (dù API latest không dùng range)
  readonly fromMonth = signal<number>(new Date().getMonth() + 1);
  readonly fromYear = signal<number>(new Date().getFullYear());
  readonly toMonth = signal<number>(new Date().getMonth() + 1);
  readonly toYear = signal<number>(new Date().getFullYear());

  readonly session = signal<string>('0900');
  readonly quote = signal<QuoteKey>('rm');
  readonly rateType = signal<RateTypeKey>('middle_rate');

  readonly months = MONTHS;
  readonly years = Array.from({ length: 12 }, (_, i) => new Date().getFullYear() - 10 + i);

  readonly apiData = signal<any[]>([]);
  readonly meta = signal<any | null>(null);

  constructor(private bnm: BnmExchangeRateService) {
    this.search();
  }

  readonly columnsByGroup = computed<Col[][]>(() => {
    return GROUPS.map(g => g.cols.map(c => ({
      code: c.code,
      unit: c.unit,
      key: colKey(c.code, c.unit),
      label: colLabel(c.code, c.unit),
    })));
  });

  readonly rows = computed<ViewRow[]>(() => {
    const list = this.apiData();
    const rateKey = this.rateType();

    const byDate = new Map<string, ViewRow>();

    for (const item of list) {
      const code = String(item.currency_code ?? '').trim();
      const unit = Number(item.unit ?? 1);
      const date = String(item.rate?.date ?? '').trim();
      const val = (item.rate?.[rateKey] ?? null) as number | null;

      if (!date) continue;

      if (!byDate.has(date)) {
        byDate.set(date, {
          date,
          dateLabel: fmtDateLabel(date),
          values: {},
        });
      }

      byDate.get(date)!.values[colKey(code, unit)] = val;
    }

    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  });

  search() {
    this.loading.set(true);
    this.error.set(null);

    // ✅ gọi đúng signature service: getRates(session, quote)
    this.bnm.getRates(this.session(), this.quote()).subscribe({
      next: (res: any) => {
        this.apiData.set(res?.data ?? []);
        this.meta.set(res?.meta ?? null);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error(err);
        this.apiData.set([]);
        this.meta.set(null);
        this.loading.set(false);

        // status 0 thường là CORS / proxy chưa bật
        const msg =
          err?.status === 0
            ? 'Blocked by CORS (hãy chạy ng serve với proxy.conf.json và gọi /bnm/...).'
            : 'Failed to load exchange rates.';
        this.error.set(msg);
      },
    });
  }

  exportCsv() {
    const rows = this.rows();
    if (!rows.length) return;

    const allCols = this.columnsByGroup().flat();
    const header = ['Date', ...allCols.map(c => c.label)];
    const lines = [header.join(',')];

    for (const r of rows) {
      const values = allCols.map(c => {
        const v = r.values[c.key];
        return (v === null || v === undefined) ? '' : Number(v).toFixed(4);
      });
      lines.push([r.dateLabel, ...values].join(','));
    }

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `exchange-rates-${this.rateType()}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  fmtValue(v: number | null | undefined) {
    return (v === null || v === undefined) ? '-' : Number(v).toFixed(4);
  }
}