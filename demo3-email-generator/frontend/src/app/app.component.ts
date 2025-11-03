import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EmailService, UserProfile, EmailGenerationResponse } from './email.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  users: UserProfile[] = [];
  selectedUser: UserProfile | null = null;
  generatedEmail: EmailGenerationResponse | null = null;
  allEmails: EmailGenerationResponse[] = [];
  taskData: any = null;
  loading = false;
  error: string | null = null;
  viewMode: 'single' | 'comparison' = 'single';
  isSampleEmail = false; // Track if currently viewing a sample email

  // Progress tracking for long-running operations
  progressSteps: Array<{ step: string; status: 'pending' | 'active' | 'complete'; timestamp?: Date }> = [];
  currentStep = 0;

  @ViewChild('emailResult') emailResult?: ElementRef;

  constructor(
    private emailService: EmailService,
    private sanitizer: DomSanitizer,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadTaskData();
  }

  loadUsers() {
    this.emailService.getUsers().subscribe({
      next: (response) => {
        this.users = response.users;
      },
      error: (err) => {
        this.error = 'Failed to load users';
        console.error(err);
      },
    });
  }

  loadTaskData() {
    this.emailService.getTaskData().subscribe({
      next: (data) => {
        this.taskData = data;
      },
      error: (err) => {
        console.error('Failed to load task data:', err);
      },
    });
  }

  selectUser(user: UserProfile) {
    this.selectedUser = user;
    this.generatedEmail = null;
    this.error = null;
  }

  generateEmail() {
    if (!this.selectedUser) return;

    this.loading = true;
    this.error = null;
    this.isSampleEmail = false;

    // Initialize progress steps for SSE
    this.initializeProgressSteps();

    // Use SSE streaming for real-time progress
    this.emailService.generateEmailStream(this.selectedUser.id).subscribe({
      next: (event) => {
        this.handleSSEEvent(event);
      },
      error: (err) => {
        this.error = 'Failed to generate email';
        this.loading = false;
        this.progressSteps = [];
        console.error(err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  private handleSSEEvent(event: { type: string; data: any }) {
    console.log('SSE Event received:', event.type, event.data);

    // Run inside Angular zone to trigger change detection
    this.ngZone.run(() => {
      switch (event.type) {
        case 'progress':
          console.log('Progress event - message:', event.data.message);
          // Update current step to active based on message
          this.updateStepFromMessage(event.data.message, 'active');
          console.log('Progress steps after update:', this.progressSteps);
          break;

        case 'step_complete':
          console.log('Step complete event - message:', event.data.message);
          // Mark step as complete
          this.updateStepFromMessage(event.data.message, 'complete');
          console.log('Progress steps after complete:', this.progressSteps);
          break;

        case 'complete':
          console.log('Complete event - final result:', event.data);
          // Final result received
          this.generatedEmail = event.data;
          this.completeAllSteps();
          this.scrollToEmail();
          break;

        case 'error':
          console.log('Error event:', event.data.message);
          this.error = event.data.message;
          break;

        default:
          console.log('Unknown event type:', event.type);
      }
    });
  }

  private updateStepFromMessage(message: string, status: 'active' | 'complete') {
    console.log(`updateStepFromMessage called with: "${message}", status: ${status}`);

    // Map keywords in messages to step indices
    let stepIndex = -1;

    if (message.includes('Analyzing') || message.includes('activity data')) {
      stepIndex = 0;
    } else if (message.includes('Retrieving') || message.includes('collaboration') || message.includes('RAG')) {
      stepIndex = 1;
    } else if (message.includes('Determining') || message.includes('style')) {
      stepIndex = 2;
    } else if (message.includes('Generating') || message.includes('email content')) {
      stepIndex = 3;
    } else if (message.includes('Converting') || message.includes('HTML') || message.includes('Finalizing') || message.includes('finalized') || message.includes('text format')) {
      stepIndex = 4;
    }

    if (stepIndex >= 0 && stepIndex < this.progressSteps.length) {
      console.log(`Matched message to step index ${stepIndex}`);
      this.progressSteps[stepIndex].status = status;
      this.progressSteps[stepIndex].timestamp = new Date();
      console.log(`Updated step ${stepIndex}:`, this.progressSteps[stepIndex]);
    } else {
      console.warn(`No matching step found for message: "${message}"`);
    }
  }

  private initializeProgressSteps() {
    // Default flow: 4 main steps (HTML conversion step can be added during live demo)
    this.progressSteps = [
      { step: '📊 Analyzing user activity data', status: 'pending' },
      { step: '🔍 Retrieving relevant collaboration context (RAG)', status: 'pending' },
      { step: '🎨 Determining personalized email style', status: 'pending' },
      { step: '✍️ Generating email content', status: 'pending' },
      // Optional step 5 - shown only if backend sends HTML conversion events
      // { step: '🎨 Converting to HTML format', status: 'pending' },
    ];
    this.currentStep = 0;
  }

  private completeAllSteps() {
    // Mark all remaining steps as complete when done
    this.progressSteps.forEach(step => {
      if (step.status !== 'complete') {
        step.status = 'complete';
        step.timestamp = new Date();
      }
    });
  }

  viewSampleEmail(format: 'text' | 'html') {
    if (!this.selectedUser) return;

    this.loading = true;
    this.error = null;

    this.emailService.getSampleEmail(this.selectedUser.id, format).subscribe({
      next: (response) => {
        this.generatedEmail = response;
        this.isSampleEmail = true;
        this.loading = false;
        this.scrollToEmail();
      },
      error: (err) => {
        this.error = 'Failed to load sample email';
        this.loading = false;
        console.error(err);
      },
    });
  }

  private scrollToEmail() {
    // Wait a bit for Angular to render the email
    setTimeout(() => {
      if (this.emailResult) {
        this.emailResult.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  }

  generateAllEmails() {
    this.loading = true;
    this.error = null;
    this.viewMode = 'comparison';
    this.allEmails = [];

    this.emailService.generateEmailBatch().subscribe({
      next: (response) => {
        this.allEmails = response.results.filter(r => r.success);
        this.loading = false;
        console.log(`Generated ${response.metadata.successCount} emails in ${response.metadata.totalTime}ms`);
      },
      error: (err) => {
        this.error = 'Failed to generate batch emails';
        this.loading = false;
        console.error(err);
      },
    });
  }

  switchViewMode(mode: 'single' | 'comparison') {
    this.viewMode = mode;
  }

  getUserTypeColor(userType: string): string {
    const colors: Record<string, string> = {
      'detail-oriented': '#3b82f6',
      'action-focused': '#ef4444',
      'inactive': '#f59e0b',
      'meme-loving': '#8b5cf6',
    };
    return colors[userType] || '#6b7280';
  }

  getUserTypeIcon(userType: string): string {
    const icons: Record<string, string> = {
      'detail-oriented': '📊',
      'action-focused': '⚡',
      'inactive': '💤',
      'meme-loving': '😎',
    };
    return icons[userType] || '👤';
  }

  formatEmailBody(body: string): string {
    // Preserve line breaks for display
    return body.replace(/\n/g, '<br>');
  }

  // Bypass Angular's sanitization for demo purposes
  // IMPORTANT: In production, you should validate and sanitize user-generated content
  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
