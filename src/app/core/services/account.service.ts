// src/app/core/services/account.service.ts
import { Injectable } from '@angular/core';
import { ApiHttpService } from './api-http.service';
import { Observable } from 'rxjs';

export interface Account {
  id: number;
  code: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  constructor(private api: ApiHttpService) {}

  getAll(): Observable<Account[]> {
    return this.api.get<Account[]>('/accounts');
  }
}
