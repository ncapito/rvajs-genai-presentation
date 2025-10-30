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
  approach: 'simple' | 'chain' | 'tool-calling' = 'simple';  // Default to simple single call
  isImageEnlarged: boolean = false;

  // Results - cached per approach
  results: {
    simple: ParseResponse | null;
    chain: ParseResponse | null;
    'tool-calling': ParseResponse | null;
  } = {
    simple: null,
    chain: null,
    'tool-calling': null
  };

  // Get current result based on selected approach
  get result(): ParseResponse | null {
    return this.results[this.approach];
  }

  // SSE Streaming State (tool-calling only)
  streamingStates: {
    'tool-calling': {
      streaming: boolean;
      progressMessages: Array<{ message: string; timestamp: Date }>;
      toolCalls: Array<{ name: string; input: any; result?: any }>;
      reasoning: string;
      streamingError: string | null;
    }
  } = {
    'tool-calling': {
      streaming: false,
      progressMessages: [],
      toolCalls: [],
      reasoning: '',
      streamingError: null
    }
  };

  // Get current streaming state
  get streaming(): boolean {
    return this.streamingStates['tool-calling'].streaming;
  }

  get progressMessages(): Array<{ message: string; timestamp: Date }> {
    return this.streamingStates['tool-calling'].progressMessages;
  }

  get toolCalls(): Array<{ name: string; input: any; result?: any }> {
    return this.streamingStates['tool-calling'].toolCalls;
  }

  get reasoning(): string {
    return this.streamingStates['tool-calling'].reasoning;
  }

  get streamingError(): string | null {
    return this.streamingStates['tool-calling'].streamingError;
  }

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
    //this.result = null;

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

    // Check if we already have results for this approach
    if (this.results[this.approach]) {
      console.log(`Already have results for ${this.approach}, skipping parse`);
      return;
    }

    this.loading = true;

    // Use SSE streaming for tool-calling approach
    if (this.approach === 'tool-calling') {
      this.streamingStates['tool-calling'].streaming = true;
      this.streamingStates['tool-calling'].progressMessages = [];
      this.streamingStates['tool-calling'].toolCalls = [];
      this.streamingStates['tool-calling'].reasoning = '';
      this.streamingStates['tool-calling'].streamingError = null;
      this.loading = false; // Use streaming state instead

      this.receiptService.matchReceiptStream(this.selectedFile).subscribe({
        next: (event) => {
          console.log('SSE Event:', event.type, event.data);
          this.handleSSEEvent(event);
        },
        error: (error) => {
          this.streamingStates['tool-calling'].streaming = false;
          this.streamingStates['tool-calling'].streamingError = 'Connection error: ' + error.message;
          console.error('SSE error:', error);
        },
        complete: () => {
          this.streamingStates['tool-calling'].streaming = false;
          console.log('SSE stream complete');
        }
      });
    } else {
      // Regular HTTP request for simple/chain approaches
      let parseMethod;
      if (this.approach === 'simple') {
        parseMethod = this.receiptService.parseSimple(this.selectedFile);
      } else {
        parseMethod = this.receiptService.parseChain(this.selectedFile);
      }

      parseMethod.subscribe({
        next: (response) => {
          this.loading = false;
          this.results[this.approach] = response;
        },
        error: (error) => {
          this.loading = false;
          console.error('Parse error:', error);
          alert('Error parsing receipt. Make sure backend is running on port 3001.');
        }
      });
    }
  }

  /**
   * Handle individual SSE events
   */
  private handleSSEEvent(event: { type: string; data: any }): void {
    const state = this.streamingStates['tool-calling'];

    switch (event.type) {
      case 'receipt_parsed':
        // Receipt was successfully parsed
        if (!this.results['tool-calling']) {
          this.results['tool-calling'] = {
            success: true,
            approach: 'tool-calling',
            status: 'success',
            receipt: event.data
          };
        }
        this.addProgressMessage('✅ Receipt parsed successfully');
        break;

      case 'progress':
        // General progress update
        this.addProgressMessage(event.data.message);
        break;

      case 'reasoning':
        // Claude's reasoning text
        state.reasoning += event.data.text + '\n';
        break;

      case 'tool_call':
        // Claude is calling a tool
        const toolCall = { name: event.data.name, input: event.data.input };
        state.toolCalls.push(toolCall);
        this.addProgressMessage(`🔧 Tool: ${event.data.name}`);
        break;

      case 'tool_result':
        // Tool execution result
        const existingCall = state.toolCalls.find(tc => tc.name === event.data.name && !tc.result);
        if (existingCall) {
          existingCall.result = event.data.result;
        }
        this.addProgressMessage(`✓ ${event.data.name} completed`);
        break;

      case 'complete':
        // Final result with match
        if (this.results['tool-calling']) {
          this.results['tool-calling'].matching = {
            reasoning: event.data.reasoning,
            toolCalls: event.data.toolCalls,
            match: event.data.match
          };
        }
        if (event.data.match) {
          this.addProgressMessage(`🎯 Match found: ${event.data.match.title} (${event.data.match.confidenceScore}% confidence)`);
        } else {
          this.addProgressMessage('❌ No matching task found');
        }
        break;

      case 'error':
        // Error occurred
        state.streamingError = event.data.message;
        this.addProgressMessage(`❌ Error: ${event.data.message}`);
        break;
    }
  }

  /**
   * Add a progress message with timestamp
   */
  private addProgressMessage(message: string): void {
    this.streamingStates['tool-calling'].progressMessages.push({
      message,
      timestamp: new Date()
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

    // Clear all cached results
    this.results = {
      simple: null,
      chain: null,
      'tool-calling': null
    };

    // Clear streaming state
    this.streamingStates = {
      'tool-calling': {
        streaming: false,
        progressMessages: [],
        toolCalls: [],
        reasoning: '',
        streamingError: null
      }
    };
  }

  /**
   * Switch parsing approach - results now persist!
   */
  switchApproach(approach: 'simple' | 'chain' | 'tool-calling'): void {
    this.approach = approach;
    // Don't clear results - they persist when switching approaches
  }

  /**
   * Get approach information
   */
  getApproachInfo(approach: 'simple' | 'chain' | 'tool-calling'): { problem: string; tech: string[] } {
    const info = {
      simple: {
        problem: 'Manual receipt entry is tedious - employees type merchant, date, amount manually, leading to errors and wasted time.',
        tech: [
          'Claude Vision API (multimodal)',
          'Zod schema validation',
          'Single API call',
          'Handles printed & handwritten receipts'
        ]
      },
      chain: {
        problem: 'After parsing, receipts must be manually matched to project tasks - which task? which budget?',
        tech: [
          'LangChain orchestration (4-step pipeline)',
          'Developer-controlled workflow',
          'Vector store semantic search',
          'Deterministic date & budget filtering',
          'LLM picks best match from filtered candidates'
        ]
      },
      'tool-calling': {
        problem: 'Same matching problem, but we want the AI to reason through the process and show its thinking in real-time.',
        tech: [
          'Claude tool calling (AI decides workflow)',
          'Three tools: search, filter, rank',
          'LLM constructs semantic queries',
          'Server-Sent Events (SSE) streaming',
          'Real-time progress visibility'
        ]
      }
    };
    return info[approach];
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

  /**
   * Toggle image enlarged view
   */
  toggleImageEnlarged(): void {
    this.isImageEnlarged = !this.isImageEnlarged;
  }
}
