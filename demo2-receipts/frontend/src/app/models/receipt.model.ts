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
  approach: 'simple' | 'chain';
  status: ParseStatus;
  receipt?: ReceiptData;
  notes?: string;
  missingFields?: string[];
  message?: string;
  suggestions?: string[];
  reason?: string;
}
