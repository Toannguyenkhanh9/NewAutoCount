import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Item {
  code: string;
  name: string;
  uom: string;
}
interface StockValueRow {
  itemCode: string;
  itemName: string;
  uom: string;
  warehouse: string;
  asOf: string;   // yyyy-MM-dd
  qty: number;
  unitCost: number;
  value: number;  // qty * unitCost
  remark?: string;
}

@Component({
  selector: 'app-stock-value-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-value-maintenance.component.html',
  styleUrls: ['./stock-value-maintenance.component.scss'],
})
export class StockValueMaintenanceComponent {
  // search
  q = '';

  // warehouses & items demo
  warehouses = ['Main Warehouse', 'Outlet A', 'Raw Materials', 'Finished Goods'];
  items: Item[] = [
    { code: 'ITM-0001', name: 'iPhone 14 128GB', uom: 'Unit' },
    { code: 'ITM-0002', name: 'Samsung S23 256GB', uom: 'Unit' },
    { code: 'ITM-0003', name: 'Xiaomi Redmi 13', uom: 'Unit' },
    { code: 'ITM-0004', name: 'USB-C Cable 1m', uom: 'Piece' },
    { code: 'ITM-0005', name: 'Power Adapter 20W', uom: 'Piece' },
  ];

  // sample rows
  rows: StockValueRow[] = [
    { itemCode: 'ITM-0001', itemName: 'iPhone 14 128GB', uom: 'Unit', warehouse: 'Main Warehouse',    asOf: '2025-01-01', qty: 10, unitCost: 850,  value: 8500,  remark: 'B/F' },
    { itemCode: 'ITM-0002', itemName: 'Samsung S23 256GB', uom: 'Unit', warehouse: 'Main Warehouse',  asOf: '2025-01-01', qty: 8,  unitCost: 790,  value: 6320,  remark: '' },
    { itemCode: 'ITM-0003', itemName: 'Xiaomi Redmi 13', uom: 'Unit', warehouse: 'Outlet A',         asOf: '2025-01-01', qty: 15, unitCost: 230,  value: 3450,  remark: '' },
    { itemCode: 'ITM-0004', itemName: 'USB-C Cable 1m', uom: 'Piece', warehouse: 'Raw Materials',     asOf: '2025-01-01', qty: 60, unitCost: 2.5,  value: 150,   remark: '' },
    { itemCode: 'ITM-0005', itemName: 'Power Adapter 20W', uom: 'Piece', warehouse: 'Finished Goods', asOf: '2025-01-01', qty: 30, unitCost: 9.8,  value: 294,   remark: '' },
  ];

  // selection
  selected: StockValueRow | null = null;

  // modal state
  showModal = false;
  isEdit = false;

  // form model
  form: StockValueRow = this.empty();

  private todayISO(): string {
    const t = new Date();
    const d = new Date(t.getTime() - t.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 10);
  }

  empty(): StockValueRow {
    return {
      itemCode: '',
      itemName: '',
      uom: '',
      warehouse: this.warehouses[0],
      asOf: this.todayISO(),
      qty: 0,
      unitCost: 0,
      value: 0,
      remark: '',
    };
  }

  filtered(): StockValueRow[] {
    const s = this.q.trim().toLowerCase();
    if (!s) return this.rows;
    return this.rows.filter(r => (r.itemCode + ' ' + r.itemName + ' ' + r.warehouse + ' ' + (r.remark || '')).toLowerCase().includes(s));
  }

  // totals
  totalQty()   { return this.filtered().reduce((t, r) => t + (Number(r.qty) || 0), 0); }
  totalValue() { return this.filtered().reduce((t, r) => t + (Number(r.value) || 0), 0); }

  // toolbar actions
  onNew() { this.isEdit = false; this.form = this.empty(); this.open(); }
  onEdit() {
    if (!this.selected) return;
    this.isEdit = true;
    this.form = { ...this.selected };
    this.open();
  }
  onDelete() {
    if (!this.selected) return;
    this.rows = this.rows.filter(r => r !== this.selected);
    this.selected = null;
  }
  onImport() { alert('Demo: Import not implemented.'); }
  onExport() { alert('Demo: Export not implemented.'); }
  onRefresh() { /* no-op demo */ }
  onPrint() { window.print(); }

  // row select
  pick(r: StockValueRow) { this.selected = r; }
  isPicked(r: StockValueRow) { return this.selected === r; }
  trackByKey(_: number, r: StockValueRow) { return r.itemCode + '|' + r.warehouse + '|' + r.asOf; }

  // modal
  open()  { this.showModal = true; }
  close() { this.showModal = false; }

  onItemChange() {
    const it = this.items.find(x => x.code === this.form.itemCode);
    this.form.itemName = it?.name || '';
    this.form.uom = it?.uom || '';
  }

  normalizeNumbers() {
    this.form.qty = Number(this.form.qty) || 0;
    this.form.unitCost = Number(this.form.unitCost) || 0;
    this.form.value = +(this.form.qty * this.form.unitCost).toFixed(2);
  }

  save() {
    if (!this.form.itemCode) { alert('Item Code is required'); return; }
    if (!this.form.warehouse) { alert('Warehouse is required'); return; }
    if (!this.form.asOf) { alert('As of Date is required'); return; }

    this.normalizeNumbers();

    if (this.isEdit) {
      const idx = this.rows.findIndex(r =>
        r.itemCode === this.form.itemCode &&
        r.warehouse === this.form.warehouse &&
        r.asOf === this.form.asOf
      );
      if (idx >= 0) this.rows[idx] = { ...this.form };
    } else {
      // tránh trùng key (itemCode-warehouse-asOf)
      const exists = this.rows.some(r =>
        r.itemCode === this.form.itemCode &&
        r.warehouse === this.form.warehouse &&
        r.asOf === this.form.asOf
      );
      if (exists) {
        alert('This item already has a stock value on the same date for the same warehouse.');
        return;
      }
      this.rows = [...this.rows, { ...this.form }];
    }
    this.close();
  }
}
