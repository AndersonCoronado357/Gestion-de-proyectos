// Modelo del dominio para el constructor visual.
//
// Un `DesignProject` agrupa N `DesignView`. Cada vista guarda DOS layouts
// independientes (desktop y mobile). El contenido del layout es un blob
// JSON opaco para el backend — el frontend es quien lo interpreta.

export interface DesignView {
  id: number;
  projectId: number;
  name: string;
  position: number;
  contentDesktop: string | null; // JSON serializado
  contentMobile: string | null;  // JSON serializado
  createdAt: string;
  updatedAt: string;
}

export interface DesignProject {
  id: number;
  name: string;
  createdBy: number | null;
  primaryViewId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface DesignProjectWithViews extends DesignProject {
  views: DesignView[];
}

export interface CreateProjectInput {
  name: string;
  createdBy?: number | null;
}

export interface UpdateProjectInput {
  name?: string;
  primaryViewId?: number | null;
}

export interface CreateViewInput {
  projectId: number;
  name?: string;
}

export interface UpdateViewInput {
  name?: string;
  position?: number;
  contentDesktop?: string | null;
  contentMobile?: string | null;
}
