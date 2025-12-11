import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd,  RouterLink} from '@angular/router';
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
import { filter } from 'rxjs';

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
export class AppComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private companyContext = inject(CompanyContextService); // 👈 inject service

  isAuthenticated$ = this.authService.isAuthenticated$;
  isLoginRoute = false;

  // 👇 dùng tên company đã chọn ở login
  companyName$ = this.companyContext.companyName$;

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.isLoginRoute = e.urlAfterRedirects.startsWith('/login');
      });
  }

  logout() {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
