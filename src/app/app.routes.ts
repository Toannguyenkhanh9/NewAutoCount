import { Routes } from '@angular/router';
import { DashboardPageComponent } from './features/dashboard/dashboard-page.component';

import { LoginPageComponent } from './features/auth/login-page.component';
import { authGuard } from './core/guards/auth.guard';
import { AccountTypeMaintenanceComponent } from './features/general-maintenance/account-type-maintenance/account-type-maintenance.component';
import { CompanyProfileComponent } from './features/general-maintenance/company-profile/company-profile.component';
import { CreditorTypeMaintenanceComponent } from './features/general-maintenance/creditor-type-maintenance/creditor-type-maintenance.component';
import { CurrencyMaintenanceComponent } from './features/general-maintenance/currency-maintenance/currency-maintenance.component';
import { DebtorTypeMaintenanceComponent } from './features/general-maintenance/debtor-type-maintenance/debtor-type-maintenance.component';
import { DocumentNumberingFormatProComponent } from './features/general-maintenance/document-numbering-format-maintenance/document-numbering-format.component';
import { JournalTypeMaintenanceComponent } from './features/general-maintenance/journal-type-maintenance/journal-type-maintenance.component';
import { LastYearBalanceMaintenanceComponent } from './features/general-maintenance/last-year-balance-maintenance/last-year-balance-maintenance.component';

import { AccountMaintenanceComponent } from './features/gl/account-maintenance/account-maintenance.component';
import { BalanceSheetComponent } from './features/gl/balance-sheet-statement/balance-sheet.component';
import { BankReconciliationComponent } from './features/gl/bank-reconciliation/bank-reconciliation.component';
import { CashBookEntryComponent } from './features/gl/cash-book-entry/cash-book-entry.component';
import { JournalEntryComponent } from './features/gl/journal-entry/journal-entry.component';
import { JournalOfTransactionReportComponent } from './features/gl/journal-of-transaction-report/journal-of-transaction-report.component';
import { LedgerReportComponent } from './features/gl/ledger-report/ledger-report.component';
import { OpeningBalanceMaintenanceComponent } from './features/gl/opening-balance-maintenance/opening-balance-maintenance.component';
import { ProfitAndLossComponent } from './features/gl/profit-and-loss-statement/profit-and-loss.component';
import { StockValueMaintenanceComponent } from './features/gl/stock-value-maintenance/stock-value-maintenance.component';
import { TrialBalanceReportComponent } from './features/gl/trial-balance-report/trial-balance-report.component';
import { ViewTransactionSummaryComponent } from './features/gl/view-transaction-summary/view-transaction-summary.component';

import { ApCreditNotePageComponent } from './features/ap/credit-note-entry/ap-credit-note-page.component';
import { CreditorAgingReportComponent } from './features/ap/creditor-aging-report/creditor-aging-report.component';
import { CreditorMaintenanceComponent } from './features/ap/creditor-maintenance/creditor-maintenance.component';
import { CreditorStatementReportComponent } from './features/ap/creditor-statement-report/creditor-statement-report.component';
import { ApDebitNotePageComponent } from './features/ap/debit-note-entry/ap-debit-note-page.component';
import { ApInvoicePageComponent } from './features/ap/invoice-entry/ap-invoice-page.component';
import { ApOutstandingReportComponent } from './features/ap/outstanding-ap-invoice-report/ap-outstanding-report.component';
import { ApPaymentPageComponent } from './features/ap/payment/ap-payment-page.component';

import { ArApContraPageComponent } from './features/ar/contra-entry/ar-ap-contra-page.component';
import { ArCreditNotePageComponent } from './features/ar/credit-note-entry/ar-credit-note-page.component';
import { ArDebitNotePageComponent } from './features/ar/debit-note-entry/ar-debit-note-page.component';
import { DebtorAgingReportComponent } from './features/ar/debtor-aging-report/debtor-aging-report.component';
import { DebtorCollectionReportComponent } from './features/ar/debtor-collection-report/debtor-collection-report.component';
import { DebtorMaintenanceComponent } from './features/ar/debtor-maintenance/debtor-maintenance.component';
import { DebtorStatementReportComponent } from './features/ar/debtor-statement-report/debtor-statement-report.component';
import { ArInvoicePageComponent } from './features/ar/invoice-entry/ar-invoice-page.component';
import { ArOutstandingReportComponent } from './features/ar/outstanding-ar-invoice-report/ar-outstanding-report.component';
import { ArReceivePaymentPageComponent } from './features/ar/receive-payment/ar-receive-payment-page.component';
import { ManageAccountBookComponent } from './features/book/manage-account-book/manage-account-book.component';
import { SettingsPageComponent } from './features/settings/settings-page/settings-page.component';
import { CreateAccountBookPageComponent } from './features/book/create-account-book/create-account-book-page.component';
export const routes: Routes = [
  { path: 'login', component: LoginPageComponent, title: 'Login' },

  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  {
    path: 'dashboard',
    component: DashboardPageComponent,
    title: 'Dashboard',
    canActivate: [authGuard],
    // không set breadcrumb => trang dashboard sẽ không hiện breadcrumb
  },

  // ===== Account Books =====
  {
    path: 'book',
    canActivate: [authGuard],
    children: [
      {
        path: 'manage-account-book',
        component: ManageAccountBookComponent,
        title: 'Manage Account Book',
        data: { breadcrumb: 'Manage Account Book' },
      },
      {
        path: 'create-account-book',
        component: CreateAccountBookPageComponent,
        title: 'Create Account Book',
        data: { breadcrumb: 'Create Account Book' },
      },
    ],
  },

  // ===== General Maintenance =====
  {
    path: 'settings',
    canActivate: [authGuard],
    data: { breadcrumb: 'Settings' },
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: SettingsPageComponent,
        title: 'Settings',
      },
      {
        path: 'account-type-maintenance',
        component: AccountTypeMaintenanceComponent,
        title: 'Account Type Maintenance',
        data: { breadcrumb: 'Account Type Maintenance' },
      },
      {
        path: 'company-profile',
        component: CompanyProfileComponent,
        title: 'Company Profile',
        data: { breadcrumb: 'Company Profile' },
      },
      {
        path: 'creditor-type-maintenance',
        component: CreditorTypeMaintenanceComponent,
        title: 'Creditor Type Maintenance',
        data: { breadcrumb: 'Creditor Type Maintenance' },
      },
      {
        path: 'currency-maintenance',
        component: CurrencyMaintenanceComponent,
        title: 'Currency Maintenance',
        data: { breadcrumb: 'Currency Maintenance' },
      },
      {
        path: 'debtor-type-maintenance',
        component: DebtorTypeMaintenanceComponent,
        title: 'Debtor Type Maintenance',
        data: { breadcrumb: 'Debtor Type Maintenance' },
      },
      {
        path: 'document-numbering-format-maintenance',
        component: DocumentNumberingFormatProComponent,
        title: 'Document Numbering Format Maintenance',
        data: { breadcrumb: 'Document Numbering Format Maintenance' },
      },
      {
        path: 'journal-type-maintenance',
        component: JournalTypeMaintenanceComponent,
        title: 'Journal Type Maintenance',
        data: { breadcrumb: 'Journal Type Maintenance' },
      },
      {
        path: 'last-year-balance-maintenance',
        component: LastYearBalanceMaintenanceComponent,
        title: 'Last Year Balance Maintenance',
        data: { breadcrumb: 'Last Year Balance Maintenance' },
      },
    ],
  },

  // ===== General Ledger (G/L) =====
  {
    path: 'general-ledger',
    canActivate: [authGuard],
    data: { breadcrumb: 'General Ledger (G/L)' },
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: DashboardPageComponent,
        title: 'General Ledger (G/L)',
      },
      {
        path: 'account-maintenance',
        component: AccountMaintenanceComponent,
        title: 'Account Maintenance',
        data: { breadcrumb: 'Account Maintenance' },
      },
      {
        path: 'balance-sheet-statement',
        component: BalanceSheetComponent,
        title: 'Balance Sheet Statement',
        data: { breadcrumb: 'Balance Sheet Statement' },
      },
      {
        path: 'bank-reconciliation',
        component: BankReconciliationComponent,
        title: 'Bank Reconciliation',
        data: { breadcrumb: 'Bank Reconciliation' },
      },
      {
        path: 'cash-book-entry',
        component: CashBookEntryComponent,
        title: 'Cash Book Entry',
        data: { breadcrumb: 'Cash Book Entry' },
      },
      {
        path: 'journal-entry',
        component: JournalEntryComponent,
        title: 'Journal Entry',
        data: { breadcrumb: 'Journal Entry' },
      },
      {
        path: 'journal-of-transaction-report',
        component: JournalOfTransactionReportComponent,
        title: 'Journal of Transaction Report',
        data: { breadcrumb: 'Journal of Transaction Report' },
      },
      {
        path: 'opening-balance-maintenance',
        component: OpeningBalanceMaintenanceComponent,
        title: 'Opening Balance Maintenance',
        data: { breadcrumb: 'Opening Balance Maintenance' },
      },
      {
        path: 'profit-and-loss-statement',
        component: ProfitAndLossComponent,
        title: 'Profit and Loss Statement',
        data: { breadcrumb: 'Profit and Loss Statement' },
      },
      {
        path: 'ledger-report',
        component: LedgerReportComponent,
        title: 'Ledger Report',
        data: { breadcrumb: 'Ledger Report' },
      },
      {
        path: 'stock-value-maintenance',
        component: StockValueMaintenanceComponent,
        title: 'Stock Value Maintenance',
        data: { breadcrumb: 'Stock Value Maintenance' },
      },
      {
        path: 'trial-balance-report',
        component: TrialBalanceReportComponent,
        title: 'Trial Balance Report',
        data: { breadcrumb: 'Trial Balance Report' },
      },
      {
        path: 'view-transaction-summary',
        component: ViewTransactionSummaryComponent,
        title: 'View Transaction Summary',
        data: { breadcrumb: 'View Transaction Summary' },
      },
    ],
  },

  // ===== Accounts Payable (A/P) =====
  {
    path: 'ap',
    canActivate: [authGuard],
    data: { breadcrumb: 'Accounts Payable (A/P)' },
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: DashboardPageComponent,
        title: 'Accounts Payable (A/P)',
      },
      {
        path: 'credit-note-entry',
        component: ApCreditNotePageComponent,
        title: 'Credit Note Entry',
        data: { breadcrumb: 'Credit Note Entry' },
      },
      {
        path: 'creditor-aging-report',
        component: CreditorAgingReportComponent,
        title: 'Creditor Aging Report',
        data: { breadcrumb: 'Creditor Aging Report' },
      },
      {
        path: 'creditor-maintenance',
        component: CreditorMaintenanceComponent,
        title: 'Creditor Maintenance',
        data: { breadcrumb: 'Creditor Maintenance' },
      },
      {
        path: 'creditor-statement-report',
        component: CreditorStatementReportComponent,
        title: 'Creditor Statement Report',
        data: { breadcrumb: 'Creditor Statement Report' },
      },
      {
        path: 'debit-note-entry',
        component: ApDebitNotePageComponent,
        title: 'Debit Note Entry',
        data: { breadcrumb: 'Debit Note Entry' },
      },
      {
        path: 'invoice-entry',
        component: ApInvoicePageComponent,
        title: 'A/P Invoice Entry',
        data: { breadcrumb: 'A/P Invoice Entry' },
      },
      {
        path: 'outstanding-ap-invoice-report',
        component: ApOutstandingReportComponent,
        title: 'Outstanding A/P Invoice Report',
        data: { breadcrumb: 'Outstanding A/P Invoice Report' },
      },
      {
        path: 'payment',
        component: ApPaymentPageComponent,
        title: 'A/P Payment',
        data: { breadcrumb: 'A/P Payment' },
      },
    ],
  },

  // ===== Accounts Receivable (A/R) =====
  {
    path: 'ar',
    canActivate: [authGuard],
    data: { breadcrumb: 'Accounts Receivable (A/R)' },
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: DashboardPageComponent,
        title: 'Accounts Receivable (A/R)',
      },
      {
        path: 'contra-entry',
        component: ArApContraPageComponent,
        title: 'A/R and A/P Contra Entry',
        data: { breadcrumb: 'A/R and A/P Contra Entry' },
      },
      {
        path: 'credit-note-entry',
        component: ArCreditNotePageComponent,
        title: 'Credit Note Entry',
        data: { breadcrumb: 'Credit Note Entry' },
      },
      {
        path: 'debit-note-entry',
        component: ArDebitNotePageComponent,
        title: 'Debit Note Entry',
        data: { breadcrumb: 'Debit Note Entry' },
      },
      {
        path: 'debtor-aging-report',
        component: DebtorAgingReportComponent,
        title: 'Debtor Aging Report',
        data: { breadcrumb: 'Debtor Aging Report' },
      },
      {
        path: 'debtor-collection-report',
        component: DebtorCollectionReportComponent,
        title: 'Debtor Collection Report',
        data: { breadcrumb: 'Debtor Collection Report' },
      },
      {
        path: 'debtor-maintenance',
        component: DebtorMaintenanceComponent,
        title: 'Debtor Maintenance',
        data: { breadcrumb: 'Debtor Maintenance' },
      },
      {
        path: 'debtor-statement-report',
        component: DebtorStatementReportComponent,
        title: 'Debtor Statement Report',
        data: { breadcrumb: 'Debtor Statement Report' },
      },
      {
        path: 'invoice-entry',
        component: ArInvoicePageComponent,
        title: 'A/R Invoice Entry',
        data: { breadcrumb: 'A/R Invoice Entry' },
      },
      {
        path: 'outstanding-ar-invoice-report',
        component: ArOutstandingReportComponent,
        title: 'Outstanding A/R Invoice Report',
        data: { breadcrumb: 'Outstanding A/R Invoice Report' },
      },
      {
        path: 'receive-payment',
        component: ArReceivePaymentPageComponent,
        title: 'A/R Receive Payment',
        data: { breadcrumb: 'A/R Receive Payment' },
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
