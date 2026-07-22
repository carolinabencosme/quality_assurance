'use client';

import { useEffect, useMemo, useState } from 'react';
import DataTable from '@/components/DataTable';
import Icon from '@/components/icons/AppIcons';
import { apiGet } from '@/lib/api';
import { canManageUsers } from '@/lib/permissions';

type PermissionDescription = {
  permission: string;
  description: string;
};

type RolePermissions = {
  role: string;
  permissions: string[];
};

type PermissionsMatrix = {
  source: string;
  permissionDescriptions: PermissionDescription[];
  roles: RolePermissions[];
};

export default function PermissionsMatrixPage() {
  const [data, setData] = useState<PermissionsMatrix | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(canManageUsers());
    apiGet<PermissionsMatrix>('/security/permissions-matrix')
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const permissions = useMemo(
    () => data?.permissionDescriptions ?? [],
    [data?.permissionDescriptions],
  );
  const descriptions = useMemo(
    () => new Map(permissions.map((permission) => [permission.permission, permission.description])),
    [permissions],
  );

  const columns = useMemo(
    () => [
      {
        key: 'role',
        header: 'Rol',
        render: (row: RolePermissions) => <strong>{row.role}</strong>,
      },
      ...permissions.map((permission) => ({
        key: permission.permission,
        header: permission.permission,
        render: (row: RolePermissions) =>
          row.permissions.includes(permission.permission) ? (
            <span className="badge badge-ok">Si</span>
          ) : (
            <span className="text-muted">No</span>
          ),
      })),
    ],
    [permissions],
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Matriz de permisos</h1>
          <p className="page-sub">
            Roles empresariales y authorities efectivas aplicadas por Cub.
          </p>
        </div>
        <span className="page-pill">
          <Icon name="shield" size={15} /> user:manage
        </span>
      </div>

      {!allowed && !loading && (
        <div className="alert alert-error" role="alert">
          No tienes permiso user:manage para consultar esta matriz.
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Administracion read-only</h2>
            <p>
              La administracion real de usuarios se realiza en Keycloak; esta vista documenta la matriz empresarial aplicada por Cub.
            </p>
          </div>
          {data && <span>{data.source}</span>}
        </div>

        <DataTable
          columns={columns}
          rows={data?.roles ?? []}
          rowKey={(row) => row.role}
          loading={loading}
          emptyTitle="Sin matriz disponible"
          emptyMessage="No se pudo cargar la matriz de permisos."
        />
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Descripcion de permisos</h2>
            <p>Catalogo de authorities usadas por backend, frontend y Keycloak.</p>
          </div>
          <span>{permissions.length}</span>
        </div>
        <div className="grid-2">
          {permissions.map((permission) => (
            <div key={permission.permission} className="list-row">
              <div>
                <strong>{permission.permission}</strong>
                <div className="row-meta">{descriptions.get(permission.permission)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
