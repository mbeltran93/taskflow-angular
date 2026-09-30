import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Project, ProjectInput } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.apiUrl}/projects`;

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.resourceUrl);
  }

  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.resourceUrl}/${id}`);
  }

  createProject(input: ProjectInput): Observable<Project> {
    const payload: Omit<Project, 'id'> = { ...input, createdAt: new Date().toISOString() };
    return this.http.post<Project>(this.resourceUrl, payload);
  }

  updateProject(id: number, changes: Partial<ProjectInput>): Observable<Project> {
    return this.http.patch<Project>(`${this.resourceUrl}/${id}`, changes);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/${id}`);
  }
}
