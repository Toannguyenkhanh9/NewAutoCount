import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CompanyContextService {
  private readonly STORAGE_KEY = 'currentCompanyName';

  private _companyName$ = new BehaviorSubject<string | null>(
    localStorage.getItem(this.STORAGE_KEY)
  );
  companyName$ = this._companyName$.asObservable();

  setCompanyName(name: string) {
    this._companyName$.next(name);
    localStorage.setItem(this.STORAGE_KEY, name);
  }

  clear() {
    this._companyName$.next(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
