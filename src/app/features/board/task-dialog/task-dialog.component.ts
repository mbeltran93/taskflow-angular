import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { BOARD_COLUMNS, Task, TaskStatus } from '../../../core/models/task.model';

export interface TaskFormValue {
  title: string;
  description: string;
  assignee: string;
  status: TaskStatus;
}

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './task-dialog.component.html',
  styleUrl: './task-dialog.component.scss'
})
export class TaskDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() task: Task | null = null;
  @Input() defaultStatus: TaskStatus = TaskStatus.TODO;
  @Output() save = new EventEmitter<TaskFormValue>();
  @Output() close = new EventEmitter<void>();

  readonly statuses = Object.values(TaskStatus);

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    assignee: [''],
    status: [TaskStatus.TODO, Validators.required]
  });

  ngOnChanges(): void {
    if (this.task) {
      this.form.reset({
        title: this.task.title,
        description: this.task.description,
        assignee: this.task.assignee,
        status: this.task.status
      });
    } else {
      this.form.reset({ title: '', description: '', assignee: '', status: this.defaultStatus });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.save.emit(this.form.getRawValue());
  }

  statusLabel(status: TaskStatus): string {
    return BOARD_COLUMNS.find((c) => c.status === status)?.label ?? status;
  }
}
