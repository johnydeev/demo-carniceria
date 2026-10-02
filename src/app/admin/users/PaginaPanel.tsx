'use client';

import { useCallback, useEffect, useState } from 'react';

interface UserItem {
  id: string;
  email: string;
  name?: string | null;
  role: 'user' | 'admin';
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

interface AdminItem {
  id: string;
  email: string;
  name: string | null;
  semilla: boolean;
  pendiente: boolean;
}

interface EstadoAdmins {
  admins: AdminItem[];
  soySemilla: boolean;
  semillaConfigurada: boolean;
}

/**
 * Usuarios del sitio. Nadie se crea con contrasena: los clientes entran con
 * Google, y los admins los agrega el administrador principal (la semilla,
 * ADMIN_SEMILLA_EMAIL) cargando el email; esa persona entra despues con Google.
 */
export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [admins, setAdmins] = useState<EstadoAdmins>({ admins: [], soySemilla: false, semillaConfigurada: true });
  const [emailNuevo, setEmailNuevo] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users', { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    setUsers(data.users || []);
  }, []);

  const loadAdmins = useCallback(async () => {
    const res = await fetch('/api/admin/admins', { cache: 'no-store' });
    if (res.ok) setAdmins(await res.json());
  }, []);

  useEffect(() => {
    loadUsers();
    loadAdmins();
  }, [loadUsers, loadAdmins]);

  const agregarAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailNuevo.trim() || agregando) return;
    setAgregando(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailNuevo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo agregar.');
      setAdmins(data);
      setEmailNuevo('');
      // Si era un cliente, deja de figurar en la lista de usuarios.
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar.');
    } finally {
      setAgregando(false);
    }
  };

  const quitarAdmin = async (a: AdminItem) => {
    if (!confirm(`¿Quitarle el rol de administrador a ${a.email}? La cuenta queda como usuario.`)) return;
    setOcupado(a.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/admins/${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo quitar.');
      setAdmins(data);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar.');
    } finally {
      setOcupado(null);
    }
  };

  // Desactivar en vez de borrar: borrar se llevaba el historial de pedidos del
  // cliente. Desactivado no entra al sitio y sus pedidos quedan.
  const cambiarActivo = async (user: UserItem) => {
    const activar = !user.isActive;
    if (!activar && !confirm(`¿Desactivar a ${user.email}? No va a poder entrar; sus pedidos se conservan.`)) return;
    setOcupado(user.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: activar }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo cambiar el estado.');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado.');
    } finally {
      setOcupado(null);
    }
  };

  return (
    <div className="admin-grid">
      <section className="admin-card">
        <h1 className="admin-h1">Administradores</h1>
        {!admins.semillaConfigurada && (
          <p className="admin-error">
            Falta configurar el administrador principal (<code>ADMIN_SEMILLA_EMAIL</code>): nadie puede agregar ni
            quitar administradores.
          </p>
        )}
        {error && <p className="admin-error">{error}</p>}

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                {admins.soySemilla && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {admins.admins.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.email}
                    {a.semilla && <span className="admin-principal"> · principal</span>}
                    {a.pendiente && <span className="admin-muted"> · todavía no entró</span>}
                  </td>
                  <td>{a.name || '—'}</td>
                  {admins.soySemilla && (
                    <td>
                      {!a.semilla && (
                        <button
                          type="button"
                          className="admin-btn danger"
                          onClick={() => quitarAdmin(a)}
                          disabled={ocupado === a.id}
                        >
                          {ocupado === a.id && <span className="admin-spinner" aria-hidden="true" />}
                          Quitar admin
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {admins.soySemilla ? (
          <form className="admin-form" onSubmit={agregarAdmin}>
            <input
              className="admin-input"
              type="email"
              placeholder="Email de la cuenta de Google"
              value={emailNuevo}
              onChange={(e) => setEmailNuevo(e.target.value)}
              maxLength={160}
              required
            />
            <p className="admin-muted">
              Si la persona todavía no entró al sitio, queda como administradora la primera vez que ingrese con
              Google.
            </p>
            <button className="admin-btn primary" disabled={agregando || !emailNuevo.trim()}>
              {agregando && <span className="admin-spinner" aria-hidden="true" />}
              Agregar administrador
            </button>
          </form>
        ) : (
          <p className="admin-muted">Solo el administrador principal puede agregar o quitar administradores.</p>
        )}
      </section>

      <section className="admin-card">
        <h2 className="admin-h1">Clientes</h2>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.name || '-'}</td>
                  <td>{user.isActive ? 'Activo' : 'Desactivado'}</td>
                  <td>
                    <button
                      type="button"
                      className={`admin-btn ${user.isActive ? 'danger' : 'secondary'}`}
                      onClick={() => cambiarActivo(user)}
                      disabled={ocupado === user.id}
                    >
                      {ocupado === user.id && <span className="admin-spinner" aria-hidden="true" />}
                      {user.isActive ? 'Desactivar' : 'Reactivar'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="admin-muted">
                    No hay clientes todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
