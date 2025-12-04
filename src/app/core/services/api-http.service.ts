// src/app/core/services/api-http.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiHttpService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  private buildUrl(path: string): string {
    if (!path.startsWith('/')) path = '/' + path;
    return this.baseUrl + path;
  }

  get<T>(path: string, options?: { params?: HttpParams | { [param: string]: string | number | boolean }; headers?: HttpHeaders | { [header: string]: string } }) {
    return this.http.get<T>(this.buildUrl(path), options);
  }

  post<T>(path: string, body: any, options?: any) {
    return this.http.post<T>(this.buildUrl(path), body, options);
  }

  put<T>(path: string, body: any, options?: any) {
    return this.http.put<T>(this.buildUrl(path), body, options);
  }

  delete<T>(path: string, options?: any) {
    return this.http.delete<T>(this.buildUrl(path), options);
  }
}
