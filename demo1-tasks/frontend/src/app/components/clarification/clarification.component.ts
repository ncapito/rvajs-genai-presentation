import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-clarification',
  imports: [CommonModule],
  templateUrl: './clarification.component.html',
  styleUrls: ['./clarification.component.css']
})
export class ClarificationComponent {
  @Input() message: string = '';
  @Input() suggestions: string[] = [];
  @Output() suggestionSelected = new EventEmitter<string>();

  selectSuggestion(suggestion: string): void {
    this.suggestionSelected.emit(suggestion);
  }
}
