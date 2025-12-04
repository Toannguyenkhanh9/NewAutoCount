// src/app/layout/top-nav/top-nav.component.ts
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { NgFor } from '@angular/common';

interface NavItem {
    label: string;
    icon?: string;
    path?: string;
    children?: NavItem[];
}

@Component({
    selector: 'app-top-nav',
    standalone: true,
    imports: [NgFor, RouterLink, RouterLinkActive, MatButtonModule, MatMenuModule, MatIconModule, CommonModule],
    templateUrl: './top-nav.component.html',
    styleUrls: ['./top-nav.component.scss'],
})
export class TopNavComponent {
    navItems: NavItem[] = [
        { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
        {
            label: 'Account Books',
            icon: 'account_balance',
            children: [
                { label: 'Journal Entry', path: '/general-ledger/journal-entry' },
                { label: 'Trial Balance', path: '/general-ledger/trial-balance' },
                { label: 'Ledger Report', path: '/general-ledger/ledger-report' },
            ],
        },
        {
            label: 'General Maintenance',
            icon: 'miscellaneous_services',
            children: [
                { label: 'Journal Entry', path: '/general-ledger/journal-entry' },
                { label: 'Trial Balance', path: '/general-ledger/trial-balance' },
                { label: 'Ledger Report', path: '/general-ledger/ledger-report' },
            ],
        },
        {
            label: 'Accounts Receivable (A/R)',
            icon: 'assignment_ind',
            children: [
                { label: 'Debtors', path: '/ar/debtors' },
                { label: 'Invoices', path: '/ar/invoices' },
                { label: 'Receipts', path: '/ar/receipts' },
            ],
        },
        {
            label: 'Accounts Payable (A/P)',
            icon: 'receipt_long',
            children: [
                { label: 'Creditors', path: '/ap/creditors' },
                { label: 'Bills', path: '/ap/bills' },
                { label: 'Payments', path: '/ap/payments' },
            ],
        },
        {
            label: 'General Ledger (G/L)',
            icon: 'bar_chart',
            children: [
                { label: 'Profit & Loss', path: '/reports/pnl' },
                { label: 'Balance Sheet', path: '/reports/balance-sheet' },
                { label: 'Cash Flow', path: '/reports/cash-flow' },
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

    constructor(private router: Router) { }

    navigate(path?: string) {
        if (path) {
            this.router.navigateByUrl(path);
        }
    }
}
