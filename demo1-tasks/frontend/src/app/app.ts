import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'Demo 1: Natural Language Task Querying';
  aiEnabled = false;

  constructor(private router: Router) {
    // Set initial state based on current route
    this.aiEnabled = this.router.url === '/after';

    // Listen to route changes
    this.router.events.subscribe(() => {
      this.aiEnabled = this.router.url === '/after';
    });
  }

  toggleAI(): void {
    this.aiEnabled = !this.aiEnabled;
    this.router.navigate([this.aiEnabled ? '/after' : '/before']);
  }
}
