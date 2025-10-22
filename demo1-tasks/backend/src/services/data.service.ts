import { readFileSync } from 'fs';
import { join } from 'path';
import { Task, User } from '../schemas/task.schema';
import { TaskQuery } from '../schemas/query.schema';

class DataService {
  private tasks: Task[];
  private users: User[];

  constructor() {
    // Load mock data
    const tasksPath = join(__dirname, '../../data/tasks.json');
    const usersPath = join(__dirname, '../../data/users.json');

    this.tasks = JSON.parse(readFileSync(tasksPath, 'utf-8'));
    this.users = JSON.parse(readFileSync(usersPath, 'utf-8'));
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return this.tasks;
  }

  /**
   * Get all users
   */
  getAllUsers(): User[] {
    return this.users;
  }

  /**
   * Find user by name (case-insensitive, partial match)
   * Returns array because multiple users might have similar names
   */
  findUsersByName(name: string): User[] {
    const searchName = name.toLowerCase().trim();
    return this.users.filter(user =>
      user.name.toLowerCase().includes(searchName)
    );
  }

  /**
   * Traditional query builder approach (BEFORE implementation)
   * Takes a structured query and filters tasks
   */
  filterTasks(query: TaskQuery): Task[] {
    let filtered = [...this.tasks];

    // Filter by assignee
    if (query.assignee) {
      filtered = filtered.filter(task =>
        task.assignee?.toLowerCase() === query.assignee?.toLowerCase()
      );
    }

    // Filter by status
    if (query.status) {
      filtered = filtered.filter(task => task.status === query.status);
    }

    // Filter by priority
    if (query.priority) {
      filtered = filtered.filter(task => task.priority === query.priority);
    }

    // Filter by due date
    if (query.dueDate) {
      if (query.dueDate.after) {
        filtered = filtered.filter(task => task.dueDate >= query.dueDate!.after!);
      }
      if (query.dueDate.before) {
        filtered = filtered.filter(task => task.dueDate <= query.dueDate!.before!);
      }
    }

    return filtered;
  }

  /**
   * Check if a name is ambiguous (multiple users match)
   */
  isAmbiguousName(name: string): { isAmbiguous: boolean; matches: User[] } {
    const matches = this.findUsersByName(name);
    return {
      isAmbiguous: matches.length > 1,
      matches
    };
  }
}

export const dataService = new DataService();
