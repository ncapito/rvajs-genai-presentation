import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ParseResponse } from '../models/receipt.model';

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {
  private readonly baseUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {}

  /**
   * Parse receipt using simple approach (single Vision call)
   */
  parseSimple(file: File): Observable<ParseResponse> {
    const formData = new FormData();
    formData.append('receipt', file);

    return this.http.post<ParseResponse>(`${this.baseUrl}/parse/simple`, formData);
  }

  /**
   * Parse receipt using chain approach (LangChain orchestration)
   */
  parseChain(file: File): Observable<ParseResponse> {
    const formData = new FormData();
    formData.append('receipt', file);

    return this.http.post<ParseResponse>(`${this.baseUrl}/parse/chain`, formData);
  }
}
