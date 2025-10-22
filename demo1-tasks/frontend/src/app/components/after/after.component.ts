import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
export class AfterComponent {
  query: string = '';
  tasks: Task[] = [];
  loading: boolean = false;
  error: string = '';
  explanation: string = '';

  // Clarification state
  needsClarification: boolean = false;
  clarificationMessage: string = '';
  suggestions: string[] = [];
  originalQuery: string = '';

  // Example queries for the user
  exampleQueries: string[] = [
    'Show me high priority tasks',
    'What\'s overdue?',
    'Show me Sarah\'s tasks', // This will trigger clarification
    'In progress items',
    'Show me Sarah Chen\'s tasks',
  ];

  constructor(private taskService: TaskService) {}

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

    this.taskService.queryNatural(this.query).subscribe({
      next: (response) => {
        this.loading = false;

        if (response.needsClarification) {
          // Handle clarification case
          this.needsClarification = true;
          this.clarificationMessage = response.message || '';
          this.suggestions = response.suggestions || [];
          this.originalQuery = response.originalQuery;
        } else if (response.success && response.data) {
          // Handle success case
          this.tasks = response.data;
          this.explanation = response.explanation || '';
        } else {
          // Handle error case
          this.error = response.error || 'An error occurred';
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
    // Replace the ambiguous part with the specific suggestion
    this.query = this.originalQuery.replace(/sarah/i, suggestion);
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
}
