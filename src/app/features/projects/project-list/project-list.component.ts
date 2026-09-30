import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Project } from '../../../core/models/project.model';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss'
})
export class ProjectListComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly projects = signal<Project[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: ['']
  });

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading.set(true);
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar los proyectos. Verifica que json-server este corriendo.');
        this.loading.set(false);
      }
    });
  }

  startCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', description: '' });
    this.showForm.set(true);
  }

  startEdit(project: Project): void {
    this.editingId.set(project.id);
    this.form.reset({ name: project.name, description: project.description });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const editingId = this.editingId();

    if (editingId != null) {
      this.projectService.updateProject(editingId, value).subscribe((updated) => {
        this.projects.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
        this.cancelForm();
      });
      return;
    }

    const ownerId = this.authService.currentUser?.id ?? 0;
    this.projectService.createProject({ ...value, ownerId }).subscribe((created) => {
      this.projects.update((list) => [...list, created]);
      this.cancelForm();
    });
  }

  remove(project: Project): void {
    if (!confirm(`Eliminar el proyecto "${project.name}"? Esto no borra sus tareas en el mock.`)) {
      return;
    }

    this.projectService.deleteProject(project.id).subscribe(() => {
      this.projects.update((list) => list.filter((p) => p.id !== project.id));
    });
  }
}
