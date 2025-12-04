// src/app/core/services/auth.service.ts
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

const AUTH_KEY = 'ac_auth';
const COMPANY_KEY = 'ac_company';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // user/pass demo
  private readonly validUsername = 'admin';
  private readonly validPassword = '123456';

  constructor() {
    // 👇 Chỉ đọc localStorage khi đang ở browser
    if (this.isBrowser) {
      const saved = localStorage.getItem(AUTH_KEY);
      if (saved === 'true') {
        this.isAuthenticatedSubject.next(true);
      }
    }
  }

  get isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  login(username: string, password: string, company: string): boolean {
    const ok =
      username === this.validUsername &&
      password === this.validPassword &&
      !!company;

    if (ok) {
      this.isAuthenticatedSubject.next(true);

      if (this.isBrowser) {
        localStorage.setItem(AUTH_KEY, 'true');
        localStorage.setItem(COMPANY_KEY, company);
      }
      return true;
    }

    this.isAuthenticatedSubject.next(false);
    if (this.isBrowser) {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(COMPANY_KEY);
    }
    return false;
  }

  logout() {
    this.isAuthenticatedSubject.next(false);
    if (this.isBrowser) {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(COMPANY_KEY);
    }
  }
}
