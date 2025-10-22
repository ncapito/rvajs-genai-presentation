export interface Task {
  id: string;
  title: string;
  assignee: string | null;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string; // ISO format YYYY-MM-DD
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface TaskQuery {
  assignee?: string;
  status?: 'todo' | 'in-progress' | 'done';
  dueDate?: {
    after?: string;
    before?: string;
  };
  priority?: 'low' | 'medium' | 'high';
}

export interface QueryResult {
  status: 'success' | 'needs_clarification' | 'invalid';
  query?: TaskQuery;
  explanation?: string;
  message?: string;
  suggestions?: string[];
  reason?: string;
}

export interface TraditionalQueryResponse {
  success: boolean;
  approach: 'traditional';
  query: TaskQuery;
  data: Task[];
  count: number;
}

export interface NaturalQueryResponse {
  success: boolean;
  approach: 'natural-language';
  originalQuery: string;
  parsedQuery?: TaskQuery;
  explanation?: string;
  data?: Task[];
  count?: number;
  needsClarification?: boolean;
  message?: string;
  suggestions?: string[];
  error?: string;
}
