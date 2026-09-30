import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  CdkDrag,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';

import { BOARD_COLUMNS, Task, TaskStatus } from '../../../core/models/task.model';
import { Project } from '../../../core/models/project.model';
import { TaskService } from '../../../core/services/task.service';
import { ProjectService } from '../../../core/services/project.service';
import { TaskCardComponent } from '../task-card/task-card.component';
import { TaskDialogComponent, TaskFormValue } from '../task-dialog/task-dialog.component';

type ColumnMap = Record<TaskStatus, Task[]>;

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [RouterLink, CdkDropListGroup, CdkDropList, CdkDrag, TaskCardComponent, TaskDialogComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export class BoardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly taskService = inject(TaskService);
  private readonly projectService = inject(ProjectService);

  readonly columns = BOARD_COLUMNS;
  readonly project = signal<Project | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly dialogOpen = signal(false);
  readonly editingTask = signal<Task | null>(null);
  readonly dialogDefaultStatus = signal<TaskStatus>(TaskStatus.TODO);

  columnsData: ColumnMap = {
    [TaskStatus.TODO]: [],
    [TaskStatus.IN_PROGRESS]: [],
    [TaskStatus.DONE]: []
  };

  private projectId = 0;

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.projectService.getProject(this.projectId).subscribe({
      next: (project) => this.project.set(project),
      error: () => this.errorMessage.set('No se encontro el proyecto.')
    });
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading.set(true);
    this.taskService.getTasksByProject(this.projectId).subscribe({
      next: (tasks) => {
        this.columnsData = {
          [TaskStatus.TODO]: tasks.filter((t) => t.status === TaskStatus.TODO),
          [TaskStatus.IN_PROGRESS]: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS),
          [TaskStatus.DONE]: tasks.filter((t) => t.status === TaskStatus.DONE)
        };
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar las tareas. Verifica que json-server este corriendo.');
        this.loading.set(false);
      }
    });
  }

  drop(event: CdkDragDrop<Task[]>, targetStatus: TaskStatus): void {
    const previousArray = event.previousContainer.data;
    const currentArray = event.container.data;

    if (event.previousContainer === event.container) {
      moveItemInArray(currentArray, event.previousIndex, event.currentIndex);
      this.syncOrder(currentArray);
      return;
    }

    transferArrayItem(previousArray, currentArray, event.previousIndex, event.currentIndex);
    currentArray[event.currentIndex].status = targetStatus;

    this.syncOrder(previousArray);
    this.syncOrder(currentArray);
  }

  openCreateDialog(status: TaskStatus): void {
    this.editingTask.set(null);
    this.dialogDefaultStatus.set(status);
    this.dialogOpen.set(true);
  }

  openEditDialog(task: Task): void {
    this.editingTask.set(task);
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
    this.editingTask.set(null);
  }

  saveTask(value: TaskFormValue): void {
    const editing = this.editingTask();

    if (editing) {
      this.taskService.updateTask(editing.id, value).subscribe((updated) => {
        this.applyUpdatedTask(editing, updated);
        this.closeDialog();
      });
      return;
    }

    const order = this.columnsData[value.status].length;
    this.taskService
      .createTask({ projectId: this.projectId, order, ...value })
      .subscribe((created) => {
        this.columnsData[value.status].push(created);
        this.closeDialog();
      });
  }

  removeTask(task: Task): void {
    if (!confirm(`Eliminar la tarea "${task.title}"?`)) {
      return;
    }

    this.taskService.deleteTask(task.id).subscribe(() => {
      const column = this.columnsData[task.status];
      const index = column.findIndex((t) => t.id === task.id);
      if (index > -1) {
        column.splice(index, 1);
      }
    });
  }

  private applyUpdatedTask(previous: Task, updated: Task): void {
    if (previous.status !== updated.status) {
      const previousColumn = this.columnsData[previous.status];
      const index = previousColumn.findIndex((t) => t.id === previous.id);
      if (index > -1) {
        previousColumn.splice(index, 1);
      }
      this.columnsData[updated.status].push(updated);
      return;
    }

    const column = this.columnsData[updated.status];
    const index = column.findIndex((t) => t.id === updated.id);
    if (index > -1) {
      column[index] = updated;
    }
  }

  private syncOrder(columnTasks: Task[]): void {
    columnTasks.forEach((task, index) => {
      task.order = index;
      this.taskService.updateTask(task.id, { status: task.status, order: index }).subscribe();
    });
  }
}
