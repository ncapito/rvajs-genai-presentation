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
}
