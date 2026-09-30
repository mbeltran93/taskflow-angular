import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ProjectService } from './project.service';
import { environment } from '../../../environments/environment';
import { Project } from '../models/project.model';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;
  const resourceUrl = `${environment.apiUrl}/projects`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fetches the project list', () => {
    const mockProjects: Project[] = [
      { id: 1, name: 'Landing', description: '', ownerId: 1, createdAt: '2026-01-01T00:00:00.000Z' }
    ];

    service.getProjects().subscribe((projects) => {
      expect(projects).toEqual(mockProjects);
    });

    const req = httpMock.expectOne(resourceUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockProjects);
  });

  it('creates a project with a generated createdAt', () => {
    service.createProject({ name: 'Nuevo', description: 'Desc', ownerId: 1 }).subscribe();

    const req = httpMock.expectOne(resourceUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.name).toBe('Nuevo');
    expect(typeof req.request.body.createdAt).toBe('string');
    req.flush({ id: 2, name: 'Nuevo', description: 'Desc', ownerId: 1, createdAt: req.request.body.createdAt });
  });

  it('deletes a project by id', () => {
    service.deleteProject(5).subscribe();

    const req = httpMock.expectOne(`${resourceUrl}/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
