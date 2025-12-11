import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface SettingsLink {
  label: string;
  description: string;
  path: string;
}

interface SettingsSection {
  title: string;
  links: SettingsLink[];
}

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss'],
})
export class SettingsPageComponent {
  sections: SettingsSection[] = [
    {
      title: 'General Maintenance',
      links: [
        {
          label: 'Company Profile',
          description: "Update your organisation's name, logo & contact info.",
          path: '/settings/company-profile',
        },
        {
          label: 'Account Type Maintenance',
          description:
            'Maintain account types & reporting categories in your chart of accounts.',
          path: '/settings/account-type-maintenance',
        },
        {
          label: 'Creditor Type Maintenance',
          description: 'Maintain creditor types.',
          path: '/settings/creditor-type-maintenance',
        },
        {
          label: 'Currency Maintenance',
          description: 'Maintain foreign currencies and exchange settings.',
          path: '/settings/currency-maintenance',
        },
        {
          label: 'Debtor Type Maintenance',
          description: 'Maintain debtor types.',
          path: '/settings/debtor-type-maintenance',
        },
        {
          label: 'Document Numbering Format Maintenance',
          description: 'Configure numbering formats for documents & vouchers.',
          path: '/settings/document-numbering-format-maintenance',
        },
        {
          label: 'Journal Type Maintenance',
          description: 'Maintain journal types for G/L entries.',
          path: '/settings/journal-type-maintenance',
        },
        {
          label: 'Last Year Balance Maintenance',
          description: 'Maintain last year opening balances.',
          path: '/settings/last-year-balance-maintenance',
        },
      ],
    },
  ];
}
