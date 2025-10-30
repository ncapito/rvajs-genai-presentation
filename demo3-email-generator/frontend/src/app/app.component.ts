import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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

  @ViewChild('emailResult') emailResult?: ElementRef;

  constructor(
    private emailService: EmailService,
    private sanitizer: DomSanitizer
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

    this.emailService.generateEmail(this.selectedUser.id).subscribe({
      next: (response) => {
        this.generatedEmail = response;
        this.loading = false;
        this.scrollToEmail();
      },
      error: (err) => {
        this.error = 'Failed to generate email';
        this.loading = false;
        console.error(err);
      },
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
