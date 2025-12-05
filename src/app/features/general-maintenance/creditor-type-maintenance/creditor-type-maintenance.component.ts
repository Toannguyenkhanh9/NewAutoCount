import {
  Component,
  ElementRef,
  Renderer2,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
type YesNo = 'Yes' | 'No';

export interface CreditorTypeRow {
  typeCode: string;
  description: string;
  description2nd: string;
  active: boolean;
}

@Component({
  selector: 'app-creditor-type-maintenance',
  templateUrl: './creditor-type-maintenance.component.html',
  styleUrls: ['./creditor-type-maintenance.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class CreditorTypeMaintenanceComponent
  implements AfterViewInit, OnDestroy
{
  /** Search box */
  q = '';
  showDeleteConfirm = false;
  /** Danh sách dữ liệu giả lập (mock) */
  rows: CreditorTypeRow[] = [
    {
      typeCode: 'IMPORT',
      description: 'IMPORT',
      description2nd: '',
      active: true,
    },
    {
      typeCode: 'MANUF',
      description: 'MANUFACTURER',
      description2nd: '',
      active: true,
    },
    {
      typeCode: 'OTHER',
      description: 'OTHER CREDITORS',
      description2nd: '',
      active: true,
    },
    {
      typeCode: 'OVERSEA',
      description: 'OVERSEA SUPPLIER',
      description2nd: '',
      active: false,
    },
    {
      typeCode: 'WSALE',
      description: 'WHOLESALER',
      description2nd: '',
      active: false,
    },
  ];

  /** Dòng đang chọn trong bảng */
  selectedIndex: number | null = null;

  /** Modal state */
  showModal = false;
  isEditing = false;
  showSuccess = false;
  successMsg = 'Saved successfully.';

  openSuccess(msg = 'Saved successfully.') {
    this.successMsg = msg;
    this.showSuccess = true;
    // tự tắt sau 1500ms (có thể chỉnh)
    setTimeout(() => (this.showSuccess = false), 1500);
  }
  closeSuccess() {
    this.showSuccess = false;
  }

  /** Object bind với form trong modal */
  editing: {
    typeCode: string;
    description: string;
    description2nd: string;
    active: YesNo;
  } = this.blankEditing();

  /** Lưu lại mã typeCode gốc khi Edit để tìm đúng phần tử cập nhật */
  private originalTypeCode: string | null = null;

  /** Root div của modal. Sẽ được move ra body để tránh mọi stacking-context */
  @ViewChild('modalRoot', { static: true })
  modalRoot!: ElementRef<HTMLDivElement>;
  private movedToBody = false;

  constructor(private r2: Renderer2) {}

  // ================== Life-cycle ==================
  ngAfterViewInit(): void {
    // Move modal ra hẳn body => fixed & z-index hoạt động đúng, không bị “vệt mờ”
    if (this.modalRoot?.nativeElement && !this.movedToBody) {
      this.r2.appendChild(document.body, this.modalRoot.nativeElement);
      this.movedToBody = true;
    }
  }

  ngOnDestroy(): void {
    // Trả modal về nếu component bị destroy
    if (this.movedToBody && this.modalRoot?.nativeElement?.parentNode) {
      this.r2.removeChild(document.body, this.modalRoot.nativeElement);
      this.movedToBody = false;
    }
    // Tránh kẹt class nếu destroy khi modal mở
    document.body.classList.remove('modal-open');
  }

  // Thoát modal bằng phím ESC
  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.showModal) this.closeModal();
  }

  // ================== Helpers ==================
  blankEditing() {
    return {
      typeCode: '',
      description: '',
      description2nd: '',
      active: 'Yes' as YesNo,
    };
  }

  filteredRows(): CreditorTypeRow[] {
    const k = (this.q || '').trim().toLowerCase();
    if (!k) return this.rows;
    return this.rows.filter(
      (r) =>
        r.typeCode.toLowerCase().includes(k) ||
        r.description.toLowerCase().includes(k)
    );
  }

  // ================== Table interactions ==================
  onRowClick(i: number): void {
    this.selectedIndex = this.selectedIndex === i ? null : i;
  }
  canDelete(): boolean {
    return this.selectedRow !== null;
  }
  onDelete() {
    if (!this.selectedRow) return;
    this.showDeleteConfirm = true;
  }
  confirmDelete(): void {
    const r = this.selectedRow;
    if (!r) return;
    this.deleteRow(r);
    this.closeDeleteConfirm();
  }
  get selectedRow(): CreditorTypeRow | null {
    if (this.selectedIndex == null) return null;
    const list = this.filteredRows();
    return list[this.selectedIndex] ?? null;
  }

  // ================== CRUD ==================
  openNew(): void {
    this.isEditing = false;
    this.originalTypeCode = null;
    this.editing = this.blankEditing();
    this.openModal();
  }

  openEditFromRow(row: CreditorTypeRow): void {
    this.isEditing = true;
    this.originalTypeCode = row.typeCode;
    this.editing = {
      typeCode: row.typeCode,
      description: row.description,
      description2nd: row.description2nd,
      active: row.active ? 'Yes' : 'No',
    };
    this.openModal();
  }

  openEdit(): void {
    const row = this.selectedRow;
    if (!row) return;
    this.openEditFromRow(row);
  }

  deleteRow(row?: CreditorTypeRow): void {
    const r = row ?? this.selectedRow;
    if (!r) return;

    const idx = this.rows.findIndex((x) => x.typeCode === r.typeCode);
    if (idx >= 0) {
      this.rows.splice(idx, 1);
      this.selectedIndex = null;
    }
  }

  refresh(): void {
    // Demo: không làm gì. Thực tế bạn call API rồi cập nhật rows.
  }
  triedSave = false;
  // Lưu form modal
  save(typeCodeInput?: HTMLInputElement) {
    this.triedSave = true;

    // Bắt buộc nhập Creditor Type
    if (!this.editing.typeCode || !this.editing.typeCode.trim()) {
      // focus lại ô nhập để người dùng sửa
      setTimeout(() => typeCodeInput?.focus(), 0);
      return;
    }

    // (tuỳ ý) chuẩn hoá mã type: trim + upper-case
    this.editing.typeCode = this.editing.typeCode.trim().toUpperCase();
    const activeBool = this.editing.active === 'Yes';

    const payload: CreditorTypeRow = {
      typeCode: (this.editing.typeCode || '').trim(),
      description: (this.editing.description || '').trim(),
      description2nd: (this.editing.description2nd || '').trim(),
      active: activeBool,
    };

    if (!payload.typeCode) {
      // Tránh tạo bản ghi rỗng
      return;
    }

    if (this.isEditing && this.originalTypeCode) {
      const idx = this.rows.findIndex(
        (r) => r.typeCode === this.originalTypeCode
      );
      if (idx >= 0) this.rows[idx] = payload;
    } else {
      // Nếu đã tồn tại mã => cập nhật, không thì push
      const idx = this.rows.findIndex((r) => r.typeCode === payload.typeCode);
      if (idx >= 0) {
        this.rows[idx] = payload;
        alert('Creditor Type ' + '"' + payload.typeCode + '"' + ' already exists.');
        return;
      }
      else this.rows.push(payload);
    }
    this.selectedIndex = null;
    this.closeModal();
    const msg = this.isEditing
      ? 'Updated successfully.'
      : 'Created successfully.';
    this.openSuccess(msg);
  }
  closeDeleteConfirm() {
    this.showDeleteConfirm = false;
  }

  // ================== Modal control ==================
  openModal(): void {
    this.showModal = true;
    document.body.classList.add('modal-open');
  }

  closeModal(): void {
    this.showModal = false;
    document.body.classList.remove('modal-open');
  }
}
