/**
 * Shared task-related interfaces
 */

// Interface for parsed receipt data
export interface ReceiptData {
  merchant: string;
  date: string; // ISO format
  total: number;
  category?: string;
  notes?: string;
}

// Interface for task data
export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee: string | null;
  status: string;
  priority: string;
  dueDate: string;
  createdAt: string;
  budget?: number;
  expenses?: any[];
}

// Interface for matched task result
export interface TaskMatch {
  taskId: string;
  title: string;
  description?: string;
  assignee: string | null;
  budget: number;
  createdAt: string;
  dueDate: string;
  confidenceScore: number;
  matchReasons: string[];
}
