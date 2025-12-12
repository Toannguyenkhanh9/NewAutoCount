// src/app/core/services/auth.service.ts
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

const AUTH_KEY = 'ac_auth';
const COMPANY_KEY = 'ac_company';
const USER_KEY = 'ac_user_name';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // trạng thái đăng nhập
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // tên hiển thị của user (để lấy initials, show menu, ...)
  private userDisplayNameSubject = new BehaviorSubject<string | null>(null);
  userDisplayName$ = this.userDisplayNameSubject.asObservable();

  // user/pass demo
  private readonly validUsername = 'admin';
  private readonly validPassword = '123456';

  constructor() {
    // Chỉ đọc localStorage khi đang ở browser
    if (this.isBrowser) {
      const savedAuth = localStorage.getItem(AUTH_KEY);
      const savedUser = localStorage.getItem(USER_KEY);

      if (savedAuth === 'true') {
        this.isAuthenticatedSubject.next(true);
      }
      if (savedUser) {
        this.userDisplayNameSubject.next(savedUser);
      }
    }
  }

  get isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  get userDisplayName(): string | null {
    return this.userDisplayNameSubject.value;
  }

  /** Set / clear tên hiển thị của user (đồng bộ với localStorage) */
  setUserDisplayName(name: string | null) {
    const clean = name?.trim() ?? '';
    const finalName = clean || null;

    this.userDisplayNameSubject.next(finalName);

    if (!this.isBrowser) return;

    if (finalName) {
      localStorage.setItem(USER_KEY, finalName);
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }

  login(username: string, password: string, company: string): boolean {
    const cleanUsername = (username || '').trim();

    const ok =
      cleanUsername === this.validUsername &&
      password === this.validPassword &&
      !!company;

    if (ok) {
      this.isAuthenticatedSubject.next(true);

      if (this.isBrowser) {
        localStorage.setItem(AUTH_KEY, 'true');
        localStorage.setItem(COMPANY_KEY, company);
      }

      // lưu username để header/user-menu dùng
      this.setUserDisplayName(cleanUsername);
      return true;
    }

    // login fail
    this.isAuthenticatedSubject.next(false);
    this.setUserDisplayName(null);

    if (this.isBrowser) {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(COMPANY_KEY);
      localStorage.removeItem(USER_KEY);
    }

    return false;
  }

  logout() {
    this.isAuthenticatedSubject.next(false);
    this.setUserDisplayName(null);

    if (this.isBrowser) {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(COMPANY_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }
}
