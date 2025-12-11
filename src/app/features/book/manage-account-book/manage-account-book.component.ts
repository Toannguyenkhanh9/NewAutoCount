import { Component, signal, inject, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { Subscription, finalize } from 'rxjs';
import { ListServerRes } from '../../../_share/models/account';
import { ApiHttpService } from '../../../core/services/api-http.service';
import { ServerSessionService } from '../../../core/services/server-session.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
type AccountBook = {
  company: string;
  remark: string;
  version: string;
  server: string;
  db: string;
};
type CreateForm = {
  company: string;
  remark: string;
  version: string;
  server: string;
  db: string;
};

@Component({
  selector: 'app-manage-account-book',
  standalone: true, // <-- Standalone
  imports: [CommonModule, ReactiveFormsModule, FormsModule], // <-- Tự import cho template
  templateUrl: './manage-account-book.component.html',
  styleUrls: ['./manage-account-book.component.scss'],
})
export class ManageAccountBookComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private api = inject(ApiHttpService);
  private cdr = inject(ChangeDetectorRef);
  private subscriptions$: Subscription[] = [];
  selectedIndex: number | null = null;
  get selectedItem(): ListServerRes | null {
    return this.selectedIndex !== null ? this.listserver[this.selectedIndex] : null;
  }
  isLoading = signal(false);
  listserver: ListServerRes[] = [];
  // Dialog state
  showCreate = false;
  showSetupNewDb = false;
  showDeleteConfirm = false;
  showEditDone = false;
  showEdit = false;
  showAttach = false;
  showAttachDone = false;

  showDetachConfirm = false;
  showDetachAuth = false;
  showDetachDone = false;
  detaching = false;

  showDeleteConfirm1 = false;
  showDeleteConfirm2 = false;
  showDeleteAuth = false;
  showDeleteDone = false;
  deleting = false;
  serverList: string[] = [];
  databaseList: string[] = [];
  private dbByServer: Record<string, string[]> = {};

  // DỮ LIỆU MẪU (dùng khi chưa build được từ listserver)
  private readonly sampleDbByServer: Record<string, string[]> = {
    'LOCALHOST\\SQLEXPRESS': ['SdnDatabase', 'DemoBook', 'MyCo_2025'],
    '192.168.0.172': ['Accounting', 'ERP', 'Warehouse'],
    'sql-prod-01.mycorp.local': ['AC_2025', 'AC_Archive'],
  };
  private buildServerLists(): void {
    const map: Record<string, string[]> = {};

    // if (Array.isArray(this.listserver) && this.listserver.length) {
    //   for (const r of this.listserver) {
    //     const s = (r.Server ?? '').trim();
    //     const d = (r.Database ?? '').trim();
    //     if (!s) continue;
    //     if (!map[s]) map[s] = [];
    //     if (d && !map[s].includes(d)) map[s].push(d);
    //   }
    //   // sort từng danh sách DB
    //   for (const k in map) map[k].sort();
    //   this.dbByServer = map;
    // } else {
    // fallback dữ liệu mẫu khi chưa có list thật
    this.dbByServer = { ...this.sampleDbByServer };
    // }

    this.serverList = Object.keys(this.dbByServer).sort();
  }

  // form edit
  editForm: FormGroup;
  attachForm: FormGroup;
  detachAdminForm: FormGroup;
  deleteAdminForm: FormGroup;
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private session: ServerSessionService
  ) {
    this.editForm = this.fb.group({
      Id: [''],
      Company: ['', [Validators.required, Validators.minLength(2)]],
      Remark: [''],
      Version: [''],
      Server: [''],
      Database: [''],
      SaPassword: [''],
    });
    this.attachForm = this.fb.group({
      serverName: ['', Validators.required],
      loginMode: ['sa' as 'sa' | 'custom'], // 'sa' hoặc 'custom'
      userName: [{ value: 'sa', disabled: true }], // mặc định SA, disable khi 'sa'
      password: [{ value: '', disabled: true }],
      databaseName: ['', Validators.required],
    });
    this.detachAdminForm = this.fb.group({
      userId: [{ value: 'ADMIN', disabled: true }],
      password: ['', Validators.required],
    });
    this.deleteAdminForm = this.fb.group({
      userId: [{ value: 'ADMIN', disabled: true }],
      password: ['', Validators.required],
    });
  }
  isCurrent(row: ListServerRes): boolean {
    const ctx = this.session.get();
    if (!ctx || !row) return false;

    // Ưu tiên so Id nếu có
    const rowId = row.Id != null ? String(row.Id) : null;
    const ctxId = ctx.companyId != null ? String(ctx.companyId) : null;
    if (rowId && ctxId && rowId === ctxId) return true;
    return false;

    // // fallback so sánh server + database
    // const s1 = (row.Server ?? '').trim().toLowerCase();
    // const d1 = (row.Database ?? '').trim().toLowerCase();
    // const s2 = (ctx.server ?? '').trim().toLowerCase();
    // const d2 = (ctx.database ?? '').trim().toLowerCase();
    // return !!s1 && !!d1 && s1 === s2 && d1 === d2;
  }
  select(i: number) {
    this.selectedIndex = i;
  }

  // ----- DELETE -----
  openDeleteConfirm() {
    if (this.selectedItem) this.showDeleteConfirm = true;
  }
  closeDeleteConfirm() {
    this.showDeleteConfirm = false;
  }
  confirmDelete() {
    if (!this.selectedItem) return;

    const target = this.selectedItem;
    const id = this.selectedItem.Id;

    this.api.delete<void>(`/api/books/${id}`).subscribe({
      next: () => {
        // đóng popup, báo done
        this.showDeleteAuth = false;
        this.showDeleteDone = true;
        this.showDeleteConfirm = false;
        this.selectedIndex = null;

        // load lại list server
        this.getListServer();

        // nếu xóa company đang login thì logout luôn
        if (target && this.isCurrent(target)) {
          this.authService.logout();
          return;
        }
      },
      error: (err) => {
        console.error(err);
        alert(err?.message || 'Delete failed');
      },
    });
  }

  // ----- EDIT -----
  openEdit() {
    if (!this.selectedItem) return;

    this.buildServerLists();
    this.editForm.reset({
      Id: String(this.selectedItem.Id ?? ''),
      Company: this.selectedItem.Company ?? '',
      Remark: this.selectedItem.Remark ?? '',
      Version: this.selectedItem.Version ?? '',
      Server: this.selectedItem.Server ?? '',
      Database: this.selectedItem.Database ?? '',
      SaPassword: '',
    });

    this.showEdit = true;
  }
  onServerChange() {
    const sv = String(this.editForm.get('Server')!.value ?? '');
    this.databaseList = this.dbByServer[sv] ?? [];
    this.editForm.get('Database')!.setValue(this.databaseList[0] ?? '');
  }
  onServerChangeAttach() {
    const s = String(this.attachForm.get('serverName')!.value || '');
    this.databaseList = this.sampleDbByServer[s] ?? [];
    if (!this.databaseList.includes(String(this.attachForm.get('databaseName')!.value || ''))) {
      this.attachForm.get('databaseName')!.setValue(this.databaseList[0] ?? '');
    }
  }
  closeEdit() {
    this.showEdit = false;
  }
  closeEditDone() {
    this.showEditDone = false;
  }

  saveEdit() {
    if (this.editForm.invalid || this.selectedIndex === null) return;
    if (!this.selectedItem) return;

    const id = this.selectedItem.Id;

    const updated: ListServerRes = {
      ...this.listserver[this.selectedIndex],
      ...this.editForm.value,
    };

    this.api.put<any>(`/api/books/${id}`, updated).subscribe({
      next: (res) => {
        this.showEditDone = true;
        // load lại danh sách từ server để sync
        this.getListServer();
        this.showEdit = false;
      },
      error: (err) => {
        console.error(err);
        alert(err?.message || 'Edit failed');
      },
    });
  }
  attach() {
    this.openAttach();
  }
  availableServers: string[] = [];
  availableDatabases: string[] = []; // nếu bạn đang gọi (click)="attach()"
  openAttach() {
    this.showAttach = true;

    // Build dropdown từ dữ liệu (ví dụ mẫu)
    this.serverList = Object.keys(this.sampleDbByServer);
    const firstServer = this.serverList[0] ?? '';
    this.databaseList = this.sampleDbByServer[firstServer] ?? [];

    // Nếu form chưa có giá trị -> set mặc định; nếu có thì giữ nguyên
    if (!this.attachForm.get('serverName')!.value) {
      this.attachForm.patchValue(
        {
          serverName: firstServer,
          databaseName: this.databaseList[0] ?? '',
          loginMode: 'sa',
        },
        { emitEvent: false }
      );
    }
  }
  get loginMode(): 'sa' | 'custom' {
    return (this.attachForm.get('loginMode')!.value as 'sa' | 'custom') || 'sa';
  }
  closeAttach() {
    this.showAttach = false;
  }
  attachSubmit() {
    this.showAttach = false;
    this.showAttachDone = true;
  }
  closeAttachDone() {
    this.showAttachDone = false;
  }

  // đổi login mode
  onLoginModeChange() {
    const mode = this.attachForm.get('loginMode')!.value as 'sa' | 'custom';
    if (mode === 'sa') {
      this.attachForm.get('userName')!.disable({ emitEvent: false });
      this.attachForm.get('password')!.disable({ emitEvent: false });
      this.attachForm.get('userName')!.setValue('sa', { emitEvent: false });
      this.attachForm.get('password')!.setValue('', { emitEvent: false });
    } else {
      this.attachForm.get('userName')!.enable({ emitEvent: false });
      this.attachForm.get('password')!.enable({ emitEvent: false });
      // để trống để người dùng nhập
      this.attachForm.get('userName')!.setValue('', { emitEvent: false });
      this.attachForm.get('password')!.setValue('', { emitEvent: false });
    }
  }
  getAvailableServers() {
    // TODO: gọi API thực tế để scan SQL Server nếu có
    this.availableServers = Object.keys(this.sampleDbByServer);
  }

  // chọn một server từ dropdown gợi ý
  pickServer(s: string) {
    if (!s) return;
    this.attachForm.get('serverName')!.setValue(s);
    this.availableDatabases = this.sampleDbByServer[s] ?? [];
    // nếu có DB đầu tiên, gợi ý luôn
    if (this.availableDatabases.length && !this.attachForm.get('databaseName')!.value) {
      this.attachForm.get('databaseName')!.setValue(this.availableDatabases[0]);
    }
  }

  // chọn DB từ dropdown gợi ý
  pickDatabase(d: string) {
    if (!d) return;
    this.attachForm.get('databaseName')!.setValue(d);
  }

  // attach file (demo)
  attachDatabaseFile() {
    // TODO: mở file picker / gọi API attach .mdf/.ldf nếu bạn có
    alert('Attach Database File not implemented');
  }

  // OK
  confirmAttach() {
    if (this.attachForm.invalid) {
      this.attachForm.markAllAsTouched();
      return;
    }
    const raw = this.attachForm.getRawValue();
    const payload = {
      server: raw.serverName,
      database: raw.databaseName,
      loginMode: raw.loginMode,
      user: raw.loginMode === 'sa' ? 'sa' : raw.userName,
      password: raw.loginMode === 'sa' ? '' : raw.password,
    };

    // TODO: gọi API thực tế để attach

    this.showAttach = false;
    // có thể refresh list sau khi attach
    // this.refresh();
  }
  // Actions
  openCreate(): void {
    this.showCreate = true;
  }
  closeCreate(): void {
    this.showCreate = false;
  }

  create() {}
  refresh(): void {
    this.getListServer();
  }
  detach(): void {
    this.openDetach();
  }

  trackRow(_i: number, r: AccountBook) {
    return `${r.server}::${r.db}`;
  }
  ngOnInit(): void {
    this.getListServer();
    // đồng bộ trạng thái ngay khi mở form
    this.onLoginModeChange();

    // theo dõi thay đổi radio
    this.attachForm.get('loginMode')!.valueChanges.subscribe(() => this.onLoginModeChange());
  }
  ngOnDestroy() {
    this.subscriptions$.forEach((sb) => sb.unsubscribe());
  }
  getListServer(): void {
    this.isLoading.set(true);

    this.subscriptions$.push(
      this.api
        .get<any[]>('/api/books/get-list-server')
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (res) => {
            this.listserver = Array.isArray(res) ? res : res ? [res] : [];
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error(err);
            this.listserver = [];
            this.cdr.markForCheck();
          },
        })
    );
  }
  closeCodeDialogSetupNewDb() {
    this.showCreate = false;
    this.getListServer();
    this.cdr.markForCheck();
  }
  openDetach() {
    if (!this.selectedItem) return;
    this.showDetachConfirm = true;
  }

  // đóng toàn bộ (khi bấm No/Cancel)
  closeDetachFlow() {
    this.showDetachConfirm = false;
    this.showDetachAuth = false;
    this.detaching = false;
    this.detachAdminForm.get('password')!.reset('');
  }

  // Yes ở bước 1 -> sang bước 2
  proceedDetach() {
    this.showDetachConfirm = false;
    this.showDetachAuth = true;
  }

  // Submit bước 2
  submitDetach() {
    if (this.detachAdminForm.invalid || !this.selectedItem) return;
    this.detaching = true;
    const pwd = this.detachAdminForm.getRawValue().password;

    // gọi API detach (viết trong service của bạn)
    // this.manageAccountBookService
    //   .detachBook(this.selectedItem.Id, { admin: 'ADMIN', password: pwd })
    //   .pipe(finalize(() => (this.detaching = false)))
    //   .subscribe({
    //     next: () => {
    //       this.showDetachAuth = false;
    //       this.showDetachDone = true;   // show thông báo thành công
    //       this.selectedIndex = null;
    //       this.getListServer();         // refresh danh sách
    //     },
    //     error: (err) => {
    //       alert(err?.message || 'Detach failed');
    //     },
    //   });
  }
  detachSubmit() {
    this.showDetachAuth = false;
    this.showDetachDone = true;
    if (!this.selectedItem) return;
    const target = this.selectedItem;
    if (target && this.isCurrent(target)) {
      this.authService.logout();
      return;
    }
  }

  // đóng popup “done”
  closeDetachDone() {
    this.showDetachDone = false;
  }
  openDeleteFlow() {
    if (!this.selectedItem) return;
    this.showDeleteConfirm1 = true;
  }

  // Confirm #1 -> #2
  goDeleteStep2() {
    this.showDeleteConfirm1 = false;
    this.showDeleteConfirm2 = true;
  }

  // Confirm #2 -> nhập ADMIN
  proceedDeleteAuth() {
    this.showDeleteConfirm2 = false;
    this.deleteAdminForm.reset({ userId: 'ADMIN', password: '' });
    this.showDeleteAuth = true;
  }

  // Hủy toàn bộ flow
  closeDeleteFlow() {
    this.showDeleteConfirm1 = false;
    this.showDeleteConfirm2 = false;
    this.showDeleteAuth = false;
    this.deleting = false;
    this.deleteAdminForm.reset({ userId: 'ADMIN', password: '' });
  }
  closeDeleteDone() {
    this.showDeleteDone = false;
  }
  // listserver hiện có rồi – dùng để sort
  get sortedList(): any[] {
    if (!this.listserver) {
      return [];
    }
    const copy = [...this.listserver];
    copy.sort((a, b) => {
      const aCur = this.isCurrent(a);
      const bCur = this.isCurrent(b);
      if (aCur === bCur) return 0;
      return aCur ? -1 : 1; // current lên đầu
    });
    return copy;
  }

  /** Row click trong grid: company current thì bỏ qua, các company khác gọi select() */
  onRowClick(row: any): void {
    if (this.isCurrent(row)) {
      return; // không cho click company đang login
    }
    const idx = this.listserver.findIndex(
      (x: any) => x.Database === row.Database && x.Server === row.Server
    );
    if (idx >= 0) {
      this.select(idx); // dùng hàm select(index) cũ để set selectedItem, selectedIndex...
    }
  }

  /** Kiểm tra row đang được chọn (dùng cho CSS row-selected) */
  isSelected(row: any): boolean {
    return (
      !!this.selectedItem &&
      this.selectedItem.Database === row.Database &&
      this.selectedItem.Server === row.Server
    );
  }
  goToCreate(): void {
    this.router.navigate(['/book/create-account-book']);
  }
}
