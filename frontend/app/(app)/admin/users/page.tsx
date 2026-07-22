'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/icons/AppIcons';
import {
  listUsers,
  MANAGED_REALM_ROLES,
  setUserEnabled,
  setUserRoles,
  type KeycloakUser,
  type ManagedRealmRole,
} from '@/lib/api/users';
import { canManageUsers } from '@/lib/permissions';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<KeycloakUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(canManageUsers());
    listUsers()
      .then(setUsers)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function updateEnabled(user: KeycloakUser) {
    setSavingUserId(user.id);
    setError(null);
    try {
      const updated = await setUserEnabled(user.id, !user.enabled);
      replaceUser(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el usuario');
    } finally {
      setSavingUserId(null);
    }
  }

  async function updateRole(user: KeycloakUser, role: ManagedRealmRole) {
    setSavingUserId(user.id);
    setError(null);
    try {
      const updated = await setUserRoles(user.id, [role]);
      replaceUser(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el rol');
    } finally {
      setSavingUserId(null);
    }
  }

  function replaceUser(updated: KeycloakUser) {
    setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)));
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="page-sub">Gestion real de usuarios, estado y roles en Keycloak.</p>
        </div>
        <span className="page-pill">
          <Icon name="key" size={15} /> user:manage
        </span>
      </div>

      {!allowed && !loading && (
        <div className="alert alert-error" role="alert">
          No tienes permiso user:manage para administrar usuarios.
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
            <h2>Usuarios Keycloak</h2>
            <p>Los cambios aplican al realm inventory-realm y se reflejan tras re-login.</p>
          </div>
          <span>{users.length}</span>
        </div>

        {loading ? (
          <div className="loading loading-card">
            <span className="spinner" aria-hidden /> Cargando usuarios...
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <strong>Sin usuarios</strong>
            <p>No se encontraron usuarios en Keycloak.</p>
          </div>
        ) : (
          <div
            className="data-table-wrap"
            role="region"
            aria-label="Usuarios Keycloak"
            tabIndex={0}
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const selectedRole = user.roles.find((role) =>
                    MANAGED_REALM_ROLES.includes(role),
                  ) ?? 'inventory-viewer';
                  const saving = savingUserId === user.id;

                  return (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.username}</strong>
                        <div className="row-meta">
                          {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.id}
                        </div>
                      </td>
                      <td>{user.email ?? '-'}</td>
                      <td>
                        <span className={user.enabled ? 'badge badge-ok' : 'badge badge-out'}>
                          {user.enabled ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <select
                          value={selectedRole}
                          disabled={saving}
                          onChange={(event) => updateRole(user, event.target.value as ManagedRealmRole)}
                        >
                          {MANAGED_REALM_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={user.enabled ? 'btn btn-danger btn-sm' : 'btn btn-secondary btn-sm'}
                          disabled={saving}
                          onClick={() => updateEnabled(user)}
                        >
                          {saving ? 'Guardando...' : user.enabled ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
