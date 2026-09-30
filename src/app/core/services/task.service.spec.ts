import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { TaskService } from './task.service';
import { environment } from '../../../environments/environment';
import { Task, TaskStatus } from '../models/task.model';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;
  const resourceUrl = `${environment.apiUrl}/tasks`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fetches tasks filtered by project and sorted by order', () => {
    const mockTasks: Task[] = [
      {
        id: 1,
        projectId: 3,
        title: 'Mapear endpoints',
        description: '',
        status: TaskStatus.TODO,
        order: 0,
        assignee: '',
        createdAt: '2026-01-01T00:00:00.000Z'
      }
    ];

    service.getTasksByProject(3).subscribe((tasks) => expect(tasks).toEqual(mockTasks));

    const req = httpMock.expectOne((r) => r.url === resourceUrl && r.params.get('projectId') === '3');
    expect(req.request.params.get('_sort')).toBe('order');
    req.flush(mockTasks);
  });

  it('moveTask sends the new status and order', () => {
    service.moveTask(7, TaskStatus.DONE, 2).subscribe();

    const req = httpMock.expectOne(`${resourceUrl}/7`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: TaskStatus.DONE, order: 2 });
    req.flush({});
  });
});
