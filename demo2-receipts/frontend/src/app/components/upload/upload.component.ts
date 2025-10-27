import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ReceiptService } from '../../services/receipt.service';
import { ParseResponse, ReceiptData } from '../../models/receipt.model';

@Component({
  selector: 'app-upload',
  imports: [CommonModule],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent {
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  safePdfUrl: SafeResourceUrl | null = null;
  isPdf: boolean = false;
  loading: boolean = false;
  approach: 'simple' | 'chain' = 'simple';

  // Results
  result: ParseResponse | null = null;

  constructor(
    private receiptService: ReceiptService,
    private sanitizer: DomSanitizer
  ) {}

  /**
   * Handle file selection
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.handleFile(input.files[0]);
    }
  }

  /**
   * Handle file drop
   */
  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  /**
   * Process the selected file
   */
  private handleFile(file: File): void {
    // Accept images and PDFs
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
      alert('Please select an image or PDF file');
      return;
    }

    this.selectedFile = file;
    this.isPdf = isPdf;
    this.result = null;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      this.imagePreview = dataUrl;

      // Sanitize PDF URL for iframe
      if (isPdf) {
        this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(dataUrl);
      } else {
        this.safePdfUrl = null;
      }
    };
    reader.readAsDataURL(file);
  }

  /**
   * Parse the receipt
   */
  parseReceipt(): void {
    if (!this.selectedFile) return;

    this.loading = true;
    this.result = null;

    const parseMethod = this.approach === 'simple'
      ? this.receiptService.parseSimple(this.selectedFile)
      : this.receiptService.parseChain(this.selectedFile);

    parseMethod.subscribe({
      next: (response) => {
        this.loading = false;
        this.result = response;
      },
      error: (error) => {
        this.loading = false;
        console.error('Parse error:', error);
        alert('Error parsing receipt. Make sure backend is running on port 3001.');
      }
    });
  }

  /**
   * Reset and start over
   */
  reset(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.safePdfUrl = null;
    this.isPdf = false;
    this.result = null;
  }

  /**
   * Switch parsing approach
   */
  switchApproach(approach: 'simple' | 'chain'): void {
    this.approach = approach;
    this.result = null;
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'success': 'status-success',
      'partial': 'status-partial',
      'not_a_receipt': 'status-error',
      'unreadable': 'status-error'
    };
    return classes[status] || '';
  }

  /**
   * Get confidence badge class
   */
  getConfidenceClass(confidence?: string): string {
    const classes: Record<string, string> = {
      'high': 'confidence-high',
      'medium': 'confidence-medium',
      'low': 'confidence-low'
    };
    return confidence ? classes[confidence] || '' : '';
  }
}
