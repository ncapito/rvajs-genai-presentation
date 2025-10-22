import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    );
  }

  /**
   * AFTER: Natural language query with LLM
   */
  queryNatural(query: string): Observable<NaturalQueryResponse> {
    return this.http.post<NaturalQueryResponse>(
      `${this.baseUrl}/query/natural`,
      { query }
    );
  }
}
