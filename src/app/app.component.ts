import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterLink } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

import { TopNavComponent } from './layout/top-nav/top-nav.component';
import { BreadcrumbComponent } from './layout/breadcrumb/breadcrumb.component';
import { AuthService } from './core/services/auth.service';
import { CompanyContextService } from './core/services/company-context.service';
import { ApiHttpService } from './core/services/api-http.service';
import { ServerSessionService } from './core/services/server-session.service';
import { filter } from 'rxjs';

// 👇 import model company
import { ListServerRes } from './_share/models/account';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HttpClientModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatDividerModule,
    TopNavComponent,
    BreadcrumbComponent,
    RouterLink,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private companyContext = inject(CompanyContextService);
  private api = inject(ApiHttpService);
  private session = inject(ServerSessionService);

  isAuthenticated$ = this.authService.isAuthenticated$;
  isLoginRoute = false;

  // tên company đang chọn (đã dùng cho label nút)
  companyName$ = this.companyContext.companyName$;
  currentCompanyName: string | null = null;
  // list company cho menu
  companies: ListServerRes[] = [];

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.isLoginRoute = e.urlAfterRedirects.startsWith('/login');
      });
    this.companyName$.subscribe((name) => {
      this.currentCompanyName = name || null;
    });
  }

  ngOnInit(): void {
    // chỉ load list khi đã login
    if (this.authService.isLoggedIn) {
      this.loadCompanyMenuList();
    }
  }

  private loadCompanyMenuList(): void {
    this.api.get<ListServerRes[]>('/api/books/get-list-server').subscribe({
      next: (res) => {
        this.companies = res ?? [];
      },
      error: (err) => {
        console.error('Load company list for header failed', err);
        this.companies = [];
      },
    });
  }

  // các company khác, exclude company hiện tại
  get otherCompanies(): ListServerRes[] {
    if (!this.companies?.length) return [];
    const ctx = this.session.get();
    const currentId = ctx?.companyId ?? null;

    return this.companies.filter((c) => {
      const differentId = currentId == null || c.Id !== currentId;
      const differentName = !this.currentCompanyName || c.Company !== this.currentCompanyName;
      return differentId && differentName;
    });
  }

  // click chọn company từ menu (tạm thời chỉ log, bạn có thể thêm logic switch DB ở đây)
  selectCompanyFromMenu(c: ListServerRes): void {
    console.log('Clicked company from header menu:', c);

    // TODO: khi bạn có API đổi company, set lại session & reload:
    // this.session.set({
    //   companyId: c.Id,
    //   companyName: c.Company,
    //   server: c.Server,
    //   database: c.Database,
    // });
    // this.companyContext.setCompanyName(c.Company ?? '');
    // this.router.navigateByUrl('/dashboard');
  }
  companyInitials(name: string | null | undefined): string {
    if (!name) return '';
    const trimmed = name.trim();
    if (!trimmed) return '';
    // chỉ lấy đúng 1 ký tự đầu tiên
    return trimmed[0].toUpperCase();
  }
companyColorClass(index: number): string {
  const palette = [
    'company-badge-1',
    'company-badge-2',
    'company-badge-3',
    'company-badge-4',
    'company-badge-5',
    'company-badge-6',
  ];
  return palette[index % palette.length];
}
   userDisplayName$ = this.authService.userDisplayName$;
 userInitials(name: string | null | undefined): string {
    if (!name) return '';
    const clean = name.trim();
    if (!clean) return '';
    // bỏ khoảng trắng, lấy 2 ký tự
    return clean.replace(/\s+/g, '').slice(0, 2).toUpperCase();
  }
  logout() {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
