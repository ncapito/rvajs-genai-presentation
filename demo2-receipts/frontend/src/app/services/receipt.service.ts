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

  /**
   * Match receipt to task using tool calling (Claude with tools)
   */
  matchReceipt(file: File): Observable<ParseResponse> {
    const formData = new FormData();
    formData.append('receipt', file);

    return this.http.post<ParseResponse>(`${this.baseUrl}/match`, formData);
  }

  /**
   * Match receipt to task using tool calling with SSE streaming
   * Returns an EventSource that emits progress updates
   */
  matchReceiptStream(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('receipt', file);

    // We'll return an Observable that emits SSE events
    return new Observable((observer) => {
      // First upload the file and establish SSE connection
      fetch(`${this.baseUrl}/match/stream`, {
        method: 'POST',
        body: formData,
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            throw new Error('No response body');
          }

          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              observer.complete();
              break;
            }

            // Decode the chunk
            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE messages (ending with \n\n)
            const messages = buffer.split('\n\n');
            buffer = messages.pop() || ''; // Keep incomplete message in buffer

            for (const message of messages) {
              if (!message.trim()) continue;

              // Parse SSE format: event: <type>\ndata: <json>
              const lines = message.split('\n');
              let eventType = 'message';
              let data = '';

              for (const line of lines) {
                if (line.startsWith('event:')) {
                  eventType = line.substring(6).trim();
                } else if (line.startsWith('data:')) {
                  data = line.substring(5).trim();
                }
              }

              try {
                const parsedData = JSON.parse(data);
                observer.next({ type: eventType, data: parsedData });
              } catch (e) {
                console.error('Failed to parse SSE data:', data);
              }
            }
          }
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }
}
