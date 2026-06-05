import type {
  DesignProject,
  DesignProjectWithViews,
  DesignView,
  CreateProjectInput,
  UpdateProjectInput,
  CreateViewInput,
  UpdateViewInput
} from '../domain/design.types';

export interface DesignRepositoryPort {
  listProjects(): Promise<DesignProject[]>;
  getProject(id: number): Promise<DesignProjectWithViews | null>;
  /** Devuelve el proyecto cuyo `name` coincide exacto (case-sensitive), o null. */
  findProjectByName(name: string): Promise<DesignProject | null>;
  createProject(input: CreateProjectInput): Promise<DesignProject>;
  updateProject(id: number, input: UpdateProjectInput): Promise<DesignProject | null>;
  deleteProject(id: number): Promise<boolean>;

  listViews(projectId: number): Promise<DesignView[]>;
  createView(input: CreateViewInput): Promise<DesignView>;
  updateView(id: number, input: UpdateViewInput): Promise<DesignView | null>;
  deleteView(id: number): Promise<boolean>;
}

class DesignRepository {}
module.exports = DesignRepository;
module.exports.default = DesignRepository;
