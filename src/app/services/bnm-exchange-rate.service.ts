import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiHttpService } from '../core/services/api-http.service'; // ✅ sửa đường dẫn đúng project bạn

export type QuoteKey = 'rm' | 'fc';
export type RateTypeKey = 'buying_rate' | 'selling_rate' | 'middle_rate';

export interface BnmExchangeRateResponse {
  data: Array<{
    currency_code: string;
    unit: number;
    rate: {
      date: string;
      buying_rate: number | null;
      selling_rate: number | null;
      middle_rate: number | null;
    };
  }>;
  meta: {
    quote: string;
    session: string;
    last_updated: string;
    total_result: number;
  };
}

@Injectable({ providedIn: 'root' })
export class BnmExchangeRateService {
  private api = inject(ApiHttpService);

  // ✅ bạn đang làm endpoint trong BooksController:
  // GET /api/books/exchange-rate?session=1700&quote=rm
  private readonly endpoint = '/api/books/exchange-rate';

  // Nếu bạn tách controller riêng /api/exchange-rate thì đổi thành:
  // private readonly endpoint = '/api/exchange-rate';

  getRates(session: string, quote: QuoteKey): Observable<BnmExchangeRateResponse> {
    // Cách 1: ApiHttpService có hỗ trợ params
    return this.api.get<BnmExchangeRateResponse>(this.endpoint, {
      params: { session, quote },
    } as any);

    // Cách 2 (nếu ApiHttpService KHÔNG support params) thì dùng query string:
    // const url = `${this.endpoint}?session=${encodeURIComponent(session)}&quote=${encodeURIComponent(quote)}`;
    // return this.api.get<BnmExchangeRateResponse>(url);
  }
}