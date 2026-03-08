// src/components/UserPanel.jsx
import { useState, useEffect } from "react";
import DaysRemaining from './DaysRemaining.jsx';

export default function UserPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", rol: "viewer" });

  // 1. Cargar usuarios desde la API real
  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/kv/usuarios');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  // 2. Agregar nuevo usuario (Llamada API POST)
  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) return alert("Completar todos los campos");
    
    try {
      const res = await fetch('/api/kv/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewUser({ username: "", password: "", rol: "viewer" });
        loadUsers();
      }
    } catch (error) {
      alert("Error al crear usuario");
    }
  };

  // 3. Cambiar Rol (Llamada API PUT)
  const handleRoleChange = async (user, newRole) => {
    try {
      await fetch('/api/kv/usuarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, rol: newRole })
      });
      loadUsers();
    } catch (error) {
      console.error("Error al actualizar rol");
    }
  };

  // 4. Eliminar usuario (Llamada API DELETE)
  const handleDeleteUser = async (userId) => {
    if (!confirm('¿Estás seguro de eliminar este acceso?')) return;
    try {
      await fetch('/api/kv/usuarios', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId })
      });
      loadUsers();
    } catch (error) {
      console.error("Error al eliminar");
    }
  };

  if (loading) return <div className="loader">Sincronizando cuentas...</div>;

  return (
    <div className="user-panel card fade-in">
      <div className="flex justify-between items-center mb-16">
        <h2 className="title-rajdhani">GESTIÓN DE ACCESOS</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
          ➕ NUEVO INTEGRANTE
        </button>
      </div>

      <div className="table-wrap shadow-sm">
        <table className="users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Permisos (Rol)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td className="font-bold">{user.username}</td>
                <td>
                  <select 
                    className="form-select-sm"
                    value={user.rol}
                    onChange={(e) => handleRoleChange(user, e.target.value)}
                    disabled={user.username === 'admin'}
                  >
                    <option value="admin">Administrador</option>
                    <option value="editor">Editor (Carga)</option>
                    <option value="viewer">Viewer (Consulta)</option>
                  </select>
                </td>
                <td>
                  {user.username !== 'admin' && (
                    <button className="btn-icon text-danger" onClick={() => handleDeleteUser(user.id)}>🗑️</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL NUEVO USUARIO */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal card shadow-glow" onClick={e => e.stopPropagation()}>
            <h3 className="mb-16">Crear Nuevo Acceso</h3>
            <input 
              className="form-input mb-12" 
              placeholder="Nombre de usuario" 
              value={newUser.username}
              onChange={e => setNewUser({...newUser, username: e.target.value})}
            />
            <input 
              type="password" 
              className="form-input mb-12" 
              placeholder="Contraseña inicial" 
              value={newUser.password}
              onChange={e => setNewUser({...newUser, password: e.target.value})}
            />
            <select 
              className="form-input mb-16"
              value={newUser.rol}
              onChange={e => setNewUser({...newUser, rol: e.target.value})}
            >
              <option value="viewer">Viewer (Solo Lectura)</option>
              <option value="editor">Editor (Carga de Datos)</option>
              <option value="admin">Admin (Control Total)</option>
            </select>
            <div className="flex gap-8">
              <button className="btn btn-secondary w-full" onClick={() => setShowAddModal(false)}>Cerrar</button>
              <button className="btn btn-primary w-full" onClick={handleAddUser}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
