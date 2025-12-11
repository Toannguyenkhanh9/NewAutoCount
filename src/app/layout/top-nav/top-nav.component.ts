// src/app/layout/top-nav/top-nav.component.ts
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, NgFor } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';

interface NavItem {
  label: string;
  icon?: string;
  path?: string;
  children?: NavItem[];
}

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [
    NgFor,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    CommonModule,
  ],
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.scss'],
})
export class TopNavComponent {
  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    {
      label: 'Accounts Receivable (A/R)',
      icon: 'assignment_ind',
      children: [
        { label: 'Debtor Maintenance', path: '/ar/debtor-maintenance' },
        { label: 'A/R Invoice Entry', path: '/ar/invoice-entry' },
        { label: 'A/R Receive Payment', path: '/ar/receive-payment' },
        { label: 'Debit Note Entry', path: '/ar/debit-note-entry' },
        { label: 'Credit Note Entry', path: '/ar/credit-note-entry' },
        { label: 'A/R and A/P Contra Entry', path: '/ar/contra-entry' },
        { label: 'Outstanding A/R Invoice Report', path: '/ar/outstanding-ar-invoice-report' },
        { label: 'Debtor Aging Report', path: '/ar/debtor-aging-report' },
        { label: 'Debtor Statement Report', path: '/ar/debtor-statement-report' },
        { label: 'Debtor Collection Report', path: '/ar/debtor-collection-report' },
      ],
    },
    {
      label: 'Accounts Payable (A/P)',
      icon: 'receipt_long',
      children: [
        { label: 'Creditor Maintenance', path: '/ap/creditor-maintenance' },
        { label: 'A/P Invoice Entry', path: '/ap/invoice-entry' },
        { label: 'A/P Payment', path: '/ap/payment' },
        { label: 'Debit Note Entry', path: '/ap/debit-note-entry' },
        { label: 'Credit Note Entry', path: '/ap/credit-note-entry' },
        { label: 'Outstanding A/P Invoice Report', path: '/ap/outstanding-ap-invoice-report' },
        { label: 'Creditor Aging Report', path: '/ap/creditor-aging-report' },
        { label: 'Creditor Statement Report', path: '/ap/creditor-statement-report' },
      ],
    },
    {
      label: 'General Ledger (G/L)',
      icon: 'bar_chart',
      children: [
        { label: 'Account Maintenance', path: '/general-ledger/account-maintenance' },
        { label: 'Cash Book Entry', path: '/general-ledger/cash-book-entry' },
        { label: 'Journal Entry', path: '/general-ledger/journal-entry' },
        { label: 'Opening Balance Maintenance', path: '/general-ledger/opening-balance-maintenance' },
        { label: 'Bank Reconciliation', path: '/general-ledger/bank-reconciliation' },
        { label: 'Stock Value Maintenance', path: '/general-ledger/stock-value-maintenance' },
        { label: 'View Transaction Summary', path: '/general-ledger/view-transaction-summary' },
        { label: 'Ledger Report', path: '/general-ledger/ledger-report' },
        { label: 'Journal of Transaction Report', path: '/general-ledger/journal-of-transaction-report' },
        { label: 'Trial Balance Report', path: '/general-ledger/trial-balance-report' },
        { label: 'Profit and Loss Statement', path: '/general-ledger/profit-and-loss-statement' },
        { label: 'Balance Sheet Statement', path: '/general-ledger/balance-sheet-statement' },
      ],
    },
    {
      label: 'Tools',
      icon: 'settings',
      children: [
        { label: 'Chart of Accounts', path: '/settings/accounts' },
        { label: 'Tax Codes', path: '/settings/tax-codes' },
        { label: 'Users & Roles', path: '/settings/users' },
      ],
    },
  ];

  // trạng thái mobile menu
  mobileMenuOpen = false;
  mobileActiveParent: NavItem | null = null;

  constructor(private router: Router) {}

  navigate(path?: string) {
    if (path) {
      this.router.navigateByUrl(path);
    }
  }

  /* ====== MOBILE MENU HANDLERS ====== */

  openMobileMenu() {
    this.mobileMenuOpen = true;
    this.mobileActiveParent = null;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
    this.mobileActiveParent = null;
  }

  onMobileRootClick(item: NavItem) {
    if (item.children && item.children.length) {
      // vào level 2 – submenu
      this.mobileActiveParent = item;
    } else if (item.path) {
      this.navigate(item.path);
      this.closeMobileMenu();
    }
  }

  backToRoot() {
    this.mobileActiveParent = null;
  }
}
