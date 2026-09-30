import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Task, TaskInput, TaskStatus } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.apiUrl}/tasks`;

  getTasksByProject(projectId: number): Observable<Task[]> {
    const params = new HttpParams().set('projectId', projectId).set('_sort', 'order');
    return this.http.get<Task[]>(this.resourceUrl, { params });
  }

  createTask(input: TaskInput): Observable<Task> {
    const payload: Omit<Task, 'id'> = { ...input, createdAt: new Date().toISOString() };
    return this.http.post<Task>(this.resourceUrl, payload);
  }

  updateTask(id: number, changes: Partial<TaskInput>): Observable<Task> {
    return this.http.patch<Task>(`${this.resourceUrl}/${id}`, changes);
  }

  moveTask(id: number, status: TaskStatus, order: number): Observable<Task> {
    return this.updateTask(id, { status, order });
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/${id}`);
  }
}
