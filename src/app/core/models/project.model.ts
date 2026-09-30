export interface Project {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  createdAt: string;
}

export type ProjectInput = Omit<Project, 'id' | 'createdAt'>;
