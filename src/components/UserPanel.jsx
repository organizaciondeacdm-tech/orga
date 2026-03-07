// src/components/UserPanel.jsx
import { useState, useEffect } from "react";

export default function UserPanel({ onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", rol: "viewer" });

  // Cargar usuarios
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/kv/usuarios');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cambiar rol de usuario
  const handleRoleChange = async (userId, newRole) => {
    // Esta función necesitaría una API PUT/POST para actualizar usuarios
    // Por ahora solo simulamos
    console.log(`Cambiar usuario ${userId} a rol ${newRole}`);
    // Recargar usuarios después
    loadUsers();
  };

  // Agregar nuevo usuario
  const handleAddUser = async () => {
    // Necesitarías una API POST para crear usuarios
    console.log('Agregar usuario:', newUser);
    setShowAddModal(false);
    loadUsers();
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId) => {
    if (!confirm('¿Eliminar usuario?')) return;
    // Necesitarías una API DELETE
    console.log('Eliminar usuario:', userId);
    loadUsers();
  };

  if (loading) return <div className="loader">Cargando usuarios...</div>;

  return (
    <div className="user-panel">
      <div className="flex justify-between mb-16">
        <h2>Panel de Usuarios</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
          ➕ NUEVO USUARIO
        </button>
      </div>

      <div className="table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>
                  {editingUser === user.id ? (
                    <select 
                      className="form-select"
                      value={user.rol}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      onBlur={() => setEditingUser(null)}
                    >
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                    </select>
                  ) : (
                    <span className={`badge ${user.rol === 'admin' ? 'badge-titular' : 'badge-active'}`}>
                      {user.rol}
                    </span>
                  )}
                </td>
                <td>
                  <div className="flex gap-4">
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEditingUser(user.id)}
                    >
                      ✏️
                    </button>
                    {user.username !== 'admin' && (
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para nuevo usuario */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">➕ Nuevo Usuario</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Usuario</label>
              <input 
                className="form-input"
                value={newUser.username}
                onChange={e => setNewUser({...newUser, username: e.target.value})}
                placeholder="nombre_usuario"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input 
                type="password"
                className="form-input"
                value={newUser.password}
                onChange={e => setNewUser({...newUser, password: e.target.value})}
                placeholder="••••••••"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Rol</label>
              <select 
                className="form-select"
                value={newUser.rol}
                onChange={e => setNewUser({...newUser, rol: e.target.value})}
              >
                <option value="viewer">Viewer (solo lectura)</option>
                <option value="editor">Editor (puede editar)</option>
                <option value="admin">Admin (todo)</option>
              </select>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleAddUser}>
                Crear Usuario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}