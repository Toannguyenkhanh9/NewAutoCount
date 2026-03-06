import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

type MsicItem = {
  code: string;
  description: string;
  category: string; // A, B, C... hoặc ''
};

type ViewRow =
  | { kind: 'category'; id: string; category: string; categoryName: string }
  | { kind: 'item'; id: string; code: string; description: string; category: string };

const CATEGORY_NAME_MAP: Record<string, string> = {
  A: 'AGRICULTURE, FORESTRY AND FISHING',
  B: 'MINING AND QUARRYING',
  C: 'MANUFACTURING',
  D: 'ELECTRICITY, GAS, STEAM AND AIR CONDITIONING SUPPLY',
  E: 'WATER SUPPLY; SEWERAGE, WASTE MANAGEMENT AND REMEDIATION ACTIVITIES',
  F: 'CONSTRUCTION',
  G: 'WHOLESALE AND RETAIL TRADE; REPAIR OF MOTOR VEHICLES AND MOTORCYCLES',
  H: 'TRANSPORTATION AND STORAGE',
  I: 'ACCOMMODATION AND FOOD SERVICE ACTIVITIES',
  J: 'INFORMATION AND COMMUNICATION',
  K: 'FINANCIAL AND INSURANCE/TAKAFUL ACTIVITIES',
  L: 'REAL ESTATE ACTIVITIES',
  M: 'PROFESSIONAL, SCIENTIFIC AND TECHNICAL ACTIVITIES',
  N: 'ADMINISTRATIVE AND SUPPORT SERVICE ACTIVITIES',
  O: 'PUBLIC ADMINISTRATION AND DEFENCE; COMPULSORY SOCIAL SECURITY',
  P: 'EDUCATION',
  Q: 'HUMAN HEALTH AND SOCIAL WORK ACTIVITIES',
  R: 'ARTS, ENTERTAINMENT AND RECREATION',
  S: 'OTHER SERVICE ACTIVITIES',
  T: 'ACTIVITIES OF HOUSEHOLDS AS EMPLOYERS; UNDIFFERENTIATED GOODS/SERVICES FOR OWN USE',
  U: 'ACTIVITIES OF EXTRATERRITORIAL ORGANISATIONS AND BODIES',
};

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  ...Object.keys(CATEGORY_NAME_MAP).sort().map(k => ({ value: k, label: `${k} - ${CATEGORY_NAME_MAP[k]}` })),
];

function normalize(raw: any): MsicItem {
  return {
    code: String(raw?.['Code'] ?? '').trim(),
    description: String(raw?.['Description'] ?? '').trim(),
    category: String(raw?.['MSIC Category Reference'] ?? '').trim(),
  };
}

function categorySortKey(cat: string) {
  // '' (NOT APPLICABLE) lên đầu
  return cat ? cat.charCodeAt(0) : 0;
}

@Component({
  selector: 'app-msic-codes',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './msic-code.component.html',
  styleUrls: ['./msic-code.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MsicCodesComponent {
  readonly loading = signal(true);

  readonly search = signal('');
  readonly categoryFilter = signal(''); // '' = all

  readonly items = signal<MsicItem[]>([]);
  readonly categories = CATEGORY_OPTIONS;

  constructor(http: HttpClient) {
    http.get<any[]>('assets/msic-codes.json').subscribe({
      next: (data) => {
        this.items.set((data ?? []).map(normalize));
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.loading.set(false);
      },
    });
  }

  readonly filteredItems = computed(() => {
    const q = this.search().trim().toLowerCase();
    const cat = this.categoryFilter();

    return this.items()
      .filter(x => !cat || x.category === cat)
      .filter(x => !q || x.code.toLowerCase().includes(q) || x.description.toLowerCase().includes(q))
      .sort((a, b) => {
        const ca = categorySortKey(a.category);
        const cb = categorySortKey(b.category);
        if (ca !== cb) return ca - cb;

        // sort code theo string (đúng kiểu 00000, 01111, 10101...)
        if (a.code !== b.code) return a.code.localeCompare(b.code);
        return a.description.localeCompare(b.description);
      });
  });

  readonly viewRows = computed<ViewRow[]>(() => {
    const rows: ViewRow[] = [];
    let lastCat = '__init__';

    const list = this.filteredItems();
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      const cat = it.category || '';

      // chỉ render header category khi có cat (A/B/C...) và đổi category
      if (cat && cat !== lastCat) {
        rows.push({
          kind: 'category',
          id: `cat-${cat}-${i}`,
          category: cat,
          categoryName: CATEGORY_NAME_MAP[cat] ?? `CATEGORY ${cat}`,
        });
      }
      lastCat = cat;

      rows.push({
        kind: 'item',
        id: `item-${cat || 'NA'}-${it.code}-${i}`,
        code: it.code,
        description: it.description,
        category: it.category,
      });
    }

    return rows;
  });

  trackRow = (_: number, r: ViewRow) => r.id;
}