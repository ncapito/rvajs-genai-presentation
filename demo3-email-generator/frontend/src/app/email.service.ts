import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  userType: string;
  preferences: {
    detailLevel: string;
    preferredTone: string;
    emailFrequency: string;
    includeMemes?: boolean;
  };
  description: string;
  lastActive?: string;
}

export interface Email {
  subject: string;
  body: string;
  format: 'text' | 'html';
  tone: string;
  priorityActions?: string[];
  memeSpots?: any[];
}

export interface EmailGenerationResponse {
  success: boolean;
  user: {
    id: string;
    name: string;
    userType: string;
  };
  email: Email;
  metadata: {
    generationTime: number;
    style: any;
  };
}

export interface BatchEmailResponse {
  success: boolean;
  results: EmailGenerationResponse[];
  metadata: {
    totalTime: number;
    successCount: number;
    failureCount: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  private apiUrl = 'http://localhost:3003/api';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<{ users: UserProfile[] }> {
    return this.http.get<{ users: UserProfile[] }>(`${this.apiUrl}/users`);
  }

  generateEmail(userId: string): Observable<EmailGenerationResponse> {
    return this.http.post<EmailGenerationResponse>(`${this.apiUrl}/generate-email?trace=true`, {
      userId,
    });
  }

  generateEmailBatch(): Observable<BatchEmailResponse> {
    return this.http.post<BatchEmailResponse>(`${this.apiUrl}/generate-email-batch`, {});
  }

  getTaskData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/task-data`);
  }

  getSampleEmail(userId: string, format: 'text' | 'html'): Observable<EmailGenerationResponse> {
    return this.http.get<EmailGenerationResponse>(`${this.apiUrl}/sample-emails/${userId}/${format}`);
  }

  /**
   * Generate email with SSE streaming progress
   */
  generateEmailStream(userId: string): Observable<{ type: string; data: any }> {
    return new Observable((observer) => {
      // Use POST with EventSource polyfill or fetch with stream
      // For SSE with POST, we'll use fetch API
      const controller = new AbortController();

      fetch(`${this.apiUrl}/generate-email?stream=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
        signal: controller.signal,
      })
        .then(async (response) => {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            throw new Error('No response body');
          }

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n\n');

            for (const line of lines) {
              if (!line.trim()) continue;

              const eventMatch = line.match(/^event: (.+)$/m);
              const dataMatch = line.match(/^data: (.+)$/m);

              if (eventMatch && dataMatch) {
                const eventType = eventMatch[1];
                const data = JSON.parse(dataMatch[1]);
                observer.next({ type: eventType, data });

                if (eventType === 'complete') {
                  observer.complete();
                  return;
                }
              }
            }
          }
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            observer.error(error);
          }
        });

      // Cleanup function
      return () => {
        controller.abort();
      };
    });
  }
}
