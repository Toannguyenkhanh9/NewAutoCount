// server-session.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ServerContext {
  companyId: string | number;
  companyName: string;         // giữ required
  server: string;
  database: string;
  remark?: string | null;
  version?: string | null;
  systemDate?: string | null;
}

const KEY = 'acc.selectedServerCtx';

@Injectable({ providedIn: 'root' })
export class ServerSessionService {
  private _ctx$ = new BehaviorSubject<ServerContext | null>(this.load());
  ctx$ = this._ctx$.asObservable();

  set(ctx: ServerContext) {
    this._ctx$.next(ctx);
    localStorage.setItem(KEY, JSON.stringify(ctx));
  }

  get(): ServerContext | null {
    return this._ctx$.value;
  }

  clear() {
    this._ctx$.next(null);
    localStorage.removeItem(KEY);
  }

  private load(): ServerContext | null {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
    catch { return null; }
  }
}
