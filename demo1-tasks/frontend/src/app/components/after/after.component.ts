import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';
import { TaskListComponent } from '../task-list/task-list.component';
import { ClarificationComponent } from '../clarification/clarification.component';

@Component({
  selector: 'app-after',
  imports: [CommonModule, FormsModule, TaskListComponent, ClarificationComponent],
  templateUrl: './after.component.html',
  styleUrls: ['./after.component.css']
})
export class AfterComponent implements OnInit {
  query: string = '';
  tasks: Task[] = [];
  loading: boolean = false;
  error: string = '';
  explanation: string = '';
  hasSearched: boolean = false;

  // Clarification state
  needsClarification: boolean = false;
  clarificationMessage: string = '';
  suggestions: string[] = [];
  originalQuery: string = '';

  // JSON display state
  showJson: boolean = false;
  rawJsonResponse: any = null;

  // Example queries for the user
  exampleQueries: string[] = [
    'Show me high priority tasks',
    'What\'s overdue?',
    'Show me Sarah\'s tasks', // This will trigger clarification
    'In progress items',
    'Show me Sarah Chen\'s tasks',
  ];

  constructor(
    private taskService: TaskService,
    private router: Router
  ) {}

  toggleAI(): void {
    this.router.navigate(['/before']);
  }

  ngOnInit(): void {
    // Load all tasks initially
    this.loadAllTasks();
  }

  /**
   * Load all tasks (no filters)
   */
  loadAllTasks(): void {
    this.loading = true;
    this.error = '';

    this.taskService.getAllTasks().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.tasks = response.data;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to load tasks';
        console.error('Error loading tasks:', err);
      }
    });
  }

  /**
   * Execute natural language query
   */
  executeQuery(): void {
    if (!this.query.trim()) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.explanation = '';
    this.needsClarification = false;
    this.tasks = [];
    this.hasSearched = true;

    this.taskService.queryNatural(this.query).subscribe({
      next: (response) => {
        this.loading = false;

        // Store raw JSON response for debugging
        this.rawJsonResponse = response;

        if (response.needsClarification) {
          // Handle clarification case
          this.needsClarification = true;
          this.clarificationMessage = response.message || '';
          this.suggestions = response.suggestions || [];
          this.originalQuery = response.originalQuery;
          this.tasks = []; // Clear tasks
        } else if (response.success && response.data) {
          // Handle success case
          this.tasks = response.data;
          this.explanation = response.explanation || '';
        } else if (!response.success && response.error) {
          // Handle error case (like delete attempts, invalid queries, etc.)
          this.error = response.error;
          this.tasks = []; // Clear tasks on error
          this.explanation = ''; // Clear explanation on error
        } else {
          // Fallback error
          this.error = 'An unexpected error occurred';
          this.tasks = [];
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to execute query. Make sure the backend server is running.';
        console.error('Query error:', err);
      }
    });
  }

  /**
   * Handle suggestion selection from clarification component
   */
  onSuggestionSelected(suggestion: string): void {
    // Use the suggestion as the new query
    this.query = suggestion;
    this.needsClarification = false;
    this.executeQuery();
  }

  /**
   * Use an example query
   */
  useExample(example: string): void {
    this.query = example;
    this.executeQuery();
  }

  /**
   * Handle Enter key press
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.executeQuery();
    }
  }

  /**
   * Toggle JSON display
   */
  toggleJsonDisplay(): void {
    this.showJson = !this.showJson;
  }

  /**
   * Get formatted JSON string
   */
  getFormattedJson(): string {
    if (!this.rawJsonResponse) {
      return '';
    }
    return JSON.stringify(this.rawJsonResponse, null, 2);
  }
}
