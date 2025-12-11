import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { ApiHttpService } from '../../core/services/api-http.service';
import { CompanyContextService } from '../../core/services/company-context.service';

interface CompanyDto {
  Id: number;
  Company: string | null;
  Remark: string | null;
  Version: string | null;
  Server: string | null;
  Database: string | null;
  ConnectionString: string | null;
}

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private api = inject(ApiHttpService);
  private companyContext = inject(CompanyContextService);

  // 👇 company là CompanyDto, không phải string
  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    company: [null as CompanyDto | null, Validators.required],
  });

  companies: CompanyDto[] = [];
  companiesLoading = false;
  companiesError = '';

  hidePassword = true;
  errorMessage = '';

  ngOnInit(): void {
    // Nếu đã login rồi mà còn vào /login thì cho đá về dashboard
    if (this.auth.isLoggedIn) {
      this.router.navigateByUrl('/dashboard');
      return;
    }

    this.loadCompanies();
  }

  private loadCompanies() {
    this.companiesLoading = true;
    this.companiesError = '';

    this.api.get<CompanyDto[]>('api/books/get-list-server').subscribe({
      next: (res) => {
        this.companies = res ?? [];
        this.companiesLoading = false;
      },
      error: (err) => {
        console.error('Load company list failed', err);
        this.companiesLoading = false;
        this.companiesError = 'Cannot load company list.';
      },
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const username = (this.form.value.username ?? '').trim();
    const password = (this.form.value.password ?? '').trim();
    const companyValue = this.form.value.company as CompanyDto | null;

    // Tham số thứ 3 tuỳ bạn: Database / ConnectionString / gì backend yêu cầu
    const loginCompany =
      companyValue?.ConnectionString ??
      companyValue?.Database ??
      companyValue?.Company ??
      '';

    const ok = this.auth.login(username, password, loginCompany);

    if (!ok) {
      this.errorMessage = 'Invalid username or password';

      this.form.get('username')?.setErrors({ invalid: true });
      this.form.get('password')?.setErrors({ invalid: true });
      return;
    }

    // ✅ Lưu tên company để header hiển thị
    if (companyValue?.Company) {
      this.companyContext.setCompanyName(companyValue.Company);
    }

    // login ok thì xoá lỗi
    this.errorMessage = '';
    this.router.navigateByUrl('/dashboard');
  }
}
