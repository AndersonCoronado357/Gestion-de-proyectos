// ProjectStructureTree — vista previa de la estructura que va a tener
// el nuevo submódulo (backend + frontend, arquitectura hexagonal
// completa).
//
// Los nombres tipo `{name}` y `{Name}` se sustituyen en tiempo de
// render por el nombre del submódulo (slug y PascalCase respectivamente).
// Si el nombre todavía está vacío, se muestra el placeholder.
//
// Las carpetas son colapsables.

import { useState } from 'react';
import { cn } from '../../../../shared/lib/cn.js';
import {
  FileIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '../../../../shared/components/icons/index.js';

type NodeKind = 'folder' | 'file';

interface TreeNode {
  name: string; // puede contener {name} y {Name}
  kind: NodeKind;
  children?: TreeNode[];
}

// ── Estructura completa de un submódulo (matching module-x) ─────────
// Sólo GestionProyectos-Backend / GestionProyectos-Frontend al tope — sin src/modules
// intermedios (irrelevantes para la vista).

// CRUD completo: los 5 use-cases con su respectivo test cada uno.
const USE_CASES_NODE: TreeNode = {
  name: 'use-cases',
  kind: 'folder',
  children: [
    {
      name: '__tests__',
      kind: 'folder',
      children: [
        { name: 'create{Name}.test.ts', kind: 'file' },
        { name: 'delete{Name}.test.ts', kind: 'file' },
        { name: 'get{Name}ById.test.ts', kind: 'file' },
        { name: 'get{Name}List.test.ts', kind: 'file' },
        { name: 'update{Name}.test.ts', kind: 'file' }
      ]
    },
    { name: 'create{Name}.ts', kind: 'file' },
    { name: 'delete{Name}.ts', kind: 'file' },
    { name: 'get{Name}ById.ts', kind: 'file' },
    { name: 'get{Name}List.ts', kind: 'file' },
    { name: 'update{Name}.ts', kind: 'file' }
  ]
};

const BACKEND_USE_CASES = USE_CASES_NODE;
const FRONTEND_USE_CASES = USE_CASES_NODE;

const TREE: ReadonlyArray<TreeNode> = [
  {
    name: 'GestionProyectos-Backend',
    kind: 'folder',
    children: [
      {
        name: '{name}',
        kind: 'folder',
        children: [
          {
            name: 'adapters',
            kind: 'folder',
            children: [
              {
                name: 'entry',
                kind: 'folder',
                children: [
                  { name: '{name}.controller.ts', kind: 'file' },
                  { name: '{name}.routes.ts', kind: 'file' }
                ]
              },
              {
                name: 'exit',
                kind: 'folder',
                children: [
                  { name: '{name}.cache.adapter.ts', kind: 'file' },
                  { name: '{name}.repository.impl.ts', kind: 'file' }
                ]
              }
            ]
          },
          {
            name: 'domain',
            kind: 'folder',
            children: [
              { name: '{name}.entity.ts', kind: 'file' },
              { name: '{name}.value-objects.ts', kind: 'file' }
            ]
          },
          {
            name: 'dtos',
            kind: 'folder',
            children: [
              { name: 'create-{name}.dto.ts', kind: 'file' },
              { name: 'update-{name}.dto.ts', kind: 'file' }
            ]
          },
          {
            name: 'ports',
            kind: 'folder',
            children: [{ name: '{name}.repository.ts', kind: 'file' }]
          },
          BACKEND_USE_CASES,
          {
            name: 'validators',
            kind: 'folder',
            children: [{ name: '{name}.validator.ts', kind: 'file' }]
          }
        ]
      },
      {
        name: 'database',
        kind: 'folder',
        children: [
          {
            name: 'migrations',
            kind: 'folder',
            children: [{ name: '00X_create_{name}.ts', kind: 'file' }]
          },
          {
            name: 'seeds',
            kind: 'folder',
            children: [{ name: '00X_{name}.seed.ts', kind: 'file' }]
          }
        ]
      }
    ]
  },
  {
    name: 'GestionProyectos-Frontend',
    kind: 'folder',
    children: [
      {
        name: '{name}',
        kind: 'folder',
        children: [
          {
            name: 'adapters',
            kind: 'folder',
            children: [
              {
                name: 'entry',
                kind: 'folder',
                children: [{ name: '{name}.api.ts', kind: 'file' }]
              },
              {
                name: 'exit',
                kind: 'folder',
                children: [{ name: '{name}.http.adapter.ts', kind: 'file' }]
              }
            ]
          },
          {
            name: 'domain',
            kind: 'folder',
            children: [
              { name: '{name}.entity.ts', kind: 'file' },
              { name: '{name}.value-objects.ts', kind: 'file' }
            ]
          },
          {
            name: 'dtos',
            kind: 'folder',
            children: [
              { name: 'create-{name}.dto.ts', kind: 'file' },
              { name: 'update-{name}.dto.ts', kind: 'file' }
            ]
          },
          {
            name: 'ports',
            kind: 'folder',
            children: [{ name: '{name}.repository.ts', kind: 'file' }]
          },
          {
            name: 'ui',
            kind: 'folder',
            children: [
              {
                name: 'components',
                kind: 'folder',
                children: [
                  { name: '{Name}Form.tsx', kind: 'file' },
                  { name: '{Name}Item.tsx', kind: 'file' },
                  { name: '{Name}List.tsx', kind: 'file' }
                ]
              },
              {
                name: 'hooks',
                kind: 'folder',
                children: [{ name: 'use{Name}.ts', kind: 'file' }]
              },
              {
                name: 'pages',
                kind: 'folder',
                children: [
                  { name: '{Name}DetailPage.tsx', kind: 'file' },
                  { name: '{Name}ListPage.tsx', kind: 'file' }
                ]
              }
            ]
          },
          FRONTEND_USE_CASES
        ]
      }
    ]
  }
];

// ── Sustitución de nombres ────────────────────────────────────────────

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function pascalize(s: string): string {
  return slugify(s)
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

function applyName(template: string, name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return template
      .replace(/\{name\}/g, '<submódulo>')
      .replace(/\{Name\}/g, '<Submódulo>');
  }
  const slug = slugify(trimmed) || '<submódulo>';
  const pascal = pascalize(trimmed) || '<Submódulo>';
  return template
    .replace(/\{name\}/g, slug)
    .replace(/\{Name\}/g, pascal);
}

// ── Helpers para inicializar colapso ──────────────────────────────────

function collectAllFolderPaths(
  nodes: ReadonlyArray<TreeNode>,
  prefix = ''
): string[] {
  const out: string[] = [];
  for (const n of nodes) {
    if (n.kind !== 'folder') continue;
    const path = prefix ? `${prefix}/${n.name}` : n.name;
    out.push(path);
    if (n.children) out.push(...collectAllFolderPaths(n.children, path));
  }
  return out;
}

// ── Iconos de tecnología ──────────────────────────────────────────────

function ReactIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-11.5 -10.232 23 20.463"
      width={13}
      height={13}
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <circle r="2.05" fill="currentColor" />
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  );
}

// Logo oficial de TypeScript (cuadrado azul con "TS"), con esquinas
// redondeadas vía contenedor con overflow-hidden.
function TsLogo() {
  return (
    <span className="inline-flex shrink-0 overflow-hidden rounded-[3.5px]">
    <svg viewBox="0 0 24 24" width={13} height={13} aria-hidden="true">
      <path
        fill="#3178c6"
        d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z"
      />
    </svg>
    </span>
  );
}

// Carpeta RELLENA (no outline) → se ve sólida en el color elegido, no "blanca".
function FolderFilledIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={13}
      height={13}
      fill="currentColor"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}

function DatabaseFilledIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={13}
      height={13}
      fill="currentColor"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <ellipse cx="12" cy="5" rx="7.5" ry="2.6" />
      <path d="M4.5 7.4v4.1c0 1.44 3.36 2.6 7.5 2.6s7.5-1.16 7.5-2.6V7.4c0 1.44-3.36 2.6-7.5 2.6s-7.5-1.16-7.5-2.6Z" />
      <path d="M4.5 13.9V18c0 1.44 3.36 2.6 7.5 2.6s7.5-1.16 7.5-2.6v-4.1c0 1.44-3.36 2.6-7.5 2.6s-7.5-1.16-7.5-2.6Z" />
    </svg>
  );
}

// Ícono según la tecnología del nodo: React (.tsx), TypeScript (.ts), base de
// datos (carpeta `database`) y carpeta normal (rellena, en el color principal).
function renderNodeIcon(node: TreeNode) {
  if (node.kind === 'folder') {
    if (node.name === 'database') {
      return <DatabaseFilledIcon className="text-primary" />;
    }
    return <FolderFilledIcon className="text-primary" />;
  }
  if (node.name.endsWith('.tsx')) {
    return <ReactIcon className="text-[#61dafb]" />;
  }
  if (node.name.endsWith('.ts')) {
    return <TsLogo />;
  }
  return <FileIcon width={12} height={12} className="shrink-0 text-fg-faint" />;
}

// ── Renderizado ───────────────────────────────────────────────────────

interface TreeRowProps {
  node: TreeNode;
  depth: number;
  path: string;
  expanded: Set<string>;
  name: string;
  onToggle: (path: string) => void;
}

function TreeRow({ node, depth, path, expanded, name, onToggle }: TreeRowProps) {
  const isFolder = node.kind === 'folder';
  const hasChildren = isFolder && (node.children?.length ?? 0) > 0;
  const isExpanded = expanded.has(path);
  const display = applyName(node.name, name);
  const isPlaceholderName = display.includes('<submódulo>') || display.includes('<Submódulo>');

  return (
    <>
      <div
        onClick={hasChildren ? () => onToggle(path) : undefined}
        className={cn(
          'flex items-center gap-1 px-2 py-[3px] text-[11.5px] outline-none',
          hasChildren ? 'cursor-pointer hover:bg-bg-muted' : 'cursor-default'
        )}
        style={{ paddingLeft: 6 + depth * 14 }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDownIcon
              width={10}
              height={10}
              className="shrink-0 text-fg-faint"
            />
          ) : (
            <ChevronRightIcon
              width={10}
              height={10}
              className="shrink-0 text-fg-faint"
            />
          )
        ) : (
          <span className="w-[10px] shrink-0" />
        )}
        {renderNodeIcon(node)}
        <span
          className={cn(
            'truncate',
            isFolder
              ? isPlaceholderName
                ? 'font-mono italic text-primary-700'
                : 'font-medium text-fg'
              : isPlaceholderName
                ? 'font-mono italic text-fg-faint'
                : 'text-fg-muted'
          )}
        >
          {display}
        </span>
      </div>
      {hasChildren &&
        isExpanded &&
        node.children!.map((child) => (
          <TreeRow
            key={`${path}/${child.name}`}
            node={child}
            depth={depth + 1}
            path={`${path}/${child.name}`}
            expanded={expanded}
            name={name}
            onToggle={onToggle}
          />
        ))}
    </>
  );
}

interface ProjectStructureTreeProps {
  name: string;
  onBack: () => void;
}

export default function ProjectStructureTree({
  name,
  onBack
}: ProjectStructureTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(collectAllFolderPaths(TREE))
  );

  const toggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-1.5 text-[11.5px] font-medium text-fg-muted outline-none transition-colors hover:bg-bg-muted hover:text-fg"
        >
          <ChevronRightIcon width={11} height={11} className="rotate-180" />
          Volver
        </button>
        <div className="h-4 w-px shrink-0 bg-border-subtle" />
        <p className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-fg">
          Estructura del proyecto
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {TREE.map((node) => (
          <TreeRow
            key={node.name}
            node={node}
            depth={0}
            path={node.name}
            expanded={expanded}
            name={name}
            onToggle={toggle}
          />
        ))}
      </div>
    </div>
  );
}
