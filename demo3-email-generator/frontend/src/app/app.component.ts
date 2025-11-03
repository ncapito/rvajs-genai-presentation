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
  expandedEmailId: string | null = null; // Track which email is expanded

  // Progress tracking for long-running operations
  progressSteps: Array<{ step: string; message: string; status: 'pending' | 'active' | 'complete'; timestamp?: Date }> = [];

  // Example of the "old way" - unpersonalized, boring email
  unpersonalizedEmail = {
    subject: 'Weekly Task Summary Report',
    body: `Dear Team Member,

This is your automated weekly task summary report.

TASK STATISTICS:
- Total Completed: 23
- In Progress: 8
- Overdue: 4
- Total Comments: 15

Please review your tasks and update their status accordingly. If you have any overdue items, please prioritize them.

For questions, please contact your project manager.

Best regards,
Task Management System
(Automated Message - Do Not Reply)`
  };

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

    // Reset progress steps - they'll be added dynamically from SSE events
    this.progressSteps = [];

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
          // Dynamically add or update step based on the step field
          if (event.data.step) {
            this.addOrUpdateStep(event.data.step, event.data.message, 'active');
          }
          break;

        case 'step_complete':
          // Mark step as complete
          if (event.data.step) {
            this.addOrUpdateStep(event.data.step, event.data.message, 'complete');
          }
          break;

        case 'complete':
          console.log('Complete event - final result:', event.data);
          // Final result received
          this.generatedEmail = event.data;
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

  private addOrUpdateStep(step: string, message: string, status: 'active' | 'complete') {
    // Check if step already exists (using step as unique identifier)
    const existingIndex = this.progressSteps.findIndex(s => s.step === step);

    if (existingIndex >= 0) {
      // Update existing step - keep original message, just update status
      this.progressSteps[existingIndex].status = status;
      this.progressSteps[existingIndex].timestamp = new Date();
    } else {
      // Add new step
      this.progressSteps.push({
        step: step,
        message: message,
        status: status,
        timestamp: new Date()
      });
    }
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
    this.expandedEmailId = null; // Reset expansion when switching modes
  }

  toggleEmailExpansion(emailId: string) {
    this.expandedEmailId = this.expandedEmailId === emailId ? null : emailId;
  }

  isEmailExpanded(emailId: string): boolean {
    return this.expandedEmailId === emailId;
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
