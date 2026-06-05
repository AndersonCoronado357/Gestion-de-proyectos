// Implementación Knex (SQL Server) del DesignRepository.

import type { Knex } from 'knex';
import type {
  DesignProject,
  DesignProjectWithViews,
  DesignView,
  CreateProjectInput,
  UpdateProjectInput,
  CreateViewInput,
  UpdateViewInput
} from '../../domain/design.types';
import type { DesignRepositoryPort } from '../../ports/design.repository';

const DesignRepository = require('../../ports/design.repository');

interface DbProject {
  id: number;
  name: string;
  created_by: number | null;
  primary_view_id: number | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface DbView {
  id: number;
  project_id: number;
  name: string;
  position: number;
  content_desktop: string | null;
  content_mobile: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

const iso = (d: Date | string): string =>
  d instanceof Date ? d.toISOString() : new Date(d).toISOString();

// SQL Server devuelve BIGINT como string en Tedious. Normalizamos a number
// porque las API públicas tipan id como number — y porque el front concatena
// con plantillas pero después hace `Number(useParams.id)`.
const toNum = (v: number | string | null): number =>
  v == null ? 0 : typeof v === 'number' ? v : Number(v);
const toNumOrNull = (v: number | string | null): number | null =>
  v == null ? null : typeof v === 'number' ? v : Number(v);

function toProject(r: DbProject): DesignProject {
  return {
    id: toNum(r.id),
    name: r.name,
    createdBy: toNumOrNull(r.created_by),
    primaryViewId: toNumOrNull(r.primary_view_id),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at)
  };
}

function toView(r: DbView): DesignView {
  return {
    id: toNum(r.id),
    projectId: toNum(r.project_id),
    name: r.name,
    position: r.position,
    contentDesktop: r.content_desktop,
    contentMobile: r.content_mobile,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at)
  };
}

class DesignRepositoryImpl extends DesignRepository implements DesignRepositoryPort {
  private db: Knex;

  constructor(db: Knex) {
    super();
    this.db = db;
  }

  async listProjects(): Promise<DesignProject[]> {
    const rows = (await this.db<DbProject>('design_projects')
      .select('id', 'name', 'created_by', 'primary_view_id', 'created_at', 'updated_at')
      .orderBy('updated_at', 'desc')) as DbProject[];
    return rows.map(toProject);
  }

  async findProjectByName(name: string): Promise<DesignProject | null> {
    const row = await this.db<DbProject>('design_projects').where({ name }).first();
    return row ? toProject(row) : null;
  }

  async getProject(id: number): Promise<DesignProjectWithViews | null> {
    const project = await this.db<DbProject>('design_projects').where({ id }).first();
    if (!project) return null;
    const views = (await this.db<DbView>('design_views')
      .where({ project_id: id })
      .orderBy('position', 'asc')
      .orderBy('id', 'asc')) as DbView[];
    return { ...toProject(project), views: views.map(toView) };
  }

  async createProject(input: CreateProjectInput): Promise<DesignProject> {
    const [inserted] = await this.db<DbProject>('design_projects')
      .insert({
        name: input.name,
        created_by: input.createdBy ?? null,
        primary_view_id: null
      })
      .returning(['id', 'name', 'created_by', 'primary_view_id', 'created_at', 'updated_at']);
    const project: DesignProject =
      inserted && typeof inserted === 'object' && 'id' in inserted
        ? toProject(inserted as DbProject)
        : {
            id: typeof inserted === 'number' ? inserted : 0,
            name: input.name,
            createdBy: input.createdBy ?? null,
            primaryViewId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

    // Crea la primera vista automáticamente y la marca como inicial.
    const firstView = await this.createView({ projectId: project.id, name: 'Vista 1' });
    await this.db('design_projects')
      .where({ id: project.id })
      .update({ primary_view_id: firstView.id, updated_at: this.db.fn.now() });

    return { ...project, primaryViewId: firstView.id };
  }

  async updateProject(id: number, input: UpdateProjectInput): Promise<DesignProject | null> {
    const patch: Record<string, unknown> = { updated_at: this.db.fn.now() };
    if (input.name !== undefined) patch.name = input.name;
    if (input.primaryViewId !== undefined) patch.primary_view_id = input.primaryViewId;
    await this.db('design_projects').where({ id }).update(patch);
    const row = await this.db<DbProject>('design_projects').where({ id }).first();
    return row ? toProject(row) : null;
  }

  async deleteProject(id: number): Promise<boolean> {
    // FK design_views.project_id tiene ON DELETE CASCADE; pero hay que
    // limpiar la FK design_projects.primary_view_id PRIMERO para no chocar.
    await this.db('design_projects').where({ id }).update({ primary_view_id: null });
    const n = await this.db('design_projects').where({ id }).del();
    return n > 0;
  }

  async listViews(projectId: number): Promise<DesignView[]> {
    const rows = (await this.db<DbView>('design_views')
      .where({ project_id: projectId })
      .orderBy('position', 'asc')
      .orderBy('id', 'asc')) as DbView[];
    return rows.map(toView);
  }

  async createView(input: CreateViewInput): Promise<DesignView> {
    const maxRow = (await this.db('design_views')
      .where({ project_id: input.projectId })
      .max<{ m: number | null }[]>({ m: 'position' })
      .first()) as { m: number | null } | undefined;
    const position = (maxRow?.m ?? -1) + 1;
    const [inserted] = await this.db<DbView>('design_views')
      .insert({
        project_id: input.projectId,
        name: input.name ?? `Vista ${position + 1}`,
        position,
        content_desktop: null,
        content_mobile: null
      })
      .returning([
        'id',
        'project_id',
        'name',
        'position',
        'content_desktop',
        'content_mobile',
        'created_at',
        'updated_at'
      ]);

    // Bump del project.updated_at para que ordene primero en la lista.
    await this.db('design_projects')
      .where({ id: input.projectId })
      .update({ updated_at: this.db.fn.now() });

    if (inserted && typeof inserted === 'object' && 'id' in inserted) {
      return toView(inserted as DbView);
    }
    const id = typeof inserted === 'number' ? inserted : 0;
    const row = await this.db<DbView>('design_views').where({ id }).first();
    return row ? toView(row) : ({
      id,
      projectId: input.projectId,
      name: input.name ?? `Vista ${position + 1}`,
      position,
      contentDesktop: null,
      contentMobile: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as DesignView);
  }

  async updateView(id: number, input: UpdateViewInput): Promise<DesignView | null> {
    const patch: Record<string, unknown> = { updated_at: this.db.fn.now() };
    if (input.name !== undefined) patch.name = input.name;
    if (input.position !== undefined) patch.position = input.position;
    if (input.contentDesktop !== undefined) patch.content_desktop = input.contentDesktop;
    if (input.contentMobile !== undefined) patch.content_mobile = input.contentMobile;
    await this.db('design_views').where({ id }).update(patch);

    // Bump del project.updated_at para que ordene primero.
    const view = await this.db<DbView>('design_views').where({ id }).first();
    if (view) {
      await this.db('design_projects')
        .where({ id: view.project_id })
        .update({ updated_at: this.db.fn.now() });
    }
    return view ? toView(view) : null;
  }

  async deleteView(id: number): Promise<boolean> {
    const view = await this.db<DbView>('design_views').where({ id }).first();
    if (!view) return false;

    // Si era la vista inicial, hay que limpiar la referencia antes.
    await this.db('design_projects')
      .where({ id: view.project_id, primary_view_id: id })
      .update({ primary_view_id: null });
    const n = await this.db('design_views').where({ id }).del();

    // Si quedaron vistas y el proyecto perdió su primary, asigna la primera.
    if (n > 0) {
      const project = await this.db('design_projects')
        .where({ id: view.project_id })
        .first<{ primary_view_id: number | null }>('primary_view_id');
      if (project && project.primary_view_id == null) {
        const first = await this.db<DbView>('design_views')
          .where({ project_id: view.project_id })
          .orderBy('position', 'asc')
          .orderBy('id', 'asc')
          .first('id');
        if (first) {
          await this.db('design_projects')
            .where({ id: view.project_id })
            .update({
              primary_view_id: (first as { id: number }).id,
              updated_at: this.db.fn.now()
            });
        }
      } else {
        await this.db('design_projects')
          .where({ id: view.project_id })
          .update({ updated_at: this.db.fn.now() });
      }
    }
    return n > 0;
  }
}

module.exports = DesignRepositoryImpl;
module.exports.default = DesignRepositoryImpl;
