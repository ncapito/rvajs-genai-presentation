import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { Task, User, TaskQuery } from '../../models/task.model';
import { TaskListComponent } from '../task-list/task-list.component';

@Component({
  selector: 'app-before',
  imports: [CommonModule, FormsModule, TaskListComponent],
  templateUrl: './before.component.html',
  styleUrls: ['./before.component.css']
})
export class BeforeComponent implements OnInit {
  tasks: Task[] = [];
  users: User[] = [];
  loading: boolean = false;
  error: string = '';

  // Filter form fields
  selectedAssignee: string = '';
  selectedStatus: string = '';
  selectedPriority: string = '';
  dueDateBefore: string = '';
  dueDateAfter: string = '';

  statusOptions = ['todo', 'in-progress', 'done'];
  priorityOptions = ['low', 'medium', 'high'];

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    // Load users for the assignee dropdown
    this.taskService.getAllUsers().subscribe({
      next: (response) => {
        if (response.success) {
          this.users = response.data;
        }
      },
      error: (err) => {
        console.error('Error loading users:', err);
      }
    });

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
   * Execute filter query
   */
  executeQuery(): void {
    const query: TaskQuery = {};

    // Build query object from form fields
    if (this.selectedAssignee) {
      query.assignee = this.selectedAssignee;
    }
    if (this.selectedStatus) {
      query.status = this.selectedStatus as any;
    }
    if (this.selectedPriority) {
      query.priority = this.selectedPriority as any;
    }
    if (this.dueDateBefore || this.dueDateAfter) {
      query.dueDate = {};
      if (this.dueDateBefore) {
        query.dueDate.before = this.dueDateBefore;
      }
      if (this.dueDateAfter) {
        query.dueDate.after = this.dueDateAfter;
      }
    }

    this.loading = true;
    this.error = '';

    this.taskService.queryTraditional(query).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.tasks = response.data;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to execute query';
        console.error('Query error:', err);
      }
    });
  }

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this.selectedAssignee = '';
    this.selectedStatus = '';
    this.selectedPriority = '';
    this.dueDateBefore = '';
    this.dueDateAfter = '';
    this.loadAllTasks();
  }

  /**
   * Check if any filters are active
   */
  hasActiveFilters(): boolean {
    return !!(
      this.selectedAssignee ||
      this.selectedStatus ||
      this.selectedPriority ||
      this.dueDateBefore ||
      this.dueDateAfter
    );
  }
}
