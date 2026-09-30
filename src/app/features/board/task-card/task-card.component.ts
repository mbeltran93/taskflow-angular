import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Task } from '../../../core/models/task.model';

@Component({
  selector: 'app-task-card',
  standalone: true,
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss'
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;
  @Output() edit = new EventEmitter<Task>();
  @Output() remove = new EventEmitter<Task>();
}
