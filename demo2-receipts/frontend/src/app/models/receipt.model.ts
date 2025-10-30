export interface ReceiptData {
  merchant: string;
  date: string;
  subtotal?: number;
  tax: number;
  taxPercentage?: number;
  total: number;
  category: 'food' | 'retail' | 'office' | 'travel' | 'entertainment' | 'other';
  items?: ReceiptItem[];
  paymentMethod?: string;
  confidence?: 'high' | 'medium' | 'low';
}

export interface ReceiptItem {
  description: string;
  price: number;
  quantity?: number;
}

export type ParseStatus = 'success' | 'partial' | 'not_a_receipt' | 'unreadable';

export interface ParseResponse {
  success: boolean;
  approach: 'simple' | 'chain' | 'tool-calling';
  status?: ParseStatus;
  receipt?: ReceiptData;
  notes?: string;
  missingFields?: string[];
  message?: string;
  suggestions?: string[];
  reason?: string;
  matching?: MatchResult;  // For tool-calling approach
  error?: string;
}

export interface MatchResult {
  reasoning: string;
  toolCalls: ToolCall[];
  match: TaskMatch | null;
}

export interface ToolCall {
  toolName: string;
  input: any;
  result: any;
}

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
