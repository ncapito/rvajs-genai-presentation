import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Task,
  User,
  TaskQuery,
  TraditionalQueryResponse,
  NaturalQueryResponse
} from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /**
   * Get all tasks
   */
  getAllTasks(): Observable<{ success: boolean; data: Task[] }> {
    return this.http.get<{ success: boolean; data: Task[] }>(`${this.baseUrl}/tasks`);
  }

  /**
   * Get all users
   */
  getAllUsers(): Observable<{ success: boolean; data: User[] }> {
    return this.http.get<{ success: boolean; data: User[] }>(`${this.baseUrl}/users`);
  }

  /**
   * BEFORE: Traditional structured query
   */
  queryTraditional(query: TaskQuery): Observable<TraditionalQueryResponse> {
    return this.http.post<TraditionalQueryResponse>(
      `${this.baseUrl}/query/traditional`,
      query
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        // For traditional queries, return error response
        return of({
          success: false,
          approach: 'traditional',
          data: [],
          error: error.error?.error || 'Network error occurred'
        } as TraditionalQueryResponse);
      })
    );
  }

  /**
   * AFTER: Natural language query with LLM
   */
  queryNatural(query: string): Observable<NaturalQueryResponse> {
    return this.http.post<NaturalQueryResponse>(
      `${this.baseUrl}/query/natural`,
      { query }
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        // If the backend returns a 400 with error details, extract and return them
        if (error.status === 400 && error.error) {
          return of(error.error as NaturalQueryResponse);
        }

        // For other errors, return a generic error response
        return of({
          success: false,
          approach: 'natural-language',
          error: error.error?.error || 'Network error occurred',
          originalQuery: query
        } as NaturalQueryResponse);
      })
    );
  }
}
