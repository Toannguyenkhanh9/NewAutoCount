import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type DocType = 'Journal Entry' | 'Payment Entry' | 'Receipt Entry' | 'Contra Entry';

export interface BrRow {
  id: number;
  postingDate: string; // yyyy-MM-dd
  docType: DocType;
  docNo: string;
  debit: number;
  credit: number;
  againstAccount: string;
  reference?: string;
}

type DisplayRow =
  | ({ kind: 'row' } & BrRow)
  | { kind: 'summary'; label: string; debit?: number; credit?: number; note?: string };

@Component({
  selector: 'app-bank-reconciliation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bank-reconciliation.component.html',
  styleUrls: ['./bank-reconciliation.component.scss'],
})
export class BankReconciliationComponent {

  menuOpen = false;

  accounts = [
    { code: 'HDFC-UP', name: 'HDFC Bank - UP' },
    { code: 'CIMB-MY', name: 'CIMB Bank - MY' },
    { code: 'MAYBANK', name: 'Maybank - MY' },
  ];
  selectedAcc = this.accounts[0].code;

  asOf = this.todayISO();
  includePos = false;

  q = '';

  // ===== Data mock =====
  rows: BrRow[] = [
    {
      id: 1,
      postingDate: '2019-04-12',
      docType: 'Journal Entry',
      docNo: 'ACC-JV-2019-00006',
      debit: 299,
      credit: 0,
      againstAccount: 'Cash - PT',
      reference: '',
    },
    {
      id: 2,
      postingDate: '2019-04-12',
      docType: 'Journal Entry',
      docNo: 'ACC-JV-2019-00005',
      debit: 0,
      credit: 200,
      againstAccount: 'Cash - PT',
      reference: '',
    },
    {
      id: 3,
      postingDate: '2019-04-16',
      docType: 'Journal Entry',
      docNo: 'ACC-JV-2019-00008',
      debit: 0,
      credit: 99,
      againstAccount: 'InterSupp',
      reference: '',
    },
    {
      id: 4,
      postingDate: '2019-07-03',
      docType: 'Payment Entry',
      docNo: 'ACC-PAY-2019-00009',
      debit: 10000,
      credit: 0,
      againstAccount: 'Aamir',
      reference: '123',
    },
    {
      id: 5,
      postingDate: '2019-09-24',
      docType: 'Payment Entry',
      docNo: 'ACC-PAY-2019-00011',
      debit: 25,
      credit: 0,
      againstAccount: 'Archie',
      reference: '123',
    },
    {
      id: 6,
      postingDate: '2019-09-25',
      docType: 'Payment Entry',
      docNo: 'ACC-PAY-2019-00013',
      debit: 25,
      credit: 0,
      againstAccount: 'Archie',
      reference: '123',
    },
  ];

  // ===== Derived =====
  filteredRows(): BrRow[] {
    const s = (this.q || '').trim().toLowerCase();
    if (!s) return this.rows;

    return this.rows.filter((r) =>
      `${r.postingDate} ${r.docType} ${r.docNo} ${r.againstAccount} ${r.reference || ''}`
        .toLowerCase()
        .includes(s)
    );
  }

  get totalDebit(): number {
    return this.filteredRows().reduce((t, r) => t + (r.debit || 0), 0);
  }
  get totalCredit(): number {
    return this.filteredRows().reduce((t, r) => t + (r.credit || 0), 0);
  }

  // Summary giống kiểu report
  get displayRows(): DisplayRow[] {
    const list = this.filteredRows().map((r) => ({ kind: 'row' as const, ...r }));

    const bankBalance = 8550; // demo
    const outstanding = 10349; // demo
    const incorrect = 0; // demo

    return [
      ...list,
      { kind: 'summary', label: 'Bank Statement balance as per General Ledger', debit: bankBalance, credit: 0 },
      { kind: 'summary', label: 'Outstanding Cheques and Deposits', debit: outstanding, credit: 299 },
      { kind: 'summary', label: 'Cheques and Deposits incorrectly cleared', debit: incorrect, credit: 0 },
    ];
  }

  // ===== Actions =====
  toggleMenu(e?: MouseEvent) {
    e?.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }
  closeMenu() {
    this.menuOpen = false;
  }

  refresh() {
    // TODO: gọi API reload
    this.closeMenu();
  }

  setChart() {
    // TODO: open popup set chart
    alert('Demo: Set Chart');
    this.closeMenu();
  }

  export() {
    alert('Demo: Export');
    this.closeMenu();
  }

  print() {
    window.print();
    this.closeMenu();
  }

  // ===== helpers =====
  trackById(_: number, r: DisplayRow) {
    return r.kind === 'row' ? `row-${r.id}` : `sum-${r.label}`;
  }

  amountClass(v: number) {
    if (v < 0) return 'neg';
    if (v > 0) return 'pos';
    return '';
  }

  private todayISO(): string {
    const t = new Date();
    const d = new Date(t.getTime() - t.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 10);
  }
}
