// src/app/features/gl/gl-journal-list-page.component.ts
import { Component } from '@angular/core';
import { NgFor } from '@angular/common';

interface JournalRow {
  type: string;
  no: string;
  date: string;
  description: string;
  netTotal: number;
}

@Component({
  selector: 'app-gl-journal-list-page',
  standalone: true,
  imports: [NgFor],
  templateUrl: './gl-journal-list-page.component.html',
  styleUrls: ['./gl-journal-list-page.component.scss'],
})
export class GlJournalListPageComponent {
  rows: JournalRow[] = [
    {
      type: 'JV',
      no: 'JV-202511-0001',
      date: '2025-11-05',
      description: 'Posted from A/R and A/P Contra',
      netTotal: 8800,
    },
    {
      type: 'JV',
      no: 'JV-202511-0002',
      date: '2025-11-09',
      description: 'Tax',
      netTotal: 1000,
    },
    {
      type: 'JV',
      no: 'JV-202511-0003',
      date: '2025-11-10',
      description: 'DISPOSAL OF MOTOR VEHICLES',
      netTotal: 70700,
    },
    {
      type: 'JV',
      no: 'JV-202511-0004',
      date: '2025-11-12',
      description: 'DEPRECIATION 09/2009',
      netTotal: 900,
    },
  ];

  get total() {
    return this.rows.reduce((s, r) => s + r.netTotal, 0);
  }
}
