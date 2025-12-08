// src/app/features/dashboard/dashboard-page.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface BankPoint {
  label: string;
  value: number;
}

interface SimpleBar {
  label: string;
  value: number;
}

interface WatchAccount {
  name: string;
  budget: number;
  thisMonth: number;
  ytd: number;
}

interface ExpenseItem {
  name: string;
  status: string;
  total: number;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss'],
})
export class DashboardPageComponent {
  bankName = 'Bank 1';
  bankAccountNo = '306-234-12345678';
  unreconciledCount = 33;
  balanceInXero = 0;
  statementBalance = 344.74;

  bankTimeline: BankPoint[] = [
    { label: 'Oct 29', value: 5 },
    { label: 'Nov 5', value: -10 },
    { label: 'Nov 12', value: -10 },
    { label: 'Nov 19', value: -10 },
  ];

  invoicesBars: SimpleBar[] = [
    { label: 'Older', value: 20 },
    { label: '12–18 Nov', value: 35 },
    { label: 'This week', value: 50 },
    { label: '26 Nov–2 Dec', value: 80 },
    { label: '3–9 Dec', value: 25 },
    { label: 'Future', value: 15 },
  ];

  billsBars: SimpleBar[] = [
    { label: 'Older', value: 25 },
    { label: '12–18 Nov', value: 50 },
    { label: 'This week', value: 20 },
    { label: '26 Nov–2 Dec', value: 55 },
    { label: '3–9 Dec', value: 40 },
    { label: 'Future', value: 30 },
  ];

  watchAccounts: WatchAccount[] = [
    { name: 'Inventory (630)', budget: 2000, thisMonth: 100, ytd: 234567 },
    { name: 'Office Expenses (453)', budget: 1993, thisMonth: 100, ytd: 0 },
    {
      name: 'PAYG Withholdings Payable (825)',
      budget: 677,
      thisMonth: 500,
      ytd: 9000,
    },
  ];

  expenseItems: ExpenseItem[] = [
    { name: 'Amy Longworth', status: '3 to review', total: 18073.95 },
    { name: 'Lacy Corlang', status: '3 to review', total: 18073.95 },
    { name: 'Norma Tucker', status: '3 to review', total: 18073.95 },
  ];

  get maxBankValue(): number {
    return Math.max(...this.bankTimeline.map((p) => p.value), 1);
  }

  get maxInvoiceValue(): number {
    return Math.max(...this.invoicesBars.map((b) => b.value), 1);
  }

  get maxBillValue(): number {
    return Math.max(...this.billsBars.map((b) => b.value), 1);
  }
}
